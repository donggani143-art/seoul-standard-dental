import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { getCurrentHospital } from '@/lib/hospitalContext';

function getSessionHospitalId(request) {
  const session = getAdminRequestSession(request);
  if (!session) return null;
  if (session.role === 'super_admin') return session.impersonateHospitalId ?? null;
  return session.hospitalId ?? null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const includeInactive = searchParams.get('includeInactive') === '1';
  const db = await getDb();

  try {
    if (type === 'popup') {
      if (includeInactive && !isAdminApiRequest(request)) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
      }

      const filters = [];
      const params = [];

      if (!includeInactive) {
        filters.push('is_active = 1');
        filters.push("(start_date IS NULL OR start_date = '' OR date(start_date) <= date('now'))");
        filters.push("(end_date IS NULL OR end_date = '' OR date(end_date) >= date('now'))");

        // 공개 요청: 도메인 기반 병원 필터
        const hospital = await getCurrentHospital();
        const pubHid = hospital?.hospitalId ?? null;
        if (!pubHid) return NextResponse.json([]);
        filters.push('hospital_id = ?');
        params.push(pubHid);
      }

      if (includeInactive && isAdminApiRequest(request)) {
        const hospitalId = getSessionHospitalId(request);
        if (hospitalId !== null) {
          filters.push('hospital_id = ?');
          params.push(hospitalId);
        }
      }

      const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
      const popups = await db.all(`SELECT * FROM popups ${where} ORDER BY sort_order ASC, id DESC`, params);
      return NextResponse.json(popups);
    }

    if (type === 'seo') {
      if (!isAdminApiRequest(request)) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
      }

      const hospitalId = getSessionHospitalId(request);
      const hFilter = hospitalId !== null ? 'WHERE hospital_id = ?' : '';
      const hParams = hospitalId !== null ? [hospitalId] : [];

      const emptySeo = { title: '', description: '', keywords: '', og_title: '', og_description: '', og_image: '', canonical_url: '', author: '', schema_type: '', schema_name: '', schema_description: '', aeo_summary: '', local_keywords: '', author_doctor_id: null, reviewer_doctor_id: null, last_reviewed: '' };

      // 사이트 페이지(공통 헤더/푸터 제외) 기준으로 SEO 목록 생성
      const pagesFilter = hospitalId !== null
        ? "WHERE hospital_id = ? AND slug NOT LIKE '\\_%' ESCAPE '\\'"
        : "WHERE slug NOT LIKE '\\_%' ESCAPE '\\'";
      const [seoSettings, sitePages] = await Promise.all([
        db.all(`SELECT * FROM seo_settings ${hFilter}`, hParams),
        db.all(`SELECT slug, title FROM pages ${pagesFilter} ORDER BY CASE slug WHEN 'main' THEN 0 ELSE 1 END, sort_order ASC, id ASC`, hParams),
      ]);

      const seoMap = new Map(seoSettings.map(s => [s.slug, s]));

      // 페이지 기준으로 SEO 항목 생성: DB에 있으면 사용, 없으면 빈 스텁
      const result = sitePages.map(p => {
        const slug = p.slug === 'main' ? 'home' : p.slug;
        const existing = seoMap.get(slug);
        if (existing) {
          return { ...existing, id: slug };
        }
        const pathMap = { main: '/', notice: '/community/notice', event: '/community/event' };
        return { ...emptySeo, id: slug, slug, page_label: p.title, path: pathMap[p.slug] || `/${p.slug}` };
      });

      return NextResponse.json(result);
    }

    if (type === 'geo') {
      if (!isAdminApiRequest(request)) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
      }

      const hospitalId = getSessionHospitalId(request);
      const geo = hospitalId !== null
        ? await db.get('SELECT * FROM geo_settings WHERE hospital_id = ? ORDER BY id DESC LIMIT 1', [hospitalId])
        : await db.get('SELECT * FROM geo_settings ORDER BY id DESC LIMIT 1');
      return NextResponse.json(geo || {});
    }

    if (type === 'doctors') {
      if (!isAdminApiRequest(request)) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
      }

      const hospitalId = getSessionHospitalId(request);
      if (hospitalId === null) return NextResponse.json([]);
      const doctors = await db.all(
        'SELECT * FROM doctors WHERE hospital_id = ? ORDER BY sort_order ASC, id ASC',
        [hospitalId]
      );
      return NextResponse.json(doctors);
    }

    if (type === 'snippets') {
      if (!isAdminApiRequest(request)) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
      }

      const hospitalId = getSessionHospitalId(request);
      const snippets = hospitalId !== null
        ? await db.get('SELECT * FROM global_snippets WHERE hospital_id = ?', [hospitalId])
        : await db.get("SELECT * FROM global_snippets WHERE id = 'global'");
      return NextResponse.json(snippets || {});
    }

    return NextResponse.json({ error: 'Invalid type requested' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const hospitalId = getSessionHospitalId(request);
  const body = await request.json();
  const db = await getDb();

  try {
    if (body.type === 'popup') {
      const items = Array.isArray(body.data) ? body.data : [body.data];

      const existingQuery = hospitalId !== null
        ? 'SELECT id FROM popups WHERE hospital_id = ?'
        : 'SELECT id FROM popups';
      const existing = await db.all(existingQuery, hospitalId !== null ? [hospitalId] : []);
      const incomingIds = new Set();

      await db.exec('BEGIN');

      for (const item of items) {
        const values = [
          item.title || '', item.content || '', item.is_active ? 1 : 0,
          item.start_date || '', item.end_date || '', item.position || 'center',
          item.image_url || '', item.link_url || '', Number(item.sort_order || 0),
        ];

        if (item.id && !String(item.id).startsWith('new-')) {
          incomingIds.add(Number(item.id));
          const hospitalClause = hospitalId !== null ? 'AND hospital_id = ?' : '';
          await db.run(
            `UPDATE popups SET title = ?, content = ?, is_active = ?, start_date = ?, end_date = ?,
             position = ?, image_url = ?, link_url = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? ${hospitalClause}`,
            [...values, item.id, ...(hospitalId !== null ? [hospitalId] : [])]
          );
        } else {
          const result = await db.run(
            'INSERT INTO popups (title, content, is_active, start_date, end_date, position, image_url, link_url, sort_order, hospital_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [...values, hospitalId]
          );
          incomingIds.add(result.lastID);
        }
      }

      for (const row of existing) {
        if (!incomingIds.has(row.id)) {
          await db.run('DELETE FROM popups WHERE id = ?', [row.id]);
        }
      }

      await db.exec('COMMIT');
      return NextResponse.json({ success: true });
    }

    if (body.type === 'seo') {
      const seoHospitalId = hospitalId;
      for (const item of body.data) {
        const slug = item.id || item.slug;
        const toDoctorId = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
        const seoValues = [
          item.page_label, item.path, item.title || '', item.description || '', item.keywords || '',
          item.og_title || '', item.og_description || '', item.og_image || '',
          item.canonical_url || '', item.author || '', item.schema_type || '',
          item.schema_name || '', item.schema_description || '',
          item.aeo_summary || '', item.local_keywords || '',
          toDoctorId(item.author_doctor_id), toDoctorId(item.reviewer_doctor_id), item.last_reviewed || '',
        ];

        const existing = await db.get(
          'SELECT rowid FROM seo_settings WHERE slug = ? AND hospital_id = ?',
          [slug, seoHospitalId]
        );

        if (existing) {
          await db.run(
            `UPDATE seo_settings SET page_label = ?, path = ?, title = ?, description = ?, keywords = ?,
             og_title = ?, og_description = ?, og_image = ?, canonical_url = ?, author = ?,
             schema_type = ?, schema_name = ?, schema_description = ?, aeo_summary = ?, local_keywords = ?,
             author_doctor_id = ?, reviewer_doctor_id = ?, last_reviewed = ?,
             updated_at = CURRENT_TIMESTAMP WHERE rowid = ?`,
            [...seoValues, existing.rowid]
          );
        } else {
          await db.run(
            `INSERT INTO seo_settings (slug, hospital_id, page_label, path, title, description, keywords,
             og_title, og_description, og_image, canonical_url, author, schema_type,
             schema_name, schema_description, aeo_summary, local_keywords,
             author_doctor_id, reviewer_doctor_id, last_reviewed)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [slug, seoHospitalId, ...seoValues]
          );
        }
      }
      return NextResponse.json({ success: true });
    }

    if (body.type === 'geo') {
      const d = body.data;

      // 모든 값이 빈 값이면 저장 차단 (자동완성/실수 방지)
      const hasAnyValue = Object.values(d || {}).some(v => v && String(v).trim());
      if (!hasAnyValue) {
        return NextResponse.json({ error: '저장할 내용이 없습니다.' }, { status: 400 });
      }

      const geoValues = [
        d.clinic_name, d.representative, d.address, d.street_address, d.address_locality,
        d.address_region, d.postal_code, d.latitude, d.longitude, d.telephone,
        d.website_url, d.map_url, d.kakao_channel_url, d.naver_booking_url, d.naver_blog_url,
        d.youtube_url, d.instagram_url, d.opening_hours, d.schema_opening_hours,
        d.medical_specialty, d.area_served, d.price_range, d.favicon_url || '', d.og_image_url || '',
      ];

      const existingGeo = hospitalId !== null
        ? await db.get('SELECT id FROM geo_settings WHERE hospital_id = ?', [hospitalId])
        : await db.get('SELECT id FROM geo_settings LIMIT 1');

      if (existingGeo) {
        await db.run(
          `UPDATE geo_settings SET clinic_name = ?, representative = ?, address = ?, street_address = ?,
           address_locality = ?, address_region = ?, postal_code = ?, latitude = ?,
           longitude = ?, telephone = ?, website_url = ?, map_url = ?, kakao_channel_url = ?,
           naver_booking_url = ?, naver_blog_url = ?, youtube_url = ?, instagram_url = ?,
           opening_hours = ?, schema_opening_hours = ?, medical_specialty = ?,
           area_served = ?, price_range = ?, favicon_url = ?, og_image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [...geoValues, existingGeo.id]
        );
      } else {
        await db.run(
          `INSERT INTO geo_settings (clinic_name, representative, address, street_address, address_locality,
           address_region, postal_code, latitude, longitude, telephone, website_url,
           map_url, kakao_channel_url, naver_booking_url, naver_blog_url, youtube_url,
           instagram_url, opening_hours, schema_opening_hours, medical_specialty,
           area_served, price_range, favicon_url, og_image_url, hospital_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [...geoValues, hospitalId]
        );
      }
      return NextResponse.json({ success: true });
    }

    if (body.type === 'doctors') {
      if (hospitalId === null) {
        return NextResponse.json({ error: '업체가 식별되지 않았습니다.' }, { status: 400 });
      }

      const items = Array.isArray(body.data) ? body.data : [];
      const existing = await db.all('SELECT id FROM doctors WHERE hospital_id = ?', [hospitalId]);
      const incomingIds = new Set();

      await db.exec('BEGIN');
      try {
        for (const item of items) {
          const values = [
            item.name || '', item.job_title || '', item.license_no || '',
            item.specialty || '', item.credentials || '', item.education || '',
            item.memberships || '', item.career || '', item.photo_url || '',
            item.same_as || '', Number(item.sort_order || 0),
          ];

          if (item.id && !String(item.id).startsWith('new-')) {
            incomingIds.add(Number(item.id));
            await db.run(
              `UPDATE doctors SET name = ?, job_title = ?, license_no = ?, specialty = ?,
               credentials = ?, education = ?, memberships = ?, career = ?, photo_url = ?,
               same_as = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
               WHERE id = ? AND hospital_id = ?`,
              [...values, item.id, hospitalId]
            );
          } else {
            const result = await db.run(
              `INSERT INTO doctors (hospital_id, name, job_title, license_no, specialty,
               credentials, education, memberships, career, photo_url, same_as, sort_order)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [hospitalId, ...values]
            );
            incomingIds.add(result.lastID);
          }
        }

        for (const row of existing) {
          if (!incomingIds.has(row.id)) {
            await db.run('DELETE FROM doctors WHERE id = ? AND hospital_id = ?', [row.id, hospitalId]);
          }
        }
        await db.exec('COMMIT');
      } catch (e) {
        await db.exec('ROLLBACK');
        throw e;
      }
      return NextResponse.json({ success: true });
    }

    if (body.type === 'snippets') {
      const { common_meta_tags, common_header, common_body, common_footer } = body.data;
      const snippetId = hospitalId !== null ? `hospital-${hospitalId}` : 'global';

      await db.run(
        `INSERT INTO global_snippets (id, hospital_id, common_meta_tags, common_header, common_body, common_footer, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
         hospital_id = excluded.hospital_id,
         common_meta_tags = excluded.common_meta_tags,
         common_header = excluded.common_header,
         common_body = excluded.common_body,
         common_footer = excluded.common_footer,
         updated_at = CURRENT_TIMESTAMP`,
        [snippetId, hospitalId, common_meta_tags, common_header, common_body, common_footer]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type requested' }, { status: 400 });
  } catch (error) {
    if (body?.type === 'popup') {
      try { await db.exec('ROLLBACK'); } catch {}
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
