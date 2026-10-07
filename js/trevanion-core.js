// Trevanion CipherLab の計算部（DOM を使わない）。globalThis.TrevanionCore に置く
// - 抽出は「句読点の直後から数えて offset 文字目」。数え方は3通りから選べる
//   stop  : 数える途中で次の句読点に当たったら、その句読点からは拾わない（本ツールの従来の挙動）
//   skip  : 句読点は数えずに飛ばして数え続ける（dCode の挙動）
//   count : 句読点も1文字として数える
// - 逸話の手紙は「空白を数えない」が前提（数えると、どの組み合わせでも正しい文が出ない）
(() => {
  'use strict';

  const DEFAULT_PUNCTS = "、。,.!?;:'";
  const DEFAULT_OFFSET = 3;
  const MODES = ['stop', 'skip', 'count'];
  const DEFAULT_MODE = 'stop';
  const MAX_OFFSET = 12;

  // 何を1文字と数えるか。dCode も同じ3択を持つ
  //   nonSpace : 空白以外を数える（逸話の手紙はこれ）
  //   all      : 空白も数える
  //   alnum    : 英数字と仮名だけを数える（記号も飛ばす）
  const COUNT_MODES = ['nonSpace', 'all', 'alnum'];
  const DEFAULT_COUNT_MODE = 'nonSpace';

  // 空白とみなす文字（全角空白を含む）
  function isSpace(ch) {
    return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '　';
  }

  // 句読点の集合。重複を外し、空白は句読点として扱わない
  function normalizePuncts(str) {
    const seen = new Set();
    let out = '';
    for (const ch of String(str ?? '')) {
      if (isSpace(ch) || seen.has(ch)) continue;
      seen.add(ch);
      out += ch;
    }
    return out;
  }

  // その文字を1文字として数えるか
  function counts(ch, countMode) {
    if (countMode === 'all') return true;
    if (countMode === 'alnum') return /[0-9A-Za-z\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(ch);
    return !isSpace(ch);
  }

  function containsJapanese(text) {
    return /[぀-ゟ゠-ヿ一-龯]/.test(String(text ?? ''));
  }

  // 抽出。拾った文字とその位置、拾えなかった句読点の位置も返す
  function extract(text, options) {
    const opts = options || {};
    const src = String(text ?? '');
    const puncts = normalizePuncts(opts.puncts === undefined ? DEFAULT_PUNCTS : opts.puncts);
    const offset = Number.isInteger(opts.offset) && opts.offset >= 1 && opts.offset <= MAX_OFFSET
      ? opts.offset
      : DEFAULT_OFFSET;
    // countMode が指定されていればそれを使う。なければ従来の countSpaces から決める
    const countMode = COUNT_MODES.includes(opts.countMode)
      ? opts.countMode
      : (opts.countSpaces === true ? 'all' : DEFAULT_COUNT_MODE);
    const countSpaces = countMode === 'all';
    const mode = MODES.includes(opts.mode) ? opts.mode : DEFAULT_MODE;

    const pset = new Set([...puncts]);
    const chars = [];
    const indices = [];
    const missed = []; // 条件に合う文字が見つからなかった句読点の位置

    for (let i = 0; i < src.length; i++) {
      if (!pset.has(src[i])) continue;
      let steps = 0;
      let hit = -1;
      for (let j = i + 1; j < src.length; j++) {
        const c = src[j];
        if (pset.has(c)) {
          if (mode === 'stop') break;
          if (mode === 'skip') continue;
        }
        if (!counts(c, countMode)) continue;
        steps++;
        if (steps === offset) {
          hit = j;
          break;
        }
      }
      if (hit >= 0) {
        chars.push(src[hit]);
        indices.push(hit);
      } else {
        missed.push(i);
      }
    }

    return { message: chars.join(''), indices, missed, puncts, offset, countSpaces, countMode, mode };
  }

  // 平文とカバーテキストを突き合わせる。1文字ごとの状態と、全体が成り立つかを返す
  function checkConstraints(plaintext, covertext, options) {
    const expected = Array.from(String(plaintext ?? '').replace(/\s+/g, ''));
    const extraction = extract(covertext, options);
    const actual = Array.from(extraction.message);

    const details = [];
    const mismatches = [];
    const missing = [];
    const extra = [];
    let matches = 0;

    const max = Math.max(expected.length, actual.length);
    for (let i = 0; i < max; i++) {
      const want = expected[i] === undefined ? null : expected[i];
      const got = actual[i] === undefined ? null : actual[i];
      const at = extraction.indices[i] === undefined ? null : extraction.indices[i];
      let status = 'unknown';
      if (want !== null && got !== null) {
        if (want.toLowerCase() === got.toLowerCase()) {
          status = 'match';
          matches++;
        } else {
          status = 'mismatch';
          mismatches.push({ index: i, expected: want, actual: got });
        }
      } else if (want !== null) {
        status = 'missing';
        missing.push({ index: i, expected: want });
      } else if (got !== null) {
        status = 'extra';
        extra.push({ index: i, actual: got });
      }
      details.push({ index: i, expected: want, actual: got, at, status });
    }

    return {
      isValid: matches === expected.length && mismatches.length === 0 && missing.length === 0 && extra.length === 0,
      expectedLength: expected.length,
      actualLength: actual.length,
      matches,
      details,
      mismatches,
      missing,
      extra,
      extraction,
    };
  }

  // 規則を総当たりする（第2弾の下ごしらえ。いまは復号の助けとしてだけ使う）
  function sweep(text, options) {
    const opts = options || {};
    const puncts = opts.puncts === undefined ? DEFAULT_PUNCTS : opts.puncts;
    const maxOffset = Number.isInteger(opts.maxOffset) ? Math.min(opts.maxOffset, MAX_OFFSET) : MAX_OFFSET;
    const rows = [];
    for (let offset = 1; offset <= maxOffset; offset++) {
      for (const countMode of COUNT_MODES) {
        for (const mode of MODES) {
          const r = extract(text, { puncts, offset, countMode, mode });
          rows.push({
            offset,
            countMode,
            countSpaces: countMode === 'all',
            mode,
            message: r.message,
            length: r.message.length,
            score: likelihood(r.message),
          });
        }
      }
    }
    // それらしい順に並べる。同点なら短いほうを後ろにする
    return rows.sort((a, b) => b.score.score - a.score.score || b.length - a.length);
  }

  // 取り出した文字列の「言語らしさ」を0〜1で返す。
  // よく使う2文字の並びがどれだけ含まれるかで測る（辞書を持たずに済ませる）
  const EN_BIGRAMS = (
    'th he in er an re on at en nd ti es or te of ed is it al ar '
    + 'st to nt ng se ha as ou io le ve co me de hi ri ro ic ne ea ra ce li ch ll be ma si om ur'
  ).split(' ');
  const JA_BIGRAMS = (
    'した する ます です ない こと もの から ので ては でも という にも とい うこ れる られ いる あり その この'
  ).split(' ');

  function likelihood(text) {
    const s = String(text ?? '');
    if (s.length < 2) return { score: 0, lang: 'unknown', hits: 0 };
    const lower = s.toLowerCase();
    const pairs = [];
    for (let i = 0; i + 1 < lower.length; i++) pairs.push(lower.slice(i, i + 2));

    const en = pairs.filter((x) => EN_BIGRAMS.includes(x)).length;
    const ja = pairs.filter((x) => JA_BIGRAMS.includes(x)).length;
    const kana = [...s].filter((c) => /[\u3040-\u309f\u30a0-\u30ff]/.test(c)).length / s.length;
    const latin = [...s].filter((c) => /[a-zA-Z]/.test(c)).length / s.length;

    // 英語は「よくある2文字の割合」、日本語は「かなの割合」も効かせる
    const enScore = (en / pairs.length) * 0.8 + latin * 0.2;
    const jaScore = (ja / pairs.length) * 0.5 + kana * 0.5;
    return enScore >= jaScore
      ? { score: Number(enScore.toFixed(4)), lang: 'en', hits: en }
      : { score: Number(jaScore.toFixed(4)), lang: 'ja', hits: ja };
  }

  globalThis.TrevanionCore = {
    DEFAULT_PUNCTS,
    DEFAULT_OFFSET,
    DEFAULT_MODE,
    MODES,
    MAX_OFFSET,
    COUNT_MODES,
    DEFAULT_COUNT_MODE,
    isSpace,
    counts,
    normalizePuncts,
    likelihood,
    containsJapanese,
    extract,
    checkConstraints,
    sweep,
  };
})();
