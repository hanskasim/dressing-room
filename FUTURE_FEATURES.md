# The Dressing Room - Future Features Roadmap

This document outlines planned features for future versions of The Dressing Room extension.

---

## 🗺️ Version Roadmap

```
v2.0 ✅ RELEASED
  └─ Production-ready extension
  └─ Local storage only
  └─ USD support only

v2.1 🚧 IN PROGRESS (Current Branch: feature/multi-currency)
  └─ Multi-currency support (15+ currencies)
  └─ Currency-grouped totals
  └─ International price detection

v3.0 📅 PLANNED
  └─ Optional USD conversion
  └─ Currency exchange API integration
  └─ "Show in USD" toggle

v3.1 📅 PLANNED
  └─ Travel mode
  └─ Multi-region price comparison
  └─ Cross-currency sorting

v4.0 💡 FUTURE
  └─ Cloud sync (optional)
  └─ Multi-device support
  └─ Advanced features
```

---

## v3.0: Currency Conversion (Q1 2026)

### Overview
Enable users to view prices in USD equivalent alongside original currency.

### Features

#### 1. Optional USD Conversion Display
**User Story:** As a user saving items in multiple currencies, I want to see USD equivalents to understand my total budget.

**Implementation:**
- Add "💱 Show in USD" toggle in popup header
- Fetch exchange rates from free API (exchangerate-api.com)
- Cache rates for 24 hours in chrome.storage.local
- Display converted amounts in parentheses next to original prices

**UI Mock:**
```
┌──────────────────────────────────┐
│ 💱 Show in USD  [ON]  ←─ Toggle │
├──────────────────────────────────┤
│ Regular-Fit Jacket               │
│ Rp 299.000 (~$19.10)  ←─ Shows  │
│ Uniqlo • Jan 15                  │
└──────────────────────────────────┘
```

#### 2. Smart Totals
- Single currency: Show original total
- Mixed currencies with conversion ON: Show USD total
- Conversion OFF: Show currency breakdown (as in v2.1)

#### 3. Exchange Rate API Integration
**Selected API:** exchangerate-api.com
- Free tier: 1,500 requests/month
- Caching strategy: Update once per day
- Fallback: Show original prices if API fails
- Privacy: No user data sent, only currency codes

**Privacy Considerations:**
- Update privacy policy to mention optional API usage
- Make conversion opt-in (disabled by default)
- Clear documentation that enabling = API calls

### Technical Specs
```javascript
// New data structure additions
{
  settings: {
    showUSDConversion: false,  // User preference
    lastExchangeUpdate: null,  // Timestamp
  },
  exchangeRates: {
    date: '2025-01-15',
    base: 'USD',
    rates: {
      IDR: 15675.5,
      JPY: 147.23,
      EUR: 0.92,
      // ...
    }
  }
}

// Conversion function
function convertToUSD(amount, fromCurrency, rates) {
  if (fromCurrency === 'USD') return amount;
  const rate = rates[fromCurrency];
  if (!rate) return null;
  return amount / rate;
}
```

### Dependencies
- No npm packages (use fetch API)
- Chrome storage for caching
- Privacy policy update

### Success Metrics
- Users can enable/disable USD conversion
- Conversion accuracy within 1% of actual rates
- Works offline with cached rates (up to 24h old)
- No performance impact when disabled

---

## v3.1: Travel Mode & Multi-Region Comparison (Q2 2026)

### Overview
Help users compare prices across different regional websites to find the best deals.

### Features

#### 1. Travel Mode
**User Story:** As a traveler, I want to compare prices between my home country and destination country to decide where to buy.

**How it works:**
1. User saves item from US Uniqlo: "Down Jacket - $89.99"
2. User travels to Indonesia, opens Indonesian Uniqlo
3. Extension detects same/similar product (via SKU matching)
4. Shows comparison: "🇺🇸 $89.99 vs 🇮🇩 Rp 299.000 ($19.10) ✅ SAVE $70!"

#### 2. SKU/Product ID Matching
**Challenge:** How to identify "same product" across regions?

**Solution:**
- Extract product SKU from URL (e.g., `/E485051-000/`)
- Match by SKU across different regional URLs
- Visual confirmation UI: "Is this the same product?"

#### 3. Multi-Region Price Display
```
Down Jacket - Comparison View
┌─────────────────────────────────┐
│ 🇺🇸 US Uniqlo:   $89.99        │
│ 🇮🇩 ID Uniqlo:   Rp 299.000    │
│                  (~$19.10 USD)  │
│ ✅ Buy in Indonesia - Save $70! │
├─────────────────────────────────┤
│ 🇯🇵 JP Uniqlo:   ¥8,900        │
│                  (~$60.32 USD)  │
│ 💰 Also cheaper than US!        │
└─────────────────────────────────┘
```

#### 4. Price Drop Alerts (Bonus)
- Notify when price drops in any tracked region
- "Down Jacket is now ¥6,900 in Japan! (was ¥8,900)"

### Technical Challenges
- **Product Matching:** Needs smart SKU extraction (regex patterns per brand)
- **UI Complexity:** Comparison view needs new popup design
- **Data Structure:** Need to link products by SKU

### Data Structure
```javascript
{
  productSKU: "E485051-000",
  regionalPrices: [
    {
      region: 'US',
      price: '$89.99',
      numericPrice: 89.99,
      currency: 'USD',
      url: 'uniqlo.com/us/...',
      savedAt: '2025-01-10'
    },
    {
      region: 'ID',
      price: 'Rp 299.000',
      numericPrice: 299000,
      currency: 'IDR',
      url: 'uniqlo.com/id/...',
      savedAt: '2025-01-15'
    }
  ],
  bestDeal: {
    region: 'ID',
    savings: 70.89  // in USD
  }
}
```

### Success Metrics
- Accurately match products across regions (>90% accuracy)
- Show meaningful price comparisons
- Help users save money when traveling

---

## v4.0: Cloud Sync (Optional) (Q3-Q4 2026)

### Overview
Enable users to sync their saved items across devices (optional feature).

### Features

#### 1. Optional Cloud Sync
**IMPORTANT:** This is 100% optional. Local-only mode remains default.

**Options:**
- Google Account sync (via Chrome Sync API)
- Self-hosted backend (Supabase/Firebase)

**Privacy-First Approach:**
- Explicit opt-in required
- Clear explanation of what data is synced
- Easy opt-out / data deletion
- End-to-end encryption option

#### 2. Multi-Device Support
- Save on laptop, view on phone
- Real-time sync across devices
- Conflict resolution (latest update wins)

#### 3. Backup & Restore
- Export data to JSON
- Import from backup file
- Automatic cloud backups (if sync enabled)

### Technical Approach

**Option A: Chrome Sync API (Easiest)**
```javascript
// Use chrome.storage.sync instead of chrome.storage.local
chrome.storage.sync.set({ products: allProducts });
```
**Pros:**
- Built into Chrome, no external service
- Free, unlimited
- Works across all Chrome devices logged in with same Google account

**Cons:**
- Limited to 100KB per item, 102KB total
- Need to chunk/compress data for large collections
- Only works in Chrome (not other browsers)

**Option B: Supabase Backend (Most Flexible)**
- User authentication
- PostgreSQL database
- Realtime subscriptions
- Free tier: 500MB database, 2GB bandwidth

**Cons:**
- Privacy concerns (data on external server)
- Need to update privacy policy significantly
- More complex implementation
- Potential Chrome Web Store review issues

### Recommendation: **Option A (Chrome Sync)** for v4.0
- Simpler
- More private (Google already has the data via Chrome)
- Faster approval
- Can add Option B later if needed

### Privacy Policy Updates Required
Major updates needed to explain:
- What data is synced
- Where it's stored (Google servers)
- How to disable
- How to delete

### Success Metrics
- <10% of users enable sync (most prefer local-only)
- Zero data loss incidents
- Sync completes in <5 seconds
- Easy opt-out process

---

## 💡 Other Future Ideas (Unscheduled)

### Size & Fit Tracking
- Save your size preferences per brand
- "You usually buy M in Uniqlo, but L in H&M"
- Size conversion charts

### Outfit Builder
- Group items into outfits
- "Summer vacation outfit: $234 total"
- Visual outfit preview

### Brand Analytics
- "You've spent $543 at Uniqlo this year"
- "Your average item price: $45"
- Brand spending breakdown

### Share Wishlist
- Generate shareable link
- Great for gift lists
- Privacy-controlled (optional)

### Price Prediction
- ML model to predict price drops
- "This jacket usually goes on sale in March"
- Historical price trends

### Browser Extension for Mobile
- Currently desktop-only
- Mobile version (harder with Chrome extensions)
- Alternative: PWA or native app

---

## 🚫 Explicitly NOT Planned

### Things we will NOT do:
1. **Affiliate links** - We don't make money from user purchases
2. **Ads** - Extension remains ad-free
3. **Sell user data** - Privacy is core to our values
4. **Required account** - Local-first always available
5. **Auto-add-to-cart** - Too invasive, security risk
6. **Browser hijacking** - No changing homepages, search engines, etc.
7. **Social features** - No social network, public profiles, etc.

---

## 📋 Feature Request Process

Have an idea? Here's how to suggest features:

1. **Check this document** - Is it already planned?
2. **Open GitHub Issue** - Use template "Feature Request"
3. **Explain use case** - Why would this help users?
4. **Community vote** - Other users can upvote (👍)
5. **Roadmap decision** - High-voted features get prioritized

**GitHub:** https://github.com/hanskasim/dressing-room/issues

---

## 🤝 Contributing

Want to help build these features?

1. Check `IMPLEMENTATION_PLAN_V*.md` for current version plan
2. Pick a feature from this document
3. Open GitHub issue: "I want to implement [Feature X]"
4. Fork repo, create feature branch
5. Submit PR with tests

**We welcome contributions!** 🎉

---

## 📅 Last Updated
**Date:** December 26, 2024
**Current Version:** v2.0
**Next Release:** v2.1 (Multi-Currency Support)

---

*This roadmap is subject to change based on user feedback, Chrome Web Store policies, and development capacity.*
