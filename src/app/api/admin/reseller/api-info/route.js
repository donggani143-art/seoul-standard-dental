import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getAdminRequestSession, isAdminApiRequest } from '@/lib/adminAuth';
import { getDb } from '@/lib/db';
import { ensurePlatformSchema } from '@/lib/platform';
import { listResellerAssignments } from '@/lib/resellerAssignments';

export const dynamic = 'force-dynamic';

// IndexNow 키 = public/ 루트의 32자리 hex .txt 파일(모든 테넌트 루트로 서빙됨)
async function getIndexNowKey() {
  try {
    const dir = path.join(process.cwd(), 'public');
    const files = await fs.readdir(dir);
    const keyFile = files.find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
    if (!keyFile) return '';
    const content = (await fs.readFile(path.join(dir, keyFile), 'utf8')).trim();
    return content || keyFile.replace(/\.txt$/, '');
  } catch {
    return '';
  }
}

// 리셀러용 "API 정보" — 담당 업체별 자동화 연동 정보(호스트·병원ID·게시판 그룹·발행 URL 패턴).
// reseller: 배정된 업체만 / super_admin: 전체 업체.
export async function GET(request) {
  if (!isAdminApiRequest(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const session = getAdminRequestSession(request);
  if (!session || (session.role !== 'reseller' && session.role !== 'super_admin')) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  try {
    await ensurePlatformSchema();
    const db = await getDb();

    let hospitals;
    if (session.role === 'reseller') {
      const assignments = await listResellerAssignments(session.accountId);
      hospitals = assignments.map((a) => ({
        id: a.hospital_id,
        name: a.hospital_name,
        slug: a.hospital_slug,
        status: a.hospital_status,
      }));
    } else {
      hospitals = await db.all('SELECT id, name, slug, status FROM hospitals ORDER BY id DESC');
    }

    const ids = hospitals.map((h) => h.id);
    const groupsByHospital = new Map();
    const domainsByHospital = new Map();
    if (ids.length) {
      const ph = ids.map(() => '?').join(',');
      const groups = await db.all(
        `SELECT id, hospital_id, name, slug, members_only FROM board_groups
          WHERE hospital_id IN (${ph}) AND is_active = 1
          ORDER BY sort_order ASC, id ASC`,
        ids
      );
      for (const g of groups) {
        const arr = groupsByHospital.get(g.hospital_id) || [];
        arr.push(g);
        groupsByHospital.set(g.hospital_id, arr);
      }
      const domains = await db.all(
        `SELECT hospital_id, domain FROM hospital_domains WHERE hospital_id IN (${ph}) ORDER BY is_primary DESC, id ASC`,
        ids
      );
      for (const d of domains) {
        const arr = domainsByHospital.get(d.hospital_id) || [];
        arr.push(d.domain);
        domainsByHospital.set(d.hospital_id, arr);
      }
    }

    const indexnowKey = await getIndexNowKey();

    const result = hospitals.map((h) => {
      const host = `https://${h.slug}.metacms.kr`;
      return {
        id: h.id,
        name: h.name,
        slug: h.slug,
        status: h.status || '',
        host,
        domains: domainsByHospital.get(h.id) || [],
        notice_url_pattern: `${host}/community/notice/{post_id}`,
        indexnow_key_location: indexnowKey ? `${host}/${indexnowKey}.txt` : '',
        groups: (groupsByHospital.get(h.id) || []).map((g) => ({
          id: g.id,
          name: g.name,
          slug: g.slug,
          members_only: !!g.members_only,
          post_url_pattern: `${host}/community/${g.slug}/{post_id}`,
        })),
      };
    });

    // 공통 Bearer 토큰(플랫폼 API 토큰) — 마스킹 표시는 클라이언트에서 처리
    const token = process.env.ADMIN_API_TOKEN || '';

    return NextResponse.json({ token, indexnow_key: indexnowKey, hospitals: result });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
