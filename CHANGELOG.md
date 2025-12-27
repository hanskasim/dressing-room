# Changelog

All notable changes to The Dressing Room extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Multi-language product name detection (Indonesian, Japanese, Chinese, Thai, Korean)
- Language-specific keyword dictionaries for accurate product name identification
- Automatic language detection from URL and HTML attributes
- Label exclusion logic (Size:, Color:, Quantity: in multiple languages)
- Navigation/header filtering to prevent menu text from being detected as product names

### Fixed
- Product name detection on Indonesian websites (e.g., Indonesian Uniqlo)
- Incorrect detection of size/color labels as product names (e.g., "Ukuran: Wanita M")
- Incomplete product names on non-English sites
- Navigation menu items (e.g., "WOMEN", "Wanita") being detected as product names
- Review ratings (e.g., "4.5") being detected as product names on Japanese sites

---

## [2.1.0] - 2025-01-XX

### Added
- Multi-currency support (15+ currencies including IDR, JPY, PHP, THB, VND, SEK, NOK, DKK, CNY, KRW, MXN, CAD, AUD)
- Currency-grouped totals display (multi-line display for better readability)
- Smart international number parsing (handles different decimal/thousands separators)
- Currency detection from both price patterns and URL
- Currency-specific price limits (e.g., ¥50,000 valid for JPY)
- Data migration for existing products (defaults to USD)

### Changed
- Price detection now searches all span/div elements (not just those with "price" class)
- Price limits are now currency-aware instead of fixed at $10,000
- Multi-currency totals now display on separate lines instead of comma-separated

### Known Limitations
- **Product name detection optimized for English sites:** Product names on non-English websites (e.g., Indonesian, Japanese) may be incomplete. This is because the name detection uses English keywords to prevent false positives on English sites. Price detection works perfectly across all languages. (Fixed in v2.2)

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

- **v2.2** (In Progress) - Multi-language product name detection
- **v2.1** (Released) - Multi-currency support
- **v2.0** (Released) - Production release, local-only
- **v1.0** (Beta) - Initial prototype

---

## Upcoming Versions

See [FUTURE_FEATURES.md](FUTURE_FEATURES.md) for planned features:
- v3.0: Currency conversion with optional USD display
- v3.1: Travel mode & multi-region comparison
- v4.0: Optional cloud sync
