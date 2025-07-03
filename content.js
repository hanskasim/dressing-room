// Helper: extract brand name from hostname
function extractBrand(hostname) {
    if (hostname.includes('uniqlo')) return 'Uniqlo';
    if (hostname.includes('hm.com')) return 'H&M';
    if (hostname.includes('everlane')) return 'Everlane';
    if (hostname.includes('zara')) return 'Zara';
    // Add more brands here as needed
    return hostname;
  }
  
  // Wait for content to load if needed
  function waitForElement(selector) {
    return new Promise(resolve => {
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
    });
  }
  
  async function addSaveButton() {
    // Wait for h1 (product name) or other product elements to appear
    await waitForElement('h1');
  
    const button = document.createElement('button');
    button.innerText = '👗 Save to Dressing Room';
    button.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:8px 12px; background:#0077cc; color:white; border:none; border-radius:4px; cursor:pointer;';
  
    button.onclick = saveProduct;
  
    document.body.appendChild(button);
  }
  
  async function saveProduct() {
    try {
      const hostname = window.location.hostname;
  
      // Extract product name with fallback
      const nameEl = document.querySelector('h1') || document.querySelector('h2') || document.querySelector('.product-name');
      const name = nameEl ? nameEl.innerText.trim() : 'Unknown Product';
  
      // Extract price with multiple fallbacks
      const priceEl =
        document.querySelector('.price') ||
        document.querySelector('[data-price]') ||
        document.querySelector('.product-price') ||
        document.querySelector('.pricing') ||
        document.querySelector('.sale-price');
  
      const price = priceEl ? priceEl.innerText.trim() : '$0.00';
  
      // Extract image - common selectors fallback
      const imgEl =
        document.querySelector('.product-image img') ||
        document.querySelector('.primary-image img') ||
        document.querySelector('img.product-main-image') ||
        document.querySelector('img');
  
      const image = imgEl ? imgEl.src : '';
  
      // URL
      const url = window.location.href;
  
      // Normalize store name
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
          alert('Saved to Dressing Room!');
        });
      });
    } catch (error) {
      alert('Error saving product: ' + error.message);
    }
  }
  
  // Run when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addSaveButton);
  } else {
    addSaveButton();
  }
  