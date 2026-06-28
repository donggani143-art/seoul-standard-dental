import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema, ensureDefaultPatientFieldsForHospital } from '@/lib/platform';
import { getCurrentHospital } from '@/lib/hospitalContext';

export async function GET() {
  try {
    await ensurePlatformSchema();
    const db = await getDb();

    const hospital = await getCurrentHospital();
    const hospitalId = hospital?.hospitalId ?? null;
    if (!hospitalId) {
      return NextResponse.json({ fields: [] });
    }

    await ensureDefaultPatientFieldsForHospital(db, hospitalId);

    const rows = await db.all(
      `SELECT field_key, label, field_type, is_custom, required, options, display_order
         FROM patient_field_configs
        WHERE hospital_id = ? AND enabled = 1
        ORDER BY display_order ASC, id ASC`,
      [hospitalId]
    );

    const fields = rows.map((r) => ({
      key: r.field_key,
      label: r.label,
      type: r.field_type,
      isCustom: !!r.is_custom,
      required: !!r.required,
      options: r.field_type === 'select' && r.options
        ? r.options.split('|').map((s) => s.trim()).filter(Boolean)
        : [],
    }));

    return NextResponse.json({ fields });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
