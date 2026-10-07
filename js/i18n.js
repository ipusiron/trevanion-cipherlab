// 言語の選択と、HTMLに書いた静的な文言（data-i18n・data-i18n-attr）の差し替え。globalThis.TrevanionI18n に置く
// 文言のなかの **…** は太字、*…* は強調、[文字](URL) はリンク、改行（\n）は改行として組み立てる。
// 文言をHTMLとして解釈しないので、辞書に <script> を書いてもタグにはならない。
(() => {
  'use strict';

  const STORAGE_KEY = 'tcl_lang';

  // ?lang= → 保存した選択 → ブラウザーの言語（ja で始まれば日本語、ほかは英語）。辞書にない言語は日本語
  function detectLanguage(search, stored, navigatorLanguage, langs) {
    const list = langs || globalThis.TrevanionMessages.LANGS;
    const q = new URLSearchParams(search || '').get('lang');
    if (list.includes(q)) return q;
    if (list.includes(stored)) return stored;
    const nav = String(navigatorLanguage || '').toLowerCase().startsWith('ja') ? 'ja' : 'en';
    return list.includes(nav) ? nav : 'ja';
  }

  function readStored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function store(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // 保存できない環境では、そのページの間だけ切り替える
    }
  }

  // **太字**・*強調*・[文字](URL) を拾う。長い **…** を先に見るので ** が * に食われない
  const TOKEN = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

  function makeNode(m) {
    if (m[1] !== undefined) {
      const el = document.createElement('strong');
      el.textContent = m[1];
      return el;
    }
    if (m[2] !== undefined) {
      const el = document.createElement('em');
      el.textContent = m[2];
      return el;
    }
    const a = document.createElement('a');
    a.textContent = m[3];
    a.setAttribute('href', m[4]);
    if (/^https?:/i.test(m[4])) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
    return a;
  }

  // 文言を要素へ入れる（既存の子は捨てる）
  function renderRich(el, text) {
    el.replaceChildren();
    String(text).split('\n').forEach((line, i) => {
      if (i) el.append(document.createElement('br'));
      let last = 0;
      for (const m of line.matchAll(TOKEN)) {
        if (m.index > last) el.append(document.createTextNode(line.slice(last, m.index)));
        el.append(makeNode(m));
        last = m.index + m[0].length;
      }
      if (last < line.length) el.append(document.createTextNode(line.slice(last)));
    });
  }

  // data-i18n="key" は文言、data-i18n-attr="attr:key;attr:key" は属性
  function applyStaticText(root) {
    const scope = root || document;
    for (const el of scope.querySelectorAll('[data-i18n]')) renderRich(el, api.t(el.dataset.i18n));
    for (const el of scope.querySelectorAll('[data-i18n-attr]')) {
      for (const pair of el.dataset.i18nAttr.split(';')) {
        const [attr, key] = pair.split(':');
        if (attr && key) el.setAttribute(attr.trim(), api.t(key.trim()));
      }
    }
    document.documentElement.lang = api.lang;
    document.title = api.t('meta.title');
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', api.t('meta.description'));
  }

  const listeners = [];
  const api = {
    lang: 'ja',
    STORAGE_KEY,
    detectLanguage,
    renderRich,
    applyStaticText,
    t(key, vars) {
      return globalThis.TrevanionMessages.t(key, vars, api.lang);
    },
    init() {
      api.lang = detectLanguage(location.search, readStored(), navigator.language);
      applyStaticText();
    },
    set(lang) {
      if (!globalThis.TrevanionMessages.LANGS.includes(lang)) return;
      api.lang = lang;
      store(lang);
      applyStaticText();
      for (const fn of listeners) fn(lang);
    },
    onChange(fn) {
      listeners.push(fn);
    },
  };

  globalThis.TrevanionI18n = api;
})();
