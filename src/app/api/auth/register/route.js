import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema, ensureDefaultPatientFieldsForHospital } from '@/lib/platform';
import { getCurrentHospital } from '@/lib/hospitalContext';
import { hashPassword, createPatientSessionToken, PATIENT_SESSION_COOKIE, getPatientCookieOptions } from '@/lib/patientAuth';

const BUILTIN_COLUMN_KEYS = new Set(['name', 'phone', 'gender', 'address']);

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해 주세요.' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: '비밀번호는 4자 이상이어야 합니다.' }, { status: 400 });
    }

    await ensurePlatformSchema();
    const db = await getDb();

    const hospital = await getCurrentHospital();
    const hospitalId = hospital?.hospitalId ?? null;
    if (!hospitalId) {
      return NextResponse.json({ error: '업체를 식별할 수 없습니다.' }, { status: 400 });
    }

    await ensureDefaultPatientFieldsForHospital(db, hospitalId);

    const configs = await db.all(
      `SELECT field_key, label, field_type, is_custom, required, options
         FROM patient_field_configs
        WHERE hospital_id = ? AND enabled = 1`,
      [hospitalId]
    );

    const values = {};
    const extras = {};
    const missing = [];

    for (const cfg of configs) {
      const raw = body?.[cfg.field_key];
      const value = typeof raw === 'string' ? raw.trim() : raw;
      const isEmpty = value === undefined || value === null || value === '';

      if (cfg.required && isEmpty) {
        missing.push(cfg.label || cfg.field_key);
        continue;
      }

      if (isEmpty) continue;

      if (cfg.field_type === 'select' && cfg.options) {
        const allowed = cfg.options.split('|').map((s) => s.trim()).filter(Boolean);
        if (allowed.length && !allowed.includes(String(value))) {
          return NextResponse.json({ error: `${cfg.label}: 허용되지 않은 값입니다.` }, { status: 400 });
        }
      }

      if (BUILTIN_COLUMN_KEYS.has(cfg.field_key) && !cfg.is_custom) {
        values[cfg.field_key] = String(value);
      } else {
        extras[cfg.field_key] = { label: cfg.label, value: String(value) };
      }
    }

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `다음 항목을 입력해 주세요: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const emailLower = email.trim().toLowerCase();
    const existing = await db.get(
      'SELECT id FROM patients WHERE email = ? AND hospital_id = ?',
      [emailLower, hospitalId]
    );
    if (existing) {
      return NextResponse.json({ error: '이미 가입된 이메일입니다.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const name = values.name || emailLower.split('@')[0];

    const result = await db.run(
      `INSERT INTO patients (hospital_id, email, password_hash, name, phone, gender, address, extras)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        hospitalId,
        emailLower,
        passwordHash,
        name,
        values.phone || '',
        values.gender || '',
        values.address || '',
        JSON.stringify(extras),
      ]
    );

    const patient = { id: result.lastID, email: emailLower, name, hospital_id: hospitalId };
    const token = createPatientSessionToken(patient);

    const response = NextResponse.json({
      ok: true,
      patient: { id: patient.id, email: patient.email, name: patient.name },
    });

    response.cookies.set(PATIENT_SESSION_COOKIE, token, getPatientCookieOptions(request));
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || '회원가입 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
