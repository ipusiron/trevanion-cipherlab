// 日本語と英語の文言がそろっているか、画面の文言と辞書がずれていないかを見る
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, core } from './load.js';
import vm from 'node:vm';

const html = read('index.html');

// 辞書と i18n を読み込む（どちらも globalThis に置く形）
vm.runInThisContext(read('js/messages.js'));
const { LANGS, DICT, t } = globalThis.TrevanionMessages;

// --- 辞書そのもの

test('日本語と英語で同じキーがそろっている', () => {
  assert.deepEqual(LANGS, ['ja', 'en']);
  const ja = Object.keys(DICT.ja).sort();
  const en = Object.keys(DICT.en).sort();
  assert.deepEqual(en, ja);
  assert.ok(ja.length > 100, `キーが ${ja.length} 件しかない`);
});

test('英語に日本語が残っていない', () => {
  const leftover = Object.entries(DICT.en)
    .filter(([, v]) => /[぀-ヿ一-鿿]/.test(v))
    // 日本語の固有名詞・用語をそのまま示す箇所は除く
    .filter(([k]) => !['ui.langButton', 'ui.langLabel', 'basic.rule.puncts',
      'enc.cover.placeholder', 'study.def.note'].includes(k))
    .map(([k]) => k);
  assert.deepEqual(leftover, []);
});

test('英語が日本語の丸写しになっていない', () => {
  const same = Object.keys(DICT.ja).filter((k) => DICT.ja[k] === DICT.en[k]);
  assert.deepEqual(same, []);
});

test('t() は言語を選び、{変数} を置き換える', () => {
  assert.equal(t('dec.run', null, 'ja'), 'ハイライト＆抽出');
  assert.equal(t('dec.run', null, 'en'), 'Highlight and extract');
  assert.equal(t('dec.run', null, 'xx'), 'ハイライト＆抽出', '知らない言語は日本語にする');
  assert.equal(t('auto.search.summary', null, 'en'), '🎯 Search for exact matches');
  assert.equal(t('存在しないキー', null, 'ja'), '存在しないキー', '無いキーはキー名をそのまま返す');
});

test('印の対応がとれている（** と * と [](URL)）', () => {
  for (const lang of LANGS) {
    for (const [key, value] of Object.entries(DICT[lang])) {
      const bold = (value.match(/\*\*/g) || []).length;
      assert.equal(bold % 2, 0, `${lang}/${key} の ** が奇数個`);
      const rest = value.replace(/\*\*/g, '');
      const em = (rest.match(/\*/g) || []).length;
      assert.equal(em % 2, 0, `${lang}/${key} の * が奇数個`);
      for (const m of value.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
        assert.match(m[2], /^https?:\/\//, `${lang}/${key} のリンク先が URL でない`);
      }
    }
  }
});

// --- 画面との対応

/** data-i18n / data-i18n-attr が付いた要素を、開始タグと中身に分けて取り出す */
function i18nElements(source) {
  const out = [];
  const re = /<([a-z0-9]+)\b([^>]*\bdata-i18n(?:-attr)?="[^"]*"[^>]*)>/gi;
  for (const m of source.matchAll(re)) {
    const name = m[1].toLowerCase();
    const attrs = m[2];
    let body = null;
    if (!/\/$/.test(attrs) && !['input', 'img', 'br'].includes(name)) {
      // 同じ名前のタグの入れ子を数えながら、閉じタグを探す
      const open = new RegExp(`<${name}\\b`, 'gi');
      const close = new RegExp(`</${name}\\s*>`, 'gi');
      let depth = 1;
      let pos = m.index + m[0].length;
      while (depth > 0) {
        open.lastIndex = pos;
        close.lastIndex = pos;
        const o = open.exec(source);
        const c = close.exec(source);
        if (!c) break;
        if (o && o.index < c.index) {
          depth += 1;
          pos = o.index + o[0].length;
        } else {
          depth -= 1;
          pos = c.index + c[0].length;
          if (depth === 0) body = source.slice(m.index + m[0].length, c.index);
        }
      }
    }
    out.push({ name, attrs, body });
  }
  return out;
}

const elements = i18nElements(html);

test('data-i18n のキーはすべて辞書にある', () => {
  const keys = [...html.matchAll(/\bdata-i18n="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length > 100, `data-i18n が ${keys.length} 件しかない`);
  for (const key of keys) {
    assert.ok(key in DICT.ja, `日本語の辞書に ${key} がない`);
    assert.ok(key in DICT.en, `英語の辞書に ${key} がない`);
  }
});

test('data-i18n-attr のキーもすべて辞書にある', () => {
  const pairs = [...html.matchAll(/\bdata-i18n-attr="([^"]+)"/g)].flatMap((m) => m[1].split(';'));
  assert.ok(pairs.length >= 10, `data-i18n-attr が ${pairs.length} 件しかない`);
  for (const pair of pairs) {
    const [attr, key] = pair.split(':').map((s) => s.trim());
    assert.ok(attr, `属性名のない指定: ${pair}`);
    assert.ok(key in DICT.ja, `日本語の辞書に ${key} がない`);
    assert.ok(key in DICT.en, `英語の辞書に ${key} がない`);
  }
});

test('文言を入れる要素のなかに、別の文言の要素を入れていない', () => {
  // 外側を差し替えると内側が消えるため
  for (const el of elements) {
    if (el.body === null || !/\bdata-i18n="/.test(el.attrs)) continue;
    assert.doesNotMatch(el.body, /data-i18n/, `${el.attrs.slice(0, 60)} の中に data-i18n がある`);
  }
});

/** HTML の中身と辞書の値を、記号と空白を落としてから見比べる */
function plain(source) {
  return source
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, '');
}

function unmark(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
    .replace(/\*\*/g, '').replace(/\*/g, '')
    .replace(/\s+/g, '');
}

test('HTMLに書いた日本語と、辞書の日本語が一致する', () => {
  let checked = 0;
  for (const el of elements) {
    const m = el.attrs.match(/\bdata-i18n="([^"]+)"/);
    if (!m || el.body === null) continue;
    const key = m[1];
    assert.equal(plain(el.body), unmark(DICT.ja[key]), `${key} の文言がHTMLとずれている`);
    checked += 1;
  }
  assert.ok(checked > 100, `見比べられたのが ${checked} 件しかない`);
});

test('data-i18n-attr で差し替える属性が、HTMLにも同じ値で書いてある', () => {
  for (const el of elements) {
    const m = el.attrs.match(/\bdata-i18n-attr="([^"]+)"/);
    if (!m) continue;
    for (const pair of m[1].split(';')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      const written = el.attrs.match(new RegExp(`\\b${attr}="([^"]*)"`));
      if (!written) continue;  // aria-label のように data-i18n-attr だけで与える属性もある
      assert.equal(written[1].replace(/\s+/g, ''), unmark(DICT.ja[key]),
        `${key} の ${attr} がHTMLとずれている`);
    }
  }
});

test('辞書のキーはどこかで使われている', () => {
  const sources = ['index.html', 'script.js', 'js/i18n.js'].map(read).join('\n');
  const unused = Object.keys(DICT.ja).filter((k) => !sources.includes(k));
  assert.deepEqual(unused, []);
});

test('言語の選び方は ?lang= → 保存した選択 → ブラウザーの言語', () => {
  vm.runInThisContext(read('js/i18n.js'));
  const { detectLanguage } = globalThis.TrevanionI18n;
  assert.equal(detectLanguage('?lang=en', 'ja', 'ja-JP'), 'en', 'URL が最優先');
  assert.equal(detectLanguage('?lang=xx', 'en', 'ja-JP'), 'en', '知らない言語は無視して保存した選択');
  assert.equal(detectLanguage('', 'en', 'ja-JP'), 'en');
  assert.equal(detectLanguage('', null, 'ja-JP'), 'ja');
  assert.equal(detectLanguage('', null, 'en-US'), 'en');
  assert.equal(detectLanguage('', null, undefined), 'en', '言語が取れなければ英語扱い');
});

test('計算部は文言も画面も触らない（表示する言語に依存しない）', () => {
  const Core = core();
  assert.equal(typeof Core.extract, 'function');
  const src = read('js/trevanion-core.js');
  assert.doesNotMatch(src, /TrevanionMessages|TrevanionI18n/, '計算部が辞書を見ている');
  assert.doesNotMatch(src, /\bdocument\b/, '計算部が画面を触っている');
  // 返す値に画面の文言を混ぜていないこと（句読点セットやバイグラムの表はデータなので対象外）
  assert.doesNotMatch(src, /(です|ます|ください|しました)['"`]/, '計算部に画面の文言がある');
});

test('言語を切り替えるボタンがある', () => {
  assert.match(html, /id="lang-toggle"[^>]*data-i18n="ui.langButton"/);
  assert.match(read('script.js'), /I18n\.set\(/);
  assert.match(read('style.css'), /\.lang-toggle/);
});
