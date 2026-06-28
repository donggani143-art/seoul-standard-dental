# METALINK CMS — MCP 서버

Claude(데스크톱·웹·모바일)에서 METALINK CMS 플랫폼을 직접 제어하는 MCP(Model Context Protocol) 서버입니다.

**두 가지 연결 방식**
- **데스크톱(stdio)** — 로컬에서 `server.mjs`를 실행, 환경변수 계정으로 동작.
- **웹/모바일(OAuth 원격 커넥터)** — `https://mcp.metacms.kr/mcp`에 커스텀 커넥터로 연결, 브라우저에서 플랫폼 계정으로 직접 로그인. (계정 역할이 권한을 결정)

## 권한 모델 — 슈퍼어드민 / 업체어드민

이 MCP는 플랫폼에 **관리자 계정으로 로그인(세션)** 하여 동작합니다. 권한은 **연결한 계정의 역할**에 따라 자동 결정됩니다 (플랫폼의 기존 역할 기반 권한을 그대로 사용).

| 연결 계정 | 노출되는 도구 |
|---|---|
| **슈퍼어드민** (`super_admin`) | 업체·계정·로그·통계 등 **전체 관리** + 아래 업체 도구 |
| **업체어드민** (`hospital_admin`) | **자기 업체**의 게시판·페이지·상담·SEO 도구만 |

→ 슈퍼/업체 두 권한은 **계정을 다르게 연결**하면 됩니다 (Claude 설정에 항목 2개 등록).

### 슈퍼어드민의 업체 지정 (`hospital_id`)

슈퍼어드민은 여러 업체를 보므로, 업체별 데이터를 다루는 도구(`list_pages`/`update_page`/`create_post`/`create_board_group`/`list_board_groups`/`list_consultations`/`list_posts`/`get_seo_settings`)에 **`hospital_id`** 파라미터가 있습니다.

- 먼저 `list_hospitals`로 대상 업체의 `id`를 확인하세요.
- 페이지·게시판 슬러그(`main` 등)는 **업체마다 중복**되므로, 슈퍼어드민은 `hospital_id`를 지정해야 그 업체에만 안전하게 스코프됩니다(내부적으로 임퍼소네이션 적용).
- **쓰기 도구**(`update_page`/`create_post`/`create_board_group`)는 슈퍼어드민의 경우 `hospital_id`가 **필수**입니다. 미지정 시 다른 업체를 덮어쓰지 않도록 거부합니다.
- 업체어드민 계정으로 연결하면 이 파라미터는 노출되지 않고 자동으로 자기 업체에만 적용됩니다.

## 제공 도구

**공통(업체어드민 이상)**
- `whoami` — 연결 계정·권한 확인
- `list_consultations` — 상담 문의 목록
- `list_posts` — 게시판 글 목록
- `create_post` — 게시글 발행(포스팅 자동화)
- `list_board_groups` / `create_board_group` — 커스텀 게시판
- `list_pages` / `update_page` — 사이트 페이지 조회·수정(HTML/CSS/JS·메타)
- `get_seo_settings` — SEO·GEO 정보

**슈퍼어드민 전용**
- `list_hospitals` / `create_hospital` — 업체 관리
- `list_accounts` / `create_account` — 관리자 계정 관리
- `list_activity_logs` — 활동 로그
- `get_analytics` — 방문 통계

## 설치

```bash
cd mcp
npm install
```

## Claude 데스크톱 연결

설정 파일을 엽니다:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

아래처럼 **두 권한을 각각** 등록합니다(필요한 것만 등록해도 됩니다). 경로는 이 `server.mjs`의 절대경로로 바꾸세요.

```json
{
  "mcpServers": {
    "metalink-슈퍼어드민": {
      "command": "node",
      "args": ["C:\\Users\\user\\Desktop\\claude_work\\project\\Metalink_hompage\\mcp\\server.mjs"],
      "env": {
        "PLATFORM_URL": "https://metacms.kr",
        "ADMIN_EMAIL": "superadmin@platform.local",
        "ADMIN_PASSWORD": "슈퍼어드민_비밀번호"
      }
    },
    "metalink-업체어드민": {
      "command": "node",
      "args": ["C:\\Users\\user\\Desktop\\claude_work\\project\\Metalink_hompage\\mcp\\server.mjs"],
      "env": {
        "PLATFORM_URL": "https://metacms.kr",
        "ADMIN_EMAIL": "업체관리자_이메일",
        "ADMIN_PASSWORD": "업체관리자_비밀번호"
      }
    }
  }
}
```

설정 후 Claude 데스크톱을 **재시작**하면 도구가 나타납니다.

## Claude 웹/모바일 연결 (OAuth 원격 커넥터)

데스크톱 설정 파일이 필요 없습니다. claude.ai(웹) 또는 모바일 앱에서 **커스텀 커넥터**를 추가합니다.

1. **설정 → 커넥터 → 커넥터 추가(Add custom connector)**
2. **URL**: `https://mcp.metacms.kr/mcp`
3. 연결을 누르면 **METALINK CMS 로그인 화면**이 뜹니다. 관리자 계정(이메일/비밀번호)으로 로그인하세요.
4. 로그인한 **계정의 역할**에 따라 권한이 자동 부여됩니다.
   - 슈퍼어드민 계정으로 로그인 → 전체 관리 도구
   - 업체어드민 계정으로 로그인 → 자기 업체 도구만

> 인증은 OAuth 2.1(DCR·PKCE)로 처리됩니다. 비밀번호는 토큰 발급 시 1회만 검증되며 저장되지 않습니다(세션 쿠키만 메모리 보관, 서버 재시작 시 재로그인). 권한 부여를 바꾸려면 **계정을 바꿔 로그인**하면 됩니다.

## 환경변수

| 변수 | 설명 | 기본값 |
|---|---|---|
| `PLATFORM_URL` | 플랫폼 주소 | `https://metacms.kr` |
| `MCP_PORT` | **설정 시 HTTP/OAuth(원격) 모드**, 미설정 시 stdio(데스크톱) | (없음) |
| `MCP_PUBLIC_URL` | HTTP 모드 공개 주소 (OAuth issuer) | `https://mcp.metacms.kr` |
| `ADMIN_EMAIL` | stdio 모드 관리자 이메일 | (stdio 시 필수) |
| `ADMIN_PASSWORD` | stdio 모드 관리자 비밀번호 | (stdio 시 필수) |

## 보안 메모

- 권한은 **플랫폼 서버가 세션 역할로 강제**합니다. 업체어드민 계정으로 연결하면 슈퍼 도구는 노출되지 않고, 설령 호출해도 서버가 거부합니다.
- 비밀번호는 Claude 설정 파일에 평문 저장되므로 파일 접근 권한에 유의하세요.
- 통신은 HTTPS(`https://metacms.kr`)로 이뤄집니다.

## 도구 추가

`server.mjs`의 `reg(server, name, { title, description, input, readOnly }, fn)` 헬퍼로 도구를 등록합니다(내부적으로 `registerTool` + annotations). `fn` 안에서 `api(path, { method, json, query })`로 플랫폼 REST API를 호출하세요. 슈퍼 전용은 `if (isSuper) { ... }` 블록 안에 둡니다.