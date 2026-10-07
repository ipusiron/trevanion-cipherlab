import test from 'node:test';
import assert from 'node:assert/strict';
import { read } from './load.js';

const html = read('index.html');

test('CSP の meta があり、meta では効かない指定を書かない', () => {
  const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert.ok(csp, 'CSP の meta がない');
  assert.match(csp[1], /default-src 'self'/);
  assert.match(csp[1], /base-uri 'none'/);
  assert.doesNotMatch(csp[1], /frame-ancestors/);
  assert.doesNotMatch(csp[1], /unsafe-inline|unsafe-eval/);
  for (const name of ['X-Frame-Options', 'X-Content-Type-Options', 'X-XSS-Protection']) {
    assert.equal(html.includes(name), false, `${name} は meta では効かない`);
  }
});

test('インラインの style 属性とイベントハンドラーがない', () => {
  // CSP の default-src 'self' では style 属性が止まる（表示の出し入れは hidden 属性で行う）
  assert.doesNotMatch(html, /\sstyle\s*=\s*"/i);
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
  assert.doesNotMatch(html, /javascript:/i);
});

test('スクリプトは計算部・画面の順に読み込む', () => {
  const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  assert.deepEqual(srcs, ['./js/trevanion-core.js', './script.js']);
});

test('タブとパネルが id で結ばれ、キーボードで移動できる', () => {
  const tabs = [...html.matchAll(/<button class="tab-btn[^"]*" id="tab-btn-(\w+)"[^>]*aria-controls="(\w+)"/g)];
  assert.equal(tabs.length, 4);
  for (const [, btnKey, panelKey] of tabs) {
    assert.equal(btnKey, panelKey);
    assert.ok(new RegExp(`<section id="${panelKey}"[^>]*aria-labelledby="tab-btn-${panelKey}"`).test(html),
      `${panelKey} に aria-labelledby がない`);
  }
  const js = read('script.js');
  assert.match(js, /ArrowRight/);
  assert.match(js, /ArrowLeft/);
});

test('ヘルプは button で、フォーカスでも読める', () => {
  const help = html.match(/<button type="button" class="help-icon" data-tooltip="([^"]+)" aria-label="([^"]+)">/);
  assert.ok(help, 'ヘルプが button になっていない');
  assert.ok(help[1].length > 5);
  const css = read('style.css');
  assert.match(css, /\.help-icon:focus-visible::after/);
});

test('タブのラベルに「未実装」が残っていない', () => {
  assert.doesNotMatch(html, /未実装/);
});

test('自動生成が実験的であることを画面に書いてある', () => {
  assert.match(html, /自動生成（実験的）/);
  assert.match(html, /<div class="warn-box">/);
  assert.match(html, /この機能は実験的です/);
});

test('主要な要素の id がそろっている', () => {
  const ids = ['dec-text', 'dec-puncts', 'dec-offset', 'dec-count-mode', 'dec-mode', 'dec-run', 'dec-sweep',
    'dec-sweep-result', 'dec-highlight', 'dec-result',
    'enc-plain', 'enc-cover', 'puncts-input', 'enc-offset', 'count-spaces', 'enc-check', 'enc-report', 'enc-preview',
    'auto-plain', 'auto-generate-btn', 'auto-results', 'auto-info', 'auto-candidates', 'toast'];
  for (const id of ids) assert.ok(html.includes(`id="${id}"`), `id="${id}" がない`);
});

test('外部への読み込みがない（同一オリジンだけ）', () => {
  assert.doesNotMatch(html, /<link[^>]+href="https?:\/\//);
  assert.doesNotMatch(html, /<script[^>]+src="https?:\/\//);
  for (const m of html.matchAll(/<a [^>]*href="https?:\/\/[^"]+"[^>]*>/g)) {
    assert.match(m[0], /rel="noopener noreferrer"/, m[0]);
  }
});

test('viewport と lang がある', () => {
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /<meta name="viewport"/);
});
