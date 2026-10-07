// 画面が出す文言（日本語・英語で同じキー）。t(key, vars, lang) で {name} を置き換える。globalThis.TrevanionMessages に置く
// 文中の **…** は太字、*…* は強調、[文字](URL) はリンク、改行（\n）は改行として i18n.js が要素で組み立てる（HTMLとして解釈しない）
(() => {
  'use strict';

  const LANGS = ['ja', 'en'];

  const ja = {
    'meta.title': 'Trevanion CipherLab - トレヴァニオン暗号ツール',
    'meta.description': 'トレヴァニオン暗号（Null暗号の一種）の可視化・学習ツール。句読点の直後から数えて何文字目を拾うかを変えながら、隠された文を取り出せます。規則の総当たりと、逸話の出典の検討つき。',

    'ui.subtitle': 'トレヴァニオン暗号（Null暗号の一種）の可視化・学習ツール',
    'ui.tablist': 'ツールの画面',
    'ui.langButton': 'English',
    'ui.langLabel': 'Switch to English',
    'ui.repo': '🔗 GitHubリポジトリーはこちら（',
    'ui.repoClose': '）',

    'tab.basic': 'トレヴァニオン暗号の基本',
    'tab.encrypt': '暗号化（隠蔽化）',
    'tab.decrypt': '復号（可視化）',
    'tab.study': 'Null暗号の座学',

    // ---- 基本タブ
    'basic.heading': 'トレヴァニオン暗号の基本',
    'basic.overview.summary': '概要',
    'basic.overview.body': '**トレヴァニオン暗号**は、**Null暗号（冗字暗号）**の一種です。\n表面的には自然な文章（カバーテキスト）ですが、*句読点の直後から数えて3文字目*を拾い集めると真のメッセージが現れます。',

    'basic.rule.summary': '基本ルール',
    'basic.rule.puncts': '句読点の集合（初期）：日本語「、。」／英語「, . ; : ! ? \'」',
    'basic.rule.count': '数え方：句読点の**直後から**3文字目（空白を数えるかは設定で選択）',

    'basic.anecdote.summary': '伝えられている逸話',
    'basic.anecdote.lead': 'この暗号には、次の逸話が伝えられています。',
    'basic.anecdote.body': '清教徒革命期、王党派のジョン・トレヴァニオンがコルチェスターの城に幽閉された。そこへ、R.T.と署名された一通の手紙が届く。一見するとただの慰めの手紙だが、句読点の直後から3文字目を順に拾うと*"panel at east end of chapel slides"*（礼拝堂の東端の板が動く）という一文が現れる。彼は祈りを装って礼拝堂に入り、そこから逃れた——。',
    'basic.anecdote.caveat': 'ただし、**この話は一次史料にたどり着けません。**下の「この逸話はどこまで確かめられるか」を開いてください。本ツールは、この手紙を題材として扱っています。',
    'basic.anecdote.doyle': 'コナン・ドイルの『グロリア・スコット号事件』にも隠し文の暗号が出てきますが、そちらは最初の語から**3語ごとに語を拾う**方式で、句読点を手がかりにする本方式とは別のものです。',

    'basic.verify.summary': 'この逸話はどこまで確かめられるか',
    'basic.verify.lead': '暗号史でよく紹介される話ですが、たどれる範囲は次のとおりです。',
    'basic.verify.oldest': '**いちばん古い記録は1853年の匿名の雑誌記事**である（無署名「Cyphers」『The National Miscellany』第1巻、ロンドン、1853年、356〜357頁）。典拠は示されておらず、現在形の物語として書かれている。同じ記事の書き手は、直後の別の暗号の話について「正確な事実を述べるつもりはない。知らないからだ」と断っている',
    'basic.verify.chain': '**そこから引き写されて広まった。**1863年の『Once a Week』→ 同年の『Harper\'s Weekly』→ 1868年のMyer『A Manual of Signals』（Myer自身が「Harper\'s Weekly から取った」と明記している）→ 1869年のBaring-Gould → 1874年のBombaugh → Kahn『The Codebreakers』→ 現代。**この系譜のどの資料も、一次史料を挙げていない**',
    'basic.verify.contradiction': '**同時代の史料と合わない。**クラレンドン伯『反乱史』が記すジョン・トレヴァニオンは、1643年7月のブリストル攻城戦で戦死した28歳未満の下院議員で、ナイトではない。コルチェスターの降伏は1648年8月で5年ずれる。降伏時に名簿から選ばれた3人（ルーカス、ライル、ガスコイン）のなかにも彼はいない。城そのものも「1648年の攻城戦ではほとんど役割を果たさなかった」とされる',
    'basic.verify.drift': '**伝わるうちに年代が壊れた例もある。**1925年の雑誌記事は「ウィリアム・ピット首相の時代」と書いており、実際の1648年とは約135年離れている',
    'basic.verify.scholar': '研究者の評価としては、友清理士が「真正性は確立していないように見える」「一次史料を引用する現代の著者はいないようだ」としつつ、「暗号そのものは、ただの作り話にしては凝りすぎている」とも述べている',
    'basic.verify.note': '作り話だと決めつけられるわけでもありません。ここで言えるのは「1853年より前にはさかのぼれず、同時代の史料とは合わない」というところまでです。',

    'basic.related.summary': '関連情報',
    'basic.related.body': 'Null暗号の詳細は**座学**タブを参照してください。',

    // ---- 暗号化タブ
    'enc.heading': '暗号化',
    'enc.subtablist': '暗号化の画面',
    'enc.subtab.support': '生成支援',
    'enc.subtab.auto': '自動生成（実験的）',

    'enc.support.heading': '制約チェック＆ヒント',
    'enc.support.note': '自然な文章を自動生成するのは難度が高いため、ここでは**「カバーテキスト案」**に対して**「各句読点のn文字目が満たすべき文字」**を可視化し、不一致箇所を指摘します。',
    'enc.plain.label': '隠したいメッセージ（平文）',
    'enc.plain.placeholder': '例：HELLO または こんにちは',
    'enc.target.label': '処理対象文字列（アルファベットのみ）：',
    'enc.cover.label': 'カバーテキスト案（自然文）',
    'enc.cover.placeholder': 'ここに自然な文章を書いて、句読点（、。,.!?;:）の3文字後に平文の各文字が並ぶように調整します。',
    'opt.puncts': '句読点セット：',
    'opt.offset': 'オフセットn：',
    'opt.countSpaces': '空白も「文字数」に含める',
    'enc.check': '制約チェック',
    'enc.preview.label': 'ハイライトプレビュー',

    'enc.tips.summary': '文章調整のコツ（ヒント）',
    'enc.tips.1': '句読点の位置は「平文の文字境界」を作るスイッチ。位置を増減して、3文字目に欲しい文字が来るよう語順を調整。',
    'enc.tips.2': '助詞・副詞・接続詞でリズムを作り、必要な箇所に3文字の余白（例：「が」「やはり」「しかし」など）を挿入。',
    'enc.tips.3': '日本語のかな・漢字・英数の混在で微調整しやすい（1文字カウントでズレを吸収）。',
    'enc.tips.4': 'どうしても無理な場合は、平文の文字集合をローマ字化／英字置換するなどの工夫も有効。',

    'auto.warn': '**この機能は実験的です。**英語では、句読点の直後に置かれるのが接続詞のほうになるため、狙った文字が抽出位置にそろうのは偶然に頼っています。日本語では規則は満たせますが、隠したい文字がそのまま見える形になりやすく、カバーテキストとしては不自然です。確実に作るなら、「生成支援」タブで自分で書いて制約チェックにかけてください。',
    'auto.heading': '自動生成',
    'auto.note': '平文を入力すると、トレヴァニオン暗号のカバーテキストを自動生成します。複数の候補から選択できます。',
    'auto.plain.placeholder': '例：HELLO または SECRET',
    'auto.style.label': '文体：',
    'auto.style.formal': '丁寧（formal）',
    'auto.style.casual': 'カジュアル',
    'auto.style.literary': '文語調',
    'auto.run': '🤖 通常生成',

    'auto.search.summary': '🎯 完全一致候補の探索機能',
    'auto.search.cautionHeading': '⚠️ 使用前の注意事項',
    'auto.search.caution.1': '**無限ループの可能性**：平文によっては完全一致候補が生成不可能な場合があります',
    'auto.search.caution.2': '**処理時間の不確定性**：数秒から数分、場合によってはそれ以上かかる可能性があります',
    'auto.search.caution.3': '**メモリ使用量増加**：大量の候補生成により一時的にメモリを消費します',
    'auto.search.caution.4': '**CPU負荷**：連続生成によりデバイスの処理負荷が高くなります',
    'auto.search.caution.5': '**バッテリー消費**：モバイルデバイスでのバッテリー消費が増加します',
    'auto.search.caution.6': '**安全装置**：10万回試行後に自動停止します（設定変更可能）',
    'auto.search.targetLabel': '目標完全一致数：',
    'auto.search.targetHelp': '平文のすべての文字が正しい位置に配置されたカバーテキストの数',
    'auto.search.helpLabel': '説明を表示',
    'auto.search.maxLabel': '最大試行回数：',
    'auto.search.start': '🎯 完全一致探索開始',
    'auto.search.pause': '⏸️ 一時停止',
    'auto.search.stop': '⏹️ 完全停止',
    'auto.search.progressHeading': '🔍 探索中...',

    'auto.results.heading': '生成結果',
    'auto.regenerate': '🔄 再生成',
    'auto.about.heading': '機能説明：',
    'auto.about.1': '英語単語データベースに基づいて自動生成',
    'auto.about.2': '各句読点のn文字目に平文の文字が配置されるように調整',
    'auto.about.3': '生成されたテキストは「生成支援」タブで検証可能',
    'auto.about.4': '現在は英語対応、日本語は今後対応予定',

    // ---- 復号タブ
    'dec.heading': '復号（可視化）',
    'dec.text.label': '対象テキスト',
    'dec.text.placeholder': 'ここにカバーテキスト（自然文）を貼り付け',
    'dec.offset.label': 'オフセットn（句読点の直後から何文字目を拾うか）：',
    'dec.countMode.label': '何を1文字と数えるか：',
    'dec.countMode.nonSpace': '空白以外（標準）',
    'dec.countMode.all': '空白も数える',
    'dec.countMode.alnum': '英数字・かなだけ',
    'dec.mode.label': '数える途中で句読点に当たったら：',
    'dec.mode.stop': 'そこで打ち切る（標準）',
    'dec.mode.skip': '飛ばして数え続ける',
    'dec.mode.count': '句読点も1文字と数える',
    'dec.run': 'ハイライト＆抽出',
    'dec.sweep': '規則を総当たり',
    'dec.highlight.heading': 'ハイライト表示',
    'dec.result.heading': '抽出結果',
    'dec.copy': '📋 コピー',
    'dec.copy.title': '結果をコピー',
    'dec.handoff': '取り出した文を Frequency Analyzer で調べる',

    // ---- 座学タブ
    'study.heading': 'Null暗号の座学',
    'study.def.summary': 'Null暗号（冗字暗号）の定義',
    'study.def.body1': '**Null暗号（Null cipher）**とは、自然文に見えるテキストから、あらかじめ決められた規則で文字を抜き出すことで真のメッセージを得る方式です。意味を持たない部分を「冗字（null）」と呼びます。一見して普通の文章に見えるため、暗号文だと気づかれにくく、検閲を避ける目的で使われました。',
    'study.def.body2': 'この考え方は古く、ジョン・ウィルキンズ『Mercury, or the Secret and Swift Messenger』（1641年）の第8章が、章題そのもので「意図した意味に必要な数より多くの文字を使って秘密に書くこと」と定義しています。同じ章には、各行の頭文字を拾うアクロスティックや、カルダングリルも並べられています。',
    'study.def.note': '日本語では「冗字暗号」と呼ばれることがありますが、調べた範囲ではこの語の用例をほとんど見つけられませんでした。日本語の暗号史では、長田順行『暗号大全』の分類で言う**分置式**がこの系統にあたります。',

    'study.how.summary': 'Null暗号の仕組み',
    'study.how.1': '少数の選ばれた単語や文字だけに注目し、それ以外は「冗字（null, dummy letters／捨て字）」として意味を持たない。',
    'study.how.2': '規則の例：',
    'study.how.2a': 'コンマの後の最初の文字を拾う',
    'study.how.2b': '一段落内の5語目の後の4文字を拾う',
    'study.how.2c': '新しい段落の直前の単語を拾う',
    'study.how.3': 'トレヴァニオン暗号では「**句読点の直後から数えて3文字目**」というルールを用いる。',

    'study.feature.summary': 'Null暗号の特徴',
    'study.feature.1': '転置や置換は行わず、文字は本文中にそのまま存在する。',
    'study.feature.2': '自然な文章に溶け込ませるため、**ステガノグラフィー（情報隠蔽）**の性質を備える。',
    'study.feature.3': '情報量は少なく効率は悪いが、暗号を使っていること自体を隠せる。',

    'study.make.summary': 'Null暗号文の作り方（簡易版）',
    'study.make.1': '紙を縦に二つ折り（や三つ折り）にする。',
    'study.make.2': '折り目に沿って縦にメッセージ（平文）を書く。',
    'study.make.3': '折り目を開き、その前後を冗字で埋めて自然な文章に仕立てる。',
    'study.make.close': '→ 受け取った側は、折り目に沿って縦に読むことで平文を復元できる。',

    'study.detect.summary': 'Null暗号文の識別のヒント',
    'study.detect.1': '不自然に冗長、または堅苦しい言葉遣いがある。',
    'study.detect.2': '一定間隔や特定位置に意味のある文字列が現れる。',
    'study.detect.close': '→ こうした特徴がある文章はNull暗号文の可能性がある。',
    'study.detect.note': '米国の検閲局が1946年にまとめた報告は、隠しメッセージを含む手紙について「文面が本物らしく響かない。自然さを欠き、人がある考えに置くはずの強調が抜け落ちている」と書いています（Friedman & Callimahos『Military Cryptanalytics Part I』par.83 に引用）。',

    'study.history.summary': 'Null暗号の歴史的背景と応用',
    'study.history.1': '古くからスパイや囚人の密書で利用され、検閲を欺くために活用された。',
    'study.history.2': '第二次世界大戦中、米国の郵便検閲は**国際チェスの対局**のようなやりとりも止めねばならなかったと、検閲局の報告（1945年、22頁）に記されている。隠す媒体としては、ほかに地図・楽譜・買い物リスト・株価などが挙げられている（Friedman & Callimahos, par.83）',
    'study.history.3': '暗号（cryptography）が内容を守るのに対し、ステガノグラフィーは**存在そのものを隠す**ものだと整理される（Petitcolas ほか「Information Hiding — A Survey」1999年）',
    'study.history.4': '現代では「隠しメッセージ」「ステガノグラフィー」の原型として扱われ、教育や歴史研究で取り上げられている。',
    'study.history.5': 'Null暗号は分置式暗号の一種である。Day036の[Hidden Message Challenge](https://ipusiron.github.io/hidden-message-challenge/)で分置式暗号を体験できる（位置抽出チャレンジがNull暗号に相当）。',
  };

  const en = {
    'meta.title': 'Trevanion CipherLab - a null cipher workbench',
    'meta.description': 'A workbench for the Trevanion cipher, a null cipher. Change which letter after each punctuation mark you pick up and watch the hidden sentence come out. Includes a sweep over the rules and a look at how far the anecdote can be traced.',

    'ui.subtitle': 'A workbench for the Trevanion cipher, a kind of null cipher',
    'ui.tablist': 'Tool screens',
    'ui.langButton': '日本語',
    'ui.langLabel': '日本語に切り替える',
    'ui.repo': '🔗 Repository on GitHub (',
    'ui.repoClose': ')',

    'tab.basic': 'Basics',
    'tab.encrypt': 'Encrypt (hide)',
    'tab.decrypt': 'Decrypt (reveal)',
    'tab.study': 'Null ciphers',

    // ---- Basics
    'basic.heading': 'Basics of the Trevanion cipher',
    'basic.overview.summary': 'Overview',
    'basic.overview.body': 'The **Trevanion cipher** is a kind of **null cipher**.\nOn the surface it is an ordinary piece of writing (the covertext), but pick up *the third letter counting from just after each punctuation mark* and the real message appears.',

    'basic.rule.summary': 'The rule',
    'basic.rule.puncts': 'Punctuation marks (initial setting): Japanese 、。 / English , . ; : ! ? \'',
    'basic.rule.count': 'Counting: the third letter **starting just after** the mark (whether spaces count is up to you)',

    'basic.anecdote.summary': 'The anecdote as it is told',
    'basic.anecdote.lead': 'The cipher comes with the following story.',
    'basic.anecdote.body': 'During the English Civil War, the Royalist Sir John Trevanion was imprisoned in Colchester Castle. A letter signed R.T. arrived. At a glance it is nothing but a letter of consolation, yet picking up the third letter after each punctuation mark in turn spells out *"panel at east end of chapel slides"*. He asked to pray in the chapel, and from there he escaped.',
    'basic.anecdote.caveat': 'However, **no primary source for this story can be found.** Open "How far the anecdote can be traced" below. This tool uses the letter as its worked example.',
    'basic.anecdote.doyle': 'Conan Doyle\'s "The Gloria Scott" also turns on a hidden message, but there the reader takes **every third word** from the start, which is a different rule from keying on punctuation.',

    'basic.verify.summary': 'How far the anecdote can be traced',
    'basic.verify.lead': 'The story is a staple of cipher history, but here is as far as it can be followed back.',
    'basic.verify.oldest': '**The earliest record is an anonymous magazine article from 1853** (unsigned, "Cyphers", The National Miscellany, vol. 1, London, 1853, pp. 356–357). It cites no source and is written as a story in the present tense. The same writer says of another cipher story a few lines later that he does not mean to state the exact facts, because he does not know them',
    'basic.verify.chain': '**It spread by being copied.** Once a Week in 1863 → Harper\'s Weekly the same year → Myer, A Manual of Signals, 1868 (Myer states outright that he took it from Harper\'s Weekly) → Baring-Gould in 1869 → Bombaugh in 1874 → Kahn, The Codebreakers → the present day. **Not one source in that line cites a primary document**',
    'basic.verify.contradiction': '**It does not fit the contemporary record.** The John Trevanion in Clarendon\'s History of the Rebellion was a Member of Parliament under 28 who was killed at the siege of Bristol in July 1643, and he was not a knight. Colchester surrendered in August 1648, five years later. He is not among the three men picked from the lists at the surrender (Lucas, Lisle and Gascoigne) either. The castle itself is said to have played almost no part in the 1648 siege',
    'basic.verify.drift': '**In some retellings the dates fall apart.** A magazine article from 1925 places the story in the time of Prime Minister William Pitt, roughly 135 years away from 1648',
    'basic.verify.scholar': 'As for scholarly opinion, Satoshi Tomokiyo writes that the authenticity does not appear to be established and that no modern author seems to cite a primary source, while adding that the cipher itself is too elaborate to be a mere invention',
    'basic.verify.note': 'That does not let us call it a fabrication either. What can be said is only this: it cannot be traced before 1853, and it does not fit the contemporary record.',

    'basic.related.summary': 'Related',
    'basic.related.body': 'For null ciphers in general, see the **Null ciphers** tab.',

    // ---- Encrypt
    'enc.heading': 'Encrypt',
    'enc.subtablist': 'Encrypt screens',
    'enc.subtab.support': 'Check a draft',
    'enc.subtab.auto': 'Generate (experimental)',

    'enc.support.heading': 'Constraint check and hints',
    'enc.support.note': 'Writing natural prose automatically is hard, so this screen takes **a draft covertext** and shows **which letter each punctuation mark has to be followed by**, pointing out where the draft does not match.',
    'enc.plain.label': 'Message to hide (plaintext)',
    'enc.plain.placeholder': 'e.g. HELLO',
    'enc.target.label': 'Letters actually used (alphabet only):',
    'enc.cover.label': 'Draft covertext (natural prose)',
    'enc.cover.placeholder': 'Write natural prose here and adjust it so that the third character after each punctuation mark (、。,.!?;:) spells out the plaintext.',
    'opt.puncts': 'Punctuation marks:',
    'opt.offset': 'Offset n:',
    'opt.countSpaces': 'Count spaces as characters',
    'enc.check': 'Check',
    'enc.preview.label': 'Highlight preview',

    'enc.tips.summary': 'Hints for adjusting the prose',
    'enc.tips.1': 'Each punctuation mark is a switch that creates a boundary for one plaintext letter. Add or move marks and reorder words so the letter you want lands third.',
    'enc.tips.2': 'Short function words and adverbs set the rhythm; drop in a three-letter run where you need one.',
    'enc.tips.3': 'Mixing scripts (kana, kanji, Latin letters, digits) makes fine adjustment easier, since each counts as one character.',
    'enc.tips.4': 'If a letter simply will not fit, try romanising or substituting the plaintext alphabet.',

    'auto.warn': '**This feature is experimental.** In English the word placed right after a punctuation mark is the connective, so the intended letter landing in the extraction position is left to chance. In Japanese the rule can be satisfied, but the letters you want to hide tend to sit in plain view, which makes a poor covertext. To get a reliable result, write the text yourself on the "Check a draft" screen and run the constraint check.',
    'auto.heading': 'Generate',
    'auto.note': 'Enter a plaintext and the tool generates covertext for the Trevanion cipher. Several candidates are offered.',
    'auto.plain.placeholder': 'e.g. HELLO or SECRET',
    'auto.style.label': 'Style:',
    'auto.style.formal': 'Formal',
    'auto.style.casual': 'Casual',
    'auto.style.literary': 'Literary',
    'auto.run': '🤖 Generate',

    'auto.search.summary': '🎯 Search for exact matches',
    'auto.search.cautionHeading': '⚠️ Before you start',
    'auto.search.caution.1': '**It may never finish**: for some plaintexts an exact match cannot be generated at all',
    'auto.search.caution.2': '**The running time is unpredictable**: seconds, minutes, or longer',
    'auto.search.caution.3': '**Memory use grows**: generating many candidates takes memory for a while',
    'auto.search.caution.4': '**CPU load**: generating continuously keeps the device busy',
    'auto.search.caution.5': '**Battery**: on a mobile device the drain goes up',
    'auto.search.caution.6': '**Safety stop**: it halts automatically after 100,000 attempts (configurable)',
    'auto.search.targetLabel': 'Exact matches wanted:',
    'auto.search.targetHelp': 'How many covertexts should place every letter of the plaintext correctly',
    'auto.search.helpLabel': 'Show the explanation',
    'auto.search.maxLabel': 'Maximum attempts:',
    'auto.search.start': '🎯 Start searching',
    'auto.search.pause': '⏸️ Pause',
    'auto.search.stop': '⏹️ Stop',
    'auto.search.progressHeading': '🔍 Searching...',

    'auto.results.heading': 'Results',
    'auto.regenerate': '🔄 Generate again',
    'auto.about.heading': 'About this screen:',
    'auto.about.1': 'Generates from a database of English words',
    'auto.about.2': 'Arranges the text so that the nth character after each punctuation mark is a plaintext letter',
    'auto.about.3': 'The generated text can be verified on the "Check a draft" screen',
    'auto.about.4': 'English for now; Japanese is planned',

    // ---- Decrypt
    'dec.heading': 'Decrypt (reveal)',
    'dec.text.label': 'Text to examine',
    'dec.text.placeholder': 'Paste the covertext (natural prose) here',
    'dec.offset.label': 'Offset n (which character after the mark to pick up):',
    'dec.countMode.label': 'What counts as one character:',
    'dec.countMode.nonSpace': 'Everything but spaces (default)',
    'dec.countMode.all': 'Spaces too',
    'dec.countMode.alnum': 'Letters, digits and kana only',
    'dec.mode.label': 'If another mark turns up while counting:',
    'dec.mode.stop': 'Stop there (default)',
    'dec.mode.skip': 'Skip it and keep counting',
    'dec.mode.count': 'Count it as a character',
    'dec.run': 'Highlight and extract',
    'dec.sweep': 'Sweep the rules',
    'dec.highlight.heading': 'Highlighted text',
    'dec.result.heading': 'Extracted message',
    'dec.copy': '📋 Copy',
    'dec.copy.title': 'Copy the result',
    'dec.handoff': 'Examine the extracted text in Frequency Analyzer',

    // ---- Null ciphers
    'study.heading': 'Null ciphers',
    'study.def.summary': 'What a null cipher is',
    'study.def.body1': 'A **null cipher** obtains the real message by taking letters out of text that looks like ordinary prose, following a rule agreed in advance. The parts that carry no meaning are the "nulls". Because the result reads as a normal piece of writing, it is not easily spotted as ciphertext, and it was used to get past censors.',
    'study.def.body2': 'The idea is old. Chapter 8 of John Wilkins\'s Mercury, or the Secret and Swift Messenger (1641) defines it in its own chapter title as writing secretly by using more letters than are needed for the intended sense. The same chapter also sets out acrostics, which take the first letter of each line, and the Cardan grille.',
    'study.def.note': 'Japanese sometimes calls this 冗字暗号, but in what I could search, examples of that term are hard to find. In the Japanese literature on cipher history, the category Osada Junkō calls 分置式 in Angou Taizen covers this family.',

    'study.how.summary': 'How it works',
    'study.how.1': 'Only a few chosen words or letters matter; everything else is a null (dummy letter) and carries no meaning.',
    'study.how.2': 'Example rules:',
    'study.how.2a': 'Take the first letter after each comma',
    'study.how.2b': 'Take the four letters after the fifth word of each paragraph',
    'study.how.2c': 'Take the word just before each new paragraph',
    'study.how.3': 'The Trevanion cipher uses the rule "**the third letter counting from just after each punctuation mark**".',

    'study.feature.summary': 'Characteristics',
    'study.feature.1': 'Nothing is transposed or substituted; the letters sit in the text as they are.',
    'study.feature.2': 'Because it blends into natural prose, it has the character of **steganography**.',
    'study.feature.3': 'It carries little information and is inefficient, but it hides the fact that a cipher is in use at all.',

    'study.make.summary': 'Making one by hand',
    'study.make.1': 'Fold a sheet of paper lengthwise in two (or in three).',
    'study.make.2': 'Write the message down the fold.',
    'study.make.3': 'Open the fold and fill either side with nulls until it reads as natural prose.',
    'study.make.close': '→ The recipient recovers the plaintext by reading down the fold.',

    'study.detect.summary': 'Hints for spotting one',
    'study.detect.1': 'The wording is oddly wordy or stiff.',
    'study.detect.2': 'Meaningful strings appear at a fixed interval or in fixed positions.',
    'study.detect.close': '→ Text with those traits may be a null cipher.',
    'study.detect.note': 'A 1946 report by the US censorship office writes of letters carrying hidden messages that the text does not ring true: it lacks naturalness, and the emphasis a person would place on an idea is missing (quoted in Friedman & Callimahos, Military Cryptanalytics Part I, par. 83).',

    'study.history.summary': 'Background and uses',
    'study.history.1': 'Long used in the secret letters of spies and prisoners, to get past censors.',
    'study.history.2': 'During the Second World War, US postal censorship had to stop even exchanges that looked like **international chess games**, according to a censorship office report (1945, p. 22). Maps, sheet music, shopping lists and stock prices are listed among the other carriers (Friedman & Callimahos, par. 83)',
    'study.history.3': 'Where cryptography protects the content, steganography is set apart as hiding **the very existence** of the message (Petitcolas et al., "Information Hiding — A Survey", 1999)',
    'study.history.4': 'Today it is treated as the ancestor of hidden messages and steganography, and taken up in teaching and in historical work.',
    'study.history.5': 'A null cipher is one kind of concealment cipher. Day036\'s [Hidden Message Challenge](https://ipusiron.github.io/hidden-message-challenge/) lets you try concealment ciphers (its position-extraction challenge is a null cipher).',
  };

  const DICT = { ja, en };

  function t(key, vars, lang) {
    const dict = DICT[lang] || DICT.ja;
    const template = dict[key] === undefined ? DICT.ja[key] : dict[key];
    if (template === undefined) return key;
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (m, name) => (vars[name] === undefined ? m : String(vars[name])));
  }

  globalThis.TrevanionMessages = { LANGS, DICT, t };
})();
