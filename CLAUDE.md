# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trevanion CipherLab is a web-based educational tool for visualizing and learning about the Trevanion Cipher (a type of Null cipher). The application is built as a static HTML/CSS/JavaScript site deployed via GitHub Pages.

## Architecture

### File Structure

- **index.html**: Main application with 4 tabs (基本/暗号化/復号/座学) and nested sub-tabs
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
- `tcl_countspaces`: Space counting preference (1/0)

## Algorithm Details

The Trevanion cipher extracts the nth character after each punctuation mark:
- Default punctuation: `、。,.!?;:'`
- Default offset: 3
- Skips to next punctuation if fewer than n characters exist before it
- Optional space counting toggle