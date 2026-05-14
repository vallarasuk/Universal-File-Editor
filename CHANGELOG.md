# Changelog

## [0.1.2] - 2026-05-14

### Added

- **File Overview Dashboard**: New feature to view file details (name, size, type, row/line count) in a premium modal.
- **Visual Enhancements**: Integrated a sleek overview banner and improved modal typography.

### Fixed

- **UPI QR Code**: Replaced broken QR code with a valid UPI URI encoded image for reliable contributions.
- **UPID Synchronization**: Ensure the UPI ID is correctly displayed and copyable in the support modal.

## [0.1.1] - 2026-05-14

### Added

- **Support the Developer**: Integrated a premium support modal with UPI ID and QR code for contributions.
- **File Conversion System**: Export your data to different formats (JSON, CSV, YAML, XML) with one click.
- **Enhanced UI**: Improved select menus and modal animations for a more fluid experience.

## [0.1.0] - 2026-05-14

### Added

- **Dual-Mode Editor**: Seamlessly toggle between "Grid View" and "Raw View".
- **Raw Code Editor**: Edit JSON, YAML, XML, and CSV directly in a premium monospaced editor.
- **Format Tool**: Beautify/Format JSON and XML source code with one click.
- **Clipboard Integration**: New "Copy" button to quickly copy the entire file content.
- **Status Dashboard**: Real-time display of detected file format and row count in the toolbar.
- **Premium Glassmorphism 2.0**: Rebuilt UI with enhanced blur effects, better typography, and interactive row/column highlights.

### Improved

- Complete rebuild of the webview logic for better performance and stability.
- Robust XML parsing that handles nested structures more reliably.
- Better synchronization between the extension backend and the webview UI.

## [0.0.5] - 2026-05-14

### Fixed

- Resolved initialization race condition where files (especially JSON) wouldn't load on first open.
- Implemented 'ready' handshake between extension and webviews for reliable data loading.
- Improved error handling for malformed JSON and XML files.

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
