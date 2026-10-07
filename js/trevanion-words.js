// 分かち書き（取り出した文字列を語に切る）ための英単語。globalThis.TrevanionWords に置く
// 取り出した文には空白が入らないので、辞書で区切り直す。
// 英語の最頻出語に、脱出や合図を伝える文で出てきそうな語を足した小さな辞書で、
// 外部に取りに行かずに済ませる（この辞書にない語が混じると分けられないので、その旨を画面に出す）
(() => {
  'use strict';

  const COMMON = (
    'a about after again all also am an and another any are as ask at away '
    + 'back be because been before being below best better between big both bring but by '
    + 'call came can cannot come could '
    + 'day did do does done door down during '
    + 'each early east end enough even ever every '
    + 'far few find first for found from '
    + 'get give go going gone good got great '
    + 'had half hand has have he help her here high him his hold home house how however '
    + 'i if in inside into is it its '
    + 'just keep kept key kind know known '
    + 'large last late later leave left less let life like little long look low '
    + 'made make man many may me mean men might more morning most move much must my '
    + 'near need never new next night no north not nothing now number '
    + 'of off often old on once one only open or other our out over own '
    + 'part place put '
    + 'quite '
    + 'rather reach read ready right room run '
    + 'said same saw say see seen send sent set several shall she should side since small so some soon south still such sure '
    + 'take tell than that the their them then there these they thing think this those though three through time to today together too took top toward town turn two '
    + 'under until up upon us use used '
    + 'very '
    + 'wait walk wall want was watch water way we week well went were west what when where which while who whole why will wish with within without word work would '
    + 'year yes yet you young your'
  ).split(/\s+/);

  // 隠し文によく出る語（逸話の文を含む）
  const MESSAGE = (
    'alone arms bridge bring castle chapel church come corner danger dark dawn door east '
    + 'escape fire floor friend gate guard help hide hour inside keep ladder leave light meet '
    + 'message midnight money north panel passage path plan prison safe secret send ship side '
    + 'signal slides south stair stone tonight tower trust tunnel under wall watch west window'
  ).split(/\s+/);

  const en = [...new Set([...COMMON, ...MESSAGE])].filter((w) => w.length > 0).sort();

  globalThis.TrevanionWords = { en };
})();
