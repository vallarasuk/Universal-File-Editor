# Changelog

All notable changes to the "Universal Spreadsheet & Markdown Editor" extension will be documented in this file.

## [0.0.3] - 2026-05-13

### Added

- New premium extension icon with glassmorphism design.

## [0.0.2] - 2026-05-13

### Fixed

- Excluded `.env` and sensitive files from the production package.
- Improved JSON parsing for single objects and primitive arrays.
- Enhanced Premium Text Viewer with a new glassmorphism design.
- Fixed markdown formatting lints in README.

## [0.0.1] - 2026-05-13

### Initial Release

- **Unified Spreadsheet Engine**: Support for `.xlsx`, `.csv`, `.tsv`, `.json`, `.jsonl`, `.xml`, and `.yaml`.
- **Advanced Markdown Editor**: Integrated `markdown-it` with `KaTex` support and preview-to-source editing.
- **Universal Media Viewer**: High-fidelity previews for `.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp`, and `.ico`.
- **Premium Text Viewer**: A glassmorphism-styled fallback editor for all other file types (`.txt`, `.log`, `.conf`, etc.).
- **Native Experience**:
  - Full **Undo/Redo (Ctrl+Z)** support via real-time document synchronization.
  - Set as the **default editor** for all supported formats.
- **Production Ready**:
  - Automated dual-market publishing script (`publish.sh`).
  - Optimized package size via `.vscodeignore`.
  - Integrated local testing configurations.
