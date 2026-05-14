# Changelog

## [0.0.4] - 2026-05-14

### Added

- Add Row and Add Column functionality to Spreadsheet Editor.
- Delete Row and Delete Column support for Spreadsheet Editor.
- Strikethrough, Headings, and List formatting to Markdown Editor.
- GFM (GitHub Flavored Markdown) support via turndown plugin.

### Fixed

- Fixed ExcelJS 1-indexed row value bug in XLSX files.
- Improved binary data handling for XLSX files using vscode.workspace.fs.
- Fixed cursor jumping issue in Markdown Editor during auto-save.
- Resolved security vulnerabilities in `fast-xml-parser` and `markdown-it`.

### Improved

- Premium UI overhaul with enhanced glassmorphism and animations.
- Better typography and interaction states across all editors.
- Robust parsing for nested JSON, YAML, and XML structures.

## [0.0.3] - 2026-05-13

### Release Highlights

- Premium Text Viewer with glassmorphism design.
- Support for JSONL files.
- Version 0.0.3 release with optimized icons.

## [0.0.2] - 2026-05-13

### Initial Features

- Initial support for XML and YAML files.
- Spreadsheet-style editing for structured data.

## [0.0.1] - 2026-05-13

### Genesis

- Initial release with support for XLSX, CSV, TSV, and Markdown.
