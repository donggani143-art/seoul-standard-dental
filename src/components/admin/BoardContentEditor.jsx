'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { sanitizeRichHtml } from '@/lib/html';
import '@toast-ui/editor/dist/toastui-editor.css';

// 백과사전 등 커스텀 구문([[용어]]·[*각주])이 있으면 WYSIWYG 정규화를 피하고 HTML 모드로.
const SPECIAL_SYNTAX = /\[\[|\[\*/;

const quickInsertTemplates = [
  { label: '문단', html: '<p>내용을 입력하세요.</p>' },
  { label: '소제목', html: '<h2>소제목</h2>' },
  { label: '강조', html: '<strong>강조 텍스트</strong>' },
  { label: '링크', html: '<a href="https://example.com" target="_blank" rel="noreferrer">링크 텍스트</a>' },
  { label: '목록', html: '<ul><li>항목 1</li><li>항목 2</li></ul>' },
  { label: '이미지 태그', html: '<img src="" alt="" />' },
];

// ── TOAST UI Editor(WYSIWYG) ──────────────────────────────────────────────
function ToastEditor({ initialHTML, onChange, onImageUpload }) {
  const elRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const onImageUploadRef = useRef(onImageUpload);
  onChangeRef.current = onChange;
  onImageUploadRef.current = onImageUpload;
  const initRef = useRef(initialHTML || '');

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let destroyed = false;
    let editor = null;

    (async () => {
      try {
        const [{ default: Editor }] = await Promise.all([
          import('@toast-ui/editor'),
          import('@toast-ui/editor/dist/i18n/ko-kr'),
        ]);
        if (destroyed || !elRef.current) return;

        editor = new Editor({
          el: elRef.current,
          height: '520px',
          initialEditType: 'wysiwyg',
          previewStyle: 'vertical',
          language: 'ko-KR',
          usageStatistics: false,
          autofocus: false,
          placeholder: '본문을 입력하세요. 이미지는 툴바의 이미지 버튼 또는 드래그·붙여넣기로 추가할 수 있습니다.',
          toolbarItems: [
            ['heading', 'bold', 'italic', 'strike'],
            ['hr', 'quote'],
            ['ul', 'ol', 'task', 'indent', 'outdent'],
            ['table', 'image', 'link'],
            ['code', 'codeblock'],
            ['scrollSync'],
          ],
          hooks: {
            addImageBlobHook: async (blob, callback) => {
              try {
                if (!onImageUploadRef.current) throw new Error('이미지 업로드 기능을 사용할 수 없습니다.');
                const uploaded = await onImageUploadRef.current(blob);
                const url = uploaded?.path || uploaded?.url || '';
                if (!url) throw new Error('이미지 경로를 받지 못했습니다.');
                callback(url, blob?.name || '이미지');
              } catch (err) {
                // eslint-disable-next-line no-alert
                alert(err?.message || '이미지 업로드 중 오류가 발생했습니다.');
              }
              return false;
            },
          },
        });

        if (initRef.current) editor.setHTML(initRef.current, false);
        editor.on('change', () => onChangeRef.current?.(editor.getHTML()));
        setReady(true);
      } catch (err) {
        setLoadError(err?.message || '에디터를 불러오지 못했습니다.');
      }
    })();

    return () => {
      destroyed = true;
      try { editor?.destroy(); } catch { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadError) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-600">
        에디터 로드 실패: {loadError} — 상단에서 ‘HTML 직접 편집’으로 전환해 작성하세요.
      </div>
    );
  }

  return (
    <div className="board-toast-editor rounded-lg border border-zinc-200 bg-white">
      {!ready ? (
        <div className="flex h-[200px] items-center justify-center text-sm font-semibold text-zinc-400">
          에디터를 불러오는 중…
        </div>
      ) : null}
      <div ref={elRef} className={ready ? '' : 'hidden'} />
    </div>
  );
}

// ── HTML 직접 편집(원본 + 빠른 삽입 + 미리보기) ────────────────────────────
function HtmlEditor({ value, onChange, onImageUpload }) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [helper, setHelper] = useState('HTML 원본을 직접 편집합니다. 아래 미리보기에서 실제 화면을 확인할 수 있습니다.');
  const previewHtml = useMemo(() => sanitizeRichHtml(value), [value]);

  const insertAtCursor = (snippet) => {
    const cur = value || '';
    const ta = textareaRef.current;
    const start = ta?.selectionStart ?? cur.length;
    const end = ta?.selectionEnd ?? cur.length;
    const before = cur.slice(0, start);
    const after = cur.slice(end);
    const lead = before && !before.endsWith('\n') ? '\n' : '';
    const trail = after && !after.startsWith('\n') ? '\n' : '';
    const next = `${before}${lead}${snippet}${trail}${after}`;
    const cursor = before.length + lead.length + snippet.length;
    onChange(next);
    requestAnimationFrame(() => {
      const t = textareaRef.current;
      if (!t) return;
      t.focus();
      t.selectionStart = cursor;
      t.selectionEnd = cursor;
    });
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setHelper(`"${file.name}" 업로드 중입니다.`);
    try {
      const uploaded = await onImageUpload(file);
      const p = uploaded?.path || uploaded?.url || '';
      if (!p) throw new Error('이미지 경로를 받지 못했습니다.');
      insertAtCursor(`<img src="${p}" alt="" />`);
      setHelper(`업로드 완료: ${p}`);
    } catch (err) {
      setHelper(err?.message || '이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3">
        {quickInsertTemplates.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={uploading}
            onClick={() => insertAtCursor(item.html)}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? '이미지 업로드 중...' : '이미지 업로드'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>
      <textarea
        ref={textareaRef}
        name="content"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
        placeholder={'<p>본문을 입력하세요.</p>\n<img src="" alt="" />'}
        className="min-h-32 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-[13px] leading-6 text-offblack outline-none transition-colors focus:border-zinc-900 focus:bg-white"
      />
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold leading-6 text-zinc-500">
        {helper}
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Preview</p>
        {previewHtml ? (
          <div className="board-html max-w-none text-base leading-8 text-zinc-700" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        ) : (
          <p className="text-sm font-semibold text-zinc-400">미리보기 내용이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

// ── 모드 전환 래퍼 ────────────────────────────────────────────────────────
export default function BoardContentEditor({ value, onChange, onImageUpload }) {
  const hasSpecial = SPECIAL_SYNTAX.test(value || '');
  const [mode, setMode] = useState(() => (hasSpecial ? 'html' : 'wysiwyg'));
  const [mountKey, setMountKey] = useState(0);

  const switchTo = (next) => {
    if (next === mode) return;
    if (next === 'wysiwyg') setMountKey((k) => k + 1); // 최신 value로 재마운트
    setMode(next);
  };

  const TabBtn = ({ id, children }) => (
    <button
      type="button"
      onClick={() => switchTo(id)}
      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
        mode === id ? 'bg-offblack text-white' : 'text-zinc-500 hover:text-offblack'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="grid gap-2 md:col-span-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1">
          <TabBtn id="wysiwyg">비주얼 편집</TabBtn>
          <TabBtn id="html">HTML 직접 편집</TabBtn>
        </div>
        {hasSpecial ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
            백과사전 특수 구문 감지 — 안전을 위해 HTML 모드 권장
          </span>
        ) : null}
      </div>

      {mode === 'wysiwyg' ? (
        <ToastEditor key={mountKey} initialHTML={value} onChange={onChange} onImageUpload={onImageUpload} />
      ) : (
        <HtmlEditor value={value} onChange={onChange} onImageUpload={onImageUpload} />
      )}

      <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold leading-6 text-zinc-500">
        <b>비주얼 편집</b>: 워드처럼 표·이미지·링크·목록을 바로 넣고 이미지는 드래그·붙여넣기로 자동 업로드됩니다. · <b>HTML 직접 편집</b>: 원본 코드를 직접 다루며 백과사전 특수 구문([[용어]]·[*각주])을 그대로 보존합니다.
      </p>
    </div>
  );
}