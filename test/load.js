// 画面と同じ通常のスクリプト（js/*.js）を、テストの実行環境に読み込む。
// vm.runInThisContext で読むので、結果のオブジェクトはテスト側と同じ realm になる
import fs from 'node:fs';
import vm from 'node:vm';

// 改行は LF にそろえて読む（作業ツリーは CRLF、GitHub Pages の配信は LF）
const CRLF = new RegExp(String.fromCharCode(13) + String.fromCharCode(10), 'g');
export const read = (f) =>
  fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').replace(CRLF, String.fromCharCode(10));

const loaded = new Set();
export function load(file) {
  if (!loaded.has(file)) {
    vm.runInThisContext(read(file), { filename: file });
    loaded.add(file);
  }
  return globalThis;
}

export const core = () => load('js/trevanion-core.js').TrevanionCore;

// 逸話の手紙。版によって綴りと句読点が違うので、両方を持っておく（調査メモ ref/day069/facts 参照）
// 版A: アポストロフィーつき・小文字混じり（本ツールが従来から例に使ってきた形）
export const LETTER_A = "Worthie Sir John, Hope, that is ye beste comfort of ye afflicted, cannot much, I fear me, help you now. That I would saye to you, is this only: if ever I may be able to requite that I do owe you, stand not upon asking me. 'Tis not much that I can do: but what I can do, bee ye verie sure I wille. I knowe that, if dethe comes, if ordinary men fear it, it frights not you, accounting it for a high honour, to have such a rewarde of your loyalty. Pray yet that you may be spared this soe bitter, cup. I fear not that you will grudge any sufferings; only if bie submission you can turn them away, 'tis the part of a wise man. Tell me, an if you can, to do for you anythinge that you wolde have done. The general goes back on Wednesday. Restinge your servant to command. R.T.";

// 版B: 大文字・アポストロフィーなし
export const LETTER_B = "WORTHIE SIR JOHN, HOPE, THAT IS YE BESTE COMFORT OF YE AFFLICTED, CANNOT MUCH, I FEAR ME, HELP YOU NOW. THAT I WOULD SAY TO YOU, IS THIS ONLY: IF EVER I MAY BE ABLE TO REQUITE THAT I DO OWE YOU, STAND NOT UPON ASKING ME. TIS NOT MUCH THAT I CAN DO; BUT WHAT I CAN DO, BEE YE VERY SURE I WILL. I KNOW THAT, IF DETHE COMES, IF ORDINARY MEN FEAR IT, IT FRIGHTS NOT YOU, ACCOUNTING IT FOR A HIGH HONOUR, TO HAVE SUCH A REWARDE OF YOUR LOYALTY. PRAY YET YOU MAY BE SPARED THIS SOE BITTER, CUP. I FEAR NOT THAT YOU WILL GRUDGE ANY SUFFERINGS; ONLY IF BIE SUBMISSIONS YOU CAN TURN THEM AWAY, TIS THE PART OF A WISE MAN. TELL ME, AN IF YOU CAN, TO DO FOR YOU ANYTHINGE THAT YOU WOLDE HAVE DONE. THE GENERAL GOES BACK ON WEDNESDAY. RESTINGE YOUR SERVANT TO COMMAND.";

export const HIDDEN = 'panelateastendofchapelslides';

// 参照実装（本体とは別の書き方で抽出する。正規表現で句読点の位置を集めてから数える）
export function refExtract(text, puncts, offset, countSpaces, mode) {
  const pset = new Set([...puncts]);
  const positions = [];
  for (let i = 0; i < text.length; i++) if (pset.has(text[i])) positions.push(i);
  let out = '';
  for (const start of positions) {
    const rest = text.slice(start + 1);
    let steps = 0;
    for (const c of rest) {
      if (pset.has(c)) {
        if (mode === 'stop') break;
        if (mode === 'skip') continue;
      }
      if (!countSpaces && (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '　')) continue;
      steps += 1;
      if (steps === offset) {
        out += c;
        break;
      }
    }
  }
  return out;
}
