# Post Formatter

A lightweight social media post formatter for turning rough drafts into platform-ready content.

## What it does

- Apply Unicode text styles such as bold, italic, script, fraktur, circular, and square.
- Remove formatting from a selection or the full draft with a single click.
- Auto-append relevant emojis to important keywords.
- Convert emoji shortcodes like `:rocket:` and `:fire:`.
- Suggest context-aware emojis and popular emoji chips.
- Generate keyword-based hashtag suggestions.
- Reshape a draft for **LinkedIn**, **X / Twitter**, **Instagram**, or **Facebook**.

## Product improvements included

### Audience-aware post shaping
Choose a target audience and click **Apply audience style**.

- **LinkedIn**: professional opener, insight bullets, CTA, concise hashtags
- **X / Twitter**: shorter structure with the 280-character limit in mind
- **Instagram**: warmer caption structure with emoji-led bullets and more hashtags
- **Facebook**: conversational structure with a community-focused CTA

### Better emoji workflow
- **Auto emoji** adds emojis to the first strong keyword matches in the post.
- **Suggested emojis** react to the current draft and selected audience.
- **Most used emojis** provide quick insert chips tuned to each platform.

### Format / unformat flow
- Unicode formatting remains selection-based for precise emphasis.
- **Unformat** clears Unicode styling and combining underline marks from a selection or the full draft.

## Project structure

- `/html/index.html` – main browser UI
- `/js/formatter.js` – shared pure formatter logic and social post helpers
- `/js/app.js` – browser event handling and UI wiring
- `/tests/formatter.test.js` – Jest regression and feature tests
- `/.github/workflows/ci.yml` – GitHub Actions CI

## Run locally

### Requirements
- Node.js 20+
- npm

### Install

```bash
npm install
```

### Run tests

```bash
npm test
```

### Open the app
Open `html/index.html` in a browser from the project root.

## Python entrypoint
The repository still includes `main.py` for environments that expect a Python entrypoint. CI validates that the file compiles successfully.

## CI workflow
The GitHub Actions workflow now:

1. installs Node dependencies with `npm ci`
2. runs the Jest suite
3. installs Python dependencies from `requirements.txt`
4. validates `main.py` with `python -m py_compile`

## Testing coverage highlights
The automated suite covers:

- Unicode map completeness and collision checks
- format detection and round-trip plain text conversion
- toggle and clear-format behavior
- emoji shortcode conversion and auto emoji logic
- social audience helpers such as emoji suggestions, hashtags, and platform output formatting

## Suggested usage flow

1. Draft the post in plain text.
2. Highlight key words or phrases and apply Unicode emphasis.
3. Convert shortcodes or auto-add emojis.
4. Select the target audience.
5. Apply audience style.
6. Review hashtags and copy the final post.

## Future ideas

- Character counter warnings for each social platform before optimization
- Saved tone presets for founders, recruiters, and creators
- Export templates for carousel captions and launch announcements
- Clipboard presets that include platform-specific hashtags only when needed
