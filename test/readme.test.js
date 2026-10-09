import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { read, core, LETTER_A, LETTER_B, HIDDEN } from './load.js';

const C = core();
const readme = read('README.md');
const enc = read('ENCRYPTION.md');
const html = read('index.html');
const ROOT = new URL('..', import.meta.url);

test('YAML メタデータの構造と値を保つ', () => {
  const block = readme.match(/^<!--\n---\n([\s\S]*?)\n---\n-->/);
  assert.ok(block, 'HTML コメントで囲んだ YAML がない');
  const yaml = block[1];
  assert.match(yaml, /^id: day069$/m);
  assert.match(yaml, /^slug: trevanion-cipherlab$/m);
  assert.match(yaml, /^repo_url: "https:\/\/github\.com\/ipusiron\/trevanion-cipherlab"$/m);
  assert.match(yaml, /^demo_url: "https:\/\/ipusiron\.github\.io\/trevanion-cipherlab\/"$/m);
  assert.match(yaml, /^hub: true$/m);
  for (const key of ['category_ja', 'category_en', 'tags']) {
    assert.ok(new RegExp(`^${key}:\n((?:  - .+\n)+)`, 'm').test(yaml), `${key} がブロック形式でない`);
  }
});

test('README に書いた抽出の例が、コードの出力と一致する', () => {
  // 打ち切る／打ち切らないの違いを表にしている
  const row = readme.match(/\| `ab, cd\. ef, ghijk`[^|]*\| `(\w+)` \| `(\w+)` \|/);
  assert.ok(row, '数え方の違いの表がない');
  const opt = { puncts: ',.', offset: 3, countSpaces: false };
  assert.equal(C.extract('ab, cd. ef, ghijk', { ...opt, mode: 'stop' }).message, row[1]);
  assert.equal(C.extract('ab, cd. ef, ghijk', { ...opt, mode: 'skip' }).message, row[2]);
});

test('README と画面に書いた隠された文が、手紙から実際に出る', () => {
  assert.ok(readme.includes('panelateastendofchapelslides'));
  assert.ok(readme.includes('panel at east end of chapel slides'));
  assert.ok(html.includes('panel at east end of chapel slides'));
  const r = C.extract(LETTER_A, { puncts: ",.;:!?'", offset: 3, countSpaces: false, mode: 'stop' });
  assert.equal(r.message.toLowerCase().replace(/[^a-z]/g, ''), HIDDEN);
  const b = C.extract(LETTER_B, { puncts: ",.;:!?'", offset: 3, countSpaces: false, mode: 'skip' });
  assert.equal(b.message.toLowerCase().replace(/[^a-z]/g, ''), HIDDEN);
});

test('逸話を断定せず、出どころを書いてある', () => {
  for (const word of ['1853年', 'National Miscellany', '一次史料', 'クラレンドン']) {
    assert.ok(readme.includes(word), `README に「${word}」がない`);
    assert.ok(html.includes(word), `画面に「${word}」がない`);
  }
  // 資料に基づかない断定が残っていないこと
  for (const bad of ['トレヴァニオン卿', '脱出に成功しました', '脱出経路として機能', '彼の同志であった', '原綴りを保った']) {
    assert.equal(readme.includes(bad), false, `README に「${bad}」が残っている`);
    assert.equal(html.includes(bad), false, `画面に「${bad}」が残っている`);
  }
});

test('自動生成を看板から外し、実験的だと書いてある', () => {
  assert.match(readme, /\*\*実験的な機能\*\*：自動生成/);
  assert.doesNotMatch(readme, /\*\*実装済み機能\*\*：[^\n]*自動生成/);
  assert.ok(enc.includes('かぎられること'));
  assert.ok(html.includes('この機能は実験的です'));
});

test('ENCRYPTION.md の記述が実装と食い違っていない', () => {
  assert.equal(enc.includes('**生成数**: 7個の候補'), false); // 固定で7個と書いていた
  assert.equal(enc.includes('70%以上の制約満足度'), false);
  assert.ok(enc.includes('青の下地'), 'ハイライトの説明が実装と合っていない');
  assert.equal(enc.includes('トレヴァニアン'), false);
  // リンク切れ（README に無い見出しを指していた）
  assert.equal(enc.includes('README.md#トレヴァニアン暗号'), false);
});

test('README の画像がすべて実在する', () => {
  const imgs = [...readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]).filter((u) => !u.startsWith('http'));
  assert.ok(imgs.length >= 4, `画像の参照が ${imgs.length} 件しかない`);
  for (const rel of imgs) assert.ok(fs.existsSync(new URL(rel, ROOT)), `${rel} がない`);
});

test('ディレクトリー構造に全ファイルが載っていて、全行に説明がある', () => {
  const tree = readme.match(/## 📁 ディレクトリー構造\n\n```\n([\s\S]*?)```/);
  assert.ok(tree, 'ディレクトリー構造がない');
  const lines = tree[1].trim().split('\n');
  for (const line of lines.slice(1)) assert.match(line, /# .+$/, `説明のない行: ${line}`);

  const skip = new Set(['.git', 'node_modules', '.claude']);
  const found = [];
  const walk = (dir, prefix) => {
    for (const entry of fs.readdirSync(new URL(dir, ROOT), { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const rel = prefix + entry.name;
      if (entry.isDirectory()) walk(`${dir}${entry.name}/`, `${rel}/`);
      else found.push(rel);
    }
  };
  walk('', '');
  for (const file of found) {
    const base = path.basename(file);
    assert.ok(lines.some((l) => l.includes(`${base} `)), `ツリーに ${file} がない`);
  }
});

test('シリーズ標準の見出しがそろっている', () => {
  for (const h of ['# Trevanion CipherLab', '**Day069 - 生成AIで作るセキュリティツール100**',
    '## 🌐 デモページ', '## 📸 スクリーンショット', '## 🎯 ユースケース', '## 🧪 テスト',
    '## 📁 ディレクトリー構造', '## 💻 動作環境', '## 📄 ライセンス', '## 🛠️ このツールについて']) {
    assert.ok(readme.includes(h), `${h} がない`);
  }
  assert.ok(readme.includes('https://akademeia.info/?page_id=42163'));
});

// 表記のゆれ
// ---- 英語版のREADME（要約にせず、同じ節をそろえる）
const readmeEn = read('README.en.md');

test('日本語版と英語版で、見出しの数・順・階層がそろっている', () => {
  const levels = (text) => [...text.matchAll(/^(#{1,3}) /gm)].map((m) => m[1].length);
  const ja = levels(readme);
  const en = levels(readmeEn);
  assert.ok(ja.length >= 30, `見出しが ${ja.length} 個しかない`);
  assert.deepEqual(en, ja, `見出しの数か階層が違う（ja ${ja.length} / en ${en.length}）`);
});

test('英語版に日本語の本文が残っていない', () => {
  const body = readmeEn
    .split('\n')
    // 手紙の原文と、日本語の用語をそのまま示す行は対象から外す
    .filter((line) => !line.includes('README.md') && !line.includes('日本語')
      && !line.includes('冗字暗号') && !line.includes('Angou Taizen'))
    .join('\n');
  const hits = [...body.matchAll(/[぀-ヿ一-鿿]+/g)].map((m) => m[0]);
  assert.deepEqual(hits, [], `日本語が残っている: ${hits.slice(0, 5).join(' / ')}`);
});

test('両方のREADMEが互いにリンクしている', () => {
  assert.match(readme, /^\[English\]\(README\.en\.md\) · 日本語$/m);
  assert.match(readmeEn, /^English · \[日本語\]\(README\.md\)$/m);
  // YAML メタデータは日本語版だけに置く（hackinglab.online が読むのは README.md）
  assert.doesNotMatch(readmeEn, /^id: day069$/m);
});

test('英語版の画像がすべて実在し、英語の画面である', () => {
  const imgs = [...readmeEn.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
  const local = imgs.filter((u) => !u.startsWith('http'));
  assert.equal(local.length, 5, `画像の参照が ${local.length} 件`);
  for (const rel of local) {
    assert.ok(rel.startsWith('assets/en/'), `英語版は英語の画面を使う: ${rel}`);
    assert.ok(fs.existsSync(new URL(rel, ROOT)), `${rel} がない`);
  }
});

test('英語版も、本ツールの数え方の違いの例が実装と合っている', () => {
  // 「打ち切る／打ち切らない」の表の値を、計算部で確かめる
  const sample = 'ab, cd. ef, ghijk';
  const stop = C.extract(sample, { puncts: ',.', offset: 3, countMode: 'nonSpace', mode: 'stop' });
  const skip = C.extract(sample, { puncts: ',.', offset: 3, countMode: 'nonSpace', mode: 'skip' });
  assert.ok(readmeEn.includes(`| \`${sample}\` (third character, spaces not counted) | \`${stop.message}\` | \`${skip.message}\` |`),
    `英語版の表が ${stop.message} / ${skip.message} と合っていない`);
  assert.ok(readme.includes(`| \`${sample}\`（3文字目・空白を数えない） | \`${stop.message}\` | \`${skip.message}\` |`),
    `日本語版の表が ${stop.message} / ${skip.message} と合っていない`);
});

const NG = [
  [/サーバ(?![ーイ])/, 'サーバー'],
  [/ユーザ(?![ー])/, 'ユーザー'],
  [/ブラウザ(?![ー])/, 'ブラウザー'],
  [/フォルダ(?![ー])/, 'フォルダー'],
  [/リポジトリ(?![ー])/, 'リポジトリー'],
  [/ライブラリ(?![ー])/, 'ライブラリー'],
  [/ディレクトリ(?![ー])/, 'ディレクトリー'],
  [/インターフェース/, 'インターフェイス'],
  [/分かる|分かり|分から/, 'わかる'],
  [/全て/, 'すべて'],
  [/既に/, 'すでに'],
  [/適時/, '適宜'],
  [/トレヴァニアン/, 'トレヴァニオン'],
];

for (const file of ['README.md', 'ENCRYPTION.md', 'index.html']) {
  test(`${file} の表記をそろえる`, () => {
    const text = read(file);
    for (const [re, should] of NG) {
      const m = text.match(re);
      assert.equal(m, null, m ? `「${m[0]}」は「${should}」に（${file}）` : '');
    }
  });
}

const TREVANION_LETTER = [
    "Worthie Sir John, Hope, that is ye beste comfort of ye afflicted, cannot much, I fear me, help you now. That I",
    "would saye to you, is this only: if ever I may be able to requite that I do owe you, stand not upon asking me.",
    "'Tis not much that I can do: but what I can do, bee ye verie sure I wille. I knowe that, if dethe comes, if",
    "ordinary men fear it, it frights not you, accounting it for a high honour, to have such a rewarde of your",
    "loyalty. Pray yet that you may be spared this soe bitter, cup. I fear not that you will grudge any sufferings;",
    "only if bie submission you can turn them away, 'tis the part of a wise man. Tell me, an if you can, to do for",
    "you anythinge that you wolde have done. The general goes back on Wednesday. Restinge your servant to command.",
    "R.T."
  ].join(' ');
test('ユースケースの「このツールならではの使い方」の抽出とスコアは計算部と同じ（日英）', () => {
  const ja = readme;
  const en = readmeEn;
  const hidden = C.extract(TREVANION_LETTER, { offset: 3 }).message;
  assert.equal(hidden, 'panelateastendofchapelslides');
  assert.ok(ja.includes('panelateastendofchapelslides') && en.includes('panelateastendofchapelslides'));
  const score = (off) => C.likelihood(C.extract(TREVANION_LETTER, { offset: off }).message).score;
  assert.deepEqual([score(2), score(3), score(4)], [0.3778, 0.6741, 0.2923]);
  assert.ok(score(3) > score(2) && score(3) > score(4));
  assert.ok(ja.includes('0.3778・0.6741・0.2923') && en.includes('0.3778, 0.6741 and 0.2923'));
  const withSpaces = C.extract(TREVANION_LETTER, { offset: 3, countMode: 'all' }).message;
  assert.equal(withSpaces, 'oha ehsftsue fftcoru nsenohe');
  assert.ok(ja.includes('oha ehsftsue fftcoru nsenohe') && en.includes('oha ehsftsue fftcoru nsenohe'));
});
