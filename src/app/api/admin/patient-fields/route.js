import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema, ensureDefaultPatientFieldsForHospital } from '@/lib/platform';

const BUILTIN_KEYS = new Set(['name', 'phone', 'gender', 'address']);
const ALLOWED_FIELD_TYPES = new Set(['text', 'tel', 'select', 'textarea', 'date', 'number', 'email']);

function slugKey(label, taken) {
  let base = String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!base) base = 'field';
  let key = `custom_${base}`;
  let i = 2;
  while (taken.has(key)) {
    key = `custom_${base}_${i++}`;
  }
  return key;
}

export async function GET(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const session = getAdminRequestSession(request);
  const hospitalId = session?.role === 'super_admin' ? (session?.impersonateHospitalId ?? null) : session?.hospitalId;

  if (!hospitalId) {
    return NextResponse.json({ error: '업체 계정으로 로그인해 주세요.' }, { status: 400 });
  }

  await ensurePlatformSchema();
  const db = await getDb();
  await ensureDefaultPatientFieldsForHospital(db, hospitalId);

  const fields = await db.all(
    `SELECT id, field_key, label, field_type, is_custom, enabled, required, options, display_order
       FROM patient_field_configs
      WHERE hospital_id = ?
      ORDER BY display_order ASC, id ASC`,
    [hospitalId]
  );

  return NextResponse.json({ fields });
}

export async function PUT(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const session = getAdminRequestSession(request);
  const hospitalId = session?.role === 'super_admin' ? (session?.impersonateHospitalId ?? null) : session?.hospitalId;

  if (!hospitalId) {
    return NextResponse.json({ error: '업체 계정으로 로그인해 주세요.' }, { status: 400 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const incoming = Array.isArray(payload?.fields) ? payload.fields : [];
  if (incoming.length === 0) {
    return NextResponse.json({ error: '필드가 비어 있습니다.' }, { status: 400 });
  }

  await ensurePlatformSchema();
  const db = await getDb();

  const existing = await db.all(
    'SELECT id, field_key, label, field_type, is_custom FROM patient_field_configs WHERE hospital_id = ?',
    [hospitalId]
  );
  const byKey = new Map(existing.map((row) => [row.field_key, row]));

  const seenKeys = new Set();
  let order = 10;

  for (const raw of incoming) {
    const isBuiltin = BUILTIN_KEYS.has(raw.field_key);
    const label = String(raw.label || '').trim().slice(0, 50);

    if (!isBuiltin && !label) {
      continue;
    }

    let fieldKey = raw.field_key;
    if (!fieldKey || !byKey.has(fieldKey)) {
      if (isBuiltin) {
        fieldKey = raw.field_key;
      } else {
        fieldKey = slugKey(label, seenKeys);
      }
    }
    if (seenKeys.has(fieldKey)) continue;
    seenKeys.add(fieldKey);

    const fieldType = isBuiltin
      ? (byKey.get(fieldKey)?.field_type || 'text')
      : (ALLOWED_FIELD_TYPES.has(raw.field_type) ? raw.field_type : 'text');

    const enabled = raw.enabled ? 1 : 0;
    const required = raw.required ? 1 : 0;
    const options = fieldType === 'select' ? String(raw.options || '').trim() : '';
    const isCustom = isBuiltin ? 0 : 1;

    if (byKey.has(fieldKey)) {
      const finalLabel = label || byKey.get(fieldKey)?.label || fieldKey;
      await db.run(
        `UPDATE patient_field_configs
           SET label = ?, field_type = ?, enabled = ?, required = ?, options = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
         WHERE hospital_id = ? AND field_key = ?`,
        [finalLabel, fieldType, enabled, required, options, order, hospitalId, fieldKey]
      );
    } else {
      await db.run(
        `INSERT INTO patient_field_configs
           (hospital_id, field_key, label, field_type, is_custom, enabled, required, options, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [hospitalId, fieldKey, label, fieldType, isCustom, enabled, required, options, order]
      );
    }
    order += 10;
  }

  for (const row of existing) {
    if (row.is_custom && !seenKeys.has(row.field_key)) {
      await db.run('DELETE FROM patient_field_configs WHERE id = ?', [row.id]);
    }
  }

  const fields = await db.all(
    `SELECT id, field_key, label, field_type, is_custom, enabled, required, options, display_order
       FROM patient_field_configs
      WHERE hospital_id = ?
      ORDER BY display_order ASC, id ASC`,
    [hospitalId]
  );

  return NextResponse.json({ fields });
}
