/* ==========================================================================
   UI Navigation - Tab Switching
   ========================================================================== */

/**
 * メインタブの切り替え機能
 * - 基本、暗号化、復号、座学の4つのタブを管理
 * - アクセシビリティ対応（aria-selected属性）
 */
const tabBtns = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // 全てのタブボタンを非アクティブに
    tabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });

    // 全てのパネルを非表示に
    panels.forEach(p => p.classList.remove('active'));

    // クリックされたタブとそのパネルをアクティブに
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

/**
 * サブタブの切り替え機能
 * - 暗号化タブ内の「生成支援」「自動生成」サブタブを管理
 * - 親タブ内でのみ動作するよう制限
 */
const subTabBtns = document.querySelectorAll('.sub-tab-btn');
const subPanels = document.querySelectorAll('.sub-tab-panel');

subTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // 同じ親タブ内のサブタブのみを対象に切り替え
    const parentTab = btn.closest('.tab-panel');
    const parentSubTabBtns = parentTab.querySelectorAll('.sub-tab-btn');
    const parentSubPanels = parentTab.querySelectorAll('.sub-tab-panel');

    // 親タブ内の全サブタブを非アクティブに
    parentSubTabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    parentSubPanels.forEach(p => p.classList.remove('active'));

    // クリックされたサブタブとそのパネルをアクティブに
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    document.getElementById(btn.dataset.subtab).classList.add('active');
  });
});

/* ==========================================================================
   Utility Functions
   ========================================================================== */

/**
 * 句読点文字列を正規化（重複削除）
 * @param {string} str - 句読点文字列
 * @returns {string} - 重複を除いた句読点文字列
 */
function normalizePuncts(str) {
  return Array.from(new Set((str || '').split(''))).join('');
}

/**
 * 空白文字かどうかを判定
 * @param {string} ch - 判定する文字
 * @returns {boolean} - 空白文字の場合true
 */
function isSpace(ch) {
  return /\s/.test(ch);
}

/**
 * HTMLエスケープ処理
 * @param {string} s - エスケープする文字列
 * @returns {string} - エスケープ済み文字列
 */
function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

/**
 * 平文から処理対象文字列（アルファベットのみ）を抽出
 * @param {string} plaintext - 入力された平文
 * @returns {string} - アルファベットのみの文字列（小文字変換済み）
 */
function extractProcessingText(plaintext) {
  if (!plaintext) return '';

  // アルファベットのみを抽出し、小文字に変換
  return plaintext.replace(/[^a-zA-Z]/g, '').toLowerCase();
}

/**
 * 処理対象文字列表示を更新する
 * @param {string} elementId - 表示先要素のID
 * @param {string} plaintext - 入力された平文
 */
function updateProcessingText(elementId, plaintext) {
  const element = document.getElementById(elementId);
  if (!element) return;

  let processingText;
  if (containsJapanese(plaintext)) {
    processingText = extractJapaneseText(plaintext);
  } else {
    processingText = extractProcessingText(plaintext);
  }

  element.textContent = processingText;
}

/**
 * 日本語文字（ひらがな、カタカナ、漢字）を検出
 * @param {string} text - チェックするテキスト
 * @returns {boolean} - 日本語文字が含まれている場合true
 */
function containsJapanese(text) {
  // ひらがな、カタカナ、漢字の範囲
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

/**
 * 文字列から平仮名のみを抽出
 * @param {string} plaintext - 入力された平文
 * @returns {string} - 平仮名のみの文字列
 */
function extractJapaneseText(plaintext) {
  if (!plaintext) return '';

  // ひらがな、カタカナ、漢字を抽出（ただし、トレヴァニオン暗号では通常ひらがなを使用）
  return plaintext.replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '');
}

/* ==========================================================================
   Trevanion Cipher Algorithm
   ========================================================================== */

/**
 * トレヴァニオン暗号の復号アルゴリズム
 * テキスト中の各句読点から指定されたオフセット位置の文字を抽出する
 *
 * @param {string} text - 対象テキスト（カバーテキスト）
 * @param {string} puncts - 句読点セット（例: "、。,.!?;:'"）
 * @param {number} offset - 抽出オフセット（句読点の直後から何文字目か、例: 3）
 * @param {boolean} countSpaces - 空白文字をカウントに含めるかどうか
 * @returns {{message:string, indices:number[]}} 抽出されたメッセージと位置情報
 */
function trevanionExtract(text, puncts = ",.;:!?'、。", offset = 3, countSpaces = true) {
  const res = [];           // 抽出された文字の配列
  const indices = [];       // 抽出位置のインデックス配列
  const pset = new Set((puncts || '').split(''));  // 句読点セットを Set に変換

  // テキストを1文字ずつ走査
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    // 句読点を発見した場合
    if (pset.has(ch)) {
      let steps = 0;           // オフセットカウンター
      let foundTarget = false; // 目標文字を見つけたかフラグ

      // 句読点の直後から文字をカウント
      for (let j = i + 1; j < text.length; j++) {
        const c = text[j];

        // 次の句読点に遭遇したら、オフセット文字に達していない場合はスキップ
        if (pset.has(c)) {
          break;
        }

        // 空白をカウントするかどうかに応じて処理
        if (countSpaces || !isSpace(c)) {
          steps++;

          // 指定されたオフセットに到達した場合
          if (steps === offset) {
            res.push(c);           // 文字を結果に追加
            indices.push(j);       // 位置を記録
            foundTarget = true;
            break;
          }
        }
      }
    }
  }

  return {
    message: res.join(''),  // 抽出された文字を連結した文字列
    indices                 // 抽出位置の配列
  };
}

/**
 * テキストのハイライト表示用HTML生成
 * 句読点と抽出文字を異なるスタイルで装飾
 *
 * @param {string} text - 対象テキスト
 * @param {number[]} indices - 抽出文字の位置配列
 * @param {string} puncts - 句読点セット
 * @returns {string} - ハイライト付きHTML
 */
function renderHighlight(text, indices, puncts = ",.;:!?'、。") {
  const pset = new Set((puncts || '').split(''));
  let out = '';

  // テキストを1文字ずつ処理
  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (indices.includes(i)) {
      // 抽出文字をハイライト（黄色）
      out += `<span class="hl">${escapeHtml(c)}</span>`;
    } else if (pset.has(c)) {
      // 句読点をマーク（青色）
      out += `<span class="kp">${escapeHtml(c)}</span>`;
    } else {
      // 通常文字
      out += escapeHtml(c);
    }
  }

  return out;
}

/* ==========================================================================
   Decrypt Tab - 復号（可視化）タブの機能
   ========================================================================== */

// DOM要素の取得
const decText = document.getElementById('dec-text');               // 入力テキストエリア
const decPuncts = document.getElementById('dec-puncts');           // 句読点設定フィールド
const decOffset = document.getElementById('dec-offset');           // オフセット設定フィールド
const decCountSpaces = document.getElementById('dec-count-spaces'); // 空白カウントチェックボックス
const decRun = document.getElementById('dec-run');               // 実行ボタン
const decResult = document.getElementById('dec-result');           // 結果表示エリア
const decHighlight = document.getElementById('dec-highlight');     // ハイライト表示エリア

/**
 * 復号実行ボタンのイベントリスナー
 * 入力されたテキストからトレヴァニオン暗号を抽出し、結果を表示
 */
decRun?.addEventListener('click', () => {
  // 入力値の取得と正規化
  const text = decText.value || '';
  const puncts = normalizePuncts(decPuncts.value || '、。,.!?;:\'');
  const offset = Math.max(1, parseInt(decOffset.value || '3', 10));
  const countSpaces = !!decCountSpaces.checked;

  // トレヴァニオン暗号の抽出実行
  const { message, indices } = trevanionExtract(text, puncts, offset, countSpaces);

  // 結果の表示
  decResult.textContent = message;                                    // 抽出されたメッセージ
  decHighlight.innerHTML = renderHighlight(text, indices, puncts);    // ハイライト表示

  // 設定をLocalStorageに保存（次回起動時に復元するため）
  try {
    localStorage.setItem('tcl_puncts', puncts);
    localStorage.setItem('tcl_offset', String(offset));
    localStorage.setItem('tcl_countspaces', countSpaces ? '1' : '0');
  } catch (e) {
    console.warn('LocalStorageの保存に失敗:', e);
  }
});

/* ==========================================================================
   Settings Management - 設定管理
   ========================================================================== */

/**
 * LocalStorageの古い設定をクリアする関数（デバッグ用）
 * コンソールから clearOldSettings() で実行可能
 */
function clearOldSettings() {
  localStorage.removeItem('tcl_puncts');
  localStorage.removeItem('tcl_offset');
  localStorage.removeItem('tcl_countspaces');
  console.log('Cleared old LocalStorage settings');
  location.reload();
}

// グローバルスコープに公開（デバッグ用）
window.clearOldSettings = clearOldSettings;

// 初期ロード時に設定復元
window.addEventListener('DOMContentLoaded', ()=>{
  // 文字コードから直接アポストロフィーを生成
  const apostrophe = String.fromCharCode(39); // ASCII apostrophe
  const defaultPuncts = "、。,.!?;:" + apostrophe;

  console.log('Default puncts:', defaultPuncts);
  console.log('Default puncts length:', defaultPuncts.length);
  console.log('Last char code:', defaultPuncts.charCodeAt(defaultPuncts.length - 1));
  console.log('Apostrophe char:', apostrophe);

  try{
    const p = localStorage.getItem('tcl_puncts');
    const o = localStorage.getItem('tcl_offset');
    const s = localStorage.getItem('tcl_countspaces');

    // 句読点セットを設定（アポストロフィーが含まれていない古い設定を更新）
    let finalPuncts = p || defaultPuncts;
    if(p && !p.includes(apostrophe)) {
      finalPuncts = p + apostrophe;
      localStorage.setItem('tcl_puncts', finalPuncts);
      console.log('Updated old puncts to include apostrophe');
    }
    decPuncts.value = finalPuncts;

    console.log('Actual decPuncts value:', decPuncts.value);
    console.log('Actual decPuncts length:', decPuncts.value.length);

    // 文字ごとに確認
    for(let i = 0; i < decPuncts.value.length; i++) {
      console.log(`Character ${i}: '${decPuncts.value[i]}' (code: ${decPuncts.value.charCodeAt(i)})`);
    }

    if(o) decOffset.value = o;
    if(s) decCountSpaces.checked = s === '1';
  }catch(e){
    console.error('Error in DOMContentLoaded:', e);
  }

  // 暗号化タブの句読点セットも同様に設定
  const encPunctsInput = document.getElementById('puncts-input');
  if(encPunctsInput) {
    const encP = localStorage.getItem('tcl_puncts');
    let finalEncPuncts = encP || defaultPuncts;
    if(encP && !encP.includes(apostrophe)) {
      finalEncPuncts = encP + apostrophe;
    }
    encPunctsInput.value = finalEncPuncts;
    console.log('Actual encPunctsInput value:', encPunctsInput.value);
  }

  // 自動生成タブの句読点セットも同様に設定
  const autoPunctsInput = document.getElementById('auto-puncts');
  if(autoPunctsInput) {
    const autoP = localStorage.getItem('tcl_puncts');
    let finalAutoPuncts = autoP || defaultPuncts;
    if(autoP && !autoP.includes(apostrophe)) {
      finalAutoPuncts = autoP + apostrophe;
    }
    autoPunctsInput.value = finalAutoPuncts;
    console.log('Actual autoPunctsInput value:', autoPunctsInput.value);
  }
});

/* ==========================================================================
   Copy & Toast Notification
   ========================================================================== */

// DOM要素の取得
const copyBtn = document.getElementById('copy-result');
const toast = document.getElementById('toast');

/**
 * トースト通知を表示する関数
 * @param {string} message - 表示するメッセージ
 */
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');  // スライドインアニメーション

  // 2秒後に自動で非表示
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

/**
 * コピーボタンのイベントリスナー
 * 抽出結果をクリップボードにコピーする
 */
copyBtn?.addEventListener('click', async () => {
  const resultText = decResult.textContent || '';

  // コピーする内容があるかチェック
  if (!resultText.trim()) {
    showToast('コピーする内容がありません');
    return;
  }

  try {
    // 現代的なClipboard APIを使用
    await navigator.clipboard.writeText(resultText);
    showToast('📋 抽出結果をコピーしました！');
  } catch (err) {
    // 古いブラウザー向けのフォールバック
    try {
      const textArea = document.createElement('textarea');
      textArea.value = resultText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');  // 非推奨だがフォールバックとして使用
      document.body.removeChild(textArea);
      showToast('📋 抽出結果をコピーしました！');
    } catch (fallbackErr) {
      console.error('Copy failed:', fallbackErr);
      showToast('❌ コピーに失敗しました');
    }
  }
});

/* ==========================================================================
   Encrypt Tab - 暗号化（制約チェック）タブの機能
   ========================================================================== */

// DOM要素の取得
const encPlain = document.getElementById('enc-plain');           // 平文入力エリア
const encCover = document.getElementById('enc-cover');           // カバーテキスト入力エリア
const countSpacesChk = document.getElementById('count-spaces');   // 空白カウントチェックボックス
const punctsInput = document.getElementById('puncts-input');     // 句読点設定フィールド
const encOffset = document.getElementById('enc-offset');         // オフセット設定フィールド
const encCheck = document.getElementById('enc-check');           // 制約チェック実行ボタン
const encReport = document.getElementById('enc-report');         // チェック結果レポートエリア
const encPreview = document.getElementById('enc-preview');       // プレビュー表示エリア

/**
 * 制約チェック機能：平文とカバーテキストの整合性を検証
 *
 * トレヴァニオン暗号の制約として、カバーテキストから抽出される文字が
 * 平文と一致しているかどうかを詳細にチェックする
 *
 * @param {string} plaintext - 隠したい平文メッセージ
 * @param {string} covertext - カバーテキスト（自然文）
 * @param {string} puncts - 句読点セット
 * @param {number} offset - 抽出オフセット
 * @param {boolean} countSpaces - 空白をカウントするかどうか
 * @returns {Object} 制約チェック結果の詳細情報
 */
function checkConstraints(plaintext, covertext, puncts, offset, countSpaces) {
  // 平文から空白を除去して文字配列に変換
  const expectedChars = Array.from(plaintext.replace(/\s+/g, ''));

  // カバーテキストから実際に抽出される文字列を取得
  const extraction = trevanionExtract(covertext, puncts, offset, countSpaces);
  const actualChars = Array.from(extraction.message);

  // 結果オブジェクトの初期化
  const result = {
    isValid: false,                    // 全体的な検証結果
    expectedLength: expectedChars.length,  // 期待される文字数
    actualLength: actualChars.length,      // 実際に抽出された文字数
    matches: 0,                        // 一致した文字数
    details: [],                       // 詳細な比較結果
    mismatches: [],
    missing: [],
    extra: []
  };

  // 各文字を比較
  const maxLength = Math.max(expectedChars.length, actualChars.length);
  for (let i = 0; i < maxLength; i++) {
    const expected = expectedChars[i] || null;
    const actual = actualChars[i] || null;
    const punctIndex = extraction.indices[i] || null;

    const detail = {
      index: i,
      expected,
      actual,
      punctIndex,
      status: 'unknown'
    };

    if (expected && actual) {
      if (expected.toLowerCase() === actual.toLowerCase()) {
        detail.status = 'match';
        result.matches++;
      } else {
        detail.status = 'mismatch';
        result.mismatches.push({index: i, expected, actual});
      }
    } else if (expected && !actual) {
      detail.status = 'missing';
      result.missing.push({index: i, expected});
    } else if (!expected && actual) {
      detail.status = 'extra';
      result.extra.push({index: i, actual});
    }

    result.details.push(detail);
  }

  result.isValid = result.matches === expectedChars.length &&
                   result.mismatches.length === 0 &&
                   result.missing.length === 0 &&
                   result.extra.length === 0;

  return result;
}

/**
 * 制約チェック結果のHTML生成
 */
function generateConstraintReport(result, covertext, puncts) {
  let html = '<div class="constraint-summary">';

  if (result.isValid) {
    html += '<div class="status success">✅ 制約チェック成功！すべての文字が正しく配置されています。</div>';
  } else {
    html += '<div class="status error">⚠️ 制約チェックで問題が見つかりました：</div>';
    html += '<ul class="issue-list">';

    if (result.missing.length > 0) {
      html += `<li class="missing">不足: ${result.missing.length}文字 (${result.missing.map(m => `"${m.expected}"`).join(', ')})</li>`;
    }
    if (result.mismatches.length > 0) {
      html += `<li class="mismatch">不一致: ${result.mismatches.length}箇所</li>`;
    }
    if (result.extra.length > 0) {
      html += `<li class="extra">余分: ${result.extra.length}文字</li>`;
    }

    html += '</ul>';
  }

  html += `<div class="stats">一致: ${result.matches}/${result.expectedLength}文字</div>`;
  html += '</div>';

  // 詳細表
  if (result.details.length > 0) {
    html += '<table class="constraint-table">';
    html += '<thead><tr><th>位置</th><th>期待値</th><th>実際</th><th>状態</th></tr></thead><tbody>';

    result.details.forEach((detail, i) => {
      const statusClass = detail.status;
      const statusText = {
        'match': '✅ 一致',
        'mismatch': '❌ 不一致',
        'missing': '❓ 不足',
        'extra': '➕ 余分'
      }[detail.status] || '?';

      html += `<tr class="row-${statusClass}">`;
      html += `<td>${i + 1}</td>`;
      html += `<td class="expected">${detail.expected || '-'}</td>`;
      html += `<td class="actual">${detail.actual || '-'}</td>`;
      html += `<td class="status-${statusClass}">${statusText}</td>`;
      html += '</tr>';
    });

    html += '</tbody></table>';
  }

  return html;
}

encCheck?.addEventListener('click', ()=>{
  const plain = (encPlain.value || '').replace(/\r?\n/g,'');
  const cover = encCover.value || '';
  const puncts = normalizePuncts(punctsInput.value || '、。,.!?;:');
  const offset = Math.max(1, parseInt(encOffset.value||'3', 10));
  const countSpaces = !!countSpacesChk.checked;

  if (!plain.trim()) {
    encReport.innerHTML = '<div class="error">平文を入力してください。</div>';
    encPreview.innerHTML = '';
    return;
  }

  if (!cover.trim()) {
    encReport.innerHTML = '<div class="error">カバーテキストを入力してください。</div>';
    encPreview.innerHTML = '';
    return;
  }

  // 制約チェック実行
  const result = checkConstraints(plain, cover, puncts, offset, countSpaces);

  // 結果表示
  encReport.innerHTML = generateConstraintReport(result, cover, puncts);

  // プレビュー表示（ハイライト）
  const extraction = trevanionExtract(cover, puncts, offset, countSpaces);
  encPreview.innerHTML = renderHighlight(cover, extraction.indices, puncts);
});

/* ==========================================================================
   Auto Generation - 自動生成機能
   ========================================================================== */

// DOM要素の取得
const autoPlain = document.getElementById('auto-plain');      // 平文入力エリア
const autoOffset = document.getElementById('auto-offset');    // オフセット設定
const autoGenerate = document.getElementById('auto-generate'); // 生成ボタン（使用していない）
const autoResult = document.getElementById('auto-result');    // 結果表示エリア（使用していない）

/**
 * 拡張英単語データベース
 * 位置別文字インデックスで整理された包括的な単語リスト
 */
const allWords = [
  // 基本単語
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use',
  // 3文字単語と追加単語
  'about', 'after', 'again', 'against', 'also', 'another', 'any', 'because', 'before', 'being', 'between', 'both', 'came', 'come', 'could', 'each', 'even', 'every', 'first', 'from', 'give', 'good', 'great', 'group', 'hand', 'have', 'here', 'high', 'home', 'however', 'important', 'into', 'just', 'know', 'large', 'last', 'life', 'little', 'long', 'made', 'make', 'many', 'most', 'move', 'much', 'must', 'name', 'need', 'never', 'next', 'night', 'number', 'only', 'other', 'over', 'own', 'part', 'people', 'place', 'point', 'right', 'same', 'seem', 'several', 'should', 'show', 'since', 'small', 'some', 'still', 'such', 'system', 'take', 'than', 'their', 'them', 'there', 'these', 'they', 'thing', 'think', 'this', 'those', 'though', 'three', 'through', 'time', 'today', 'together', 'turn', 'under', 'until', 'very', 'want', 'water', 'well', 'were', 'what', 'when', 'where', 'which', 'while', 'with', 'without', 'work', 'world', 'would', 'write', 'year', 'young',
  // 追加: h,e,l,o用の単語（3文字目対応）
  'the', 'she', 'all', 'old', 'help', 'held', 'self', 'tell', 'well', 'will', 'call', 'full', 'still', 'skill', 'hello', 'follow', 'hollow', 'yellow', 'allow', 'below', 'fellow', 'pillow',
  // フォーマル単語
  'therefore', 'however', 'furthermore', 'moreover', 'nevertheless', 'consequently', 'accordingly', 'meanwhile', 'distinguished', 'honourable', 'respectfully', 'sincerely', 'faithfully', 'graciously', 'humbly', 'earnestly', 'carefully', 'thoughtfully', 'considerately',
  // カジュアル単語
  'awesome', 'amazing', 'fantastic', 'wonderful', 'excellent', 'brilliant', 'perfect', 'incredible', 'outstanding', 'fabulous', 'terrific', 'superb', 'marvelous', 'spectacular',
  // 文語調単語
  'whereupon', 'whilst', 'hence', 'thus', 'perchance', 'verily', 'forsooth', 'indeed', 'behold', 'mayhap', 'dearest', 'beloved', 'gracious', 'noble', 'gentle', 'blessed', 'divine', 'wondrous', 'fair'
];

/**
 * 日本語単語データベース
 * ひらがな文字の位置別インデックス用
 */
const japaneseWords = [
  // あ行
  'あの', 'あそこ', 'あなた', 'あまり', 'あとで', 'ありがとう', 'あります', 'あった', 'あって', 'あんな',
  'いま', 'いつも', 'いい', 'いろいろ', 'いちばん', 'いっしょ', 'いくつ', 'いつか', 'いかが', 'いけません',
  'うち', 'うしろ', 'うまい', 'うれしい', 'うんと', 'うみ', 'うた', 'うごく', 'うまれる', 'うける',
  'えき', 'えいが', 'えらい', 'えんぴつ', 'えーと', 'えほん', 'えがお', 'えいご', 'えらぶ', 'えんきょく',
  'おもしろい', 'おかえり', 'おなじ', 'おいしい', 'おとうさん', 'おかあさん', 'おじいさん', 'おばあさん', 'おっと', 'おそい',

  // か行
  'かならず', 'かんがえる', 'かいもの', 'かぞく', 'かわいい', 'かんたん', 'からだ', 'かれ', 'かのじょ', 'かたち',
  'きもち', 'きれい', 'きのう', 'きょう', 'きっと', 'きこえる', 'きをつける', 'きせつ', 'きにいる', 'きんじょ',
  'くらい', 'くる', 'くに', 'くるま', 'くらす', 'くわしい', 'くろい', 'くちば', 'くやしい', 'くらべる',
  'けっこう', 'けんこう', 'けっして', 'けいけん', 'けれど', 'けさ', 'けっきょく', 'けいかく', 'けんきゅう', 'けんか',
  'こんど', 'こちら', 'こんな', 'こと', 'ことば', 'こども', 'こっち', 'こんにちは', 'こまる', 'こころ',

  // さ行
  'さいきん', 'さっき', 'さがす', 'さいしょ', 'さっそく', 'さんぽ', 'さいふ', 'さくら', 'さかな', 'さびしい',
  'しかし', 'しんぱい', 'しずか', 'しあわせ', 'しつもん', 'したがって', 'しかも', 'しんじる', 'しらべる', 'しごと',
  'すこし', 'すぐ', 'すばらしい', 'すてき', 'すみません', 'すでに', 'すべて', 'するとき', 'するから', 'すきな',
  'せんせい', 'せいかつ', 'せんそう', 'せかい', 'せっかく', 'せつめい', 'せんたく', 'せまい', 'せんもん', 'せいじ',
  'そうして', 'そのため', 'そうです', 'そちら', 'そして', 'そんな', 'そうすると', 'そうですね', 'そこで', 'そんなに',

  // た行
  'たいせつ', 'ただし', 'たとえば', 'たすける', 'たのしい', 'たくさん', 'ただいま', 'たしかに', 'たべもの', 'たいへん',
  'ちょっと', 'ちいさい', 'ちかい', 'ちがう', 'ちょうど', 'ちゃんと', 'ちから', 'ちゅうい', 'ちかく', 'ちきゅう',
  'つぎ', 'つくる', 'つかれる', 'つめたい', 'つづく', 'つよい', 'つかう', 'つまり', 'つきあう', 'つもり',
  'てんき', 'てつだう', 'てがみ', 'てんしゃ', 'てんち', 'てあし', 'てんらんかい', 'てんごく', 'てんきん', 'てほん',
  'ところで', 'とても', 'となり', 'ともだち', 'とうきょう', 'とくに', 'とおい', 'とき', 'ところ', 'とまる',

  // な行
  'なにか', 'なるほど', 'なかなか', 'なぜなら', 'なんでも', 'なるべく', 'なかま', 'ながい', 'なつかしい', 'なんとか',
  'にほん', 'にんげん', 'にちようび', 'にぎやか', 'にあう', 'にがて', 'にゅうす', 'にもつ', 'にわ', 'にっき',
  'ぬれる', 'ぬぐ', 'ぬかる', 'ぬける', 'ぬりえ', 'ぬいもの', 'ぬるい', 'ぬらす', 'ぬけだす', 'ぬきうち',
  'ねる', 'ねんまつ', 'ねだん', 'ねっしん', 'ねこ', 'ねがい', 'ねんれい', 'ねんど', 'ねむる', 'ねつい',
  'のんびり', 'のぼる', 'のこる', 'のみもの', 'のうりょく', 'のがす', 'のろい', 'のうか', 'のむら', 'のあい',

  // は行
  'はじめて', 'はっきり', 'はやい', 'はなし', 'はいる', 'はたらく', 'はしる', 'はんたい', 'はこぶ', 'はずかしい',
  'ひとり', 'ひつよう', 'ひくい', 'ひろい', 'ひさしぶり', 'ひみつ', 'ひかり', 'ひやけ', 'ひだり', 'ひがし',
  'ふつう', 'ふしぎ', 'ふたり', 'ふるい', 'ふゆ', 'ふね', 'ふくざつ', 'ふりかえる', 'ふくろう', 'ふかい',
  'へや', 'へいわ', 'へん', 'へた', 'へんじ', 'へいきん', 'へんか', 'へこむ', 'へらす', 'へいめん',
  'ほんとう', 'ほしい', 'ほかの', 'ほとんど', 'ほうほう', 'ほけん', 'ほうもん', 'ほめる', 'ほうそう', 'ほんき',

  // ま行
  'まいにち', 'まえ', 'まわり', 'まちがい', 'まだまだ', 'まるで', 'まにあう', 'まかせる', 'まさか', 'まめ',
  'みんな', 'みせ', 'みつかる', 'みち', 'みどり', 'みらい', 'みがく', 'みえる', 'みなみ', 'みじかい',
  'むずかしい', 'むりに', 'むこう', 'むかし', 'むすこ', 'むすめ', 'むらさき', 'むしあつい', 'むざい', 'むりょう',
  'めずらしい', 'めんどう', 'めがね', 'めいじ', 'めいわく', 'めでたい', 'めった', 'めんせつ', 'めんきょ', 'めし',
  'もちろん', 'もしかすると', 'もっと', 'もんだい', 'もどる', 'もくてき', 'もらう', 'もつ', 'もうすぐ', 'もしも',

  // や行
  'やっぱり', 'やすい', 'やめる', 'やくそく', 'やちん', 'やっと', 'やわらかい', 'やきゅう', 'やぶる', 'やくだつ',
  'ゆっくり', 'ゆめ', 'ゆうべ', 'ゆうえんち', 'ゆうこう', 'ゆうはん', 'ゆきがた', 'ゆりかご', 'ゆでる', 'ゆめみる',
  'よく', 'よろしい', 'よかった', 'よほど', 'よぶ', 'よい', 'よそ', 'よてい', 'よこ', 'よる',

  // ら行
  'らいねん', 'らくに', 'らいしゅう', 'らんち', 'らいげつ', 'らくだい', 'らんぼう', 'らっしゃる', 'らんたーん', 'らくごう',
  'りょこう', 'りょうり', 'りかい', 'りそう', 'りゆう', 'りっぱ', 'りえき', 'りようする', 'りーだー', 'りくつ',
  'るすばん', 'るーる', 'るーぷ', 'るしの', 'るすい', 'るり', 'るんるん', 'るぽ', 'るいご', 'るいせき',
  'れきし', 'れんしゅう', 'れいぎ', 'れんらく', 'れっしゃ', 'れすとらん', 'れんあい', 'れきだい', 'れんぞく', 'れっとう',
  'ろんぶん', 'ろうじん', 'ろくが', 'ろく', 'ろばた', 'ろっかく', 'ろんり', 'ろまん', 'ろっく', 'ろごまーく',

  // わ行
  'わかる', 'わすれる', 'わるい', 'わたし', 'わけ', 'わざわざ', 'わらう', 'わきあいあい', 'わがまま', 'わかれる'
];

/**
 * 位置別文字インデックス生成（英語用）
 * 各文字と位置の組み合わせに対して適切な単語を事前計算
 */
const positionIndex = {};

// インデックス構築
for (let pos = 1; pos <= 10; pos++) {
  positionIndex[pos] = {};
  for (let charCode = 97; charCode <= 122; charCode++) {
    const char = String.fromCharCode(charCode);
    positionIndex[pos][char] = allWords.filter(word =>
      word.length >= pos && word[pos - 1].toLowerCase() === char
    );
  }
}

/**
 * 日本語用位置別文字インデックス生成
 * ひらがな文字と位置の組み合わせに対して適切な単語を事前計算
 */
const japanesePositionIndex = {};

// 日本語インデックス構築
for (let pos = 1; pos <= 10; pos++) {
  japanesePositionIndex[pos] = {};

  // ひらがなの範囲でインデックス構築
  for (let charCode = 0x3040; charCode <= 0x309F; charCode++) {
    const char = String.fromCharCode(charCode);
    japanesePositionIndex[pos][char] = japaneseWords.filter(word =>
      word.length >= pos && word[pos - 1] === char
    );
  }
}

/**
 * 文章構成要素（スタイル別）
 *
 * 各文体スタイルに応じた接続語、開始フレーズ、終了フレーズ、形容詞を定義。
 * 生成されるテキストの自然性とスタイルの一貫性を保つために使用。
 */
const textElements = {
  formal: {
    connectors: [
      ', and', ', but', ', therefore', ', furthermore', ', consequently',
      '. Moreover', '. However', '. Nevertheless', '. Subsequently', '. Additionally'
    ],
    starters: [
      'Honoured Sir', 'Distinguished colleague', 'Esteemed friend', 'Dear Sir',
      'Worthy Sir', 'Respected friend', 'My dear Sir', 'Kind Sir'
    ],
    enders: [
      'respectfully yours', 'most faithfully', 'with highest regards',
      'your devoted servant', 'most respectfully', 'with sincere devotion'
    ],
    adjectives: ['worthy', 'esteemed', 'distinguished', 'honourable', 'respected', 'noble']
  },
  casual: {
    connectors: [
      ', and', ', but', ', so', ', plus', ', anyway',
      '. Then', '. Also', '. Well', '. You know', '. Actually'
    ],
    starters: [
      'Hey there', 'Hi friend', 'Hello', 'What\'s up', 'Hi buddy',
      'Hey mate', 'Greetings', 'How are things', 'Hope you\'re well'
    ],
    enders: [
      'cheers', 'take care', 'see you soon', 'best wishes',
      'talk soon', 'catch you later', 'all the best', 'stay cool'
    ],
    adjectives: ['great', 'nice', 'cool', 'awesome', 'good', 'fine', 'okay']
  },
  japanese: {
    connectors: [
      '、そして', '、また', '、しかし', '、それで', '、さらに',
      '。それから', '。しかしながら', '。ところが', '。なお', '。そのため'
    ],
    starters: [
      'こんにちは', 'いつもお世話になっております', 'お疲れさまです', 'おはようございます',
      'お忙しい中', 'いつもありがとうございます', 'ご連絡いたします', 'お元気ですか'
    ],
    enders: [
      'よろしくお願いします', 'ありがとうございます', 'お疲れさまでした',
      'どうぞよろしく', 'お体に気をつけて', 'またお会いしましょう', 'では失礼します'
    ],
    adjectives: ['すてきな', 'すばらしい', 'たいせつな', 'おもしろい', 'うつくしい', 'あたらしい', 'たのしい']
  },
  literary: {
    connectors: [
      ', whereupon', ', whilst', ', thus', ', hence', ', perchance',
      '. Verily', '. Forsooth', '. Indeed', '. Behold', '. Mayhap'
    ],
    starters: [
      'Dearest companion', 'Noble friend', 'Gentle reader', 'Kind soul',
      'Beloved friend', 'Fair friend', 'Good sir', 'Gracious friend'
    ],
    enders: [
      'ever faithfully', 'with deepest affection', 'in eternal friendship',
      'with fondest regards', 'most devotedly', 'with heartfelt sincerity'
    ],
    adjectives: ['fair', 'gentle', 'noble', 'gracious', 'blessed', 'divine', 'wondrous']
  }
};

/**
 * 指定位置に特定文字を含む単語を検索
 * @param {string} char - 目標文字
 * @param {number} offset - 文字位置（1ベース）
 * @param {string[]} excludeUsed - 使用済み単語リスト
 * @returns {string[]} 条件に合う単語の配列
 */
function findWordsForChar(char, offset, excludeUsed = [], posIndex = positionIndex) {
  const targetChar = char.toLowerCase ? char.toLowerCase() : char;

  // 位置別インデックスから候補を取得
  const candidates = posIndex[offset]?.[targetChar] || [];

  // 使用済み単語を除外
  return candidates.filter(word => !excludeUsed.includes(word));
}

/**
 * 複数の戦略で単語を検索（フォールバック機能付き）
 */
function findWordsWithFallback(char, offset, excludeUsed = []) {
  let words = findWordsForChar(char, offset, excludeUsed);

  // 戦略1: 完全一致が見つからない場合、近い位置を探す
  if (words.length === 0) {
    for (let deltaPos of [1, -1, 2, -2]) {
      const newOffset = offset + deltaPos;
      if (newOffset >= 1 && newOffset <= 10) {
        words = findWordsForChar(char, newOffset, excludeUsed);
        if (words.length > 0) break;
      }
    }
  }

  // 戦略2: それでも見つからない場合、文字を含む任意の単語を探す
  if (words.length === 0) {
    words = allWords.filter(word =>
      word.toLowerCase().includes(char.toLowerCase()) &&
      !excludeUsed.includes(word)
    );
  }

  return words;
}

/**
 * 改良されたトレヴァニオン暗号文生成
 */
function generateTrevanionText(plaintext, offset = 3, style = 'formal') {
  // 日本語が含まれているかチェック
  const isJapanese = containsJapanese(plaintext);

  let chars, elements, wordDatabase, posIndex;

  if (isJapanese) {
    // 日本語の場合
    chars = Array.from(extractJapaneseText(plaintext));
    elements = textElements.japanese;
    wordDatabase = japaneseWords;
    posIndex = japanesePositionIndex;
  } else {
    // 英語の場合
    chars = Array.from(plaintext.toLowerCase().replace(/\s+/g, ''));
    elements = textElements[style] || textElements.formal;
    wordDatabase = allWords;
    posIndex = positionIndex;
  }

  if (chars.length === 0) return '';

  let result = '';
  let usedWords = [];

  // 開始フレーズ
  result += elements.starters[Math.floor(Math.random() * elements.starters.length)];

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    // 改良された単語検索（フォールバック付き）
    let words = findWordsWithFallback(char, offset, usedWords, isJapanese ? japaneseWords : allWords, isJapanese ? japanesePositionIndex : positionIndex);

    if (words.length === 0) {
      // 最終フォールバック: 制御された文字挿入
      const padding = generatePadding(offset - 1);
      result += `、${padding}${char}`;
    } else {
      // 最適な単語を選択
      const selectedWord = selectBestWord(words, char, offset);
      usedWords.push(selectedWord);

      // 文脈に応じた接続詞選択
      const connector = selectConnector(i, chars.length, elements);

      // 自然性向上のための調整
      const enhancement = addTextEnhancement(elements, Math.random() < 0.25);

      result += connector + enhancement + selectedWord;
    }
  }

  // 終了フレーズ
  const ending = elements.enders[Math.floor(Math.random() * elements.enders.length)];
  result += `. Yours ${ending}.`;

  return result;
}

/**
 * パディング文字列生成
 */
function generatePadding(length) {
  const fillers = ['my', 'oh', 'ah', 'or', 'so', 'to', 'by', 'in', 'of', 'at'];
  let padding = '';

  while (padding.length < length) {
    const filler = fillers[Math.floor(Math.random() * fillers.length)];
    if (padding.length + filler.length <= length) {
      padding += filler;
    } else {
      padding += 'a'.repeat(length - padding.length);
    }
  }

  return padding + ' ';
}

/**
 * 最適単語選択
 */
function selectBestWord(words, targetChar, offset) {
  // 目標文字が正確な位置にある単語を優先
  const exactMatches = words.filter(word =>
    word.length >= offset && word[offset - 1].toLowerCase() === targetChar.toLowerCase()
  );

  const candidates = exactMatches.length > 0 ? exactMatches : words;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * 接続詞選択
 */
function selectConnector(index, totalLength, elements) {
  if (index === 0) return ', ';
  if (index === totalLength - 1) return '. ';

  // 位置に応じた接続詞の重み付け選択
  const connectors = elements.connectors;
  const weights = connectors.map((_, i) =>
    i < connectors.length / 2 ? 1.5 : 1.0 // 前半の接続詞を優先
  );

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return connectors[i] + ' ';
    }
  }

  return connectors[0] + ' ';
}

/**
 * テキスト強化要素追加
 */
function addTextEnhancement(elements, shouldAdd) {
  if (!shouldAdd) return '';

  const enhancements = [
    ...elements.adjectives.map(adj => adj + ' '),
    'most ', 'very ', 'quite ', 'rather ', 'truly '
  ];

  return enhancements[Math.floor(Math.random() * enhancements.length)];
}

/**
 * 品質評価付き候補生成
 */
function generateQualityCandidates(plaintext, puncts, offset, countSpaces, targetCount = 7) {
  const candidates = [];
  const maxAttempts = targetCount * 3; // 品質フィルタリングのため多めに生成

  for (let i = 0; i < maxAttempts && candidates.length < targetCount; i++) {
    const candidate = generateTrevanionText(plaintext, offset);

    // 品質チェック
    const quality = evaluateTextQuality(candidate, plaintext, puncts, offset, countSpaces);

    if (quality.score >= 0.7) { // 70%以上の一致率
      candidates.push({ text: candidate, quality });
    }
  }

  // 品質順でソート
  return candidates
    .sort((a, b) => b.quality.score - a.quality.score)
    .slice(0, targetCount)
    .map(c => c.text);
}

/**
 * テキスト品質評価
 */
function evaluateTextQuality(text, plaintext, puncts, offset, countSpaces) {
  const result = checkConstraints(plaintext, text, puncts, offset, countSpaces);

  return {
    score: result.expectedLength > 0 ? result.matches / result.expectedLength : 0,
    matches: result.matches,
    total: result.expectedLength,
    isValid: result.isValid
  };
}

/**
 * 候補をHTML形式で表示（全文字一致を特別に強調）
 */
function renderCandidates(candidates, plaintext, puncts, offset, countSpaces) {
  if (!candidates || candidates.length === 0) {
    return '<p class="error">候補を生成できませんでした。</p>';
  }

  let html = '';
  let perfectMatchCount = 0;

  candidates.forEach((candidate, index) => {
    // 各候補の制約チェック
    const result = checkConstraints(plaintext, candidate, puncts, offset, countSpaces);
    const isPerfectMatch = result.isValid;

    if (isPerfectMatch) {
      perfectMatchCount++;
    }

    // 完全一致の場合の特別なスタイリング
    const itemClass = isPerfectMatch ? 'candidate-item perfect-match' : 'candidate-item';
    const headerClass = isPerfectMatch ? 'candidate-header perfect-header' : 'candidate-header';

    // アイコンとテキストの改良
    let validityIcon, validityText, qualityBadge = '';

    if (isPerfectMatch) {
      validityIcon = '🎯';
      validityText = '完全一致';
      qualityBadge = '<span class="perfect-badge">PERFECT</span>';
    } else {
      const matchRate = result.expectedLength > 0 ? (result.matches / result.expectedLength) : 0;
      if (matchRate >= 0.8) {
        validityIcon = '✅';
        validityText = `優秀: ${result.matches}/${result.expectedLength}`;
      } else if (matchRate >= 0.6) {
        validityIcon = '⚡';
        validityText = `良好: ${result.matches}/${result.expectedLength}`;
      } else if (matchRate >= 0.4) {
        validityIcon = '⚠️';
        validityText = `普通: ${result.matches}/${result.expectedLength}`;
      } else {
        validityIcon = '❌';
        validityText = `要調整: ${result.matches}/${result.expectedLength}`;
      }
    }

    html += `
      <div class="${itemClass}" data-index="${index}">
        <div class="${headerClass}">
          <h5>
            候補 ${index + 1} ${validityIcon} ${validityText}
            ${qualityBadge}
          </h5>
          <button class="copy-candidate" data-candidate="${index}">📋 コピー</button>
        </div>
        <div class="candidate-text">${escapeHtml(candidate)}</div>
        <div class="candidate-preview">${renderHighlight(candidate, trevanionExtract(candidate, puncts, offset, false).indices, puncts)}</div>
      </div>
    `;
  });

  // 完全一致がある場合のサマリーメッセージを先頭に追加
  if (perfectMatchCount > 0) {
    const summaryMessage = `
      <div class="perfect-summary">
        🎉 <strong>${perfectMatchCount}個の完全一致候補</strong>が見つかりました！完全一致候補は金色の枠で表示されています。
      </div>
    `;
    html = summaryMessage + html;
  }

  return html;
}

// Auto-generation event handlers
const autoGenerateBtn = document.getElementById('auto-generate-btn');
const autoPuncts = document.getElementById('auto-puncts');
const autoCountSpaces = document.getElementById('auto-count-spaces');
const autoResults = document.getElementById('auto-results');
const autoCandidates = document.getElementById('auto-candidates');
const autoInfo = document.getElementById('auto-info');
const autoRegenerateBtn = document.getElementById('auto-regenerate');

let currentCandidates = [];

autoGenerateBtn?.addEventListener('click', () => {
  const plaintext = (autoPlain.value || '').trim();
  const puncts = normalizePuncts(autoPuncts.value || '、。,.!?;:\'');
  const offset = Math.max(1, parseInt(autoOffset.value || '3', 10));
  const countSpaces = autoCountSpaces?.checked || false;
  const style = document.getElementById('auto-style')?.value || 'formal';

  if (!plaintext) {
    autoResults.style.display = 'none';
    showToast('平文を入力してください');
    return;
  }

  // 生成実行
  generateAndDisplayCandidates(plaintext, puncts, offset, countSpaces, style);
});

autoRegenerateBtn?.addEventListener('click', () => {
  // 進行中の完全一致探索を停止してリセット
  if (searchState.isRunning) {
    stopSearch();
    resetSearchUI();
  }

  const plaintext = (autoPlain.value || '').trim();
  const puncts = normalizePuncts(autoPuncts.value || '、。,.!?;:\'');
  const offset = Math.max(1, parseInt(autoOffset.value || '3', 10));
  const countSpaces = autoCountSpaces?.checked || false;
  const style = document.getElementById('auto-style')?.value || 'formal';

  if (plaintext) {
    generateAndDisplayCandidates(plaintext, puncts, offset, countSpaces, style);
  }
});

function generateAndDisplayCandidates(plaintext, puncts, offset, countSpaces, style) {
  try {
    // 品質重視の候補生成
    currentCandidates = generateQualityCandidates(plaintext, puncts, offset, countSpaces, 7);

    if (currentCandidates.length === 0) {
      // フォールバック: 基本生成を試行
      currentCandidates = [];
      for (let i = 0; i < 5; i++) {
        currentCandidates.push(generateTrevanionText(plaintext, offset, style));
      }
      showToast('⚠️ 高品質な候補が生成できませんでした。基本生成を使用します。');
    }

    // UI更新
    const avgQuality = currentCandidates.length > 0 ?
      currentCandidates.reduce((sum, candidate) => {
        const quality = evaluateTextQuality(candidate, plaintext, puncts, offset);
        return sum + quality.score;
      }, 0) / currentCandidates.length : 0;

    autoInfo.innerHTML = `
      ${currentCandidates.length}個の候補を生成<br>
      <small>平文: "${plaintext}" | オフセット: ${offset} | 平均品質: ${(avgQuality * 100).toFixed(1)}%</small>
    `;

    autoCandidates.innerHTML = renderCandidates(currentCandidates, plaintext, puncts, offset, countSpaces);
    autoResults.style.display = 'block';

    // 候補のコピーボタンイベント
    document.querySelectorAll('.copy-candidate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const candidateIndex = parseInt(e.target.dataset.candidate);
        const candidateText = currentCandidates[candidateIndex];

        if (candidateText) {
          copyToClipboard(candidateText, `候補 ${candidateIndex + 1} をコピーしました！`);
        }
      });
    });

    // 完全一致候補の数をカウント
    const perfectMatches = currentCandidates.filter(candidate => {
      const quality = evaluateTextQuality(candidate, plaintext, puncts, offset);
      return quality.isValid;
    }).length;

    let qualityMessage;
    if (perfectMatches > 0) {
      qualityMessage = `🎉 完全一致 ${perfectMatches}個含む`;
    } else if (avgQuality >= 0.8) {
      qualityMessage = '🎯 高品質';
    } else if (avgQuality >= 0.6) {
      qualityMessage = '✨ 良品質';
    } else if (avgQuality >= 0.4) {
      qualityMessage = '⚡ 標準品質';
    } else {
      qualityMessage = '🔧 要調整';
    }

    showToast(`${qualityMessage} ${currentCandidates.length}個の候補を生成しました`);

  } catch (error) {
    console.error('Generation error:', error);
    autoInfo.textContent = 'エラーが発生しました';
    autoCandidates.innerHTML = '<p class="error">生成中にエラーが発生しました。</p>';
    autoResults.style.display = 'block';
    showToast('❌ 生成に失敗しました');
  }
}

async function copyToClipboard(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch (err) {
    // Fallback
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast(successMessage);
    } catch (fallbackErr) {
      console.error('Copy failed:', fallbackErr);
      showToast('❌ コピーに失敗しました');
    }
  }
}

/* ==========================================================================
   Perfect Match Search - 完全一致探索機能
   ========================================================================== */

let searchState = {
  isRunning: false,
  shouldStop: false,
  startTime: null,
  attempts: 0,
  perfectMatches: [],
  timeInterval: null
};

// DOM要素の取得
const startSearchBtn = document.getElementById('start-perfect-search');
const pauseSearchBtn = document.getElementById('pause-perfect-search');
const stopSearchBtn = document.getElementById('stop-perfect-search');
const targetCountInput = document.getElementById('target-perfect-count');
const maxAttemptsInput = document.getElementById('max-attempts');
const searchProgress = document.getElementById('search-progress');
const attemptsCount = document.getElementById('attempts-count');
const perfectFound = document.getElementById('perfect-found');
const searchTime = document.getElementById('search-time');
const progressBar = document.getElementById('progress-bar');

/**
 * 完全一致探索の開始
 */
startSearchBtn?.addEventListener('click', async () => {
  const plaintext = (autoPlain.value || '').trim();
  const puncts = normalizePuncts(autoPuncts.value || '、。,.!?;:\'');
  const offset = Math.max(1, parseInt(autoOffset.value || '3', 10));
  const countSpaces = autoCountSpaces?.checked || false;
  const style = document.getElementById('auto-style')?.value || 'formal';
  const targetCount = Math.max(1, parseInt(targetCountInput.value || '2', 10));
  const maxAttempts = Math.max(100, parseInt(maxAttemptsInput.value || '1000', 10));

  if (!plaintext) {
    showToast('平文を入力してください');
    return;
  }

  // 検索状態の初期化
  searchState = {
    isRunning: true,
    shouldStop: false,
    startTime: Date.now(),
    attempts: 0,
    perfectMatches: [],
    timeInterval: null,
    targetCount: targetCount,
    maxAttempts: maxAttempts
  };

  // UI状態の更新
  startSearchBtn.style.display = 'none';
  pauseSearchBtn.style.display = 'inline-block';
  stopSearchBtn.style.display = 'inline-block';
  searchProgress.style.display = 'block';

  // 進捗バーの初期化
  progressBar.style.width = '0%';
  const progressPercentage = document.getElementById('progress-percentage');
  if (progressPercentage) {
    progressPercentage.textContent = '0%';
  }
  updateSearchProgress(targetCount, maxAttempts);

  // 時間表示の更新開始
  searchState.timeInterval = setInterval(updateSearchTime, 1000);

  showToast(`🎯 完全一致探索を開始しました (目標: ${targetCount}個)`);

  try {
    await performPerfectSearch(plaintext, puncts, offset, countSpaces, style, targetCount, maxAttempts);
  } catch (error) {
    console.error('Search error:', error);
    showToast('❌ 探索中にエラーが発生しました');
  } finally {
    stopSearch();
  }
});

/**
 * 完全一致探索の一時停止
 */
pauseSearchBtn?.addEventListener('click', () => {
  searchState.shouldStop = true;
  showToast('⏸️ 探索を一時停止しています...');
});

/**
 * 完全一致探索の完全停止
 */
stopSearchBtn?.addEventListener('click', () => {
  searchState.shouldStop = true;
  resetSearchUI();
  showToast('⏹️ 探索を完全停止しました');
});

/**
 * 非同期完全一致探索の実行
 */
async function performPerfectSearch(plaintext, puncts, offset, countSpaces, style, targetCount, maxAttempts) {
  while (searchState.isRunning && !searchState.shouldStop &&
         searchState.perfectMatches.length < targetCount &&
         searchState.attempts < maxAttempts) {

    // UIをブロックしないように定期的に待機
    if (searchState.attempts % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    searchState.attempts++;

    // 候補生成
    const candidate = generateTrevanionText(plaintext, offset, style);
    const quality = evaluateTextQuality(candidate, plaintext, puncts, offset, countSpaces);

    // 完全一致をチェック
    if (quality.isValid) {
      searchState.perfectMatches.push(candidate);
      showToast(`🎉 完全一致発見！ (${searchState.perfectMatches.length}/${targetCount})`);
      // 完全一致発見時は即座に進捗更新
      updateSearchProgress(targetCount, maxAttempts);
    }

    // 定期的な進捗更新（毎回）
    updateSearchProgress(targetCount, maxAttempts);

    // メモリ管理: 大量の候補蓄積を防ぐ
    if (searchState.attempts % 100 === 0) {
      // ガベージコレクションを促進
      if (window.gc) window.gc();
    }
  }

  // 探索完了処理と最終進捗更新
  updateSearchProgress(targetCount, maxAttempts);

  if (searchState.perfectMatches.length >= targetCount) {
    showToast(`🎊 目標達成！ ${searchState.perfectMatches.length}個の完全一致候補を発見`);
    displayPerfectSearchResults(searchState.perfectMatches, plaintext, puncts, offset, countSpaces);
  } else if (searchState.attempts >= maxAttempts) {
    showToast(`⏰ 最大試行回数に到達しました (${searchState.perfectMatches.length}個発見)`);
    if (searchState.perfectMatches.length > 0) {
      displayPerfectSearchResults(searchState.perfectMatches, plaintext, puncts, offset, countSpaces);
    }
  } else if (searchState.shouldStop) {
    showToast(`🛑 探索を停止しました (${searchState.perfectMatches.length}個発見)`);
    if (searchState.perfectMatches.length > 0) {
      displayPerfectSearchResults(searchState.perfectMatches, plaintext, puncts, offset, countSpaces);
    }
  }
}

/**
 * 探索進捗の更新
 */
function updateSearchProgress(targetCount, maxAttempts) {
  attemptsCount.textContent = `試行回数: ${searchState.attempts.toLocaleString()}`;
  perfectFound.textContent = `完全一致: ${searchState.perfectMatches.length}`;

  // プログレスバーの更新
  let progress = 0;

  if (searchState.perfectMatches.length >= targetCount) {
    // 目標達成時は100%
    progress = 100;
  } else {
    // 試行回数による進捗（0-90%）+ 完全一致による進捗（0-10%）
    const attemptProgress = Math.min(90, (searchState.attempts / maxAttempts) * 90);
    const matchBonus = (searchState.perfectMatches.length / targetCount) * 10;
    progress = attemptProgress + matchBonus;
  }

  const finalProgress = Math.min(100, progress);
  progressBar.style.width = `${finalProgress}%`;

  // パーセンテージ表示も更新
  const progressPercentage = document.getElementById('progress-percentage');
  if (progressPercentage) {
    progressPercentage.textContent = `${Math.round(finalProgress)}%`;
  }
}

/**
 * 経過時間の更新
 */
function updateSearchTime() {
  if (!searchState.startTime) return;

  const elapsed = Date.now() - searchState.startTime;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  searchTime.textContent = `経過時間: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 探索の停止処理
 */
function stopSearch() {
  searchState.isRunning = false;

  // 最終進捗更新
  if (searchState.targetCount && searchState.maxAttempts) {
    updateSearchProgress(searchState.targetCount, searchState.maxAttempts);
  }

  // UI状態のリセット
  startSearchBtn.style.display = 'inline-block';
  pauseSearchBtn.style.display = 'none';
  stopSearchBtn.style.display = 'none';

  // タイマーのクリア
  if (searchState.timeInterval) {
    clearInterval(searchState.timeInterval);
    searchState.timeInterval = null;
  }
}

/**
 * 探索UIを完全にリセット
 */
function resetSearchUI() {
  // 進捗表示エリアを非表示
  const searchProgress = document.getElementById('search-progress');
  if (searchProgress) {
    searchProgress.style.display = 'none';
  }

  // ボタン状態をリセット
  if (startSearchBtn) startSearchBtn.style.display = 'inline-block';
  if (pauseSearchBtn) pauseSearchBtn.style.display = 'none';
  if (stopSearchBtn) stopSearchBtn.style.display = 'none';

  // 進捗バーをリセット
  if (progressBar) {
    progressBar.style.width = '0%';
  }
  const progressPercentage = document.getElementById('progress-percentage');
  if (progressPercentage) {
    progressPercentage.textContent = '0%';
  }

  // 探索状態をリセット
  searchState = {
    isRunning: false,
    shouldStop: false,
    attempts: 0,
    startTime: null,
    perfectMatches: [],
    timeInterval: null,
    targetCount: null,
    maxAttempts: null
  };
}

/**
 * 完全一致探索結果の表示
 */
function displayPerfectSearchResults(perfectMatches, plaintext, puncts, offset, countSpaces) {
  // 既存の結果をクリア
  currentCandidates = perfectMatches;

  // UI更新
  autoInfo.innerHTML = `
    🎯 完全一致探索結果: ${perfectMatches.length}個の完全一致候補<br>
    <small>試行回数: ${searchState.attempts.toLocaleString()} | 平文: "${plaintext}" | 句読点: "${puncts}" | オフセット: ${offset}</small>
  `;

  autoCandidates.innerHTML = renderCandidates(perfectMatches, plaintext, puncts, offset, countSpaces);
  autoResults.style.display = 'block';

  // コピーボタンイベントの設定
  document.querySelectorAll('.copy-candidate').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const candidateIndex = parseInt(e.target.dataset.candidate);
      const candidateText = perfectMatches[candidateIndex];

      if (candidateText) {
        copyToClipboard(candidateText, `完全一致候補 ${candidateIndex + 1} をコピーしました！`);
      }
    });
  });
}

/* ==========================================================================
   Processing Text Display - 処理対象文字列表示機能
   ========================================================================== */

/**
 * 暗号化タブの平文入力欄に処理対象文字列表示機能を追加
 */
document.addEventListener('DOMContentLoaded', () => {
  // 生成支援サブタブの平文入力欄
  const encPlainInput = document.getElementById('enc-plain');
  if (encPlainInput) {
    // 初期表示
    updateProcessingText('enc-processing-text', encPlainInput.value);

    // リアルタイム更新
    encPlainInput.addEventListener('input', (e) => {
      updateProcessingText('enc-processing-text', e.target.value);
    });
  }

  // 自動生成サブタブの平文入力欄
  const autoPlainInput = document.getElementById('auto-plain');
  if (autoPlainInput) {
    // 初期表示
    updateProcessingText('auto-processing-text', autoPlainInput.value);

    // リアルタイム更新
    autoPlainInput.addEventListener('input', (e) => {
      updateProcessingText('auto-processing-text', e.target.value);
    });
  }
});
