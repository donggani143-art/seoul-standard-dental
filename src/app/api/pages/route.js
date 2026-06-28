import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';

function getHospitalId(session) {
  if (!session) return null;
  if (session.role === 'super_admin') return session.impersonateHospitalId ?? null;
  return session.hospitalId ?? null;
}

export async function GET(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const session = getAdminRequestSession(request);
  const hospitalId = getHospitalId(session);

  try {
    await ensurePlatformSchema();
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    const conditions = [];
    const params = [];

    if (hospitalId !== null) {
      conditions.push('hospital_id = ?');
      params.push(hospitalId);
    }
    if (slug) {
      conditions.push('slug = ?');
      params.push(slug);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const pages = await db.all(
      `SELECT * FROM pages ${where} ORDER BY sort_order ASC, id ASC`,
      params
    );
    return NextResponse.json(pages);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const session = getAdminRequestSession(request);
  const hospitalId = getHospitalId(session);

  try {
    await ensurePlatformSchema();
    const db = await getDb();
    const body = await request.json();
    const { slug, title, content, custom_css, custom_js, meta_title, meta_description, is_published, sort_order, page_type } = body;

    if (!slug?.trim()) return NextResponse.json({ error: 'slug가 필요합니다.' }, { status: 400 });
    if (!title?.trim()) return NextResponse.json({ error: '제목이 필요합니다.' }, { status: 400 });

    const result = await db.run(
      `INSERT INTO pages (hospital_id, slug, title, content, custom_css, custom_js, meta_title, meta_description, is_published, sort_order, page_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        hospitalId,
        slug.trim(),
        title.trim(),
        content ?? '',
        custom_css ?? '',
        custom_js ?? '',
        meta_title?.trim() ?? '',
        meta_description?.trim() ?? '',
        is_published !== false ? 1 : 0,
        sort_order ?? 0,
        page_type ?? 'custom',
      ]
    );
    const page = await db.get('SELECT * FROM pages WHERE id = ?', [result.lastID]);
    return NextResponse.json({ success: true, page });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const session = getAdminRequestSession(request);
  const hospitalId = getHospitalId(session);

  try {
    await ensurePlatformSchema();
    const db = await getDb();
    const body = await request.json();
    const { id, slug, title, content, custom_css, custom_js, meta_title, meta_description, is_published, sort_order, page_type } = body;

    const scopeClause = hospitalId !== null ? 'AND hospital_id = ?' : '';
    const scopeParams = hospitalId !== null ? [hospitalId] : [];

    // id가 없으면 slug로 upsert (디자인 에디터용)
    if (!id && slug) {
      const existing = await db.get(
        `SELECT id FROM pages WHERE slug = ? ${hospitalId !== null ? 'AND hospital_id = ?' : ''}`,
        hospitalId !== null ? [slug, hospitalId] : [slug]
      );

      if (existing) {
        await db.run(
          `UPDATE pages SET
            title = ?, content = ?, custom_css = ?, custom_js = ?, meta_title = ?, meta_description = ?,
            is_published = ?, sort_order = ?, page_type = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? ${scopeClause}`,
          [
            title?.trim() ?? '',
            content ?? '',
            custom_css ?? '',
            custom_js ?? '',
            meta_title?.trim() ?? '',
            meta_description?.trim() ?? '',
            is_published !== false ? 1 : 0,
            sort_order ?? 0,
            page_type ?? 'builtin',
            existing.id,
            ...scopeParams,
          ]
        );
        const page = await db.get('SELECT * FROM pages WHERE id = ?', [existing.id]);
        return NextResponse.json({ success: true, page });
      } else {
        // 없으면 새로 삽입
        const result = await db.run(
          `INSERT INTO pages (hospital_id, slug, title, content, custom_css, custom_js, meta_title, meta_description, is_published, sort_order, page_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            hospitalId,
            slug.trim(),
            title?.trim() ?? slug,
            content ?? '',
            custom_css ?? '',
            custom_js ?? '',
            meta_title?.trim() ?? '',
            meta_description?.trim() ?? '',
            is_published !== false ? 1 : 0,
            sort_order ?? 0,
            page_type ?? 'builtin',
          ]
        );
        const page = await db.get('SELECT * FROM pages WHERE id = ?', [result.lastID]);
        return NextResponse.json({ success: true, page });
      }
    }

    // id 기반 업데이트
    if (!id) return NextResponse.json({ error: 'id 또는 slug가 필요합니다.' }, { status: 400 });

    await db.run(
      `UPDATE pages SET
        slug = ?, title = ?, content = ?, custom_css = ?, custom_js = ?, meta_title = ?, meta_description = ?,
        is_published = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? ${scopeClause}`,
      [
        slug?.trim() ?? '',
        title?.trim() ?? '',
        content ?? '',
        custom_css ?? '',
        custom_js ?? '',
        meta_title?.trim() ?? '',
        meta_description?.trim() ?? '',
        is_published !== false ? 1 : 0,
        sort_order ?? 0,
        id,
        ...scopeParams,
      ]
    );
    const page = await db.get('SELECT * FROM pages WHERE id = ?', [id]);
    return NextResponse.json({ success: true, page });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const session = getAdminRequestSession(request);
  const hospitalId = getHospitalId(session);

  try {
    await ensurePlatformSchema();
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id') || 0);

    if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

    const scopeClause = hospitalId !== null ? 'AND hospital_id = ?' : '';
    const scopeParams = hospitalId !== null ? [hospitalId] : [];

    await db.run(`DELETE FROM pages WHERE id = ? ${scopeClause}`, [id, ...scopeParams]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
