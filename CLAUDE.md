# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trevanion CipherLab is a web-based educational tool for visualizing and learning about the Trevanion Cipher (a type of Null cipher). The application is built as a static HTML/CSS/JavaScript site deployed via GitHub Pages.

## Architecture

### File Structure

- **index.html**: Main application with 4 tabs (基本/暗号化/復号/座学) and nested sub-tabs
- **js/messages.js**, **js/i18n.js**: the wording on screen, and the language switch
- **script.js** (~1500 lines): Core cipher logic, UI interactions, auto-generation algorithms
- **style.css** (~900 lines): CSS custom properties, responsive styling with mobile support

### Tab Architecture

```
基本 (Basic)          - Educational content in accordions
暗号化 (Encrypt)      - Contains sub-tabs:
  ├─ 生成支援         - Manual constraint checking
  └─ 自動生成         - Auto-generation with perfect match search
復号 (Decrypt)        - Extract hidden message with highlighting
座学 (Study)          - Null cipher theory in accordions
```

### Key Functions (script.js)

| Function | Purpose |
|----------|---------|
| `trevanionExtract()` | Core decryption: extracts characters at offset positions after punctuation |
| `checkConstraints()` | Validates cover text against plaintext requirements |
| `renderHighlight()` | Generates HTML with highlighted punctuation (blue) and extracted chars (yellow) |
| `generateTrevanionText()` | Auto-generates cover text from plaintext using word databases |
| `performPerfectSearch()` | Async search loop to find 100% constraint-satisfying texts |
| `findWordsWithFallback()` | Multi-strategy word lookup with position index fallback |

### Word Databases

- `allWords[]`: English words indexed by character position (1-10)
- `japaneseWords[]`: Japanese words (hiragana) with position index
- `textElements{}`: Style-specific connectors, starters, enders by tone (formal/casual/literary/japanese)

### CSS Organization

Uses CSS custom properties (`:root`) for theming:
- Color palette: `--bg`, `--panel`, `--ink`, `--accent`, etc.
- Shadow effects: `--shadow`, `--shadow-lg`

## Development Commands

Static site with no build process:

```bash
# Serve locally
python -m http.server 8000
# Or
npx http-server
```

Deploy to GitHub Pages is automatic from main branch.

## Local Storage Keys

- `tcl_puncts`: Punctuation character set
- `tcl_offset`: Character offset value
- `tcl_countmode`: What counts as one character (nonSpace/all/alnum)
- `tcl_mode`: What to do when another mark turns up while counting (stop/skip/count)
- `tcl_lang`: Chosen language (ja/en)

## Algorithm Details

The Trevanion cipher extracts the nth character after each punctuation mark:
- Default punctuation: `、。,.!?;:'`
- Default offset: 3
- Skips to next punctuation if fewer than n characters exist before it
- Optional space counting toggle

## Calculation layer (js/trevanion-core.js)

Published as `globalThis.TrevanionCore`; it never touches the DOM, and the tests call it directly.

- `extract(text, {puncts, offset, countSpaces, mode})` returns the characters, their positions, and the punctuation marks it could not read from. `mode` is the one real design decision here:
  - `stop` (default): stop counting when another punctuation mark appears before the offset is reached
  - `skip`: ignore punctuation and keep counting (this is what dCode does)
  - `count`: count punctuation as a character
- `checkConstraints(plaintext, covertext, options)` compares the two character by character
- `sweep(text, options)` runs every combination of offset, space handling and mode

**The two versions of the letter behave differently.** With the apostrophe version, only `stop` plus `'` in the punctuation set yields the hidden sentence; with the uppercase version without apostrophes, every mode works. Neither version works when spaces are counted. `test/core.test.js` pins all of this down.

## Wording and languages (js/messages.js, js/i18n.js)

`TrevanionMessages.DICT` holds one dictionary per language with **the same keys**; `TrevanionI18n` picks the language (`?lang=` → stored choice → browser) and swaps anything marked `data-i18n` / `data-i18n-attr`.

- Dictionary values use `**bold**`, `*emphasis*`, `[text](URL)` and newline escapes; `i18n.js` builds them as elements, so a value is never parsed as HTML
- The Japanese wording is written **both** in index.html (for the first paint) and in the dictionary. `test/i18n.test.js` compares them, so a change has to be made in both places
- **Never put a `data-i18n` element inside another one.** The outer one is replaced first and the inner one disappears with it (wrap the text in a `<span>` instead)
- Anything the screen builds goes through `showAgain(key, fn)`, which remembers the arguments so the same result can be rebuilt when the language changes. Generated candidates are rebuilt, not regenerated
- The calculation layer holds no wording at all. The punctuation set and the bigram tables are data, not messages

## Conventions

- No dependencies, no build step, no CDN. Everything must keep working from `file://`
- Write to the DOM with `textContent` or `escapeHtml`, never raw input in `innerHTML`
- Keep the CSP meta as strict as it is. Inline `style` attributes are blocked by it, so toggle visibility with the `hidden` attribute (CSSOM property assignment is fine)
- Colours used as text must stay at 4.5:1 or better; `test/contrast.test.js` enforces this
- The auto-generation feature is **experimental and stays out of the headline feature list**. Its current design puts the connector, not the chosen word, right after the punctuation mark, so hits are accidental. Fixing that means building the sentence so the target letter lands at the offset position
- The Trevanion anecdote has **no primary source**. Keep the hedging in index.html and README.md, and keep the citations (1853 *National Miscellany*, Clarendon, the transmission chain)
- Japanese text: polite form in prose, plain form in bullet lists and tables; long vowel marks (サーバー, ブラウザー); no space between Japanese and Latin characters
- README.en.md mirrors README.md section for section (same count, same order, same level); the English screenshots live in `assets/en/`
