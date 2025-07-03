const ITEMS_PER_PAGE = 5;
let currentPage = 1;
let allProducts = [];
let filteredStore = null;

function parsePrice(priceStr) {
  if (!priceStr || priceStr === 'Price not found') return 0;
  
  // Remove common currency symbols and clean up
  const cleaned = priceStr.replace(/[,$£€¥₹]/g, '').replace(/\s+/g, ' ').trim();
  
  // Look for number patterns
  const patterns = [
    /(\d+\.?\d*)/,           // Basic number
    /(\d+,\d+\.?\d*)/,       // Number with comma thousands
    /(\d+\.\d{2})/,          // Decimal price
    /(\d+)/                  // Just digits
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

function getBrandIcon(store) {
  if (!store) return 'https://via.placeholder.com/32?text=?';
  
  const storeLower = store.toLowerCase();
  
  // Use a more reliable approach with different icon sources
  const brandIcons = {
    'uniqlo': 'https://logos-world.net/wp-content/uploads/2020/11/Uniqlo-Logo-700x394.png',
    'h&m': 'https://logos-world.net/wp-content/uploads/2020/04/HM-Logo-700x394.png',
    'everlane': 'https://logos-world.net/wp-content/uploads/2021/02/Everlane-Logo-700x394.png',
    'zara': 'https://logos-world.net/wp-content/uploads/2020/04/Zara-Logo-700x394.png',
    'nike': 'https://logos-world.net/wp-content/uploads/2020/04/Nike-Logo-700x394.png',
    'adidas': 'https://logos-world.net/wp-content/uploads/2020/04/Adidas-Logo-700x394.png',
    'gap': 'https://logos-world.net/wp-content/uploads/2020/09/Gap-Logo-700x394.png',
    'target': 'https://logos-world.net/wp-content/uploads/2020/04/Target-Logo-700x394.png',
    'walmart': 'https://logos-world.net/wp-content/uploads/2020/04/Walmart-Logo-700x394.png',
    'amazon': 'https://logos-world.net/wp-content/uploads/2020/04/Amazon-Logo-700x394.png'
  };
  
  // Try to find exact match first
  if (brandIcons[storeLower]) {
    return brandIcons[storeLower];
  }
  
  // Try partial matches
  for (const [brand, icon] of Object.entries(brandIcons)) {
    if (storeLower.includes(brand) || brand.includes(storeLower)) {
      return icon;
    }
  }
  
  // Generate a simple colored favicon as fallback
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
  const color = colors[store.charCodeAt(0) % colors.length];
  const letter = store.charAt(0).toUpperCase();
  
  // Use canvas to create a simple logo
  return generateSimpleLogo(letter, color);
}

function generateSimpleLogo(letter, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  // Draw circle background
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw letter
  ctx.fillStyle = 'white';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 16, 16);
  
  return canvas.toDataURL();
}

function renderProducts() {
  const list = document.getElementById('product-list');
  const totalCountDiv = document.getElementById('total-count');
  const totalPriceDiv = document.getElementById('total-price');
  const pageNumberSpan = document.getElementById('page-number');

  const products = filteredStore
    ? allProducts.filter(p => p.store?.toLowerCase() === filteredStore.toLowerCase())
    : allProducts;

  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const totalPrice = products.reduce((sum, item) => sum + parsePrice(item.price), 0);

  totalCountDiv.textContent = `Items: ${totalItems}`;
  totalPriceDiv.textContent = `Total: $${totalPrice.toFixed(2)}`;
  pageNumberSpan.textContent = totalPages ? `Page ${currentPage} of ${totalPages}` : 'No items';

  if (totalItems === 0) {
    list.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No items saved yet.<br>Visit a shopping site and click the save button!</p>';
    document.getElementById('prev-btn').disabled = true;
    document.getElementById('next-btn').disabled = true;
    return;
  }

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = products.slice(start, end);

  list.innerHTML = '';

  pageItems.forEach((item, index) => {
    const productDiv = document.createElement('div');
    productDiv.className = 'product';

    const displayPrice = item.price === 'Price not found' ? 'Price not available' : item.price;
    const imageUrl = item.image || 'https://via.placeholder.com/60?text=No+Image';

    productDiv.innerHTML = `
      <img src="${imageUrl}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60?text=No+Image'" />
      <div class="info">
        <p><a href="${item.url}" target="_blank" rel="noopener noreferrer" title="${item.name}"><strong>${item.name}</strong></a></p>
        <p style="color: #0077cc; font-weight: bold;">${displayPrice}</p>
        <p style="font-size:11px; color:gray;">${item.store} • ${new Date(item.savedAt).toLocaleDateString()}</p>
      </div>
      <button data-index="${allProducts.indexOf(item)}" class="delete-btn" aria-label="Delete ${item.name}" title="Delete item">🗑️</button>
    `;

    list.appendChild(productDiv);
  });

  // Update pagination buttons
  document.getElementById('prev-btn').disabled = currentPage === 1;
  document.getElementById('next-btn').disabled = currentPage >= totalPages;

  // Add delete button event listeners
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      if (confirm('Are you sure you want to delete this item?')) {
        allProducts.splice(idx, 1);
        chrome.storage.local.set({ products: allProducts }, () => {
          // Adjust current page if needed
          const newTotalPages = Math.ceil(allProducts.length / ITEMS_PER_PAGE);
          if (currentPage > newTotalPages && newTotalPages > 0) {
            currentPage = newTotalPages;
          }
          renderBrandFilters();
          renderProducts();
        });
      }
    });
  });
}

function renderBrandFilters() {
  const filterDiv = document.getElementById('brand-filters');
  filterDiv.innerHTML = '';

  const uniqueStores = [...new Set(allProducts.map(p => p.store?.trim()).filter(Boolean))];
  
  if (uniqueStores.length === 0) {
    return;
  }

  uniqueStores.forEach(store => {
    const container = document.createElement('div');
    container.style.cssText = 'position: relative; display: inline-block;';
    
    const img = document.createElement('img');
    img.className = 'brand-icon';
    img.src = getBrandIcon(store);
    img.alt = store;
    img.title = store;
    
    if (store === filteredStore) {
      img.classList.add('active');
    }

    // Add error handling for brand icons
    img.onerror = () => {
      img.src = generateSimpleLogo(store.charAt(0).toUpperCase(), '#666');
    };

    img.addEventListener('click', () => {
      filteredStore = filteredStore === store ? null : store;
      currentPage = 1;
      renderBrandFilters();
      renderProducts();
    });

    container.appendChild(img);
    filterDiv.appendChild(container);
  });
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['products'], (result) => {
    allProducts = Array.isArray(result.products) ? result.products : [];
    renderBrandFilters();
    renderProducts();

    // Pagination event listeners
    document.getElementById('prev-btn').addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderProducts();
      }
    });

    document.getElementById('next-btn').addEventListener('click', () => {
      const products = filteredStore
        ? allProducts.filter(p => p.store?.toLowerCase() === filteredStore.toLowerCase())
        : allProducts;
      const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
      if (currentPage < totalPages) {
        currentPage++;
        renderProducts();
      }
    });

    // Add clear all button functionality
    const clearAllBtn = document.createElement('button');
    clearAllBtn.textContent = 'Clear All';
    clearAllBtn.style.cssText = `
      background: #dc3545;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 10px;
    `;
    clearAllBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all saved items?')) {
        allProducts = [];
        chrome.storage.local.set({ products: [] }, () => {
          currentPage = 1;
          filteredStore = null;
          renderBrandFilters();
          renderProducts();
        });
      }
    });

    document.querySelector('h2').appendChild(clearAllBtn);
  });
});