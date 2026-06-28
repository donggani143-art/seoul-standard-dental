# METALINK CMS API Reference

웹 에이전시 멀티테넌트 CMS 플랫폼 API 명세서입니다.

---

## 목차

1. [플랫폼 구조](#플랫폼-구조)
2. [관리자 인증](#관리자-인증)
3. [환자 인증](#환자-인증)
4. [병원 스코프 (Multi-Tenant)](#병원-스코프-multi-tenant)
5. [게시판 그룹 (Board Groups)](#게시판-그룹-board-groups)
6. [게시글 (Boards)](#게시글-boards)
7. [이미지 업로드 (Board Image)](#이미지-업로드-board-image)
8. [상담 신청 (Consult)](#상담-신청-consult)
9. [페이지 디자인 (Pages)](#페이지-디자인-pages)
10. [설정 (Settings)](#설정-settings)
11. [슈퍼어드민 전용](#슈퍼어드민-전용)
12. [페이지 빌더 블록](#페이지-빌더-블록)
13. [도메인 및 미리보기](#도메인-및-미리보기)
14. [스타일 적용 안내](#스타일-적용-안내)

---

## 플랫폼 구조

| 역할 | 설명 |
|------|------|
| `super_admin` | 플랫폼 운영자. 모든 병원 데이터 접근, 병원/계정/도메인 관리 |
| `hospital_admin` | 개별 사이트 관리자. 자기 병원 데이터만 접근 |
| 환자 (patient) | 개별 병원 사이트 회원. 병원별 독립 |

모든 데이터는 `hospital_id`로 완전 분리됩니다.

---

## 관리자 인증

### 로그인

```
POST /admin/login
```

**요청 (multipart/form-data)**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `email` | string | Y | 관리자 이메일 |
| `password` | string | Y | 비밀번호 |

JSON 응답을 받으려면 `X-Requested-With: XMLHttpRequest` 또는 `Accept: application/json` 헤더를 포함합니다.

**성공 응답 (200)**
```json
{
  "ok": true,
  "redirectTo": "/admin?module=dashboard",
  "message": "관리자 페이지로 이동합니다."
}
```

**실패 응답 (200)**
```json
{ "ok": false, "message": "이메일 또는 비밀번호가 올바르지 않습니다." }
```

### 로그아웃

```
POST /admin/logout
```

---

## 환자 인증

각 병원별로 독립된 환자 회원 시스템입니다. 요청 도메인 기준으로 병원이 자동 식별됩니다.

### 회원가입

```
POST /api/auth/register
```

**요청 (application/json)**
```json
{
  "email": "patient@example.com",
  "password": "1234",
  "name": "홍길동",
  "phone": "010-1234-5678"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `email` | string | Y | 이메일 |
| `password` | string | Y | 비밀번호 (4자 이상) |
| `name` | string | Y | 이름 |
| `phone` | string | N | 연락처 |

**성공 응답 (200)**
```json
{
  "ok": true,
  "patient": { "id": 1, "email": "patient@example.com", "name": "홍길동" }
}
```
응답에 `patient_session` 쿠키가 설정됩니다.

### 로그인

```
POST /api/auth/login
```

**요청 (application/json)**
```json
{ "email": "patient@example.com", "password": "1234" }
```

### 로그아웃

```
POST /api/auth/logout
```

### 현재 로그인 상태

```
GET /api/auth/me
```

**응답 (200)**
```json
{ "loggedIn": true, "patient": { "id": 1, "email": "patient@example.com", "name": "홍길동" } }
```
또는
```json
{ "loggedIn": false }
```

### 환자 목록 (어드민)

```
GET /api/auth/patients
```

**인증 필요** (관리자). 해당 병원의 환자 목록 반환.

### 환자 삭제 (어드민)

```
DELETE /api/auth/patients?id={id}
```

**인증 필요**

---

## 병원 스코프 (Multi-Tenant)

모든 데이터는 `hospital_id`로 완전 분리됩니다.

### 어드민 API

- `hospital_admin`: 자기 병원 데이터만 접근
- `super_admin`: 전체 병원 데이터 접근

### 공개 API

요청 도메인(`Host` 헤더) 기준으로 병원을 자동 식별합니다.
도메인이 등록되지 않은 요청은 **빈 결과**를 반환합니다.

### 서브도메인 미리보기

도메인 연결 전 미리보기: `{hospital-slug}.metalink3.mycafe24.com`

```
test.metalink3.mycafe24.com     → TEST 병원 사이트
wonju-dental.metalink3.mycafe24.com → 원주치과 사이트
```

---

## 게시판 그룹 (Board Groups)

### 목록 조회

```
GET /api/board-group
```

| 파라미터 | 설명 |
|----------|------|
| `includeInactive=1` | 비활성 포함. **인증 필요** |

### 그룹 생성

```
POST /api/board-group
```

**인증 필요**

```json
{
  "name": "자유게시판",
  "slug": "free",
  "description": "자유롭게 이야기하는 공간",
  "is_active": true,
  "sort_order": 0
}
```

### 그룹 수정

```
PUT /api/board-group
```

**인증 필요**. 요청 바디에 `id` 포함 필수.

### 그룹 삭제

```
DELETE /api/board-group?id={id}
```

**인증 필요**

---

## 게시글 (Boards)

타입: `notice`(공지), `event`(이벤트), `board`(커스텀 게시판)

### 목록 조회

```
GET /api/board
```

| 파라미터 | 설명 |
|----------|------|
| `type` | `notice` \| `event` \| `board` \| `all` (all은 **인증 필요**) |
| `groupSlug` | 커스텀 게시판 슬러그 필터 |
| `includeDrafts=1` | 미발행 포함. **인증 필요** |

### 단건 조회

```
GET /api/board/{id}
```

### 게시글 생성

```
POST /api/board
Authorization: Bearer {ADMIN_API_TOKEN}
Content-Type: application/json
```

```json
{
  "type": "board",
  "board_group_id": 1,
  "hospital_id": 3,
  "title": "게시글 제목",
  "content": "<p>HTML 콘텐츠</p>",
  "is_published": true,
  "start_date": "2025-03-01",
  "end_date": "2025-12-31"
}
```

| 필드 | 필수 | 설명 |
|---|---|---|
| `type` | ✓ | `notice` \| `event` \| `board` |
| `board_group_id` | `type='board'`일 때 필수 | 커스텀 게시판 그룹 ID |
| `hospital_id` | **API 토큰 인증 시 권장** | 대상 병원 ID. **세션(쿠키) 인증 시 무시되고 본인 hospital 강제** |
| `title` | ✓ | 제목 |
| `content` | ✓ | HTML 본문 (`<p>내용을 입력하세요.</p>` 같은 placeholder는 거부) |

**hospital_id 동작 규칙**
- **API 토큰 인증** (`Authorization: Bearer ...`): body의 `hospital_id` 사용. 명시 안 하면 `NULL` 저장.
- **세션 쿠키 인증** (브라우저 어드민): 본인 hospital이 강제됨 → body의 `hospital_id` 무시 (위장 차단).
- **board_group_id 정합성 가드**: 명시한 `hospital_id`와 `board_group_id` 소속 hospital이 다르면 400 에러 반환.

**응답**
```json
{ "success": true, "id": 123, "hospital_id": 3 }
```

**에러 (400)**
```json
{ "error": "board_group_id(2127)는 hospital_id=10 소속입니다. hospital_id 값과 일치하지 않습니다." }
```

> `content`의 `<style>` 태그는 보안상 자동 제거됩니다. 인라인 `style=""` 속성은 유지됩니다.

### 게시글 수정

```
PUT /api/board
Authorization: Bearer {ADMIN_API_TOKEN}
```

요청 바디에 `id` 포함 필수. `hospital_id`는 POST와 동일 규칙 (토큰 인증 시 명시).

### 게시글 삭제

```
DELETE /api/board?id={id}&hospital_id={hospital_id}
Authorization: Bearer {ADMIN_API_TOKEN}
```

`hospital_id` 쿼리 파라미터는 API 토큰 인증 시 권장 (다른 병원 글 실수 삭제 방지). 세션 인증은 본인 hospital 강제.

---

## 이미지 업로드 (Board Image)

```
POST /api/board-image
Authorization: Bearer {ADMIN_API_TOKEN}
Content-Type: multipart/form-data
```

**요청 (multipart/form-data)**

| 필드 | 필수 | 설명 |
|------|------|------|
| `file` | ✓ | 이미지 파일 |
| `hospital_id` | **API 토큰 인증 시 권장** | 대상 병원 ID. 지정하면 해당 병원 폴더(`/uploads/hospitals/{slug}/boards/`)에 저장. 세션 인증 시 무시되고 본인 hospital 강제. **미지정 시 `shared` 폴더로 저장됨** |

**인증 동작**
- **API 토큰**(`Authorization: Bearer ...`): `hospital_id` form 필드로 병원 폴더 결정 (board API와 동일 규칙)
- **세션 쿠키**(브라우저 어드민): 본인 hospital 폴더 자동
- 둘 다 없으면 401

**제한:** 최대 10MB, `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`

**응답 (200)**
```json
{
  "success": true,
  "url": "/uploads/hospitals/oaksdental/boards/1700000000-photo.jpg",
  "path": "/uploads/hospitals/oaksdental/boards/1700000000-photo.jpg",
  "fileName": "1700000000-photo.jpg",
  "contentType": "image/jpeg",
  "tagTemplate": "<img src=\"/uploads/hospitals/oaksdental/boards/1700000000-photo.jpg\" alt=\"\" />"
}
```

**자동화 권장 흐름**: ① `/api/board-image`에 `hospital_id`와 함께 이미지 업로드 → 응답 `url` 획득 → ② 그 `url`을 게시글 `content`의 `<img src="...">`에 삽입 → ③ `/api/board` POST (동일 `hospital_id`).

```bash
# 1) 이미지 업로드
curl -X POST 'https://cms.mtlink.kr/api/board-image' \
  -H 'Authorization: Bearer {ADMIN_API_TOKEN}' \
  -F 'file=@photo.jpg' \
  -F 'hospital_id=3'
# → {"success":true,"url":"/uploads/hospitals/oaksdental/boards/...jpg", ...}

# 2) 위 url 을 content 에 넣어 게시글 작성
curl -X POST 'https://cms.mtlink.kr/api/board' \
  -H 'Authorization: Bearer {ADMIN_API_TOKEN}' -H 'Content-Type: application/json' \
  -d '{"type":"board","board_group_id":2040,"hospital_id":3,"title":"[일반] ...","content":"<p><img src=\"/uploads/hospitals/oaksdental/boards/...jpg\" alt=\"\"></p>","is_published":true}'
```

업로드 경로: `/uploads/hospitals/{병원slug}/boards/`

---

## 상담 신청 (Consult)

### 상담 제출 (공개)

```
POST /api/consult
```

인증 불필요. 요청 도메인 기준 병원에 저장. 병원 미식별 시 거부.

```json
{
  "category": "임플란트",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "email": "hong@example.com",
  "agreed": true
}
```

### 상담 목록 (어드민)

```
GET /api/consult?limit=200
```

**인증 필요**. 최대 500건.

### 상담 삭제 (어드민)

```
DELETE /api/consult?id={id}
```

**인증 필요**

---

## 페이지 디자인 (Pages)

### 목록 조회

```
GET /api/pages
GET /api/pages?slug={slug}
```

**인증 필요**

### 페이지 생성

```
POST /api/pages
```

**인증 필요**

```json
{
  "slug": "about",
  "title": "병원 소개",
  "content": "<div>...</div>",
  "custom_css": ".my-class { color: #333; }",
  "custom_js": "console.log('ready');",
  "is_published": true,
  "page_type": "builtin"
}
```

| 필드 | 설명 |
|------|------|
| `slug` | URL 경로. `main` = `/`, 나머지 = `/{slug}` |
| `custom_css` | `<style>` 태그 없이 CSS 규칙만 작성 |
| `custom_js` | `<script>` 태그 없이 JS 코드만 작성. HTML `content`에 `<script>` 포함 시 자동 실행됨 |
| `page_type` | `builtin` \| `custom` \| `layout` |

**슬러그 규칙**

| 슬러그 | 용도 |
|--------|------|
| `main` | 메인 홈페이지 (`/`) |
| `_header` | 전체 공통 헤더 |
| `_footer` | 전체 공통 푸터 |
| `notice` | 공지사항 목록 |
| `notice-detail` | 공지사항 상세 (템플릿 변수 지원) |
| `event` / `event-detail` | 이벤트 목록/상세 |
| `{custom}` | 커스텀 페이지 (`/{custom}` URL 자동 생성) |

**상세 페이지 템플릿 변수**

`notice-detail`, `event-detail` 등에서 사용:

```
{{post.title}}      → 게시글 제목
{{post.content}}    → 게시글 본문 (HTML)
{{post.date}}       → 등록일
{{post.boardLabel}} → 게시판 이름
{{post.listHref}}   → 목록 페이지 링크
{{post.listLabel}}  → 목록 버튼 텍스트
```

### 페이지 수정 (Upsert)

```
PUT /api/pages
```

**인증 필요**. `id` 또는 `slug` 기반.

### 페이지 삭제

```
DELETE /api/pages?id={id}
```

**인증 필요**

---

## 설정 (Settings)

### 설정 조회

```
GET /api/settings?type={type}
```

| `type` | 인증 | 설명 |
|--------|------|------|
| `popup` | 불필요 (활성만) / 필요 (`includeInactive=1`) | 팝업 목록 (병원별 분리) |
| `seo` | 필요 | 페이지 SEO 설정 (사이트 페이지 기준 자동 매칭) |
| `geo` | 필요 | 병원 위치/연락처 정보 |
| `snippets` | 필요 | 공통 HTML 스니펫 (GTM 등) |

### 설정 저장

```
POST /api/settings
```

**인증 필요**. `type` 필드로 대상 구분.

#### 팝업

```json
{
  "type": "popup",
  "data": [{
    "title": "이벤트",
    "content": "<img src='...' />",
    "is_active": true,
    "position": "center",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31"
  }]
}
```

#### SEO

```json
{
  "type": "seo",
  "data": [{
    "id": "home",
    "title": "병원 타이틀",
    "description": "메타 설명",
    "keywords": "키워드1, 키워드2",
    "og_title": "OG 제목"
  }]
}
```

#### GEO

```json
{
  "type": "geo",
  "data": {
    "clinic_name": "원주치과의원",
    "telephone": "033-000-0000",
    "address": "강원도 원주시...",
    "latitude": "37.3422",
    "longitude": "127.9205"
  }
}
```

#### 공통 코드 스니펫

```json
{
  "type": "snippets",
  "data": {
    "common_meta_tags": "<!-- GTM 등 -->",
    "common_header": "<!-- body 시작 후 -->",
    "common_body": "<!-- 콘텐츠 전 -->",
    "common_footer": "<!-- body 종료 전 -->"
  }
}
```

---

## 슈퍼어드민 전용

### 병원 관리

```
GET  /api/admin/hospitals        → 병원 목록
POST /api/admin/hospitals        → 병원 생성
```

### 관리자 계정

```
GET  /api/admin/accounts         → 계정 목록
POST /api/admin/accounts         → 계정 생성
```

```json
{
  "email": "admin@hospital.com",
  "password": "password",
  "display_name": "관리자",
  "role": "hospital_admin",
  "hospital_id": 1
}
```

### 도메인 관리

```
GET    /api/admin/domains?hospitalId={id}  → 도메인 목록
POST   /api/admin/domains                  → 도메인 추가
DELETE /api/admin/domains?id={id}          → 도메인 삭제
```

### 활동 로그

```
GET /api/admin/logs?limit=50
```

---

## 페이지 빌더 블록

페이지 빌더에서 원클릭으로 삽입 가능한 HTML 블록:

| 블록 | 설명 |
|------|------|
| 퀵메뉴 (SNS/예약) | 우하단 플로팅 SNS 버튼 |
| 인트로 애니메이션 | 로딩 시 타이핑 + 브랜드 표시 |
| 히어로 섹션 | 큰 제목 + 부제 + CTA 버튼 |
| CTA 배너 | 행동 유도 배너 |
| 카드 3단 | 서비스/특징 나열 |
| 텍스트 + 이미지 | 2단 레이아웃 |
| 인용/후기 | 환자 후기 |
| 버튼 | 단일 CTA |
| 구분선 | 섹션 구분 |
| 지도 | iframe 지도 임베드 |
| 게시판 목록 | API 연동 게시글 목록 (`boardType` 설정) |
| 게시글 상세 | URL 기반 게시글 상세 표시 |
| 상담 신청 폼 | `/api/consult` 연동 폼 |
| 환자 로그인 폼 | `/api/auth/login` 연동 |
| 환자 회원가입 폼 | `/api/auth/register` 연동 |

---

## 도메인 및 미리보기

### 도메인 구조

| 도메인 | 용도 |
|--------|------|
| `metalink3.mycafe24.com` | 관리자 전용 (자동 `/admin` 리다이렉트) |
| `{slug}.metalink3.mycafe24.com` | 도메인 연결 전 미리보기 |
| `wonju.clinic-info.co.kr` 등 | 실제 병원 사이트 도메인 |

### 도메인 연결 절차

1. DNS: 도메인 A 레코드 → 서버 IP (`172.235.202.109`)
2. 어드민: 도메인 관리 → 도메인 등록
3. Nginx: `server_name`에 도메인 추가
4. SSL: `certbot --nginx -d domain.com`

### 접근 제한

- 관리 도메인에서만 `/admin` 접근 가능
- 병원 도메인에서 `/admin` → `/` 리다이렉트
- 서브도메인 미리보기에서 `/admin` → `/` 리다이렉트

---

## 스타일 적용 안내

### 게시글 콘텐츠

- `<style>` 태그: XSS 방지로 **자동 제거**
- 인라인 `style="..."`: 유지됨

### 페이지 디자인 커스텀 CSS

`custom_css` 필드에 `<style>` 태그 없이 CSS 규칙만 작성. 해당 페이지 `<head>`에 삽입됩니다.

```css
/* 권장: 스코프 제한 */
.my-section .title { font-size: 1.2rem; }

/* 비권장: 전체 영향 */
h2 { color: red; }
```

### HTML 내 `<script>` 태그

페이지 디자인의 `content`(HTML) 안에 `<script>` 태그를 포함하면 자동 실행됩니다. `DOMContentLoaded` 래핑도 정상 작동합니다.

---

## 공통 오류 코드

| 상태 코드 | 의미 |
|-----------|------|
| 400 | 요청 파라미터 오류 |
| 401 | 인증 필요 |
| 404 | 리소스 없음 |
| 409 | 중복 (이메일 등) |
| 500 | 서버 오류 |

오류 응답 형식:
```json
{ "error": "오류 메시지" }
```
