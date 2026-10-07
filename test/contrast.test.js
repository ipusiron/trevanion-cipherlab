import test from 'node:test';
import assert from 'node:assert/strict';
import { read } from './load.js';

const css = read('style.css');

function vars() {
  const block = css.match(/:root\s*\{([^}]*)\}/);
  assert.ok(block, ':root の定義が見つからない');
  const out = {};
  for (const m of block[1].matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g)) out[m[1]] = m[2];
  return out;
}

function toRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

// WCAG 2.2 の相対輝度
function luminance(hex) {
  const [r, g, b] = toRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const V = vars();

test('変数で指定する文字色が、パネルと背景のどちらでも 4.5:1 以上', () => {
  for (const name of ['ink', 'muted', 'accent', 'accent-2', 'warn', 'error', 'text', 'text-secondary']) {
    assert.ok(V[name], `--${name} が未定義`);
    for (const bg of ['panel', 'bg']) {
      const r = ratio(V[name], V[bg]);
      assert.ok(r >= 4.5, `--${name} on --${bg} = ${r.toFixed(2)}:1`);
    }
  }
});

test('旧来の名前（--text・--text-secondary）も定義されている', () => {
  // 未定義のまま使われていて、色の指定が効かない箇所があった
  assert.equal(V.text, V.ink);
  assert.equal(V['text-secondary'], V.muted);
});

test('ハイライトと句読点の印が 4.5:1 以上', () => {
  // 抽出文字は黒文字に明るい黄、句読点は白文字にアクセント色
  const hl = css.match(/\.hl \{[^}]*\}/);
  assert.ok(hl);
  assert.match(hl[0], /background: var\(--warn-bg\)/);
  assert.match(hl[0], /color: #000000/);
  assert.ok(ratio('#000000', V['warn-bg']) >= 4.5, `黒 on --warn-bg = ${ratio('#000000', V['warn-bg']).toFixed(2)}`);

  const kp = css.match(/\.kp \{[^}]*\}/);
  assert.ok(kp);
  assert.ok(ratio('#ffffff', V.accent) >= 4.5, `白 on --accent = ${ratio('#ffffff', V.accent).toFixed(2)}`);
});

test('1文字ごとの状態の色が、その行の背景で 4.5:1 以上', () => {
  const pairs = [
    ['.status-match', '.row-match'],
    ['.status-mismatch', '.row-mismatch'],
    ['.status-missing', '.row-missing'],
    ['.status-extra', '.row-extra'],
  ];
  for (const [fgSel, bgSel] of pairs) {
    const fg = css.match(new RegExp(`\\${fgSel}\\{color:(#[0-9a-fA-F]{3,6})\\}`));
    const bg = css.match(new RegExp(`\\${bgSel}\\{background:(#[0-9a-fA-F]{3,6})\\}`));
    assert.ok(fg, `${fgSel} が見つからない`);
    assert.ok(bg, `${bgSel} が見つからない`);
    const r = ratio(fg[1], bg[1]);
    assert.ok(r >= 4.5, `${fgSel} ${fg[1]} on ${bg[1]} = ${r.toFixed(2)}:1`);
  }
});

test('入力欄の文字は16px以上（iOS が勝手に拡大しない）', () => {
  const block = css.match(/textarea,\s*\ninput\[type="text"\],\s*\ninput\[type="number"\] \{([^}]*)\}/);
  assert.ok(block, '入力欄の定義が見つからない');
  const size = block[1].match(/font-size:\s*(\d+)px/);
  assert.ok(size && Number(size[1]) >= 16, block[1]);
});

test('キーボードのフォーカスが見え、動きを減らす設定も尊重する', () => {
  assert.match(css, /:focus-visible \{[^}]*outline:/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('狭い画面で長いラベルを折り返せるようにしてある', () => {
  // white-space: nowrap のままだと、幅320pxで画面からはみ出していた
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.opts label \{[\s\S]*?white-space: normal/);
});
