import test from 'node:test';
import assert from 'node:assert/strict';
import { read } from './load.js';

// 1行に詰め込んだ（minify した）ファイルを見つける。行数の下限も見る
const FILES = [
  { path: 'js/trevanion-core.js', maxLine: 160, minLines: 120 },
  { path: 'script.js', maxLine: 1000, minLines: 1200 }, // 単語の辞書に長い行がある
  { path: 'style.css', maxLine: 250, minLines: 900 },
  { path: 'index.html', maxLine: 950, minLines: 350 }, // 逸話の手紙を初期値に入れている
  { path: 'test/core.test.js', maxLine: 900, minLines: 120 }, // 手紙の全文を持つ
  { path: 'test/html.test.js', maxLine: 160, minLines: 50 },
  { path: 'test/contrast.test.js', maxLine: 160, minLines: 50 },
  { path: 'test/readme.test.js', maxLine: 160, minLines: 100 },
];

for (const f of FILES) {
  test(`${f.path} が1行に詰め込まれていない`, () => {
    const lines = read(f.path).split('\n');
    const longest = lines.reduce((a, b) => (a.length > b.length ? a : b), '');
    assert.ok(longest.length <= f.maxLine, `最長 ${longest.length} 文字: ${longest.slice(0, 60)}…`);
    assert.ok(lines.length >= f.minLines, `${lines.length} 行しかない`);
  });
}

test('計算部は DOM を使わない', () => {
  const core = read('js/trevanion-core.js');
  for (const token of ['document', 'window', 'localStorage', 'navigator']) {
    assert.equal(core.includes(token), false, `計算部に ${token} がある`);
  }
});

test('画面のスクリプトにデバッグ用の出力が残っていない', () => {
  const js = read('script.js');
  const lines = js.split('\n').filter((l) => /^\s*console\.(log|debug)\(/.test(l));
  assert.deepEqual(lines, [], `console.log が ${lines.length} 行残っている`);
});

test('計算部を読み込んでから画面のスクリプトを読む', () => {
  const html = read('index.html');
  const core = html.indexOf('js/trevanion-core.js');
  const script = html.indexOf('./script.js');
  assert.ok(core > 0 && script > core, '読み込みの順が違う');
});
