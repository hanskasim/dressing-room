// ============================================
// STREAMLINED DETECTION SYSTEM v3.1
// Phase 1 Enhancements:
// - Related products exclusion  
// - Multi-element name assembly
// - Add to Cart proximity detection
// ============================================

console.log('🪞 DRESSING ROOM v3.1: Enhanced detection loaded!');

let saveButtonEnabled = false;

// ============================================
// MULTI-CURRENCY CONFIGURATION (v2.1)
// ============================================

const CURRENCY_CONFIG = {
  USD: {
    patterns: [
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*USD/
    ],
    symbol: '$',
    decimalSep: '.',
    thousandsSep: ',',
    maxPrice: 10000
  },
  EUR: {
    patterns: [
      /€\s*(\d{1,3}(?:[.,]\d{3})*(?:,\d{2})?)/,
      /(\d{1,3}(?:[.,]\d{3})*(?:,\d{2})?)\s*€/,
      /(\d{1,3}(?:[.,]\d{3})*(?:,\d{2})?)\s*EUR/
    ],
    symbol: '€',
    decimalSep: ',',
    thousandsSep: '.',
    maxPrice: 10000
  },
  GBP: {
    patterns: [
      /£\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*GBP/
    ],
    symbol: '£',
    decimalSep: '.',
    thousandsSep: ',',
    maxPrice: 10000
  },
  JPY: {
    patterns: [
      /¥\s*(\d{1,3}(?:,\d{3})*)/,
      /(\d{1,3}(?:,\d{3})*)\s*円/
    ],
    symbol: '¥',
    decimalSep: null,
    thousandsSep: ',',
    maxPrice: 1000000
  },
  IDR: {
    patterns: [
      /Rp\s*(\d{1,3}(?:\.\d{3})*)/,
      /(\d{1,3}(?:\.\d{3})*)\s*Rp/
    ],
    symbol: 'Rp',
    decimalSep: null,
    thousandsSep: '.',
    maxPrice: 10000000
  },
  PHP: {
    patterns: [
      /₱\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      /PHP\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/
    ],
    symbol: '₱',
    decimalSep: '.',
    thousandsSep: ',',
    maxPrice: 500000
  },
  THB: {
    patterns: [
      /฿\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*THB/,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*บาท/
    ],
    symbol: '฿',
    decimalSep: '.',
    thousandsSep: ',',
    maxPrice: 300000
  },
  VND: {
    patterns: [
      /₫\s*(\d{1,3}(?:\.\d{3})*)/,
      /(\d{1,3}(?:\.\d{3})*)\s*₫/,
      /(\d{1,3}(?:\.\d{3})*)\s*VND/
    ],
    symbol: '₫',
    decimalSep: null,
    thousandsSep: '.',
    maxPrice: 100000000
  },
  SEK: {
    patterns: [
      /(\d{1,3}(?:\s\d{3})*)\s*kr/i,
      /(\d{1,3}(?:\s\d{3})*)\s*SEK/i
    ],
    symbol: 'kr',
    decimalSep: ',',
    thousandsSep: ' ',
    maxPrice: 100000
  },
  CNY: {
    patterns: [
      /¥\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*元/
    ],
    symbol: '¥',
    decimalSep: '.',
    thousandsSep: ',',
    maxPrice: 70000
  },
  KRW: {
    patterns: [
      /₩\s*(\d{1,3}(?:,\d{3})*)/,
      /(\d{1,3}(?:,\d{3})*)\s*원/
    ],
    symbol: '₩',
    decimalSep: null,
    thousandsSep: ',',
    maxPrice: 10000000
  },
  MXN: {
    patterns: [
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*MXN/,
      /MXN\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/
    ],
    symbol: '$',
    decimalSep: '.',
    thousandsSep: ',',
    maxPrice: 200000
  },
  CAD: {
    patterns: [
      /CAD\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*CAD/
    ],
    symbol: '$',
    decimalSep: '.',
    thousandsSep: ',',
    maxPrice: 15000
  },
  AUD: {
    patterns: [
      /AUD\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*AUD/
    ],
    symbol: '$',
    decimalSep: '.',
    thousandsSep: ',',
    maxPrice: 15000
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function parsePrice(priceStr) {
  if (!priceStr || priceStr === 'Price not found') return 0;
  const cleaned = priceStr.replace(/[,$£€¥₹]/g, '').trim();
  const match = cleaned.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

function extractBrand(hostname) {
  const brandMap = {
    'uniqlo': 'Uniqlo', 'hm.com': 'H&M', 'zara': 'Zara', 'adidas': 'Adidas',
    'nike': 'Nike', 'aritzia': 'Aritzia', 'jcrew': 'J.Crew', 'forever21': 'Forever 21',
    'gap': 'Gap', 'oldnavy': 'Old Navy', 'bananarepublic': 'Banana Republic',
    'everlane': 'Everlane', 'reformation': 'Reformation'
  };
  
  for (const [key, brand] of Object.entries(brandMap)) {
    if (hostname.includes(key)) return brand;
  }
  
  return hostname.replace(/^www\./, '').split('.')[0];
}

function formatStructuredPrice(price, currency = 'USD') {
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) return price.toString();

  const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
  const symbol = symbols[currency] || '$';

  return `${symbol}${numPrice.toFixed(2)}`;
}

// ============================================
// CURRENCY DETECTION & PARSING (v2.1)
// ============================================

function detectCurrency(priceString, url) {
  console.log('   🔍 Detecting currency from:', priceString);

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

  const URL_CURRENCY_MAP = {
    '/id/': 'IDR', '/ph/': 'PHP', '/th/': 'THB', '/vn/': 'VND',
    '/jp/': 'JPY', '/cn/': 'CNY', '/kr/': 'KRW', '/mx/': 'MXN',
    '/ca/': 'CAD', '/au/': 'AUD', '/uk/': 'GBP', '/gb/': 'GBP',
    '/eu/': 'EUR', '/de/': 'EUR', '/fr/': 'EUR', '/es/': 'EUR',
    '/it/': 'EUR', '/se/': 'SEK'
  };

  for (const [urlPart, currency] of Object.entries(URL_CURRENCY_MAP)) {
    if (urlLower.includes(urlPart)) {
      console.log(`   ✅ Detected ${currency} from URL`);
      return currency;
    }
  }

  console.log('   ℹ️ Defaulting to USD');
  return 'USD';
}

function parseInternationalPrice(priceString, currency) {
  const config = CURRENCY_CONFIG[currency];
  if (!config) return 0;

  // Extract numeric part (remove currency symbols and letters)
  let numericString = priceString
    .replace(/[A-Za-z₱฿₫₩¥£€\$Rp]/g, '')
    .trim();

  // Handle different separator formats based on currency
  if (config.thousandsSep === '.') {
    // Indonesian/German format: 299.000,50
    // Remove dots (thousands), replace comma with dot (decimal)
    numericString = numericString.replace(/\./g, '').replace(',', '.');
  } else if (config.thousandsSep === ',') {
    // US/UK format: 299,000.50
    // Remove commas (thousands), keep dot (decimal)
    numericString = numericString.replace(/,/g, '');
  } else if (config.thousandsSep === ' ') {
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

// ============================================
// SMART PAGE AREA DETECTION (ENHANCED)
// ============================================

function isRelatedProductsArea(element) {
  const classList = element.className.toLowerCase();
  const id = element.id?.toLowerCase() || '';
  
  const excludePatterns = [
    'recommend', 'related', 'similar', 'you-might', 'you-may',
    'carousel', 'slider', 'swiper', 'gallery',
    'also-like', 'popular', 'trending', 'bestseller',
    'recently-viewed', 'customers-also', 'complete-look'
  ];
  
  for (const pattern of excludePatterns) {
    if (classList.includes(pattern) || id.includes(pattern)) {
      return true;
    }
  }
  
  const headings = element.querySelectorAll('h2, h3, h4, [class*="heading"], [class*="title"]');
  for (const heading of headings) {
    const headingText = heading.textContent.toLowerCase();
    if (headingText.includes('you might') || 
        headingText.includes('recommended') ||
        headingText.includes('similar') ||
        headingText.includes('complete the look')) {
      return true;
    }
  }
  
  return false;
}

function findAddToCartButton() {
  const buttonSelectors = [
    'button[class*="add-to-cart"]',
    'button[class*="add-to-bag"]',
    'button[id*="add-to-cart"]',
    'button[id*="add-to-bag"]',
    '[data-testid*="add-to-cart"]',
    '[data-testid*="add-to-bag"]'
  ];
  
  for (const selector of buttonSelectors) {
    const buttons = document.querySelectorAll(selector);
    for (const button of buttons) {
      if (button.offsetWidth === 0 || button.offsetHeight === 0) continue;
      
      const text = button.textContent.toLowerCase();
      if (text.includes('add') || text.includes('cart') || text.includes('bag') || text.includes('buy')) {
        console.log('   ✅ Found Add to Cart button');
        return button;
      }
    }
  }
  
  const allButtons = document.querySelectorAll('button');
  for (const button of allButtons) {
    if (button.offsetWidth === 0 || button.offsetHeight === 0) continue;
    
    const text = button.textContent.toLowerCase().trim();
    if (text === 'add to cart' || 
        text === 'add to bag' || 
        text === 'buy now' ||
        text === 'add to basket') {
      console.log('   ✅ Found Add to Cart button (by text)');
      return button;
    }
  }
  
  console.log('   ⚠️ Could not find Add to Cart button');
  return null;
}

function identifyMainProductArea() {
  console.log('🔍 Identifying main product area...');
  
  // Strategy 1: Find Add to Cart button and work backwards
  const addToCartButton = findAddToCartButton();
  if (addToCartButton) {
    let container = addToCartButton.closest('[class*="product"]');
    if (!container) container = addToCartButton.closest('main');
    if (!container) container = addToCartButton.closest('[role="main"]');
    if (!container) container = addToCartButton.closest('article');
    
    if (container && !isRelatedProductsArea(container)) {
      console.log('   ✅ Main product area identified (via Add to Cart button)');
      return container;
    }
  }
  
  // Strategy 2: Look for main product container with validation
  const candidates = [];
  const allContainers = document.querySelectorAll('main, [role="main"], article, section, div[class*="product"], div[id*="product"]');
  
  for (const container of allContainers) {
    if (isRelatedProductsArea(container)) {
      console.log('   ⏭️ Skipping related products area');
      continue;
    }
    
    const rect = container.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const absoluteTop = rect.top + scrollTop;
    
    if (absoluteTop > window.innerHeight * 1.5) continue;
    if (rect.width < 200 || rect.height < 200) continue;
    
    const images = container.querySelectorAll('img');
    const validImages = Array.from(images).filter(img => {
      const imgRect = img.getBoundingClientRect();
      return imgRect.width > 100 && imgRect.height > 100;
    });
    
    if (validImages.length === 0) continue;
    
    const hasPrice = container.textContent.includes('$') || container.textContent.match(/\d+\.\d{2}/);
    if (!hasPrice) continue;
    
    const hasAddToCart = container.querySelector('button') && 
      container.textContent.toLowerCase().includes('add to');
    const addToCartBonus = hasAddToCart ? 50000 : 0;
    
    const score = ((rect.width * rect.height) / (absoluteTop + 100)) + addToCartBonus;
    
    candidates.push({
      element: container,
      score,
      top: absoluteTop,
      size: rect.width * rect.height,
      hasAddToCart
    });
  }
  
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    console.log(`   ✅ Main product area identified (score: ${best.score.toFixed(0)}, hasAddToCart: ${best.hasAddToCart})`);
    return best.element;
  }
  
  console.log('   ⚠️ Could not identify specific product area, using body');
  return document.body;
}

// ============================================
// DYNAMIC CONTENT DETECTION (Simplified)
// ============================================

function isPageStillLoading() {
  const loadingIndicators = document.querySelectorAll('[aria-busy="true"], [class*="loading"], [class*="skeleton"]');
  return loadingIndicators.length > 0 || document.readyState !== 'complete';
}

async function waitForContent(timeout = 3000) {
  console.log('⏳ Waiting for dynamic content to load...');
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout && isPageStillLoading()) {
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  const elapsed = Date.now() - startTime;
  if (elapsed > 100) {
    console.log(`   ✅ Content loaded after ${elapsed}ms`);
  }
}

// ============================================
// PRIORITY 1: STRUCTURED DATA
// ============================================

function detectStructuredData() {
  console.log('🔍 PRIORITY 1: Checking structured data...');
  
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      const products = Array.isArray(data) ? data : [data];
      
      for (const item of products) {
        const isProduct = item['@type'] === 'Product' || 
                         (Array.isArray(item['@type']) && item['@type'].includes('Product'));
        
        if (isProduct && item.offers) {
          const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
          const offer = offers[0];
          
          if (offer && offer.price) {
            const price = formatStructuredPrice(offer.price, offer.priceCurrency);
            const highPrice = offer.highPrice ? formatStructuredPrice(offer.highPrice, offer.priceCurrency) : null;
            
            console.log('✅ Found structured data');
            console.log('   Name:', item.name);
            console.log('   Price:', price);
            
            return {
              name: item.name,
              price: price,
              originalPrice: highPrice,
              image: Array.isArray(item.image) ? item.image[0] : item.image,
              isSale: !!highPrice && parseFloat(offer.price) < parseFloat(offer.highPrice),
              confidence: 0.95,
              method: 'structured-data'
            };
          }
        }
      }
    } catch (e) {
      // Silent fail, try next script
    }
  }
  
  console.log('   ❌ No structured data found');
  return null;
}

// ============================================
// PRIORITY 2: FOCUSED SEMANTIC DETECTION (ENHANCED)
// ============================================

function findProductSubtitle(titleElement) {
  const possibleSubtitles = [
    titleElement.nextElementSibling,
    titleElement.nextElementSibling?.nextElementSibling,
    titleElement.parentElement?.querySelector('[class*="subtitle"]'),
    titleElement.parentElement?.querySelector('[class*="description"]'),
    titleElement.parentElement?.querySelector('p'),
    titleElement.parentElement?.querySelector('h2')
  ];
  
  for (const el of possibleSubtitles) {
    if (!el) continue;
    if (el.offsetWidth === 0 || el.offsetHeight === 0) continue;
    
    const text = el.textContent.trim();
    
    if (text.length < 5 || text.length > 100) continue;
    if (text.includes('$') || text.match(/\d+\.\d{2}/)) continue;
    
    const lowerText = text.toLowerCase();
    if (lowerText.includes('add to') || 
        lowerText.includes('buy now') ||
        lowerText.includes('select') ||
        lowerText.includes('choose')) {
      continue;
    }
    
    if (text.match(/\b(men's|women's|unisex|kids|shirt|jacket|pants|dress|sweater|hoodie|coat|jeans|shorts|half-zip|full-zip|pullover|cardigan|vest|blazer|skirt|top|tee|winterized)\b/i)) {
      console.log('   ✅ Found subtitle:', text);
      return text;
    }
  }
  
  return null;
}

function findProductName(productArea) {
  console.log('🔍 Finding product name...');
  
  const candidates = [];
  const searchArea = productArea || document.body;
  
  // Look for h1 first (most common)
  const h1Elements = searchArea.querySelectorAll('h1');
  for (const h1 of h1Elements) {
    if (h1.offsetWidth === 0 || h1.offsetHeight === 0) continue;
    
    const text = h1.textContent.trim();
    if (isValidProductName(text)) {
      // Check if this is a short brand/collection name that needs a subtitle
      if (text.length < 25 && !text.match(/\b(shirt|jacket|pants|dress|sweater|hoodie|coat|jeans)\b/i)) {
        const subtitle = findProductSubtitle(h1);
        if (subtitle) {
          const fullName = `${text} ${subtitle}`;
          console.log('   ✅ Found in h1 + subtitle:', fullName);
          return fullName;
        }
      }
      
      console.log('   ✅ Found in h1:', text);
      return text;
    }
  }
  
  // Look for elements with data-testid (modern sites)
  // Expanded to include typography-related test IDs (e.g., Uniqlo's ITOTypography)
  const testIdElements = searchArea.querySelectorAll('[data-testid*="product"], [data-testid*="title"], [data-testid*="name"], [data-testid*="Typography"], [data-testid*="typography"]');
  for (const el of testIdElements) {
    if (el.offsetWidth === 0 || el.offsetHeight === 0) continue;

    const text = el.textContent.trim();
    if (isValidProductName(text)) {
      const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
      const rect = el.getBoundingClientRect();

      // Boost score for typography elements that are large and near the top
      const isTypographyElement = el.getAttribute('data-testid')?.includes('Typography') ||
                                   el.getAttribute('data-testid')?.includes('typography');
      const typographyBonus = isTypographyElement && fontSize >= 16 ? 30 : 0;

      candidates.push({
        text,
        fontSize,
        top: rect.top,
        score: fontSize * (1 / (rect.top + 1)) + 50 + typographyBonus
      });
    }
  }
  
  // Look for product-title classes
  const titleElements = searchArea.querySelectorAll('[class*="product-title"], [class*="product-name"], [class*="ProductTitle"], [class*="ProductName"]');
  for (const el of titleElements) {
    if (el.offsetWidth === 0 || el.offsetHeight === 0) continue;
    
    const text = el.textContent.trim();
    if (isValidProductName(text)) {
      const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
      const rect = el.getBoundingClientRect();
      
      candidates.push({
        text,
        fontSize,
        top: rect.top,
        score: fontSize * (1 / (rect.top + 1)) + 30
      });
    }
  }
  
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    console.log('   ✅ Found best match:', best.text);
    return best.text;
  }
  
  console.log('   ❌ Could not find product name');
  return 'Product Name Not Found';
}

function isValidProductName(text) {
  if (!text) return false;
  
  if (text.length < 3 || text.length > 150) return false;
  if (text.includes('$') || text.match(/\d+\.\d{2}/)) return false;
  
  const excludeWords = ['menu', 'home', 'shop', 'cart', 'checkout', 'search', 'account', 'sign in', 'log in'];
  const lowerText = text.toLowerCase();
  if (excludeWords.includes(lowerText)) return false;
  
  if (text.match(/^\w+\s*\/\s*\w+/) || text.includes(' > ')) return false;
  
  // Exclude badge/label patterns
  if (text.length < 20 && text === text.toUpperCase() && !text.match(/\d/)) {
    console.log('   ⏭️ Skipping badge (all caps):', text);
    return false;
  }
  
  if (text.match(/^[A-Z][a-z]+:/)) {
    console.log('   ⏭️ Skipping label (has colon):', text);
    return false;
  }
  
  const badgePatterns = [
    'sustainable materials', 'eco-friendly', 'new arrival', 'best seller',
    'limited edition', 'exclusive', 'member', 'free shipping'
  ];
  
  for (const pattern of badgePatterns) {
    if (lowerText === pattern || lowerText === pattern.replace(/\s+/g, '')) {
      console.log('   ⏭️ Skipping badge:', text);
      return false;
    }
  }
  
  return true;
}

function findPrice(productArea) {
  console.log('🔍 Finding price...');

  const searchArea = productArea || document.body;
  const candidates = [];

  // ENHANCED: Also search all span and div elements, not just those with "price" in class
  // This handles sites like H&M that use obfuscated class names
  const priceElements = searchArea.querySelectorAll('[class*="price"], [id*="price"], [data-price], [data-testid*="price"], span, div');

  for (const el of priceElements) {
    // ENHANCEMENT: Don't skip hidden elements if they have price-related attributes
    // Many sites (like Abercrombie) use aria-hidden with actual visible nested children
    const hasStrongPriceIndicator =
      el.hasAttribute('data-testid') && el.getAttribute('data-testid').includes('price') ||
      el.hasAttribute('data-price') ||
      el.className.toLowerCase().includes('product-price');

    // Skip only if truly invisible AND doesn't have strong indicators
    if (!hasStrongPriceIndicator && (el.offsetWidth === 0 || el.offsetHeight === 0)) {
      continue;
    }

    const text = el.textContent.trim();

    // MULTI-CURRENCY: Try all currency patterns instead of just USD
    let matchedCurrency = null;
    let match = null;

    for (const [currencyCode, config] of Object.entries(CURRENCY_CONFIG)) {
      for (const pattern of config.patterns) {
        match = text.match(pattern);
        if (match) {
          matchedCurrency = currencyCode;
          break;
        }
      }
      if (match) break;
    }

    if (!match) continue;

    // ENHANCED: For elements without "price" in class, ensure text is ONLY a price (no other text)
    // This prevents matching navigation text like "Shop $50 and under"
    const isPriceOnlyText = text.length < 30 && text.replace(/[\$€£¥₱฿₫₩Rp\s\d.,]/g, '').length <= 2;
    const hasPriceInClass = el.className.toLowerCase().includes('price') || hasStrongPriceIndicator;

    if (match && (hasPriceInClass || isPriceOnlyText)) {
      // Use multi-currency parsing
      const numericPrice = parseInternationalPrice(text, matchedCurrency);
      if (numericPrice === 0) continue; // Skip invalid prices

      // Get bounding rect from first visible child if parent is hidden
      let rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Try to get rect from first visible descendant
        const visibleChild = el.querySelector('[aria-hidden="true"], span, div');
        if (visibleChild) {
          const childRect = visibleChild.getBoundingClientRect();
          if (childRect.width > 0) rect = childRect;
        }
      }

      // Get font size from deepest text-containing element
      let fontSize = parseFloat(window.getComputedStyle(el).fontSize);
      const textElement = el.querySelector('[class*="price-text"], span:last-child, div:last-child');
      if (textElement) {
        const childFontSize = parseFloat(window.getComputedStyle(textElement).fontSize);
        if (childFontSize > fontSize) fontSize = childFontSize;
      }

      const classList = el.className.toLowerCase();
      const hasPrice = classList.includes('price');

      // ENHANCEMENT: Bonus points for data-testid="product-price"
      const hasTestId = hasStrongPriceIndicator ? 25 : 0;

      const score =
        (fontSize / 10) * 30 +
        (rect.top < 500 ? 30 : 10) +
        (hasPrice ? 20 : 0) +
        hasTestId;

      candidates.push({
        price: match[0].trim(),
        numericPrice: numericPrice,
        currency: matchedCurrency,
        currencySymbol: CURRENCY_CONFIG[matchedCurrency].symbol,
        element: el,
        score,
        top: rect.top
      });
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    console.log(`   ✅ Found price: ${best.price} ${best.currency} (confidence: ${Math.min(best.score, 100).toFixed(0)}%)`);

    return {
      currentPrice: best.price,
      numericPrice: best.numericPrice,
      currency: best.currency,
      currencySymbol: best.currencySymbol,
      element: best.element,
      confidence: Math.min(best.score / 100, 1),
      method: 'focused-semantic'
    };
  }

  console.log('   ❌ Could not find price');
  return { currentPrice: 'Price not found' };
}

function findImages(productArea) {
  console.log('🔍 Finding images...');

  const searchArea = productArea || document.body;
  const images = [];
  const seenUrls = new Set(); // Prevent duplicates

  // ENHANCEMENT: For Uniqlo and similar sites, also check for media galleries outside productArea
  let searchAreas = [searchArea];

  // Check if there's a media gallery that might be outside the detected product area
  const mediaGallery = document.querySelector('.media-gallery, [class*="media-gallery"], [class*="product-images"], [class*="image-gallery"]');
  if (mediaGallery && !searchArea.contains(mediaGallery)) {
    console.log('   🔍 Found media gallery outside product area, including it in search');
    searchAreas.push(mediaGallery);
  }

  // Strategy 1: Look for img tags (with multiple src attributes)
  for (const area of searchAreas) {
    const allImages = area.querySelectorAll('img');

    for (const img of allImages) {
      const rect = img.getBoundingClientRect();
      if (rect.width < 150 || rect.height < 150) continue;

      // Try multiple image source attributes (lazy loading support)
      let imageUrl = img.src ||
                     img.getAttribute('data-src') ||
                     img.getAttribute('data-lazy-src') ||
                     img.getAttribute('data-original') ||
                     img.dataset.src;

      if (!imageUrl || imageUrl.startsWith('data:')) continue;

      // Skip logos, icons, placeholders
      const urlLower = imageUrl.toLowerCase();
      const altLower = (img.alt || '').toLowerCase();

      if (urlLower.includes('logo') ||
          urlLower.includes('icon') ||
          urlLower.includes('placeholder') ||
          urlLower.includes('blank') ||
          altLower.includes('logo')) {
        continue;
      }

      // Clean up the URL (remove query params for deduplication check)
      const cleanUrl = imageUrl.split('?')[0];

      if (!seenUrls.has(cleanUrl)) {
        seenUrls.add(cleanUrl);
        images.push(imageUrl);
        console.log(`   ✅ Found image: ${imageUrl.substring(0, 60)}...`);
      }

      if (images.length >= 3) break;
    }

    if (images.length >= 3) break;
  }

  // Strategy 2: If no images found, check picture elements
  if (images.length === 0) {
    console.log('   🔍 Trying <picture> elements...');
    const pictures = searchArea.querySelectorAll('picture source, picture img');

    for (const el of pictures) {
      const imageUrl = el.srcset?.split(' ')[0] ||
                       el.src ||
                       el.getAttribute('data-srcset')?.split(' ')[0];

      if (imageUrl && !imageUrl.startsWith('data:')) {
        const cleanUrl = imageUrl.split('?')[0];
        if (!seenUrls.has(cleanUrl)) {
          seenUrls.add(cleanUrl);
          images.push(imageUrl);
          console.log(`   ✅ Found image in <picture>: ${imageUrl.substring(0, 60)}...`);
        }
      }

      if (images.length >= 3) break;
    }
  }

  // Strategy 3: Check for background images (CSS)
  if (images.length === 0) {
    console.log('   🔍 Trying CSS background images...');
    const elementsWithBg = searchArea.querySelectorAll('[style*="background-image"], [class*="image"], [class*="product-img"]');

    for (const el of elementsWithBg) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 150 || rect.height < 150) continue;

      const bgImage = window.getComputedStyle(el).backgroundImage;
      if (bgImage && bgImage !== 'none') {
        const match = bgImage.match(/url\(['"]?([^'"()]+)['"]?\)/);
        if (match && match[1]) {
          const imageUrl = match[1];
          if (!imageUrl.startsWith('data:')) {
            const cleanUrl = imageUrl.split('?')[0];
            if (!seenUrls.has(cleanUrl)) {
              seenUrls.add(cleanUrl);
              images.push(imageUrl);
              console.log(`   ✅ Found background image: ${imageUrl.substring(0, 60)}...`);
            }
          }
        }
      }

      if (images.length >= 3) break;
    }
  }

  console.log(`   📸 Found ${images.length} total images`);
  return images;
}

// ============================================
// SALE DETECTION (Enhanced for Multiple Brands)
// ============================================

function detectSale(priceElement) {
  if (!priceElement) return { isSale: false };

  console.log('🔍 Checking for sale...');
  const reasons = [];

  // Check 1: Red/Green color styling (Uniqlo, H&M, Adidas, J.Crew, Aritzia)
  const color = window.getComputedStyle(priceElement).color;
  const bgColor = window.getComputedStyle(priceElement).backgroundColor;

  if (color.includes('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      // Red text (common sale indicator)
      if (r > 180 && r > g * 2 && r > b * 2) {
        reasons.push('red-color');
      }
    }
  }

  // Green background (Zara uses green highlight for sale)
  if (bgColor.includes('rgb')) {
    const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      if (g > 200 && g > r * 1.5 && g > b * 1.5) {
        reasons.push('green-background');
      }
    }
  }

  // Check 2: Sale-related classes (all brands use variations)
  // Check both the element itself AND its children
  const classList = priceElement.className.toLowerCase();
  const saleClassPatterns = [
    'sale', 'promo', 'discount', 'promotional', 'markdown',
    'on-sale', 'salecolor', 'sale-price', 'current-sale'
  ];

  for (const pattern of saleClassPatterns) {
    if (classList.includes(pattern)) {
      reasons.push(`sale-class:${pattern}`);
      break; // Only count once
    }
  }

  // Also check child elements for sale classes (in case priceElement is a container)
  if (reasons.length === 0) {
    const childrenWithSaleClass = priceElement.querySelectorAll('*');
    for (const child of childrenWithSaleClass) {
      const childClass = child.className.toLowerCase();
      for (const pattern of saleClassPatterns) {
        if (childClass.includes(pattern)) {
          reasons.push(`sale-class:${pattern}`);
          break;
        }
      }
      if (reasons.some(r => r.startsWith('sale-class:'))) break;
    }
  }

  // Check 3: Sale-related data attributes (Adidas, H&M, Banana Republic, Aritzia)
  const dataTestId = priceElement.getAttribute('data-testid')?.toLowerCase() || '';
  if (dataTestId.includes('sale') || dataTestId.includes('discount') || dataTestId.includes('markdown')) {
    reasons.push('sale-data-testid');
  }

  // Also check children for sale-related data-testid (Aritzia uses data-testid="product-list-sale-text")
  const childrenWithSaleTestId = priceElement.querySelectorAll('[data-testid*="sale"], [data-testid*="discount"], [data-testid*="markdown"], [data-testid*="percent"]');
  if (childrenWithSaleTestId.length > 0) {
    reasons.push('sale-data-testid-child');
  }

  // Check 4: Custom sale elements (Forever21)
  if (priceElement.tagName.toLowerCase() === 'sale-price' ||
      priceElement.closest('sale-price')) {
    reasons.push('sale-tag');
  }

  // Check 5: Look for strikethrough prices nearby (all brands)
  const container = priceElement.closest('[class*="price"], [class*="product"]') || priceElement.parentElement;
  let hasStrikethrough = false;
  let hasPercentageDiscount = false;

  if (container) {
    // Look for strikethrough elements (including Banana Republic's specific classes)
    const strikethroughElements = container.querySelectorAll('del, s, [class*="strike"], [class*="old-price"], [class*="original-price"], [class*="list-price"], [data-testid*="strikethrough"]');
    if (strikethroughElements.length > 0) {
      // Make sure at least one has a price in it
      const hasPrice = Array.from(strikethroughElements).some(el => {
        const text = el.textContent.trim();
        return text.includes('$') || /\d+\.\d{2}/.test(text);
      });
      if (hasPrice) {
        reasons.push('strikethrough-present');
        hasStrikethrough = true;
      }
    }

    // Check for text decoration strikethrough
    const allElements = container.querySelectorAll('*');
    for (const el of allElements) {
      const textDecoration = window.getComputedStyle(el).textDecoration;
      if (textDecoration.includes('line-through') && el !== priceElement) {
        const text = el.textContent.trim();
        if (text.includes('$') || text.match(/\d+\.\d{2}/)) {
          if (!hasStrikethrough) {
            reasons.push('line-through-price');
            hasStrikethrough = true;
          }
          break;
        }
      }
    }

    // Check 6: Multiple prices (indicates sale vs original)
    const allText = container.textContent;
    const priceMatches = allText.match(/\$\d+(?:\.\d{2})?/g);
    if (priceMatches && priceMatches.length >= 2) {
      reasons.push('multiple-prices');
    }

    // Check 7: Discount percentage indicators (H&M, Adidas, Zara, J.Crew, Banana Republic Factory, Nike)
    const percentagePatterns = [
      /-\d+%/, // "-17%"
      /\d+%\s*off/i, // "60% off" or "32% off"
      /\(\d+%\s*Off\)/i, // "(18% Off)"
      /\d+%/, // Generic percentage (catch-all for "32%")
    ];

    for (const pattern of percentagePatterns) {
      if (pattern.test(container.textContent)) {
        reasons.push('percentage-discount');
        hasPercentageDiscount = true;
        break;
      }
    }

    // Check 7.5: STRONG SALE INDICATOR - Strikethrough + Percentage Discount combo
    // This is a very reliable indicator that an item is on sale, even without "sale" text
    if (hasStrikethrough && hasPercentageDiscount) {
      reasons.push('strikethrough-plus-percentage-combo');
      console.log('   🎯 STRONG SALE SIGNAL: Strikethrough price + percentage discount detected');
    }

    // Check 8: Sale flag/badge text (Uniqlo, general)
    const textContent = container.textContent.toLowerCase();
    if (textContent.includes('sale,') ||
        textContent.includes('on sale') ||
        /\bsale\b/.test(textContent)) {
      // Make sure it's not just in a class name
      const hasVisibleSaleText = Array.from(container.querySelectorAll('*')).some(el => {
        const text = el.textContent.toLowerCase().trim();
        return text === 'sale' || text.startsWith('sale,') || text.includes('on sale');
      });

      if (hasVisibleSaleText) {
        reasons.push('sale-text');
      }
    }
  }

  const isSale = reasons.length > 0;
  if (isSale) {
    console.log(`   ✅ Sale detected (${reasons.join(', ')})`);
  } else {
    console.log('   ℹ️ No sale indicators found');
  }

  return {
    isSale,
    reasons,
    confidence: Math.min(reasons.length * 0.25, 1)
  };
}

// ============================================
// MAIN ORCHESTRATION
// ============================================

async function detectProductInfo() {
  console.log('🪞 ===== STARTING PRODUCT DETECTION v3.1 =====');
  
  if (isPageStillLoading()) {
    await waitForContent(3000);
  }
  
  const structured = detectStructuredData();
  if (structured) {
    console.log('✅ Using structured data (95% confidence)');
    return {
      name: structured.name,
      price: structured.price,
      images: structured.image ? [structured.image] : [],
      saleInfo: structured.isSale ? { isSale: true, originalPrice: structured.originalPrice } : null,
      confidence: 0.95,
      method: 'structured-data'
    };
  }
  
  const productArea = identifyMainProductArea();
  const name = findProductName(productArea);
  const priceInfo = findPrice(productArea);
  const images = findImages(productArea);
  
  let saleInfo = null;
  if (priceInfo.element) {
    saleInfo = detectSale(priceInfo.element);
    if (!saleInfo.isSale) saleInfo = null;
  }
  
  console.log('🪞 ===== DETECTION COMPLETE =====');
  console.log('   Name:', name);
  console.log('   Price:', priceInfo.currentPrice);
  console.log('   Currency:', priceInfo.currency || 'USD');
  console.log('   Images:', images.length);
  console.log('   Sale:', saleInfo ? 'Yes' : 'No');

  return {
    name,
    price: priceInfo.currentPrice,
    numericPrice: priceInfo.numericPrice,
    currency: priceInfo.currency || 'USD',
    currencySymbol: priceInfo.currencySymbol || '$',
    images,
    saleInfo,
    confidence: priceInfo.confidence || 0.7,
    method: priceInfo.method || 'focused-semantic'
  };
}

// ============================================
// SAVE FUNCTIONALITY
// ============================================

async function addSaveButton() {
  if (document.getElementById('dressing-room-save-btn')) return;
  
  const button = document.createElement('button');
  button.id = 'dressing-room-save-btn';
  button.innerHTML = '🪞 Save to Dressing Room';
  button.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    padding: 12px 20px; background: linear-gradient(135deg, #f5f1eb 0%, #e8e0d6 100%);
    color: #5a4a3a; border: 2px solid #d4a574; border-radius: 24px; cursor: pointer;
    font-size: 14px; font-weight: 600; box-shadow: 0 4px 16px rgba(139, 115, 85, 0.2);
    transition: all 0.3s ease; font-family: system-ui, sans-serif;
  `;

  button.onmouseover = () => {
    button.style.background = 'linear-gradient(135deg, #d4a574 0%, #a8947a 100%)';
    button.style.color = '#faf9f7';
  };
  
  button.onmouseout = () => {
    button.style.background = 'linear-gradient(135deg, #f5f1eb 0%, #e8e0d6 100%)';
    button.style.color = '#5a4a3a';
  };

  button.onclick = saveProduct;
  document.body.appendChild(button);
  
  console.log('🪞 Save button added');
  saveButtonEnabled = true;
}

function removeSaveButton() {
  const button = document.getElementById('dressing-room-save-btn');
  if (button) {
    button.remove();
    console.log('🪞 Save button removed');
  }
  saveButtonEnabled = false;
}

async function saveProduct() {
  let button = null;
  
  try {
    button = document.getElementById('dressing-room-save-btn');
    if (button) {
      button.textContent = '⏳ Detecting...';
      button.disabled = true;
    }

    const productInfo = await detectProductInfo();
    
    if (!productInfo.price || productInfo.price === 'Price not found') {
      throw new Error('Could not find product price');
    }
    
    if (!productInfo.name || productInfo.name === 'Product Name Not Found') {
      throw new Error('Could not find product name');
    }
    
    if (button) button.textContent = '⏳ Saving...';

    const url = window.location.href;
    const store = extractBrand(window.location.hostname);
    const timestamp = new Date().toISOString();

    const priceEntry = {
      price: productInfo.price,
      timestamp,
      numericPrice: productInfo.numericPrice || parsePrice(productInfo.price),
      currency: productInfo.currency,
      currencySymbol: productInfo.currencySymbol,
      isSale: productInfo.saleInfo?.isSale || false,
      confidence: productInfo.confidence,
      method: productInfo.method
    };

    if (productInfo.saleInfo) {
      priceEntry.saleReasons = productInfo.saleInfo.reasons;
    }

    const product = {
      name: productInfo.name,
      price: productInfo.price,
      currency: productInfo.currency,
      currencySymbol: productInfo.currencySymbol,
      image: productInfo.images[0] || '',
      images: productInfo.images,
      url,
      store,
      savedAt: timestamp,
      priceHistory: [priceEntry],
      detectionMethod: productInfo.method,
      detectionConfidence: productInfo.confidence
    };

    console.log('🪞 Saving product:', product);

    chrome.storage.local.get(['products'], function (result) {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
        if (button) button.textContent = '❌ Error';
        return;
      }

      const products = result.products || [];
      const existingIndex = products.findIndex(p => p.url === product.url);
      
      if (existingIndex !== -1) {
        const existing = products[existingIndex];
        products[existingIndex] = {
          ...existing,
          price: product.price,
          currency: product.currency,
          currencySymbol: product.currencySymbol,
          updatedAt: timestamp,
          priceHistory: [...(existing.priceHistory || []), priceEntry],
          detectionMethod: product.detectionMethod,
          detectionConfidence: product.detectionConfidence
        };

        if (button) button.textContent = '📈 Updated!';
      } else {
        products.push(product);
        if (button) button.textContent = '✅ Saved!';
      }

      chrome.storage.local.set({ products: products }, () => {
        console.log('🪞 ===== SAVE COMPLETE =====');
        
        setTimeout(() => {
          if (button) {
            button.textContent = '🪞 Save to Dressing Room';
            button.disabled = false;
          }
        }, 2000);
      });
    });

  } catch (error) {
    console.error('🪞 Save error:', error);
    if (button) {
      button.textContent = '❌ ' + error.message;
      setTimeout(() => {
        if (button) {
          button.textContent = '🪞 Save to Dressing Room';
          button.disabled = false;
        }
      }, 4000);
    }
  }
}

// ============================================
// MESSAGE HANDLER
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🪞 Received message:', request);
  
  try {
    if (request.action === 'toggleSaveButton') {
      const button = document.getElementById('dressing-room-save-btn');
      if (button) {
        removeSaveButton();
        sendResponse({ success: true, buttonVisible: false });
      } else {
        addSaveButton();
        sendResponse({ success: true, buttonVisible: true });
      }
    } else if (request.action === 'showSaveButton') {
      addSaveButton();
      sendResponse({ success: true, buttonVisible: true });
    } else if (request.action === 'hideSaveButton') {
      removeSaveButton();
      sendResponse({ success: true, buttonVisible: false });
    } else if (request.action === 'checkButtonState') {
      const button = document.getElementById('dressing-room-save-btn');
      sendResponse({ success: true, buttonVisible: !!button });
    }
  } catch (error) {
    console.error('🪞 Message handler error:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true;
});

console.log('🪞 DRESSING ROOM v3.1: Ready with Phase 1 enhancements!');