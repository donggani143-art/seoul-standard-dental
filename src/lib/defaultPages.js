/**
 * 신규 병원 생성 시 자동으로 만들어지는 기본 페이지 템플릿.
 * 관리자는 어드민 페이지 빌더에서 자유롭게 수정 가능.
 */
import { getMainPageContent, getHeaderContent, getFooterContent } from '@/lib/siteTemplates';
import { LIGHT_SUBPAGES } from '@/lib/templates/lightTemplate';

const COMMON_CSS = `
.auth-page { min-height: 70vh; display: flex; align-items: center; justify-content: center; padding: 80px 20px; background: #fafafa; }
.auth-container { width: 100%; max-width: 420px; background: #fff; padding: 48px 36px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }
.auth-container h1 { text-align: center; font-size: 1.75rem; font-weight: 800; color: #18181b; margin: 0 0 32px; }
.auth-container form { display: flex; flex-direction: column; gap: 14px; }
.auth-container .auth-field { display: flex; flex-direction: column; gap: 6px; }
.auth-container .auth-field-label { font-size: 12px; font-weight: 600; color: #52525b; }
.auth-container .auth-field-label .req { color: #ef4444; margin-left: 2px; }
.auth-container input[type="text"], .auth-container input[type="email"], .auth-container input[type="tel"], .auth-container input[type="password"], .auth-container input[type="number"], .auth-container input[type="date"], .auth-container select, .auth-container textarea {
  width: 100%; border: 1px solid #e4e4e7; background: #fafafa; padding: 14px 16px; border-radius: 10px; font-size: 14px; outline: none; box-sizing: border-box; font-family: inherit; color: #18181b;
}
.auth-container select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%2371717a' d='M6 8L0 0h12z'/></svg>"); background-repeat: no-repeat; background-position: right 16px center; padding-right: 40px; }
.auth-container textarea { min-height: 84px; resize: vertical; }
.auth-container input:focus, .auth-container select:focus, .auth-container textarea:focus { border-color: #2563eb; background: #fff; }
.auth-container button[type="submit"] { background: #2563eb; color: #fff; font-weight: 700; padding: 14px; border-radius: 10px; border: none; font-size: 15px; cursor: pointer; margin-top: 8px; }
.auth-container button[type="submit"]:hover { background: #1d4ed8; }
.auth-container button[type="submit"]:disabled { opacity: 0.6; }
.auth-container .auth-error { display: none; text-align: center; color: #ef4444; font-size: 13px; font-weight: 700; }
.auth-container .auth-error.show { display: block; }
.auth-container .auth-link { text-align: center; margin: 16px 0 0; font-size: 13px; color: #71717a; }
.auth-container .auth-link a { color: #2563eb; font-weight: 700; margin-left: 4px; }
.auth-agree { display: flex; align-items: flex-start; gap: 8px; margin: 8px 0; font-size: 13px; color: #3f3f46; }
.auth-agree input { width: 16px; height: 16px; margin-top: 2px; }
.auth-agree a { color: #2563eb; text-decoration: underline; }

.policy-page { padding: 80px 20px; background: #fff; }
.policy-container { max-width: 800px; margin: 0 auto; }
.policy-container h1 { font-size: 2rem; font-weight: 800; color: #18181b; margin: 0 0 32px; padding-bottom: 16px; border-bottom: 2px solid #18181b; }
.policy-container h2 { font-size: 1.15rem; font-weight: 700; color: #18181b; margin: 32px 0 12px; }
.policy-container p, .policy-container li { font-size: 14px; line-height: 1.8; color: #3f3f46; }
.policy-container ul, .policy-container ol { padding-left: 20px; margin: 8px 0; }
.policy-container table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
.policy-container th, .policy-container td { border: 1px solid #e4e4e7; padding: 10px; text-align: left; }
.policy-container th { background: #fafafa; font-weight: 700; }
`;

export const DEFAULT_PAGES = [
  {
    slug: 'login',
    title: '로그인',
    page_type: 'builtin',
    content: `<section class="auth-page">
  <div class="auth-container">
    <h1>로그인</h1>
    <form id="loginForm">
      <input type="email" name="email" placeholder="이메일" required />
      <input type="password" name="password" placeholder="비밀번호" required />
      <div class="auth-error" id="loginError"></div>
      <button type="submit">로그인</button>
    </form>
    <p class="auth-link">계정이 없으신가요? <a href="/register">회원가입</a></p>
  </div>
</section>
<script>
(function(){
  var f = document.getElementById('loginForm');
  if (!f) return;
  f.addEventListener('submit', function(e){
    e.preventDefault();
    var err = document.getElementById('loginError');
    err.classList.remove('show');
    var btn = f.querySelector('button[type="submit"]');
    btn.disabled = true;
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email: f.email.value, password: f.password.value })
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d.ok) { location.href = '/'; }
      else { err.textContent = d.error || '로그인 실패'; err.classList.add('show'); btn.disabled = false; }
    })
    .catch(function(){ err.textContent = '네트워크 오류'; err.classList.add('show'); btn.disabled = false; });
  });
})();
</script>`,
    custom_css: COMMON_CSS,
  },
  {
    slug: 'register',
    title: '회원가입',
    page_type: 'builtin',
    content: `<section class="auth-page">
  <div class="auth-container">
    <h1>회원가입</h1>
    <form id="registerForm">
      <div id="registerDynamicFields"></div>
      <input type="email" name="email" placeholder="이메일" required />
      <input type="password" name="password" placeholder="비밀번호 (4자 이상)" minlength="4" required />
      <label class="auth-agree">
        <input type="checkbox" name="agreePrivacy" required />
        <span><a href="/privacy" target="_blank">개인정보 수집·이용</a>에 동의합니다 (필수)</span>
      </label>
      <label class="auth-agree">
        <input type="checkbox" name="agreeTerms" required />
        <span><a href="/terms" target="_blank">이용약관</a>에 동의합니다 (필수)</span>
      </label>
      <div class="auth-error" id="registerError"></div>
      <button type="submit">가입하기</button>
    </form>
    <p class="auth-link">이미 계정이 있으신가요? <a href="/login">로그인</a></p>
  </div>
</section>
<script>
(function(){
  var form = document.getElementById('registerForm');
  var host = document.getElementById('registerDynamicFields');
  var err = document.getElementById('registerError');
  if (!form || !host) return;

  var dynamicFields = [];

  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);
    });
  }

  function renderField(f){
    var req = f.required ? ' required' : '';
    var label = escapeHtml(f.label || f.key);
    var labelHtml = '<label class="auth-field-label">' + label + (f.required ? '<span class="req">*</span>' : '') + '</label>';
    var control = '';
    if (f.type === 'select'){
      var opts = (f.options || []).map(function(o){
        return '<option value="' + escapeHtml(o) + '">' + escapeHtml(o) + '</option>';
      }).join('');
      control = '<select name="' + escapeHtml(f.key) + '"' + req + '>' +
        '<option value="">선택하세요</option>' + opts + '</select>';
    } else if (f.type === 'textarea'){
      control = '<textarea name="' + escapeHtml(f.key) + '" placeholder="' + label + '"' + req + ' rows="3"></textarea>';
    } else {
      var type = f.type === 'tel' || f.type === 'email' || f.type === 'date' ? f.type : (f.type === 'number' ? 'text' : 'text');
      var inputmode = f.type === 'number' ? ' inputmode="numeric"' : '';
      control = '<input type="' + type + '" name="' + escapeHtml(f.key) + '" placeholder="' + label + '"' + inputmode + req + ' />';
    }
    return '<div class="auth-field">' + labelHtml + control + '</div>';
  }

  fetch('/api/auth/fields', { credentials: 'same-origin' })
    .then(function(r){ return r.json(); })
    .then(function(d){
      dynamicFields = (d && d.fields) || [];
      host.innerHTML = dynamicFields.map(renderField).join('');
    })
    .catch(function(){});

  form.addEventListener('submit', function(e){
    e.preventDefault();
    err.classList.remove('show');
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    var payload = { email: form.email.value, password: form.password.value };
    for (var i = 0; i < dynamicFields.length; i++){
      var f = dynamicFields[i];
      var el = form.elements[f.key];
      if (el) payload[f.key] = el.value;
    }
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d.ok) { location.href = '/'; }
      else { err.textContent = d.error || '가입 실패'; err.classList.add('show'); btn.disabled = false; }
    })
    .catch(function(){ err.textContent = '네트워크 오류'; err.classList.add('show'); btn.disabled = false; });
  });
})();
</script>`,
    custom_css: COMMON_CSS,
  },
  {
    slug: 'privacy',
    title: '개인정보 처리방침',
    page_type: 'builtin',
    content: `<section class="policy-page">
  <div class="policy-container">
    <h1>개인정보 처리방침</h1>

    <p>업체(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.</p>

    <h2>1. 수집하는 개인정보 항목</h2>
    <ul>
      <li>필수 항목: 이름, 이메일, 비밀번호, 연락처</li>
      <li>자동 수집 항목: 접속 IP, 쿠키, 접속 로그, 기기 정보</li>
    </ul>

    <h2>2. 개인정보 수집·이용 목적</h2>
    <ul>
      <li>회원 가입 및 관리</li>
      <li>예약 및 상담 서비스 제공</li>
      <li>공지사항 전달</li>
      <li>서비스 개선 및 통계 분석</li>
    </ul>

    <h2>3. 개인정보 보유 및 이용 기간</h2>
    <p>원칙적으로 개인정보 수집·이용 목적이 달성되면 지체 없이 파기합니다. 단, 관계 법령에 의해 보존할 필요가 있는 경우 다음과 같이 보관합니다.</p>
    <ul>
      <li>계약 또는 청약철회 기록: 5년</li>
      <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
      <li>소비자 불만 또는 분쟁처리 기록: 3년</li>
    </ul>

    <h2>4. 개인정보 제3자 제공</h2>
    <p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 법령에 의해 요구되는 경우에만 제공합니다.</p>

    <h2>5. 이용자의 권리</h2>
    <p>이용자는 언제든지 자신의 개인정보를 조회·수정·삭제 요청할 수 있습니다.</p>

    <h2>6. 개인정보 보호책임자</h2>
    <p>문의: 업체 대표번호</p>

    <p style="margin-top: 32px; font-size: 12px; color: #a1a1aa;">시행일자: 2026년 1월 1일</p>
  </div>
</section>`,
    custom_css: COMMON_CSS,
  },
  {
    slug: 'terms',
    title: '이용약관',
    page_type: 'builtin',
    content: `<section class="policy-page">
  <div class="policy-container">
    <h1>이용약관</h1>

    <h2>제1조 (목적)</h2>
    <p>이 약관은 업체(이하 "회사")가 제공하는 웹사이트 서비스의 이용 조건 및 절차, 이용자와 회사의 권리·의무를 규정함을 목적으로 합니다.</p>

    <h2>제2조 (용어의 정의)</h2>
    <ul>
      <li>"서비스"란 회사가 제공하는 웹사이트 및 관련 서비스를 말합니다.</li>
      <li>"회원"이란 회사와 서비스 이용 계약을 체결하고 아이디를 부여받은 자를 말합니다.</li>
    </ul>

    <h2>제3조 (약관의 효력 및 변경)</h2>
    <p>본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다. 회사는 필요 시 약관을 변경할 수 있으며, 변경 시 시행일 7일 전에 공지합니다.</p>

    <h2>제4조 (회원 가입)</h2>
    <p>회원가입은 이용자가 약관에 동의하고 회사가 정한 절차에 따라 신청하여 회사가 이를 승낙함으로써 성립합니다.</p>

    <h2>제5조 (서비스 이용)</h2>
    <ul>
      <li>회사는 서비스를 24시간 제공하는 것을 원칙으로 합니다.</li>
      <li>시스템 점검, 교체, 고장 등 부득이한 경우 서비스 제공이 일시 중단될 수 있습니다.</li>
    </ul>

    <h2>제6조 (회원의 의무)</h2>
    <ul>
      <li>회원은 타인의 정보를 도용하여서는 안 됩니다.</li>
      <li>회원은 서비스 이용 시 법령과 본 약관을 준수하여야 합니다.</li>
    </ul>

    <h2>제7조 (회사의 의무)</h2>
    <p>회사는 법령과 본 약관이 금지하는 행위를 하지 않으며, 지속적이고 안정적인 서비스 제공을 위해 노력합니다.</p>

    <h2>제8조 (면책)</h2>
    <p>회사는 천재지변, 전쟁, 기타 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</p>

    <p style="margin-top: 32px; font-size: 12px; color: #a1a1aa;">시행일자: 2026년 1월 1일</p>
  </div>
</section>`,
    custom_css: COMMON_CSS,
  },
  {
    slug: 'mypage',
    title: '마이페이지',
    page_type: 'builtin',
    content: `<section class="auth-page">
  <div class="auth-container">
    <h1>마이페이지</h1>
    <form id="profileForm">
      <label class="auth-label">이름</label>
      <input type="text" name="name" required />
      <label class="auth-label">연락처</label>
      <input type="tel" name="phone" placeholder="010-0000-0000" />
      <label class="auth-label">이메일</label>
      <input type="email" name="email" required />
      <div class="auth-error" id="profileError"></div>
      <div class="auth-success" id="profileSuccess"></div>
      <button type="submit">정보 수정</button>
    </form>

    <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;" />

    <h2 style="text-align:center; font-size:1.2rem; font-weight:700; color:#18181b; margin:0 0 20px;">비밀번호 변경</h2>
    <form id="passwordForm">
      <input type="password" name="currentPassword" placeholder="현재 비밀번호" required />
      <input type="password" name="newPassword" placeholder="새 비밀번호 (4자 이상)" minlength="4" required />
      <div class="auth-error" id="passwordError"></div>
      <div class="auth-success" id="passwordSuccess"></div>
      <button type="submit">비밀번호 변경</button>
    </form>

    <p class="auth-link">
      <a href="#" id="btnMyLogout" style="color:#ef4444;">로그아웃</a>
    </p>
  </div>
</section>
<script>
(function(){
  // 로그인 상태 확인 및 프로필 로드
  fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (!d.loggedIn) { location.href = '/login'; return; }
      var f = document.getElementById('profileForm');
      if (f) {
        f.name.value = d.patient.name || '';
        f.phone.value = d.patient.phone || '';
        f.email.value = d.patient.email || '';
      }
    });

  // 정보 수정
  var pf = document.getElementById('profileForm');
  if (pf) {
    pf.addEventListener('submit', function(e){
      e.preventDefault();
      var err = document.getElementById('profileError');
      var ok = document.getElementById('profileSuccess');
      err.classList.remove('show'); ok.classList.remove('show');
      var btn = pf.querySelector('button[type="submit"]');
      btn.disabled = true;
      fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name: pf.name.value, phone: pf.phone.value, email: pf.email.value })
      })
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d.ok) { ok.textContent = '정보가 수정되었습니다.'; ok.classList.add('show'); }
        else { err.textContent = d.error || '수정 실패'; err.classList.add('show'); }
        btn.disabled = false;
      })
      .catch(function(){ err.textContent = '네트워크 오류'; err.classList.add('show'); btn.disabled = false; });
    });
  }

  // 비밀번호 변경
  var pwf = document.getElementById('passwordForm');
  if (pwf) {
    pwf.addEventListener('submit', function(e){
      e.preventDefault();
      var err = document.getElementById('passwordError');
      var ok = document.getElementById('passwordSuccess');
      err.classList.remove('show'); ok.classList.remove('show');
      var btn = pwf.querySelector('button[type="submit"]');
      btn.disabled = true;
      fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ currentPassword: pwf.currentPassword.value, newPassword: pwf.newPassword.value })
      })
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d.ok) { ok.textContent = '비밀번호가 변경되었습니다.'; ok.classList.add('show'); pwf.reset(); }
        else { err.textContent = d.error || '변경 실패'; err.classList.add('show'); }
        btn.disabled = false;
      })
      .catch(function(){ err.textContent = '네트워크 오류'; err.classList.add('show'); btn.disabled = false; });
    });
  }

  // 로그아웃
  var lb = document.getElementById('btnMyLogout');
  if (lb) {
    lb.addEventListener('click', function(e){
      e.preventDefault();
      fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
        .then(function(){ location.href = '/'; });
    });
  }
})();
</script>`,
    custom_css: COMMON_CSS + `
.auth-label { font-size: 12px; font-weight: 700; color: #71717a; margin-top: 4px; }
.auth-success { display: none; text-align: center; color: #10b981; font-size: 13px; font-weight: 700; }
.auth-success.show { display: block; }
.auth-container h2 { text-align: center; font-size: 1.2rem; font-weight: 700; color: #18181b; margin: 0 0 20px; }
`,
  },
  {
    slug: 'notice',
    title: '공지사항',
    page_type: 'builtin',
    content: `<section class="board-list-page">
  <div class="board-container">
    <div class="board-header">
      <h1>공지사항</h1>
      <p>업체 소식과 운영 변경 사항을 확인해 보세요.</p>
    </div>
    <div class="board-list" id="boardList">
      <div class="board-loading">불러오는 중...</div>
    </div>
  </div>
</section>
<script>
(function(){
  var container = document.getElementById('boardList');
  if (!container) return;
  fetch('/api/board?type=notice', { credentials: 'same-origin' })
    .then(function(r){ return r.json(); })
    .then(function(posts){
      if (!Array.isArray(posts) || posts.length === 0) {
        container.innerHTML = '<div class="board-empty">등록된 공지사항이 없습니다.</div>';
        return;
      }
      var html = '<div class="board-head"><div class="col-num">번호</div><div class="col-title">제목</div><div class="col-date">등록일</div></div>';
      posts.forEach(function(p, i){
        var date = (p.created_at || '').slice(0, 10);
        html += '<a href="/community/notice/' + p.id + '" class="board-row">'
          + '<div class="col-num">' + (posts.length - i) + '</div>'
          + '<div class="col-title">' + p.title + '</div>'
          + '<div class="col-date">' + date + '</div>'
          + '</a>';
      });
      container.innerHTML = html;
    })
    .catch(function(){ container.innerHTML = '<div class="board-empty">게시글을 불러올 수 없습니다.</div>'; });
})();
</script>`,
    custom_css: `
.board-list-page { min-height: 70vh; padding: 80px 20px; background: #fff; }
.board-container { max-width: 1100px; margin: 0 auto; }
.board-header { margin-bottom: 40px; }
.board-header h1 { font-size: 2rem; font-weight: 800; color: #18181b; margin: 0 0 8px; }
.board-header p { color: #71717a; font-size: 15px; margin: 0; }
.board-list { border-top: 2px solid #18181b; background: #fff; }
.board-head { display: grid; grid-template-columns: 80px 1fr 120px; padding: 16px 20px; background: #fafafa; border-bottom: 1px solid #e4e4e7; font-size: 13px; font-weight: 700; color: #71717a; }
.board-row { display: grid; grid-template-columns: 80px 1fr 120px; padding: 20px; border-bottom: 1px solid #f4f4f5; color: inherit; text-decoration: none; transition: background 0.15s; align-items: center; }
.board-row:hover { background: #fafafa; }
.board-row .col-num { color: #a1a1aa; font-size: 13px; text-align: center; }
.board-row .col-title { font-weight: 600; color: #18181b; font-size: 15px; }
.board-row:hover .col-title { color: #2563eb; }
.board-row .col-date { color: #a1a1aa; font-size: 13px; text-align: right; }
.board-empty { padding: 80px 20px; text-align: center; color: #a1a1aa; border: 1px solid #e4e4e7; border-top: none; border-radius: 0 0 12px 12px; }
.board-loading { padding: 40px; text-align: center; color: #a1a1aa; }
@media (max-width: 768px) {
  .board-head, .board-row { grid-template-columns: 1fr 100px; padding: 14px 16px; }
  .board-head .col-num, .board-row .col-num { display: none; }
}
`,
  },
  {
    slug: 'event',
    title: '이벤트',
    page_type: 'builtin',
    content: `<section class="board-list-page">
  <div class="board-container">
    <div class="board-header">
      <h1><span class="accent">이벤트</span></h1>
      <p>현재 진행 중인 혜택과 프로모션 소식을 확인해 보세요.</p>
    </div>
    <div class="event-grid" id="eventList">
      <div class="board-loading">불러오는 중...</div>
    </div>
  </div>
</section>
<script>
(function(){
  var container = document.getElementById('eventList');
  if (!container) return;
  fetch('/api/board?type=event', { credentials: 'same-origin' })
    .then(function(r){ return r.json(); })
    .then(function(posts){
      if (!Array.isArray(posts) || posts.length === 0) {
        container.innerHTML = '<div class="board-empty">진행 중인 이벤트가 없습니다.</div>';
        return;
      }
      var html = '';
      posts.forEach(function(p){
        var date = (p.created_at || '').slice(0, 10);
        html += '<a href="/community/event/' + p.id + '" class="event-card">'
          + '<div class="event-badge">EVENT</div>'
          + '<h3>' + p.title + '</h3>'
          + '<p>' + date + '</p>'
          + '</a>';
      });
      container.innerHTML = html;
    })
    .catch(function(){ container.innerHTML = '<div class="board-empty">게시글을 불러올 수 없습니다.</div>'; });
})();
</script>`,
    custom_css: `
.board-list-page { min-height: 70vh; padding: 80px 20px; background: #fff; }
.board-container { max-width: 1100px; margin: 0 auto; }
.board-header { margin-bottom: 40px; }
.board-header h1 { font-size: 2rem; font-weight: 800; color: #18181b; margin: 0 0 8px; }
.board-header h1 .accent { color: #fca311; }
.board-header p { color: #71717a; font-size: 15px; margin: 0; }
.event-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.event-card { display: block; padding: 28px; border: 1px solid #e4e4e7; border-radius: 16px; text-decoration: none; color: inherit; transition: all 0.2s; background: #fff; }
.event-card:hover { border-color: #fca311; transform: translateY(-2px); box-shadow: 0 10px 30px rgba(252,163,17,0.1); }
.event-badge { display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #fca311; background: #fff4e0; padding: 4px 10px; border-radius: 999px; margin-bottom: 16px; }
.event-card h3 { font-size: 1.15rem; font-weight: 700; color: #18181b; margin: 0 0 12px; line-height: 1.4; }
.event-card p { color: #a1a1aa; font-size: 13px; margin: 0; }
.board-empty { grid-column: 1/-1; padding: 80px 20px; text-align: center; color: #a1a1aa; border: 1px solid #e4e4e7; border-radius: 12px; }
.board-loading { grid-column: 1/-1; padding: 40px; text-align: center; color: #a1a1aa; }
`,
  },
  {
    slug: 'notice-detail',
    title: '공지사항 상세',
    page_type: 'builtin',
    content: `<!-- 템플릿 변수: {{post.title}}, {{post.content}}, {{post.date}}, {{post.boardLabel}}, {{post.listHref}}, {{post.listLabel}} -->
<main class="board-detail-page">
  <article class="board-detail">
    <div class="detail-header">
      <div class="detail-meta">
        <span class="detail-badge">{{post.boardLabel}}</span>
        <span class="detail-date">{{post.date}}</span>
      </div>
      <h1>{{post.title}}</h1>
    </div>
    <div class="detail-body">{{post.content}}</div>
  </article>
  <div class="detail-footer">
    <a href="{{post.listHref}}" class="list-btn">{{post.listLabel}}</a>
  </div>
</main>`,
    custom_css: `
.board-detail-page { max-width: 900px; margin: 0 auto; min-height: 70vh; padding: 120px 20px 80px; }
.board-detail { border: 1px solid #e4e4e7; border-radius: 24px; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.04); overflow: hidden; }
.detail-header { padding: 40px 48px; border-bottom: 1px solid #e4e4e7; }
.detail-meta { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
.detail-badge { background: rgba(37,99,235,0.1); color: #2563eb; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 999px; }
.detail-date { color: #a1a1aa; font-size: 13px; font-weight: 600; }
.detail-header h1 { font-size: 1.75rem; font-weight: 800; color: #18181b; margin: 0; line-height: 1.3; letter-spacing: -0.01em; }
.detail-body { padding: 40px 48px; font-size: 15px; line-height: 1.9; color: #3f3f46; }
.detail-body img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; }
.detail-footer { display: flex; justify-content: flex-end; margin-top: 24px; }
.list-btn { display: inline-flex; align-items: center; padding: 12px 20px; border: 1px solid #d4d4d8; border-radius: 10px; font-size: 14px; font-weight: 700; color: #3f3f46; text-decoration: none; transition: all 0.15s; background: #fff; }
.list-btn:hover { border-color: #2563eb; color: #2563eb; }
@media (max-width: 768px) {
  .board-detail-page { padding: 100px 16px 60px; }
  .detail-header, .detail-body { padding: 28px 24px; }
  .detail-header h1 { font-size: 1.4rem; }
}
`,
  },
  {
    slug: 'event-detail',
    title: '이벤트 상세',
    page_type: 'builtin',
    content: `<!-- 템플릿 변수: {{post.title}}, {{post.content}}, {{post.date}}, {{post.boardLabel}}, {{post.listHref}}, {{post.listLabel}} -->
<main class="board-detail-page">
  <article class="board-detail">
    <div class="detail-header">
      <div class="detail-meta">
        <span class="detail-badge event">{{post.boardLabel}}</span>
        <span class="detail-date">{{post.date}}</span>
      </div>
      <h1>{{post.title}}</h1>
    </div>
    <div class="detail-body">{{post.content}}</div>
  </article>
  <div class="detail-footer">
    <a href="{{post.listHref}}" class="list-btn">{{post.listLabel}}</a>
  </div>
</main>`,
    custom_css: `
.board-detail-page { max-width: 900px; margin: 0 auto; min-height: 70vh; padding: 120px 20px 80px; }
.board-detail { border: 1px solid #e4e4e7; border-radius: 24px; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.04); overflow: hidden; }
.detail-header { padding: 40px 48px; border-bottom: 1px solid #e4e4e7; }
.detail-meta { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
.detail-badge.event { background: rgba(252,163,17,0.1); color: #fca311; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 999px; }
.detail-date { color: #a1a1aa; font-size: 13px; font-weight: 600; }
.detail-header h1 { font-size: 1.75rem; font-weight: 800; color: #18181b; margin: 0; line-height: 1.3; letter-spacing: -0.01em; }
.detail-body { padding: 40px 48px; font-size: 15px; line-height: 1.9; color: #3f3f46; }
.detail-body img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; }
.detail-footer { display: flex; justify-content: flex-end; margin-top: 24px; }
.list-btn { display: inline-flex; align-items: center; padding: 12px 20px; border: 1px solid #d4d4d8; border-radius: 10px; font-size: 14px; font-weight: 700; color: #3f3f46; text-decoration: none; transition: all 0.15s; background: #fff; }
.list-btn:hover { border-color: #fca311; color: #fca311; }
@media (max-width: 768px) {
  .board-detail-page { padding: 100px 16px 60px; }
  .detail-header, .detail-body { padding: 28px 24px; }
  .detail-header h1 { font-size: 1.4rem; }
}
`,
  },
];

/**
 * 특정 병원에 기본 페이지들이 없으면 생성
 * @param {string} templateKey - 'blank' | 'modern' | 'premium'
 * @param {string} hospitalName - 템플릿에 치환될 병원명
 */
export async function ensureDefaultPagesForHospital(db, hospitalId, templateKey = null, hospitalName = '', hospitalSlug = '') {
  // 라이트/베이직 커뮤니티 "진료안내" 게시판 슬러그 (병원별 고유)
  // board_groups.slug 는 전역 UNIQUE 이므로, 같은 슬러그를 쓴 병원이 삭제→재생성된 경우
  // 옛 게시판이 다른 hospital_id 로 남아 충돌할 수 있다. 다른 병원이 점유 중이면 병원 id 를 붙여 회피.
  let guideSlug = hospitalSlug ? `${hospitalSlug}-guide` : `guide-h${hospitalId}`;
  const slugClash = await db.get('SELECT id, hospital_id FROM board_groups WHERE slug = ?', [guideSlug]);
  if (slugClash && slugClash.hospital_id !== hospitalId) {
    guideSlug = `${guideSlug}-${hospitalId}`;
  }
  const guideHref = `/community/${guideSlug}`;
  // 기본 auth/policy/board 페이지들 생성
  for (const page of DEFAULT_PAGES) {
    const existing = await db.get(
      'SELECT id, content FROM pages WHERE slug = ? AND hospital_id = ?',
      [page.slug, hospitalId]
    );
    if (!existing) {
      await db.run(
        `INSERT INTO pages (hospital_id, slug, title, content, custom_css, custom_js, meta_title, meta_description, is_published, sort_order, page_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 100, ?)`,
        [hospitalId, page.slug, page.title, page.content, page.custom_css || '', page.custom_js || '', page.title, '', page.page_type]
      );
    } else if (page.slug === 'register' && existing.content) {
      const isUnmodifiedOld = !existing.content.includes('registerDynamicFields') && existing.content.includes('f.name.value');
      const isUnmodifiedV1 = existing.content.includes('registerDynamicFields') && !existing.content.includes('auth-field-label');
      if (isUnmodifiedOld || isUnmodifiedV1) {
        await db.run(
          'UPDATE pages SET content = ?, custom_css = ? WHERE id = ?',
          [page.content, page.custom_css || '', existing.id]
        );
      }
    }
  }

  // 템플릿 선택 시에만 생성 (기존 있으면 스킵)
  if (templateKey) {
    const layoutPages = [
      { slug: 'main',    title: '메인 페이지', sort: 0,   pageType: 'builtin', get: () => getMainPageContent(templateKey, hospitalName) },
      { slug: '_header', title: '공통 헤더',   sort: -10, pageType: 'layout',  get: () => getHeaderContent(templateKey, hospitalName) },
      { slug: '_footer', title: '공통 푸터',   sort: 999, pageType: 'layout',  get: () => getFooterContent(templateKey, hospitalName) },
    ];

    for (const p of layoutPages) {
      const existing = await db.get(
        'SELECT id FROM pages WHERE slug = ? AND hospital_id = ?',
        [p.slug, hospitalId]
      );
      if (!existing) {
        const tpl = p.get();
        const content = String(tpl.content || '').replace(/\{\{guide_href\}\}/g, guideHref);
        await db.run(
          `INSERT INTO pages (hospital_id, slug, title, content, custom_css, custom_js, meta_title, meta_description, is_published, sort_order, page_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, '', 1, ?, ?)`,
          [hospitalId, p.slug, p.title, content, tpl.custom_css || '', tpl.custom_js || '', p.title, p.sort, p.pageType]
        );
      }
    }

    // 라이트/베이직 템플릿: 병원소개·진료안내·FAQ 서브 페이지 + 진료안내 게시판 자동 생성
    if (templateKey === 'light' || templateKey === 'basic') {
      for (const sp of LIGHT_SUBPAGES(hospitalName)) {
        const exists = await db.get('SELECT id FROM pages WHERE slug = ? AND hospital_id = ?', [sp.slug, hospitalId]);
        if (!exists) {
          await db.run(
            `INSERT INTO pages (hospital_id, slug, title, content, custom_css, custom_js, meta_title, meta_description, is_published, sort_order, page_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, '', 1, ?, 'builtin')`,
            [hospitalId, sp.slug, sp.title, sp.content, sp.custom_css || '', sp.custom_js || '', sp.title, sp.sort || 50]
          );
        }
      }

      // 커뮤니티 "진료안내" 포스팅 자동화 게시판 (병원별 고유 슬러그)
      const existingBoard = await db.get('SELECT id FROM board_groups WHERE slug = ? AND hospital_id = ?', [guideSlug, hospitalId]);
      if (!existingBoard) {
        await db.run(
          `INSERT INTO board_groups (slug, name, description, is_active, members_only, sort_order, hospital_id)
           VALUES (?, '진료안내', '진료 정보·소식을 안내하는 게시판입니다.', 1, 0, 0, ?)`,
          [guideSlug, hospitalId]
        );
        await ensureCustomBoardPages(db, hospitalId, guideSlug, '진료안내');
      }
    }
  }
}

/**
 * 커스텀 게시판 그룹 생성 시, notice 템플릿을 기반으로
 * board-{slug}, board-{slug}-detail 페이지를 자동 생성한다.
 */
export async function ensureCustomBoardPages(db, hospitalId, boardSlug, boardName) {
  const listSlug = `board-${boardSlug}`;
  const detailSlug = `board-${boardSlug}-detail`;

  const noticeList = DEFAULT_PAGES.find(p => p.slug === 'notice');
  const noticeDetail = DEFAULT_PAGES.find(p => p.slug === 'notice-detail');
  if (!noticeList || !noticeDetail) return;

  // 목록 페이지: notice API 호출 부분을 board+groupSlug로 치환
  const listContent = noticeList.content
    .replace('공지사항', boardName)
    .replace('업체 소식과 운영 변경 사항을 확인해 보세요.', `${boardName} 게시판입니다.`)
    .replace("fetch('/api/board?type=notice'", `fetch('/api/board?type=board&groupSlug=${boardSlug}'`)
    .replace("등록된 공지사항이 없습니다.", '등록된 게시글이 없습니다.')
    .replace("href=\"/community/notice/'", `href="/community/${boardSlug}/'`);

  for (const spec of [
    { slug: listSlug, title: `${boardName} 목록`, content: listContent, css: noticeList.custom_css },
    { slug: detailSlug, title: `${boardName} 상세`, content: noticeDetail.content, css: noticeDetail.custom_css },
  ]) {
    const existing = await db.get('SELECT id FROM pages WHERE slug = ? AND hospital_id = ?', [spec.slug, hospitalId]);
    if (!existing) {
      await db.run(
        `INSERT INTO pages (hospital_id, slug, title, content, custom_css, custom_js, meta_title, meta_description, is_published, sort_order, page_type)
         VALUES (?, ?, ?, ?, ?, '', ?, '', 1, 100, 'builtin')`,
        [hospitalId, spec.slug, spec.title, spec.content, spec.css || '', spec.title]
      );
    }
  }
}
