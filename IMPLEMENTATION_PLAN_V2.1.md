# Implementation Plan: v2.1 Multi-Currency Support

**Version:** 2.1
**Branch:** `feature/multi-currency`
**Goal:** Enable saving and tracking fashion items in multiple currencies worldwide

---

## 🎯 Scope: What's In v2.1

### Core Features:
1. ✅ Detect and save prices in 15+ currencies (USD, EUR, GBP, JPY, IDR, PHP, THB, etc.)
2. ✅ Smart number parsing (handle `,` vs `.` as thousands/decimal separators)
3. ✅ Currency-specific price limits (¥50,000 is valid for JPY, not USD)
4. ✅ Display prices in original currency
5. ✅ Group totals by currency
6. ✅ Price tracking in original currency (no conversion)

### What's NOT In v2.1:
- ❌ Currency conversion (deferred to v3.0)
- ❌ Currency filter UI (deferred - low priority)
- ❌ Cross-currency comparison (deferred to v3.1)
- ❌ Travel/multi-region comparison (deferred to v4.0)

---

## 📋 Implementation Steps

### Step 1: Update Data Structure

**File:** All files (content.js, popup.js, background.js)

**Add currency fields to product object:**
```javascript
{
  name: "Regular-Fit Jacket",
  price: "Rp 299.000",           // Display string (formatted as shown on site)
  numericPrice: 299000,           // For calculations (no formatting)
  currency: "IDR",                // NEW: ISO 4217 code
  currencySymbol: "Rp",           // NEW: Display symbol
  url: "uniqlo.com/id/...",
  store: "Uniqlo",
  savedAt: "2025-01-15",
  priceHistory: [...]
}
```

---

### Step 2: Create Currency Configuration

**File:** `content.js` (and duplicate in `popup.js`)

**Add comprehensive currency patterns:**
```javascript
const CURRENCY_CONFIG = {
  // Major currencies
  USD: {
    patterns: [
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,      // $1,234.56
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*USD/      // 1,234.56 USD
    ],
    symbol: '$',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    maxPrice: 10000,
    name: 'US Dollar'
  },
  EUR: {
    patterns: [
      /€\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/,      // €1.234,56 (EU format)
      /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*€/       // 1.234,56 €
    ],
    symbol: '€',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    maxPrice: 10000,
    name: 'Euro'
  },
  GBP: {
    patterns: [
      /£\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,      // £1,234.56
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*GBP/
    ],
    symbol: '£',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    maxPrice: 10000,
    name: 'British Pound'
  },
  JPY: {
    patterns: [
      /¥\s*(\d{1,3}(?:,\d{3})*)/,                  // ¥1,234 (no decimals)
      /(\d{1,3}(?:,\d{3})*)\s*円/                   // 1,234 円
    ],
    symbol: '¥',
    decimalSeparator: null,
    thousandsSeparator: ',',
    maxPrice: 1000000,  // JPY has large numbers
    name: 'Japanese Yen'
  },
  IDR: {
    patterns: [
      /Rp\s*(\d{1,3}(?:\.\d{3})*)/,                // Rp 299.000 (. as thousands!)
      /(\d{1,3}(?:\.\d{3})*)\s*Rp/
    ],
    symbol: 'Rp',
    decimalSeparator: null,
    thousandsSeparator: '.',  // IMPORTANT: Indonesia uses . for thousands
    maxPrice: 10000000,  // IDR has very large numbers
    name: 'Indonesian Rupiah'
  },
  PHP: {
    patterns: [
      /₱\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,      // ₱1,234.56
      /PHP\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/
    ],
    symbol: '₱',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    maxPrice: 500000,
    name: 'Philippine Peso'
  },
  THB: {
    patterns: [
      /฿\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,      // ฿1,234.56
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*THB/,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*บาท/     // Thai script
    ],
    symbol: '฿',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    maxPrice: 300000,
    name: 'Thai Baht'
  },
  VND: {
    patterns: [
      /₫\s*(\d{1,3}(?:\.\d{3})*)/,                 // ₫1.234.000
      /(\d{1,3}(?:\.\d{3})*)\s*₫/,
      /(\d{1,3}(?:\.\d{3})*)\s*VND/
    ],
    symbol: '₫',
    decimalSeparator: null,
    thousandsSeparator: '.',
    maxPrice: 100000000,  // VND has huge numbers
    name: 'Vietnamese Dong'
  },
  SEK: {
    patterns: [
      /(\d{1,3}(?:\s\d{3})*)\s*kr/i,               // 1 234 kr (space separator!)
      /(\d{1,3}(?:\s\d{3})*)\s*SEK/i
    ],
    symbol: 'kr',
    decimalSeparator: ',',
    thousandsSeparator: ' ',  // IMPORTANT: Space as separator
    maxPrice: 100000,
    name: 'Swedish Krona'
  },
  NOK: {
    patterns: [
      /(\d{1,3}(?:\s\d{3})*)\s*kr/i,
      /(\d{1,3}(?:\s\d{3})*)\s*NOK/i
    ],
    symbol: 'kr',
    decimalSeparator: ',',
    thousandsSeparator: ' ',
    maxPrice: 100000,
    name: 'Norwegian Krone'
  },
  DKK: {
    patterns: [
      /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*kr/i,
      /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*DKK/i
    ],
    symbol: 'kr',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    maxPrice: 70000,
    name: 'Danish Krone'
  },
  CNY: {
    patterns: [
      /¥\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*元/       // Chinese yuan symbol
    ],
    symbol: '¥',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    maxPrice: 70000,
    name: 'Chinese Yuan'
  },
  KRW: {
    patterns: [
      /₩\s*(\d{1,3}(?:,\d{3})*)/,
      /(\d{1,3}(?:,\d{3})*)\s*원/                   // Korean won symbol
    ],
    symbol: '₩',
    decimalSeparator: null,
    thousandsSeparator: ',',
    maxPrice: 10000000,
    name: 'South Korean Won'
  },
  MXN: {
    patterns: [
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*MXN/,
      /MXN\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/
    ],
    symbol: '$',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    maxPrice: 200000,
    name: 'Mexican Peso'
  },
  CAD: {
    patterns: [
      /CAD\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*CAD/
    ],
    symbol: '$',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    maxPrice: 15000,
    name: 'Canadian Dollar'
  },
  AUD: {
    patterns: [
      /AUD\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*AUD/
    ],
    symbol: '$',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    maxPrice: 15000,
    name: 'Australian Dollar'
  }
};
```

---

### Step 3: Implement Currency Detection

**File:** `content.js`

**Function: `detectCurrency(priceString, url)`**
```javascript
function detectCurrency(priceString, url) {
  console.log('🔍 Detecting currency from:', priceString);

  // Strategy 1: Try to match price pattern directly
  for (const [code, config] of Object.entries(CURRENCY_CONFIG)) {
    for (const pattern of config.patterns) {
      if (pattern.test(priceString)) {
        console.log(`   ✅ Matched ${code} via pattern`);
        return code;
      }
    }
  }

  // Strategy 2: Fallback to URL-based detection for ambiguous symbols ($)
  console.log('   ⚠️ No pattern match, checking URL...');

  const urlLower = url.toLowerCase();

  // Country code mapping (from URL patterns like /id/, /mx/, /en-gb/)
  const URL_CURRENCY_MAP = {
    '/id/': 'IDR',  // Indonesia
    '/ph/': 'PHP',  // Philippines
    '/th/': 'THB',  // Thailand
    '/vn/': 'VND',  // Vietnam
    '/jp/': 'JPY',  // Japan
    '/cn/': 'CNY',  // China
    '/kr/': 'KRW',  // Korea
    '/mx/': 'MXN',  // Mexico
    '/ca/': 'CAD',  // Canada
    '/au/': 'AUD',  // Australia
    '/uk/': 'GBP',  // UK
    '/gb/': 'GBP',  // Great Britain
    '/eu/': 'EUR',  // EU
    '/de/': 'EUR',  // Germany
    '/fr/': 'EUR',  // France
    '/es/': 'EUR',  // Spain
    '/it/': 'EUR',  // Italy
    '/se/': 'SEK',  // Sweden
    '/no/': 'NOK',  // Norway
    '/dk/': 'DKK',  // Denmark
  };

  for (const [urlPart, currency] of Object.entries(URL_CURRENCY_MAP)) {
    if (urlLower.includes(urlPart)) {
      console.log(`   ✅ Detected ${currency} from URL`);
      return currency;
    }
  }

  // Default fallback
  console.log('   ℹ️ Defaulting to USD');
  return 'USD';
}
```

---

### Step 4: Implement Smart Number Parsing

**File:** `content.js`

**Function: `parseInternationalPrice(priceString, currency)`**
```javascript
function parseInternationalPrice(priceString, currency) {
  const config = CURRENCY_CONFIG[currency];
  if (!config) return 0;

  // Extract numeric part (remove currency symbols and letters)
  let numericString = priceString
    .replace(/[A-Za-z₱฿₫₩¥£€\$]/g, '')  // Remove all currency symbols
    .trim();

  // Handle different separator formats based on currency
  if (config.thousandsSeparator === '.') {
    // Indonesian/German format: 299.000,50
    // Remove dots (thousands), replace comma with dot (decimal)
    numericString = numericString.replace(/\./g, '').replace(',', '.');
  } else if (config.thousandsSeparator === ',') {
    // US/UK format: 299,000.50
    // Remove commas (thousands), keep dot (decimal)
    numericString = numericString.replace(/,/g, '');
  } else if (config.thousandsSeparator === ' ') {
    // Swedish format: 299 000,50
    // Remove spaces (thousands), replace comma with dot (decimal)
    numericString = numericString.replace(/\s/g, '').replace(',', '.');
  }

  const numericPrice = parseFloat(numericString);

  if (isNaN(numericPrice) || numericPrice < 1) {
    console.log(`   ⚠️ Invalid price after parsing: ${numericString}`);
    return 0;
  }

  if (numericPrice > config.maxPrice) {
    console.log(`   ⚠️ Price ${numericPrice} exceeds max for ${currency} (${config.maxPrice})`);
    return 0;
  }

  console.log(`   ✅ Parsed ${priceString} → ${numericPrice} (${currency})`);
  return numericPrice;
}
```

---

### Step 5: Update `findPrice()` Function

**File:** `content.js` (lines 431-518)

**Changes:**
1. Try all currency patterns instead of just USD
2. Detect currency from match + URL
3. Parse price using currency-aware parser
4. Return currency info along with price

```javascript
function findPrice(productArea) {
  console.log('🔍 Finding price...');

  const searchArea = productArea || document.body;
  const currentUrl = window.location.href;

  const candidates = [];
  const priceElements = searchArea.querySelectorAll(
    '[class*="price"], [id*="price"], [data-price], [data-testid*="price"], span, div'
  );

  for (const el of priceElements) {
    // ... existing visibility checks ...

    const text = el.textContent.trim();

    // Try to match ANY currency pattern
    let match = null;
    let detectedCurrency = null;

    for (const [currencyCode, config] of Object.entries(CURRENCY_CONFIG)) {
      for (const pattern of config.patterns) {
        match = text.match(pattern);
        if (match) {
          detectedCurrency = currencyCode;
          break;
        }
      }
      if (match) break;
    }

    // If $ matched, need to disambiguate (USD vs MXN vs CAD etc)
    if (detectedCurrency && CURRENCY_CONFIG[detectedCurrency].symbol === '$') {
      detectedCurrency = detectCurrency(text, currentUrl);
    }

    if (!match) continue;

    // ... existing filtering logic (isPriceOnlyText, etc) ...

    // Parse price based on currency
    const numericPrice = parseInternationalPrice(text, detectedCurrency);
    if (numericPrice === 0) continue;

    // ... existing scoring logic ...

    candidates.push({
      price: text.match(/[^\d\s.,]*\d[^\d]*\d*/)[0].trim(),  // Preserve original format
      numericPrice: numericPrice,
      currency: detectedCurrency,
      currencySymbol: CURRENCY_CONFIG[detectedCurrency].symbol,
      element: el,
      score,
      top: rect.top
    });
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    console.log(`   ✅ Found price: ${best.price} (${best.currency})`);

    return {
      currentPrice: best.price,
      numericPrice: best.numericPrice,
      currency: best.currency,
      currencySymbol: best.currencySymbol,
      element: best.element,
      confidence: Math.min(best.score / 100, 1),
      method: 'multi-currency-semantic'
    };
  }

  console.log('   ❌ Could not find price');
  return { currentPrice: 'Price not found' };
}
```

---

### Step 6: Update Product Save Logic

**File:** `content.js` (saveProduct function)

```javascript
// Update price history entry to include currency
const priceEntry = {
  price: productInfo.price,
  timestamp,
  numericPrice: productInfo.numericPrice,
  currency: productInfo.currency,          // NEW
  currencySymbol: productInfo.currencySymbol,  // NEW
  isSale: productInfo.saleInfo?.isSale || false,
  confidence: productInfo.confidence,
  method: productInfo.method
};

const product = {
  name: productInfo.name,
  price: productInfo.price,
  numericPrice: productInfo.numericPrice,  // NEW (for sorting)
  currency: productInfo.currency,          // NEW
  currencySymbol: productInfo.currencySymbol,  // NEW
  image: productInfo.images[0] || '',
  images: productInfo.images,
  url,
  store,
  savedAt: timestamp,
  priceHistory: [priceEntry],
  // ... rest
};
```

---

### Step 7: Update Popup Display (Currency Totals)

**File:** `popup.js`

**Function: Group products by currency and show totals**

```javascript
function renderCurrencyTotals() {
  const totalCountDiv = document.getElementById('total-count');
  const totalPriceDiv = document.getElementById('total-price');

  const products = getSortedProducts();

  // Group by currency
  const currencyGroups = {};
  products.forEach(product => {
    const currency = product.currency || 'USD';
    if (!currencyGroups[currency]) {
      currencyGroups[currency] = {
        count: 0,
        total: 0,
        symbol: product.currencySymbol || CURRENCY_CONFIG[currency]?.symbol || currency
      };
    }
    currencyGroups[currency].count++;
    currencyGroups[currency].total += product.numericPrice || parsePrice(product.price);
  });

  const currencyCount = Object.keys(currencyGroups).length;

  // If only one currency, show as before
  if (currencyCount === 1) {
    const [currency, data] = Object.entries(currencyGroups)[0];
    totalCountDiv.textContent = `Items: ${data.count}`;
    totalPriceDiv.textContent = `Total: ${data.symbol}${formatNumber(data.total, currency)}`;
  }
  // Multiple currencies - show breakdown
  else {
    totalCountDiv.textContent = `Items: ${products.length}`;

    const breakdown = Object.entries(currencyGroups)
      .map(([currency, data]) => {
        return `${data.symbol}${formatNumber(data.total, currency)} (${data.count})`;
      })
      .join(' • ');

    totalPriceDiv.innerHTML = `<div class="multi-currency-total">${breakdown}</div>`;
  }
}

function formatNumber(number, currency) {
  const config = CURRENCY_CONFIG[currency];
  if (!config) return number.toFixed(2);

  // Format based on currency (e.g., no decimals for JPY)
  if (config.decimalSeparator === null) {
    return Math.round(number).toLocaleString('en-US');
  }

  return number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
```

---

### Step 8: Data Migration

**File:** `popup.js` (DOMContentLoaded)

```javascript
// Migrate existing products to add currency fields
allProducts.forEach(product => {
  if (!product.currency) {
    // Default to USD for existing products
    product.currency = 'USD';
    product.currencySymbol = '$';
    product.numericPrice = product.numericPrice || parsePrice(product.price);
    migrationNeeded = true;
  }

  // Migrate price history entries
  if (product.priceHistory) {
    product.priceHistory.forEach(entry => {
      if (!entry.currency) {
        entry.currency = product.currency;
        entry.currencySymbol = product.currencySymbol;
        migrationNeeded = true;
      }
    });
  }
});
```

---

### Step 9: Update `popup.js` Price Refresh

**File:** `popup.js` (extractPriceSemantically)

Apply same multi-currency logic as in content.js

---

### Step 10: Testing Checklist

**Currencies to test:**
- [ ] USD - US Uniqlo, H&M, Gap
- [ ] EUR - German/French Zara
- [ ] GBP - UK ASOS
- [ ] JPY - Japanese Uniqlo
- [ ] IDR - Indonesian Uniqlo (CRITICAL - uses . as thousands!)
- [ ] PHP - Philippine H&M
- [ ] THB - Thai Lazada
- [ ] SEK - Swedish H&M (uses space as separator!)
- [ ] MXN - Mexican stores

**Test cases:**
1. Save item in USD → Shows $49.99
2. Save item in IDR → Shows Rp 299.000 (parsed as 299000)
3. Mix USD + IDR → Shows separate totals
4. Price history in mixed currencies → Each entry shows own currency
5. Refresh prices → Detects currency correctly
6. Sort products → Works within currency groups

---

## 🎨 UI Changes

### Before (v2.0):
```
Items: 5
Total: $299.50
```

### After (v2.1) - Single Currency:
```
Items: 5
Total: $299.50
```
*(No change if all same currency)*

### After (v2.1) - Multi Currency:
```
Items: 8
$134 (3) • Rp 598K (2) • £89.99 (2) • €45 (1)
```

---

## 🚀 Release Checklist

- [ ] Update manifest.json version to 2.1
- [ ] Test all currency detections
- [ ] Test data migration for existing users
- [ ] Update privacy policy if needed (no changes expected)
- [ ] Create release notes
- [ ] Test Chrome Web Store submission
- [ ] Create git tag v2.1
- [ ] Merge feature branch to main
- [ ] Deploy to Chrome Web Store

---

## 📊 Success Metrics

**v2.1 is successful if:**
1. ✅ Can save items from Indonesian Uniqlo (Rp 299.000)
2. ✅ Can save items from Japanese Uniqlo (¥8,900)
3. ✅ Totals show correctly grouped by currency
4. ✅ Price tracking works in all currencies
5. ✅ No regressions in USD detection
6. ✅ Existing user data migrates smoothly

---

## ⏭️ Next Steps (Post v2.1)

See `FUTURE_FEATURES.md` for roadmap
