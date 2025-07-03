// Helper: extract brand name from hostname
function extractBrand(hostname) {
  if (hostname.includes('uniqlo')) return 'Uniqlo';
  if (hostname.includes('hm.com')) return 'H&M';
  if (hostname.includes('everlane')) return 'Everlane';
  if (hostname.includes('zara')) return 'Zara';
  
  // Clean up hostname for display
  return hostname.replace(/^www\./, '').split('.')[0].charAt(0).toUpperCase() + 
         hostname.replace(/^www\./, '').split('.')[0].slice(1);
}

// Wait for content to load if needed
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }
    
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Timeout after specified time
    setTimeout(() => {
      observer.disconnect();
      reject(new Error('Element not found within timeout'));
    }, timeout);
  });
}

async function addSaveButton() {
  try {
    // Wait for page content to load
    await waitForElement('h1, h2, .product-name, [data-testid*="product"], .product-title');
  } catch (error) {
    console.log('Product element not found, adding button anyway');
  }

  // Check if button already exists
  if (document.getElementById('dressing-room-save-btn')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'dressing-room-save-btn';
  button.innerText = '👗 Save to Dressing Room';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    padding: 10px 15px;
    background: #0077cc;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    transition: all 0.2s ease;
  `;

  button.onmouseover = () => {
    button.style.background = '#005fa3';
    button.style.transform = 'translateY(-1px)';
  };
  
  button.onmouseout = () => {
    button.style.background = '#0077cc';
    button.style.transform = 'translateY(0)';
  };

  button.onclick = saveProduct;
  document.body.appendChild(button);
}

function findPrice() {
  // Comprehensive price selectors - order matters (most specific first)
  const priceSelectors = [
    // Common price classes
    '.price-current',
    '.current-price',
    '.sale-price',
    '.price-now',
    '.price-reduced',
    '.price-final',
    '.price-special',
    '.price-display',
    '.price-value',
    '.price-amount',
    '.price-box .price',
    '.pricing .price',
    '.product-price .price',
    '.price-container .price',
    '.price-wrapper .price',
    
    // Data attributes
    '[data-price]',
    '[data-current-price]',
    '[data-sale-price]',
    '[data-price-current]',
    '[data-testid*="price"]',
    '[data-cy*="price"]',
    '[aria-label*="price"]',
    
    // Generic price classes
    '.price',
    '.product-price',
    '.pricing',
    '.cost',
    '.amount',
    '.money',
    '.currency',
    
    // Brand-specific selectors
    '.price-group .price', // Common pattern
    '.price-info .price',
    '.price-section .price',
    '.pdp-price', // Product detail page price
    '.product-detail-price',
    '.item-price',
    '.regular-price',
    '.retail-price',
    '.list-price',
    '.msrp',
    
    // Fallback to any element containing price-like text
    '*[class*="price"]',
    '*[id*="price"]'
  ];

  for (const selector of priceSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.textContent || element.getAttribute('data-price') || element.getAttribute('content');
      if (text && /\$\d+|\d+\.\d{2}|USD|EUR|GBP/.test(text)) {
        // Skip if it's clearly not a price (like a product ID)
        if (!/^\d{8,}$/.test(text.replace(/\D/g, ''))) {
          return text.trim();
        }
      }
    }
  }

  // Last resort: look for any text that looks like a price
  const allElements = document.querySelectorAll('*');
  for (const element of allElements) {
    const text = element.textContent;
    if (text && text.length < 50) { // Reasonable price text length
      const match = text.match(/\$\d+(?:\.\d{2})?|\d+\.\d{2}\s*(?:USD|EUR|GBP)/i);
      if (match && element.children.length === 0) { // Leaf node
        return match[0];
      }
    }
  }

  return 'Price not found';
}

function findProductName() {
  const nameSelectors = [
    'h1[data-testid*="product"]',
    'h1[class*="product"]',
    'h1[class*="title"]',
    '.product-name h1',
    '.product-title h1',
    '.product-info h1',
    '.product-details h1',
    '.product-summary h1',
    '.pdp-product-name',
    '.product-display-name',
    '.item-name',
    '.product-item-name',
    'h1',
    'h2[class*="product"]',
    'h2[class*="title"]',
    'h2',
    '.product-name',
    '.product-title',
    '.title',
    '.name'
  ];

  for (const selector of nameSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }

  return 'Product Name Not Found';
}

function findProductImage() {
  const imageSelectors = [
    '.product-image img',
    '.product-images img',
    '.product-photo img',
    '.product-gallery img',
    '.primary-image img',
    '.main-image img',
    '.hero-image img',
    '.pdp-image img',
    '.product-detail-image img',
    'img[class*="product"]',
    'img[data-testid*="product"]',
    'img[alt*="product"]',
    '.carousel img',
    '.slider img',
    '.gallery img',
    'img'
  ];

  for (const selector of imageSelectors) {
    const img = document.querySelector(selector);
    if (img && img.src && !img.src.includes('placeholder') && img.width > 100) {
      return img.src;
    }
  }

  return '';
}

async function saveProduct() {
  try {
    const button = document.getElementById('dressing-room-save-btn');
    if (button) {
      button.textContent = '⏳ Saving...';
      button.disabled = true;
    }

    const hostname = window.location.hostname;
    const name = findProductName();
    const price = findPrice();
    const image = findProductImage();
    const url = window.location.href;
    const store = extractBrand(hostname);

    const product = {
      name,
      price,
      image,
      url,
      store,
      savedAt: new Date().toISOString()
    };

    chrome.storage.local.get(['products'], function (result) {
      const products = result.products || [];
      products.push(product);
      chrome.storage.local.set({ products: products }, () => {
        if (button) {
          button.textContent = '✅ Saved!';
          setTimeout(() => {
            button.textContent = '👗 Save to Dressing Room';
            button.disabled = false;
          }, 2000);
        }
      });
    });
  } catch (error) {
    console.error('Error saving product:', error);
    const button = document.getElementById('dressing-room-save-btn');
    if (button) {
      button.textContent = '❌ Error';
      setTimeout(() => {
        button.textContent = '👗 Save to Dressing Room';
        button.disabled = false;
      }, 2000);
    }
  }
}

// Run when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addSaveButton);
} else {
  addSaveButton();
}

// Also run when URL changes (for SPAs)
let currentUrl = window.location.href;
setInterval(() => {
  if (currentUrl !== window.location.href) {
    currentUrl = window.location.href;
    setTimeout(addSaveButton, 1000); // Delay to let page load
  }
}, 1000);