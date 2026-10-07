import test from 'node:test';
import assert from 'node:assert/strict';
import { core, refExtract, LETTER_A, LETTER_B, HIDDEN } from './load.js';

const C = core();
const ex = (text, opts) => C.extract(text, opts);

test('逸話の手紙から隠された文が出る（版A・アポストロフィーつき）', () => {
  // 版Aでは「アポストロフィーも句読点に数え」「空白は数えず」「次の句読点で打ち切る」必要がある
  const r = ex(LETTER_A, { puncts: ",.;:!?'", offset: 3, countSpaces: false, mode: 'stop' });
  assert.equal(r.message.toLowerCase().replace(/[^a-z]/g, ''), HIDDEN);
  assert.equal(r.message.length, 28);
});

test('版Aは、打ち切らない数え方では別の文字列になる', () => {
  const skip = ex(LETTER_A, { puncts: ",.;:!?'", offset: 3, countSpaces: false, mode: 'skip' });
  assert.notEqual(skip.message.toLowerCase().replace(/[^a-z]/g, ''), HIDDEN);
  // 余分な s が2つ入る（dCode と同じ結果）
  assert.equal(skip.message.toLowerCase().replace(/[^a-z]/g, ''), 'panelateasstendofchapelsslides');
});

test('版Aは、アポストロフィーを句読点に入れないと2文字ずれる', () => {
  const r = ex(LETTER_A, { puncts: ',.;:!?', offset: 3, countSpaces: false, mode: 'stop' });
  assert.equal(r.message.toLowerCase().replace(/[^a-z]/g, ''), 'panelateaitendofchapelilides');
});

test('版B（大文字・アポストロフィーなし）は、どの数え方でも同じ文が出る', () => {
  for (const mode of C.MODES) {
    for (const puncts of [",.;:!?'", ',.;:!?', C.DEFAULT_PUNCTS]) {
      const r = ex(LETTER_B, { puncts, offset: 3, countSpaces: false, mode });
      assert.equal(r.message.toLowerCase().replace(/[^a-z]/g, ''), HIDDEN, `${mode} / ${puncts}`);
    }
  }
});

test('空白を数える設定では、どちらの版でも隠された文は出ない', () => {
  for (const letter of [LETTER_A, LETTER_B]) {
    for (const mode of C.MODES) {
      const r = ex(letter, { puncts: ",.;:!?'", offset: 3, countSpaces: true, mode });
      assert.notEqual(r.message.toLowerCase().replace(/[^a-z]/g, ''), HIDDEN);
    }
  }
});

test('3つの数え方の違いが短い例に出る', () => {
  const text = 'ab, cd. ef, ghijk';
  const opt = { puncts: ',.', offset: 3, countSpaces: false };
  assert.equal(ex(text, { ...opt, mode: 'stop' }).message, 'i');
  assert.equal(ex(text, { ...opt, mode: 'skip' }).message, 'egi');
  assert.equal(ex(text, { ...opt, mode: 'count' }).message, '.,i');
});

test('拾えなかった句読点の位置を返す', () => {
  const r = ex('ab, cd. ef, ghijk', { puncts: ',.', offset: 3, countSpaces: false, mode: 'stop' });
  // 最初の2つの句読点は、3文字目に届く前に次の句読点が来るので拾えない
  assert.equal(r.missed.length, 2);
  assert.equal(r.indices.length, 1);
  assert.deepEqual(r.missed, [2, 6]);
});

test('参照実装と一致する（版A・版B × 設定の組み合わせ）', () => {
  const texts = [LETTER_A, LETTER_B, 'ab, cd. ef, ghijk', 'Hello, world. This, is a test.'];
  for (const text of texts) {
    for (const puncts of [",.;:!?'", ',.', C.DEFAULT_PUNCTS]) {
      for (const offset of [1, 2, 3, 5]) {
        for (const countSpaces of [false, true]) {
          for (const mode of C.MODES) {
            const got = ex(text, { puncts, offset, countSpaces, mode }).message;
            const want = refExtract(text, C.normalizePuncts(puncts), offset, countSpaces, mode);
            assert.equal(got, want, `${puncts}/${offset}/${countSpaces}/${mode}`);
          }
        }
      }
    }
  }
});

test('句読点の集合は重複を外し、空白を句読点として扱わない', () => {
  assert.equal(C.normalizePuncts(",,.."), ',.');
  assert.equal(C.normalizePuncts(", . ;"), ',.;');
  assert.equal(C.normalizePuncts(''), '');
  assert.equal(C.normalizePuncts(null), '');
  assert.equal(C.normalizePuncts('、。,.'), '、。,.');
});

test('既定の設定は「空白を数えない・打ち切る・3文字目」', () => {
  const r = ex('a, bcdef');
  assert.equal(r.countSpaces, false);
  assert.equal(r.mode, 'stop');
  assert.equal(r.offset, 3);
  assert.equal(r.puncts, C.DEFAULT_PUNCTS);
  assert.equal(r.message, 'd');
});

test('知らない設定を渡したら既定に戻す', () => {
  const r = ex('a, bcdef', { offset: 99, mode: 'zzz' });
  assert.equal(r.offset, C.DEFAULT_OFFSET);
  assert.equal(r.mode, C.DEFAULT_MODE);
  const low = ex('a, bcdef', { offset: 0 });
  assert.equal(low.offset, C.DEFAULT_OFFSET);
});

test('空白を数えると位置が変わる', () => {
  assert.equal(ex('a, bcdef', { puncts: ',', countSpaces: false }).message, 'd');
  assert.equal(ex('a, bcdef', { puncts: ',', countSpaces: true }).message, 'c');
});

test('日本語でも抽出できる', () => {
  const text = 'こんにちは、おはようございます。きょうはいい天気です、とてもきもちいいですね。';
  const r = ex(text, { puncts: '、。', offset: 3, countSpaces: false, mode: 'stop' });
  assert.equal(r.message, 'ようも'); // dCode と一致する（調査メモ ref/day069/survey）
  assert.equal(C.containsJapanese(text), true);
  assert.equal(C.containsJapanese('hello'), false);
});

test('空の入力と句読点のない入力は、空の結果を返す', () => {
  assert.equal(ex('').message, '');
  assert.equal(ex(null).message, '');
  assert.equal(ex('no punctuation here').message, '');
  assert.deepEqual(ex('').indices, []);
});

test('句読点が末尾にあっても落ちない', () => {
  const r = ex('hello,', { puncts: ',' });
  assert.equal(r.message, '');
  assert.equal(r.missed.length, 1);
});

test('サロゲートペアを1文字として数えない（UTF-16のまま数える）ことを記録しておく', () => {
  // 絵文字は2つのコード単位になるため、いまの実装では2文字と数える。仕様として固定しておく
  const r = ex('a,\u{1F600}bc', { puncts: ',', countSpaces: false, offset: 3 });
  assert.equal(r.message, 'b');
});

test('制約チェックは1文字ごとの状態を返す', () => {
  const opts = { puncts: ',.', offset: 3, countSpaces: false, mode: 'stop' };
  const ok = C.checkConstraints('ab', 'xx, yzaqq. wwbzz', opts);
  assert.equal(ok.extraction.message, 'ab');
  assert.equal(ok.isValid, true);
  assert.equal(ok.matches, 2);
  assert.equal(ok.details.every((d) => d.status === 'match'), true);
});

test('制約チェックは不足と余りを分けて数える', () => {
  const opts = { puncts: ',.', offset: 3, countSpaces: false, mode: 'stop' };
  const short = C.checkConstraints('abc', 'xx, yza', opts);
  assert.equal(short.isValid, false);
  assert.equal(short.missing.length, 2);
  const over = C.checkConstraints('a', 'xx, yza. wwbzz', opts);
  assert.equal(over.extra.length, 1);
  assert.equal(over.isValid, false);
});

test('制約チェックは大文字と小文字を区別しない', () => {
  const opts = { puncts: ',.', offset: 3, countSpaces: false, mode: 'stop' };
  const r = C.checkConstraints('AB', 'xx, yzaqq. wwbzz', opts);
  assert.equal(r.isValid, true);
  assert.equal(r.matches, 2);
});

test('制約チェックは平文の空白を無視する', () => {
  const opts = { puncts: ',.', offset: 3, countSpaces: false, mode: 'stop' };
  const r = C.checkConstraints(' a b ', 'xx, yzaqq. wwbzz', opts);
  assert.equal(r.expectedLength, 2);
});

test('総当たりは全部の組み合わせを返す', () => {
  const rows = C.sweep(LETTER_B, { puncts: ",.;:!?'", maxOffset: 5 });
  assert.equal(rows.length, 5 * 2 * C.MODES.length);
  const hit = rows.filter((r) => r.message.toLowerCase().replace(/[^a-z]/g, '') === HIDDEN);
  // 版Bはどの数え方でも通るので、オフセット3・空白を数えない の3通りが当たる
  assert.equal(hit.length, 3);
  for (const r of hit) {
    assert.equal(r.offset, 3);
    assert.equal(r.countSpaces, false);
  }
});

test('総当たりの上限を超える指定は丸める', () => {
  const rows = C.sweep('a, bcdef', { maxOffset: 99 });
  assert.equal(rows.length, C.MAX_OFFSET * 2 * C.MODES.length);
});
