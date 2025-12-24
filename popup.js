// ============================================
// GLOBAL STATE MANAGEMENT
// ============================================

const ITEMS_PER_PAGE = 5;
let currentPage = 1;
let allProducts = [];
let filteredStore = null;
let saveButtonVisible = false;
let showingFavorites = false;
let activePreview = null;
let showingAllBrands = false;
let brandSearchTerm = '';
let currentSort = 'date-desc'; // Default sort by newest first

// ============================================
// BRAND CONFIGURATION
// ============================================

// Store mapping for major brands to their domains
const BRAND_DOMAINS = {
  'Uniqlo': 'uniqlo.com',
  'H&M': 'hm.com', 
  'Zara': 'zara.com',
  'Nike': 'nike.com',
  'Adidas': 'adidas.com',
  'Gap': 'gap.com',
  'Old Navy': 'oldnavy.com',
  'Banana Republic': 'bananarepublic.com',
  'J.Crew': 'jcrew.com',
  'Madewell': 'madewell.com',
  'Everlane': 'everlane.com',
  'Reformation': 'thereformation.com',
  'Patagonia': 'patagonia.com',
  'Levi\'s': 'levi.com',
  'Levis': 'levi.com',
  'Calvin Klein': 'calvinklein.com',
  'Tommy Hilfiger': 'tommy.com',
  'Ralph Lauren': 'ralphlauren.com',
  'Urban Outfitters': 'urbanoutfitters.com',
  'Free People': 'freepeople.com',
  'Anthropologie': 'anthropologie.com',
  'Nordstrom': 'nordstrom.com',
  'Macy\'s': 'macys.com',
  'Target': 'target.com',
  'Walmart': 'walmart.com',
  'Amazon': 'amazon.com'
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function parsePrice(priceStr) {
  if (!priceStr || priceStr === 'Price not found') return 0;
  
  const cleaned = priceStr.replace(/[,$Â£â‚¬Â¥â‚¹]/g, '').replace(/\s+/g, ' ').trim();
  const patterns = [
    /(\d+\.?\d*)/,
    /(\d+,\d+\.?\d*)/,
    /(\d+\.\d{2})/,
    /(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }
  return 0;
}

function generateSimpleLogo(letter, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 16, 16);
  
  return canvas.toDataURL();
}

function optimizeImageUrl(imageUrl) {
  if (!imageUrl || imageUrl.includes('placeholder')) {
    return imageUrl;
  }
  
  try {
    const url = new URL(imageUrl);
    const hostname = url.hostname.toLowerCase();
    
    // Site-specific image optimization
    if (hostname.includes('nike.com')) {
      if (!url.search.includes('wid=')) {
        url.searchParams.set('wid', '120');
        url.searchParams.set('hei', '120');
      }
    } else if (hostname.includes('adidas.com')) {
      if (!url.search.includes('width=')) {
        url.searchParams.set('width', '120');
        url.searchParams.set('height', '120');
      }
    } else if (hostname.includes('hm.com')) {
      const pathParts = url.pathname.split('/');
      if (pathParts.length > 2) {
        url.pathname = url.pathname.replace(/\/\d+x\d+\//, '/120x120/');
      }
    } else if (hostname.includes('bananarepublic') || hostname.includes('gap.com')) {
      url.searchParams.set('wid', '120');
      url.searchParams.set('hei', '120');
    }
    
    return url.toString();
  } catch (error) {
    return imageUrl;
  }
}

function getBrandIcon(store, productUrl = null) {
  if (!store) return 'https://via.placeholder.com/32?text=?';
  
  let domain = null;
  if (productUrl) {
    try {
      const url = new URL(productUrl);
      domain = url.hostname.replace('www.', '');
    } catch (e) {
      // Invalid URL, will use fallback domain
    }
  }
  
  if (!domain && BRAND_DOMAINS[store]) {
    domain = BRAND_DOMAINS[store];
  }
  
  if (!domain) {
    const cleanStoreName = store.toLowerCase().replace(/[^a-z0-9]/g, '');
    domain = `${cleanStoreName}.com`;
  }
  
  if (domain) {
    const clearbitUrl = `https://logo.clearbit.com/${domain}`;
    const img = new Image();
    img.src = clearbitUrl;
    img.onload = function() {
      updateBrandIcon(store, clearbitUrl);
    };
    img.onerror = function() {
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      updateBrandIcon(store, faviconUrl);
    };
    return clearbitUrl;
  }
  
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
  const color = colors[store.charCodeAt(0) % colors.length];
  const letter = store.charAt(0).toUpperCase();
  
  return generateSimpleLogo(letter, color);
}

function updateBrandIcon(store, newIconUrl) {
  const brandIcons = document.querySelectorAll(`.brand-icon[alt="${store}"]`);
  brandIcons.forEach(icon => {
    const testImg = new Image();
    testImg.onload = function() {
      icon.src = newIconUrl;
    };
    testImg.src = newIconUrl;
  });
}

// ============================================
// BRAND MANAGEMENT
// ============================================

// Brand usage tracking and priority functions
function updateBrandUsage(store) {
  chrome.storage.local.get(['brandUsage'], (result) => {
    const brandUsage = result.brandUsage || {};
    brandUsage[store] = Date.now();
    chrome.storage.local.set({ brandUsage: brandUsage });
  });
}

function getBrandPriority(brand) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['brandUsage'], (result) => {
      const itemCount = allProducts.filter(p => p.store === brand).length;
      const brandUsage = result.brandUsage || {};
      const lastUsed = brandUsage[brand] || 0;
      const daysSinceUsed = (Date.now() - lastUsed) / (1000 * 60 * 60 * 24);
      
      // Higher score = higher priority
      let score = itemCount * 2; // 2 points per item
      
      // Recency bonus (more points for recent usage)
      if (daysSinceUsed < 1) score += 10;      // Used today
      else if (daysSinceUsed < 7) score += 5;  // Used this week
      else if (daysSinceUsed < 30) score += 2; // Used this month
      
      resolve(score);
    });
  });
}

async function sortBrandsByPriority(brands) {
  const brandsWithPriority = await Promise.all(
    brands.map(async (brand) => ({
      brand,
      priority: await getBrandPriority(brand)
    }))
  );
  
  return brandsWithPriority
    .sort((a, b) => b.priority - a.priority)
    .map(item => item.brand);
}

function getUniqueBrands() {
  return [...new Set(allProducts.map(p => p.store?.trim()).filter(Boolean))];
}

// ============================================
// SAVE BUTTON MANAGEMENT
// ============================================

// Check current button state without auto-restoring
function checkSaveButtonState() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    
    // Send message to check current button state
    chrome.tabs.sendMessage(activeTab.id, { action: 'checkButtonState' }, (response) => {
      if (chrome.runtime.lastError) {
        // Default to false if we can't check
        saveButtonVisible = false;
        updateToggleButtonText();
        return;
      }
      
      if (response && response.success) {
        saveButtonVisible = response.buttonVisible;
        updateToggleButtonText();
      }
    });
  });
}

// Update toggle button text based on current state
function updateToggleButtonText() {
  const button = document.getElementById('save-toggle-btn');
  if (button) {
    if (saveButtonVisible) {
      button.textContent = 'Hide Save Button';
      button.classList.add('active');
    } else {
      button.textContent = 'Show Save Button';
      button.classList.remove('active');
    }
  }
}

function toggleSaveButton() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    
    // First ensure content script is injected
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ['content.js']
    }, () => {
      // Try to send message even if script was already injected
      chrome.tabs.sendMessage(activeTab.id, { action: 'toggleSaveButton' }, (response) => {
        if (chrome.runtime.lastError) {
          // Message failed - content script may not be ready
        }
        
        if (response && response.success) {
          saveButtonVisible = response.buttonVisible;
          updateToggleButtonText();
        }
      });
    });
  });
}

// ============================================
// PRODUCT FAVORITES
// ============================================

function toggleFavorite(productIndex) {
  const product = allProducts[productIndex];
  if (!product) return;
  
  product.isFavorite = !product.isFavorite;
  
  chrome.storage.local.set({ products: allProducts }, () => {
    renderProducts();
  });
}

// ============================================
// PRICE HISTORY & TRACKING
// ============================================

function getPriceTrend(item) {
  if (!item.priceHistory || item.priceHistory.length < 2) {
    return { trend: 'stable', text: '', class: '' };
  }
  
  const history = item.priceHistory;
  const previousPrice = history[history.length - 2].numericPrice;
  const lastPrice = history[history.length - 1].numericPrice;
  
  if (lastPrice > previousPrice) {
    const increase = ((lastPrice - previousPrice) / previousPrice * 100).toFixed(1);
    return { 
      trend: 'up', 
      text: `+${increase}%`, 
      class: 'price-trend-up' 
    };
  } else if (lastPrice < previousPrice) {
    const decrease = ((previousPrice - lastPrice) / previousPrice * 100).toFixed(1);
    return { 
      trend: 'down', 
      text: `-${decrease}%`, 
      class: 'price-trend-down' 
    };
  }
  
  return { trend: 'stable', text: 'stable', class: 'price-trend-stable' };
}

function formatPriceHistory(item) {
  if (!item.priceHistory || item.priceHistory.length <= 1) {
    return '<div class="no-history">No price changes yet</div>';
  }
  
  const history = item.priceHistory;
  const historyHtml = history.map((entry, index) => {
    const date = new Date(entry.timestamp).toLocaleDateString();
    const time = new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const isLatest = index === history.length - 1;
    
    // Add sale indicator to price history
    let priceDisplay = entry.price;
    if (entry.isSale && entry.originalPrice) {
      priceDisplay = `<span class="history-original-price">${entry.originalPrice}</span> <span class="history-sale-price">${entry.price}</span> <span class="history-sale-badge">SALE</span>`;
    }
    
    return `<div class="history-entry ${isLatest ? 'latest' : ''}">
      <div class="history-date-time">
        <span class="history-date">${date}</span>
        <span class="history-time">${time}</span>
        ${isLatest ? '<span class="latest-badge">Current</span>' : ''}
      </div>
      <span class="history-price">${priceDisplay}</span>
    </div>`;
  }).join('');
  
  return `<div class="price-history-list">${historyHtml}</div>`;
}

function formatPriceDisplay(item) {
  const displayPrice = item.price === 'Price not found' ? 'Price not available' : item.price;
  const trend = getPriceTrend(item);
  
  let priceHtml = `<div class="price-container"><span class="current-price">${displayPrice}</span></div>`;
  
  if (trend.text) {
    priceHtml += `<div class="price-trend ${trend.class}">${trend.text}</div>`;
  }
  
  return priceHtml;
}

function togglePriceHistory(productIndex) {
  const historyDiv = document.getElementById(`history-${productIndex}`);
  const toggleBtn = document.getElementById(`toggle-${productIndex}`);
  
  if (!historyDiv || !toggleBtn) {
    return;
  }
  
  if (historyDiv.style.display === 'none' || !historyDiv.style.display) {
    historyDiv.style.display = 'block';
    toggleBtn.textContent = '📈 Hide History';
    toggleBtn.classList.add('active');
  } else {
    historyDiv.style.display = 'none';
    toggleBtn.textContent = '📊 Price History';
    toggleBtn.classList.remove('active');
  }
}

// ============================================
// PRODUCT PREVIEW
// ============================================

function showProductPreview(productIndex, clickedElement) {
  const product = allProducts[productIndex];
  if (!product) return;

  activePreview = productIndex;
  
  // Remove active state from all products and add to clicked one
  document.querySelectorAll('.product.preview-active').forEach(el => {
    el.classList.remove('preview-active');
  });
  clickedElement.classList.add('preview-active');

  // Create and show preview in sidebar
  const previewContent = createPreviewContent(product, productIndex);
  document.getElementById('preview-content').innerHTML = previewContent;
  
  // Show sidebar and expand popup
  document.body.classList.add('preview-open');
  document.getElementById('preview-sidebar').classList.add('open');
  
  // Add event listeners after content is inserted
  setTimeout(() => {
    // Close button event listener
    const closeBtn = document.getElementById('close-preview-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeProductPreview);
    }
    
    // Image dot event listeners
    const imageDots = document.querySelectorAll('.preview-images .image-dot');
    imageDots.forEach((dot, index) => {
      dot.addEventListener('click', () => showPreviewImage(index));
    });
  }, 50);
}

function closeProductPreview() {
  // Hide sidebar and shrink popup
  document.body.classList.remove('preview-open');
  document.getElementById('preview-sidebar').classList.remove('open');
  
  // Remove active state from all products
  document.querySelectorAll('.product.preview-active').forEach(el => {
    el.classList.remove('preview-active');
  });
  
  // Clear preview content
  setTimeout(() => {
    document.getElementById('preview-content').innerHTML = '';
  }, 300); // Wait for animation to complete
  
  activePreview = null;
}

function createPreviewContent(product, productIndex) {
  const trend = getPriceTrend(product);
  const savedPrice = product.priceHistory && product.priceHistory.length > 0 
    ? product.priceHistory[0].price 
    : product.price;
  
  const images = product.images || [product.image];
  const imageCarouselHTML = images.length > 1 ? createImageCarousel(images) : 
    `<div class="preview-single-image">
      <img src="${images[0] || 'https://via.placeholder.com/280x180?text=No+Image'}" alt="${product.name}" style="width: 100%; border-radius: 8px;" />
    </div>`;
  
  const colorsHTML = createColorOptionsHTML(product.colors);
  const sizesHTML = createSizeInfoHTML(product.sizes);
  
  const content = `
    <div class="preview-sidebar-header">
      <div class="preview-sidebar-title">Product Details</div>
      <button class="minimize-btn" id="close-preview-btn">Close x</button>
    </div>
    
    <div class="preview-header">
      <div class="preview-title">
        <a href="${product.url}" target="_blank" rel="noopener noreferrer" 
           class="preview-product-link">${product.name}</a>
      </div>
      <div class="preview-brand">${product.store}</div>
    </div>

    ${imageCarouselHTML}

    <div class="preview-details">
      <div class="price-comparison">
        <div>
          <div class="price-saved">Saved: ${savedPrice}</div>
          <div class="price-current">Current: ${product.price}</div>
        </div>
        ${trend.text ? `<div class="price-change ${trend.class.replace('price-trend-', '')}">${trend.text}</div>` : ''}
      </div>

      ${colorsHTML || sizesHTML ? `
        <div class="variants-info">
          ${colorsHTML}
          ${sizesHTML}
        </div>
      ` : ''}

      ${product.material ? `<div class="material-info">${product.material}</div>` : ''}
    </div>
  `;
  
  return content;
}

function createImageCarousel(images) {
  // Only show carousel if we have multiple valid images
  const validImages = images.filter(img => img && img !== '' && !img.includes('placeholder'));
  
  if (validImages.length <= 1) {
    return `<div class="preview-single-image">
      <img src="${validImages[0] || images[0] || 'https://via.placeholder.com/280x240?text=No+Image'}" alt="Product" style="width: 100%; height: 240px; object-fit: cover; border-radius: 8px;" />
    </div>`;
  }
  
  const imageElements = validImages.map((src, index) => 
    `<img src="${src}" class="preview-image" data-index="${index}" alt="Product image ${index + 1}" 
         style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; opacity: ${index === 0 ? '1' : '0'}; transition: opacity 0.3s ease;" />`
  ).join('');
  
  const dots = validImages.map((_, index) => 
    `<div class="image-dot" data-index="${index}"
         style="width: 6px; height: 6px; border-radius: 50%; background: ${index === 0 ? 'white' : 'rgba(255, 255, 255, 0.5)'}; cursor: pointer; transition: all 0.3s ease;"></div>`
  ).join('');
  
  return `
    <div class="preview-images" style="position: relative; height: 240px; margin-bottom: 16px; border-radius: 8px; overflow: hidden; background: var(--warm-beige);">
      ${imageElements}
      <div class="image-dots" style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px;">
        ${dots}
      </div>
    </div>
  `;
}

function showPreviewImage(index) {
  const images = document.querySelectorAll('.preview-images .preview-image');
  const dots = document.querySelectorAll('.preview-images .image-dot');
  
  images.forEach((img, i) => {
    if (i === index) {
      img.style.opacity = '1';
    } else {
      img.style.opacity = '0';
    }
  });
  
  dots.forEach((dot, i) => {
    if (i === index) {
      dot.style.background = 'white';
      dot.style.transform = 'scale(1.2)';
    } else {
      dot.style.background = 'rgba(255, 255, 255, 0.5)';
      dot.style.transform = 'scale(1)';
    }
  });
}

function createColorOptionsHTML(colors) {
  if (!colors || colors.length === 0) return '';
  
  const colorDots = colors.slice(0, 5).map(color => {
    const bgStyle = color.color && color.color !== 'rgba(0, 0, 0, 0)' 
      ? `style="background-color: ${color.color};"` 
      : 'style="background: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%); background-size: 6px 6px; background-position: 0 0, 0 3px, 3px -3px, -3px 0px;"';
    
    return `<div class="color-dot" ${bgStyle} title="${color.name}"></div>`;
  }).join('');
  
  const moreText = colors.length > 5 ? ` +${colors.length - 5} more` : '';
  
  return `
    <div class="color-variants">
      <span>${colors.length} color${colors.length !== 1 ? 's' : ''}${moreText}:</span>
      <div class="color-dots-container">${colorDots}</div>
    </div>
  `;
}

function createSizeInfoHTML(sizes) {
  if (!sizes || sizes.length === 0) return '';
  
  const sizeRange = sizes.length > 3 
    ? `${sizes[0]} - ${sizes[sizes.length - 1]} (${sizes.length} sizes)`
    : sizes.join(', ');
  
  return `<div class="size-info">${sizeRange}</div>`;
}

// ============================================
// PRODUCT SORTING & FILTERING
// ============================================

function getSortedProducts() {
  let products = allProducts;

  // Apply filters
  if (showingFavorites && filteredStore) {
    products = products.filter(p =>
      p.isFavorite && p.store?.toLowerCase() === filteredStore.toLowerCase()
    );
  } else if (showingFavorites) {
    products = products.filter(p => p.isFavorite);
  } else if (filteredStore) {
    products = products.filter(p => p.store?.toLowerCase() === filteredStore.toLowerCase());
  }

  // Apply sorting
  return products.sort((a, b) => {
    switch (currentSort) {
      case 'date-desc':
        // Newest first (default)
        const dateADesc = new Date(a.updatedAt || a.savedAt);
        const dateBDesc = new Date(b.updatedAt || b.savedAt);
        return dateBDesc - dateADesc;

      case 'date-asc':
        // Oldest first
        const dateAAsc = new Date(a.updatedAt || a.savedAt);
        const dateBAsc = new Date(b.updatedAt || b.savedAt);
        return dateAAsc - dateBAsc;

      case 'price-asc':
        // Price: Low to High
        return parsePrice(a.price) - parsePrice(b.price);

      case 'price-desc':
        // Price: High to Low
        return parsePrice(b.price) - parsePrice(a.price);

      case 'brand-asc':
        // Brand: A to Z
        const brandA = (a.store || '').toLowerCase();
        const brandB = (b.store || '').toLowerCase();
        return brandA.localeCompare(brandB);

      case 'brand-desc':
        // Brand: Z to A
        const brandADesc = (a.store || '').toLowerCase();
        const brandBDesc = (b.store || '').toLowerCase();
        return brandBDesc.localeCompare(brandADesc);

      case 'name-asc':
        // Name: A to Z
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);

      case 'name-desc':
        // Name: Z to A
        const nameADesc = (a.name || '').toLowerCase();
        const nameBDesc = (b.name || '').toLowerCase();
        return nameBDesc.localeCompare(nameADesc);

      default:
        // Default to newest first
        const dateADef = new Date(a.updatedAt || a.savedAt);
        const dateBDef = new Date(b.updatedAt || b.savedAt);
        return dateBDef - dateADef;
    }
  });
}

// ============================================
// PAGINATION
// ============================================

function goToPage(page) {
  const products = getSortedProducts();
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderProducts();
  }
}

function renderPagination() {
  const paginationDiv = document.getElementById('pagination');
  const products = getSortedProducts();
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  if (totalPages <= 1) {
    paginationDiv.innerHTML = '<div class="page-info">No pagination needed</div>';
    return;
  }

  // Create pagination controls container
  let controlsHTML = '<div class="pagination-controls">';
  
  // LEFT ARROW - Previous button
  controlsHTML += `<button id="prev-btn" class="pagination-arrow" ${currentPage === 1 ? 'disabled' : ''} title="Previous page">⏴</button>`;

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // Page 1 (if not in range)
  if (startPage > 1) {
    controlsHTML += `<button class="page-number ${currentPage === 1 ? 'active' : ''}" data-page="1">1</button>`;
    if (startPage > 2) {
      controlsHTML += `<span class="pagination-ellipsis">...</span>`;
    }
  }

  // Page numbers in range
  for (let i = startPage; i <= endPage; i++) {
    controlsHTML += `<button class="page-number ${currentPage === i ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  // Last page (if not in range)
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      controlsHTML += `<span class="pagination-ellipsis">...</span>`;
    }
    controlsHTML += `<button class="page-number ${currentPage === totalPages ? 'active' : ''}" data-page="${totalPages}">${totalPages}</button>`;
  }

  // RIGHT ARROW - Next button
  controlsHTML += `<button id="next-btn" class="pagination-arrow" ${currentPage >= totalPages ? 'disabled' : ''} title="Next page">⏵</button>`;
  
  controlsHTML += '</div>';
  
  // Page info below the controls
  const pageInfoHTML = `<div class="page-info">Page ${currentPage} of ${totalPages}</div>`;

  // Combine everything
  paginationDiv.innerHTML = controlsHTML + pageInfoHTML;

  // Add event listeners
  setTimeout(() => {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
          goToPage(currentPage - 1);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
          goToPage(currentPage + 1);
        }
      });
    }

    // Add event listeners for page number buttons
    document.querySelectorAll('.page-number').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(e.target.getAttribute('data-page'));
        goToPage(page);
      });
    });
  }, 0);
}

// ============================================
// PRODUCT RENDERING
// ============================================

function renderProducts() {
  const list = document.getElementById('product-list');
  const totalCountDiv = document.getElementById('total-count');
  const totalPriceDiv = document.getElementById('total-price');
  const clearAllBtn = document.getElementById('clear-all-btn');

  const products = getSortedProducts();
  const totalItems = products.length;
  const totalPrice = products.reduce((sum, item) => sum + parsePrice(item.price), 0);

  totalCountDiv.textContent = `Items: ${totalItems}`;
  totalPriceDiv.textContent = `Total: $${totalPrice.toFixed(2)}`;

  clearAllBtn.style.display = totalItems > 0 ? 'block' : 'none';

  if (totalItems === 0) {
    let emptyMessage = '';
    if (showingFavorites) {
      emptyMessage = `
        <div class="empty-state">
          <p>⭐ No favorite items yet!</p>
          <p>Start adding your favorite items to this list by clicking the star icon next to any saved item.</p>
        </div>
      `;
    } else {
      emptyMessage = `
        <div class="empty-state">
          <p>🪞 Your dressing room is empty</p>
          <p>Click "Show Save Button" above, then visit any fashion website and start curating your perfect wardrobe!</p>
        </div>
      `;
    }
    
    list.innerHTML = emptyMessage;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = products.slice(start, end);

  list.innerHTML = '';

  pageItems.forEach((item) => {
    const productDiv = document.createElement('div');
    productDiv.className = 'product';

    const priceDisplay = formatPriceDisplay(item);
    let imageUrl = item.image || 'https://via.placeholder.com/60?text=No+Image';
    const optimizedImageUrl = optimizeImageUrl(imageUrl);
    
    const isUpdated = item.updatedAt && item.updatedAt !== item.savedAt;
    const globalIndex = allProducts.indexOf(item);
    const hasHistory = item.priceHistory && item.priceHistory.length > 1;
    const priceHistoryHtml = formatPriceHistory(item);

    const favoriteClass = item.isFavorite ? 'favorite-btn active' : 'favorite-btn';
    const favoriteIcon = item.isFavorite ? '⭐' : '⭐︎';

    // Check if current item is a sale
    const currentPriceHistory = item.priceHistory && item.priceHistory.length > 0
      ? item.priceHistory[item.priceHistory.length - 1]
      : null;
    const isSale = currentPriceHistory?.isSale || false;

    // Get price freshness indicator
    const freshness = getPriceFreshness(item.lastChecked);

    productDiv.innerHTML = `
      <button class="${favoriteClass}" data-index="${globalIndex}" data-tooltip="${item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">${favoriteIcon}</button>
      <img src="${optimizedImageUrl}" 
           alt="${item.name}" 
           onerror="this.onerror=null; this.src='https://via.placeholder.com/60?text=No+Image';" 
           style="max-width: 60px; max-height: 60px; object-fit: cover;" />
      <div class="info">
        <p><a href="${item.url}" target="_blank" rel="noopener noreferrer" title="${item.name}"><strong>${item.name}</strong></a></p>
        ${priceDisplay}
        <p class="item-meta">
          ${item.store} • ${new Date(item.savedAt).toLocaleDateString()}
          ${isUpdated ? ' <span class="updated-badge">Updated</span>' : ''}
          ${hasHistory ? ` <span class="history-badge">${item.priceHistory.length} prices tracked</span>` : ''}
          ${isSale ? ' <span class="sale-indicator">🏷️ SALE</span>' : ''}
          <span class="price-freshness ${freshness.class}" title="Last price check">${freshness.icon} ${freshness.text}</span>
        </p>
        ${hasHistory ? `
          <button class="history-toggle-btn" id="toggle-${globalIndex}">
            📊 Price History
          </button>
          <div class="price-history-container" id="history-${globalIndex}" style="display: none;">
            ${priceHistoryHtml}
          </div>
        ` : ''}
      </div>
      <button data-index="${globalIndex}" class="delete-btn" aria-label="Delete ${item.name}" title="Delete item">🗑️</button>
    `;

    // Add click handler to entire product row for preview
    productDiv.addEventListener('click', (e) => {
      // Don't trigger preview if clicking on buttons or links
      if (e.target.closest('button') || e.target.closest('a')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      
      // If clicking on the same product that's already active, close preview
      if (activePreview === globalIndex) {
        closeProductPreview();
      } else {
        showProductPreview(globalIndex, productDiv);
      }
    });

    list.appendChild(productDiv);
  });

  renderPagination();

  // Event listeners for buttons only (row click handled above)
  document.querySelectorAll('.favorite-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const productIndex = parseInt(button.getAttribute('data-index'));
      toggleFavorite(productIndex);
    });
  });

  document.querySelectorAll('.history-toggle-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const productIndex = parseInt(button.id.replace('toggle-', ''));
      togglePriceHistory(productIndex);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const idx = parseInt(e.target.getAttribute('data-index'));
      if (confirm('Are you sure you want to delete this item?')) {
        allProducts.splice(idx, 1);
        chrome.storage.local.set({ products: allProducts }, () => {
          if (activePreview === idx) {
            closeProductPreview();
          }
          const newProducts = getSortedProducts();
          const newTotalPages = Math.ceil(newProducts.length / ITEMS_PER_PAGE);
          if (currentPage > newTotalPages && newTotalPages > 0) {
            currentPage = newTotalPages;
          } else if (newProducts.length === 0) {
            currentPage = 1;
          }
          renderBrandFilters();
          renderProducts();
        });
      }
    });
  });
}

// ============================================
// BRAND FILTERS UI
// ============================================

// Enhanced brand filters with search and smart prioritization
async function renderBrandFilters(searchTerm = brandSearchTerm) {
  const filterDiv = document.getElementById('brand-filters');
  
  // Clear existing content
  filterDiv.innerHTML = '';
  
  // Create brand filters header
  const headerDiv = document.createElement('div');
  headerDiv.className = 'brand-filters-header';
  headerDiv.innerHTML = `
    <div class="brand-filters-title">Brand Filters</div>
  `;
  filterDiv.appendChild(headerDiv);
  
  // Create search input
  const searchContainer = document.createElement('div');
  searchContainer.className = 'brand-search-container';
  
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = '🔍 Search brands...';
  searchInput.className = 'brand-search-input';
  searchInput.value = searchTerm;
  
  // Store reference to prevent re-rendering during typing
  let isTyping = false;
  
  searchInput.addEventListener('input', (e) => {
    e.stopPropagation();
    brandSearchTerm = e.target.value.trim();

    if (isTyping) return;

    isTyping = true;
    // Debounce for responsive feel
    setTimeout(() => {
      renderBrandFilters(brandSearchTerm);
      isTyping = false;
    }, 300);
  });
  
  searchInput.addEventListener('keydown', (e) => {
    e.stopPropagation();
  });
  
  searchInput.addEventListener('keyup', (e) => {
    e.stopPropagation();
  });
  
  searchInput.addEventListener('focus', (e) => {
    e.stopPropagation();
  });
  
  searchInput.addEventListener('blur', (e) => {
    e.stopPropagation();
  });
  
  searchInput.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  searchContainer.appendChild(searchInput);
  filterDiv.appendChild(searchContainer);
  
  // Create brand icons container
  const iconsContainer = document.createElement('div');
  iconsContainer.className = 'brand-icons-container';
  
  // Always show favorites button first
  const favoritesBtn = document.createElement('button');
  favoritesBtn.className = showingFavorites ? 'favorites-filter-btn active' : 'favorites-filter-btn';
  favoritesBtn.innerHTML = '⭐';
  favoritesBtn.title = 'Favorites';
  
  favoritesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showingFavorites = !showingFavorites;
    currentPage = 1;
    renderBrandFilters();
    renderProducts();
  });
  
  iconsContainer.appendChild(favoritesBtn);
  
  // Get unique brands
  const uniqueStores = getUniqueBrands();
  
  if (uniqueStores.length === 0) {
    filterDiv.appendChild(iconsContainer);
    setTimeout(() => searchInput.focus(), 0);
    return;
  }
  
  let displayBrands;
  
  if (searchTerm) {
    // Filter by search term
    displayBrands = uniqueStores.filter(brand => 
      brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } else {
    // Show prioritized brands
    displayBrands = await sortBrandsByPriority(uniqueStores);
    
    // Limit to 5 brands when not searching or showing all
    if (!showingAllBrands) {
      displayBrands = displayBrands.slice(0, 5);
    }
  }
  
  // Render brand icons
  displayBrands.forEach(store => {
    const img = document.createElement('img');
    img.className = 'brand-icon';
    
    const sampleProduct = allProducts.find(p => p.store === store);
    img.src = getBrandIcon(store, sampleProduct?.url);
    
    img.alt = store;
    img.title = store;
    
    img.onerror = function() {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
      const color = colors[store.charCodeAt(0) % colors.length];
      const letter = store.charAt(0).toUpperCase();
      this.src = generateSimpleLogo(letter, color);
    };
    
    if (store === filteredStore) {
      img.classList.add('active');
    }

    img.addEventListener('click', (e) => {
      e.stopPropagation();
      filteredStore = filteredStore === store ? null : store;
      currentPage = 1;
      renderBrandFilters();
      renderProducts();
    });

    iconsContainer.appendChild(img);
  });
  
  // Add "Show All" / "Show Less" button if needed
  if (!searchTerm) {
    const totalBrands = uniqueStores.length;
    const visibleBrands = showingAllBrands ? displayBrands.length : Math.min(5, displayBrands.length);
    
    if (totalBrands > 5) {
      const toggleButton = document.createElement('button');
      toggleButton.className = 'show-all-brands-btn';
      
      if (showingAllBrands) {
        toggleButton.textContent = 'Show Less';
        toggleButton.title = 'Show only top 5 brands';
      } else {
        const hiddenCount = totalBrands - visibleBrands;
        toggleButton.textContent = `+${hiddenCount} more...`;
        toggleButton.title = 'Show all brands';
      }
      
      toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        showingAllBrands = !showingAllBrands;
        renderBrandFilters();
      });
      
      iconsContainer.appendChild(toggleButton);
    }
  }

  filterDiv.appendChild(iconsContainer);

  // Restore focus and cursor position
  setTimeout(() => {
    const newSearchInput = filterDiv.querySelector('.brand-search-input');
    if (newSearchInput) {
      newSearchInput.focus();
      newSearchInput.setSelectionRange(newSearchInput.value.length, newSearchInput.value.length);
    }
  }, 0);
}

// ============================================
// GLOBAL EVENT HANDLERS
// ============================================

// Make functions globally accessible for onclick handlers
window.closeProductPreview = closeProductPreview;
window.showPreviewImage = showPreviewImage;
document.addEventListener('click', (e) => {
  if (activePreview !== null && 
      !e.target.closest('.product-preview-sidebar') && 
      !e.target.closest('.product')) {
    closeProductPreview();
  }
});

// ============================================
// PRICE CHECKING & UPDATES
// ============================================

let isCheckingPrices = false;

function getPriceFreshness(lastChecked) {
  if (!lastChecked) return { class: 'freshness-stale', text: 'Never updated', icon: '🔴' };

  const hours = (Date.now() - new Date(lastChecked)) / (1000 * 60 * 60);

  if (hours < 6) return { class: 'freshness-fresh', text: 'Fresh', icon: '🟢' };
  if (hours < 24) return { class: 'freshness-recent', text: 'Recent', icon: '🟡' };
  return { class: 'freshness-stale', text: 'Stale', icon: '🟠' };
}

async function checkSinglePrice(product) {
  try {
    // Fetch the product page HTML
    const response = await fetch(product.url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': navigator.userAgent
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Try to extract price using the same logic as content.js
    const newPriceInfo = extractPriceFromDocument(doc);
    
    if (newPriceInfo && newPriceInfo.price && newPriceInfo.price !== 'Price not found') {
      const oldNumericPrice = parsePrice(product.price);
      const newNumericPrice = parsePrice(newPriceInfo.price);
      
      // Determine if price changed
      const priceChanged = Math.abs(oldNumericPrice - newNumericPrice) > 0.01;
      const priceIncreased = newNumericPrice > oldNumericPrice;
      const priceDecreased = newNumericPrice < oldNumericPrice;
      
      return {
        success: true,
        priceChanged,
        priceIncreased,
        priceDecreased,
        oldPrice: product.price,
        newPrice: newPriceInfo.price,
        oldNumericPrice,
        newNumericPrice,
        isSale: newPriceInfo.isSale || false
      };
    } else {
      return {
        success: false,
        error: 'Could not find price on page'
      };
    }
    
  } catch (error) {
    console.error(`❌ Error checking ${product.name}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

function extractPriceFromDocument(doc) {
  // Try structured data first (most reliable)
  const structuredData = extractStructuredData(doc);
  if (structuredData && structuredData.price) {
    return structuredData;
  }
  
  // Fallback to semantic search
  return extractPriceSemantically(doc);
}

function extractStructuredData(doc) {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  
  for (const script of scripts) {
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
            const price = formatPrice(offer.price, offer.priceCurrency);
            return {
              price: price,
              isSale: !!offer.highPrice && parseFloat(offer.price) < parseFloat(offer.highPrice)
            };
          }
        }
      }
    } catch (e) {
      // Silent fail, try next script
    }
  }
  
  return null;
}

function extractPriceSemantically(doc) {
  const pricePattern = /\$\s*(\d{1,4}(?:[.,]\d{2})?)/;
  // ENHANCED: Also search all span and div elements, not just those with "price" in class
  // This handles sites like H&M that use obfuscated class names
  const priceElements = doc.querySelectorAll('[class*="price"], [id*="price"], [data-price], [data-testid*="price"], span, div');

  const candidates = [];

  for (const el of priceElements) {
    const text = el.textContent.trim();
    const match = text.match(pricePattern);

    const classList = el.className.toLowerCase();
    const dataTestId = el.getAttribute('data-testid')?.toLowerCase() || '';

    // ENHANCED: For elements without "price" in class, ensure text is ONLY a price (no other text)
    // This prevents matching navigation text like "Shop $50 and under"
    const isPriceOnlyText = text.length < 20 && text.replace(/[\$\s\d.,]/g, '').length === 0;
    const hasPriceInClass = classList.includes('price') ||
                            dataTestId.includes('price') ||
                            el.hasAttribute('data-price');

    if (match && (hasPriceInClass || isPriceOnlyText)) {
      const price = parseFloat(match[1].replace(',', ''));
      if (price < 1 || price > 10000) continue;

      // CRITICAL: Check if this is a strikethrough/old price (should be EXCLUDED)
      const isOldPrice = classList.includes('strike') ||
                         classList.includes('old-price') ||
                         classList.includes('original-price') ||
                         classList.includes('list-price') ||
                         dataTestId.includes('strikethrough') ||
                         dataTestId.includes('original-price') ||
                         el.tagName.toLowerCase() === 'del' ||
                         el.tagName.toLowerCase() === 's';

      // Skip strikethrough prices
      if (isOldPrice) {
        continue;
      }

      // Check for sale indicators
      const isSalePrice = classList.includes('sale') ||
                          classList.includes('discount') ||
                          classList.includes('promotional') ||
                          classList.includes('current-sale') ||
                          classList.includes('sale-price') ||
                          dataTestId.includes('sale');

      // Scoring system (similar to content.js)
      const hasPrice = classList.includes('price');
      const hasTestId = dataTestId.includes('price') ? 25 : 0;

      // Bonus for sale-related classes (these are likely the CURRENT price)
      const saleBonus = isSalePrice ? 50 : 0;

      const score = (hasPrice ? 20 : 0) + hasTestId + saleBonus;

      candidates.push({
        price: match[0],
        numericPrice: price,
        element: el,
        score,
        isSale: isSalePrice
      });
    }
  }

  // Sort by score descending
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];


    return {
      price: best.price,
      isSale: best.isSale
    };
  }

  return { price: 'Price not found' };
}

function formatPrice(price, currency = 'USD') {
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) return price.toString();
  
  const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
  const symbol = symbols[currency] || '$';
  
  return `${symbol}${numPrice.toFixed(2)}`;
}

async function checkAllPrices() {
  if (isCheckingPrices) return;
  
  const products = getSortedProducts();
  
  if (products.length === 0) {
    alert('No products to check!');
    return;
  }
  
  isCheckingPrices = true;
  
  // Show status container
  const statusContainer = document.getElementById('price-check-status');
  const checkButton = document.getElementById('check-prices-btn');
  const progressBar = document.getElementById('progress-bar');
  const currentItemText = document.getElementById('current-item');
  const statusProgress = document.querySelector('.status-progress');
  const statusSummary = document.getElementById('status-summary');
  
  statusContainer.classList.add('active');
  checkButton.disabled = true;
  checkButton.classList.add('checking');
  checkButton.innerHTML = '⏳ Checking prices...';
  
  let priceDrops = 0;
  let priceIncreases = 0;
  let noChanges = 0;
  let errors = 0;
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const progress = ((i + 1) / products.length) * 100;
    
    // Update UI
    progressBar.style.width = `${progress}%`;
    statusProgress.textContent = `${i + 1} / ${products.length}`;
    currentItemText.innerHTML = `Checking: <strong>${product.name}</strong> (${product.store})`;
    
    // Check price
    const result = await checkSinglePrice(product);
    
    if (result.success) {
      if (result.priceChanged) {
        // Update product with new price
        const globalIndex = allProducts.findIndex(p => p.url === product.url);
        if (globalIndex !== -1) {
          const timestamp = new Date().toISOString();
          
          allProducts[globalIndex].price = result.newPrice;
          allProducts[globalIndex].updatedAt = timestamp;
          allProducts[globalIndex].lastChecked = timestamp;
          
          // Add to price history
          allProducts[globalIndex].priceHistory.push({
            price: result.newPrice,
            timestamp: timestamp,
            numericPrice: result.newNumericPrice,
            isSale: result.isSale,
            confidence: 0.8,
            method: 'background-check'
          });
          
          if (result.priceDecreased) {
            priceDrops++;
          } else if (result.priceIncreased) {
            priceIncreases++;
          }
        }
      } else {
        noChanges++;
        // Update last checked timestamp even if price didn't change
        const globalIndex = allProducts.findIndex(p => p.url === product.url);
        if (globalIndex !== -1) {
          allProducts[globalIndex].lastChecked = new Date().toISOString();
        }
      }
    } else {
      errors++;
      console.error(`Failed to check ${product.name}:`, result.error);
    }
    
    // Rate limiting - wait 2 seconds between requests
    if (i < products.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Save all updates
  await new Promise(resolve => {
    chrome.storage.local.set({ products: allProducts }, resolve);
  });
  
  // Show summary
  progressBar.style.width = '100%';
  currentItemText.innerHTML = `<strong>✅ Complete!</strong> Checked ${products.length} items`;
  
  document.getElementById('price-drops').textContent = priceDrops;
  document.getElementById('price-increases').textContent = priceIncreases;
  document.getElementById('no-changes').textContent = noChanges;
  statusSummary.style.display = 'flex';
  
  // Update button
  checkButton.classList.remove('checking');
  checkButton.disabled = false;
  
  if (priceDrops > 0) {
    checkButton.innerHTML = `🎉 ${priceDrops} price drop${priceDrops !== 1 ? 's' : ''} found!`;
    checkButton.style.background = 'linear-gradient(135deg, #7a9b76, #96CEB4)';
  } else if (priceIncreases > 0) {
    checkButton.innerHTML = `⚠️ ${priceIncreases} price increase${priceIncreases !== 1 ? 's' : ''}`;
    checkButton.style.background = 'linear-gradient(135deg, #c65d47, #d4a574)';
  } else {
    checkButton.innerHTML = '✅ All prices current';
  }
  
  // Refresh product list to show updates
  renderProducts();
  
  // Reset after 5 seconds
  setTimeout(() => {
    statusContainer.classList.remove('active');
    checkButton.innerHTML = '🔄 Refresh Prices';
    checkButton.style.background = '';
    statusSummary.style.display = 'none';
    isCheckingPrices = false;
  }, 5000);
}

// ============================================
// SYNC FUNCTIONALITY
// ============================================

function openCompareWindow() {
  chrome.windows.create({
    url: chrome.runtime.getURL('compare.html'),
    type: 'popup',
    width: 1200,
    height: 750
  });
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {

  // Load saved sort preference
  chrome.storage.local.get(['sortPreference'], (result) => {
    if (result.sortPreference) {
      currentSort = result.sortPreference;
      document.getElementById('sort-select').value = currentSort;
    }
  });

  chrome.storage.local.get(['products'], (result) => {
    allProducts = Array.isArray(result.products) ? result.products : [];
    
    // Migration for all data types including sale detection
    let migrationNeeded = false;
    allProducts.forEach(product => {
      if (!product.priceHistory && product.price) {
        product.priceHistory = [{
          price: product.price,
          timestamp: product.savedAt || new Date().toISOString(),
          numericPrice: parsePrice(product.price),
          // Initialize sale fields for existing products
          isSale: false,
          originalPrice: null,
          salePercentage: null,
          saleType: null,
          confidence: 0
        }];
        migrationNeeded = true;
      }
      
      // Migrate existing price history entries to include sale fields
      if (product.priceHistory) {
        product.priceHistory.forEach(entry => {
          if (entry.isSale === undefined) {
            entry.isSale = false;
            entry.originalPrice = null;
            entry.salePercentage = null;
            entry.saleType = null;
            entry.confidence = 0;
            migrationNeeded = true;
          }
        });
      }
      
      if (product.isFavorite === undefined) {
        product.isFavorite = false;
        migrationNeeded = true;
      }
      
      if (!product.images) {
        product.images = product.image ? [product.image] : [];
        migrationNeeded = true;
      }
      
      if (!product.colors) {
        product.colors = [];
        migrationNeeded = true;
      }
      
      if (!product.sizes) {
        product.sizes = [];
        migrationNeeded = true;
      }
      
      if (product.material === undefined) {
        product.material = null;
        migrationNeeded = true;
      }
    });
    
    if (migrationNeeded) {
      chrome.storage.local.set({ products: allProducts });
    }
    
    // Check current button state without auto-restoring
    checkSaveButtonState();
    
    renderBrandFilters();
    renderProducts();

    // Event listeners
    document.getElementById('save-toggle-btn').addEventListener('click', toggleSaveButton);
    document.getElementById('check-prices-btn').addEventListener('click', checkAllPrices);
    document.getElementById('compare-items-btn').addEventListener('click', openCompareWindow);

    document.getElementById('clear-all-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all saved items?')) {
        allProducts = [];
        chrome.storage.local.set({ products: [] }, () => {
          currentPage = 1;
          filteredStore = null;
          showingFavorites = false;
          showingAllBrands = false;
          brandSearchTerm = '';
          closeProductPreview();
          renderBrandFilters();
          renderProducts();
        });
      }
    });

    // Sort dropdown event listener
    document.getElementById('sort-select').addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1; // Reset to first page when sorting changes

      // Save sort preference
      chrome.storage.local.set({ sortPreference: currentSort });

      renderProducts();
    });
  });
});