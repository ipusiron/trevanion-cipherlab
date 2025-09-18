# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trevanion CipherLab is a web-based educational tool for visualizing and learning about the Trevanion Cipher (a type of Null cipher). The application is built as a static HTML/CSS/JavaScript site deployed via GitHub Pages.

## Architecture

### Core Components

- **index.html**: Main application interface with 4 tabs (基本/暗号化/復号/座学)
- **script.js**: Core cipher logic and UI interactions
  - `trevanionExtract()`: Main decryption function that extracts hidden messages
  - `checkConstraints()`: Validates cover text against plaintext requirements
  - Tab switching and DOM manipulation
- **style.css**: Responsive styling and visual feedback elements

### Key Algorithm

The Trevanion cipher works by extracting the 3rd character after each punctuation mark. The core implementation:
- Default punctuation set: `、。,.!?;:`
- Configurable offset (default: 3)
- Option to include/exclude spaces in character counting

## Development Commands

Since this is a static site with no build process:

```bash
# Serve locally for development
python -m http.server 8000
# Or
npx http-server

# Deploy to GitHub Pages is automatic from main branch
```

## Testing Approach

Manual testing via the web interface. Key test scenarios:
- Encryption constraint checking with various punctuation patterns
- Decryption with different offset values
- Space counting toggle behavior
- Tab switching and UI state persistence

## Localization

The application is bilingual (Japanese/English) with:
- Japanese UI labels and documentation
- Support for both Japanese (、。) and English (,.!?;:) punctuation
- Examples work with both character sets

## Local Storage

Settings are persisted:
- `tcl_puncts`: Punctuation character set
- `tcl_offset`: Character offset value
- `tcl_countspaces`: Space counting preference