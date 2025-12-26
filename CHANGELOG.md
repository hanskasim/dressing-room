# Changelog

All notable changes to The Dressing Room extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Multi-currency support (15+ currencies including IDR, JPY, PHP, THB, VND, SEK, NOK, DKK, CNY, KRW, MXN, CAD, AUD)
- Currency-grouped totals display
- Smart international number parsing (handles different decimal/thousands separators)
- Currency detection from both price patterns and URL
- Currency-specific price limits (e.g., ¥50,000 valid for JPY)

### Changed
- Price detection now searches all span/div elements (not just those with "price" class)
- Price limits are now currency-aware instead of fixed at $10,000

---

## [2.0.0] - 2025-01-15

### Added
- Initial production release
- Save fashion items from any website
- Local storage (chrome.storage.local)
- Price tracking and history
- Sale detection (strikethrough, red text, percentage discounts)
- Brand filters with auto-detection
- Favorites system
- Price comparison view
- "Refresh Prices" feature
- Sort by date, price, brand, name
- Pagination for large collections
- Privacy policy (hosted on GitHub Pages)

### Fixed
- H&M price detection with obfuscated class names
- Strikethrough price exclusion
- Sale indicator detection across multiple brands

### Security
- All data stored locally (no external transmission)
- No analytics or tracking
- Privacy-first approach

---

## [1.0.0] - 2024-12-20 (Internal Beta)

### Added
- Basic product detection
- Simple save functionality
- Popup UI
- Cloud sync prototype (removed in v2.0)

---

## Version History Quick Reference

- **v2.1** (In Progress) - Multi-currency support
- **v2.0** (Current) - Production release, local-only
- **v1.0** (Beta) - Initial prototype

---

## Upcoming Versions

See [FUTURE_FEATURES.md](FUTURE_FEATURES.md) for planned features:
- v3.0: Currency conversion with optional USD display
- v3.1: Travel mode & multi-region comparison
- v4.0: Optional cloud sync
