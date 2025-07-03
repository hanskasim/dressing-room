const ITEMS_PER_PAGE = 5;
let currentPage = 1;
let allProducts = [];
let filteredStore = null;
let saveButtonVisible = false;

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

function getBrandIcon(store) {
  if (!store) return 'https://via.placeholder.com/32?text=?';
  
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
  const color = colors[store.charCodeAt(0) % colors.length];
  const letter = store.charAt(0).toUpperCase();
  
  return generateSimpleLogo(letter, color);
}

function toggleSaveButton() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleSaveButton' }, (response) => {
      const button = document.getElementById('save-toggle-btn');
      saveButtonVisible = !saveButtonVisible;
      
      if (saveButtonVisible) {
        button.textContent = 'Hide Save Button';
        button.classList.add('active');
      } else {
        button.textContent = 'Show Save Button';
        button.classList.remove('active');
      }
    });
  });
}

function renderProducts() {
  const list = document.getElementById('product-list');
  const totalCountDiv = document.getElementById('total-count');
  const totalPriceDiv = document.getElementById('total-price');
  const pageNumberSpan = document.getElementById('page-number');
  const clearAllBtn = document.getElementById('clear-all-btn');

  const products = filteredStore
    ? allProducts.filter(p => p.store?.toLowerCase() === filteredStore.toLowerCase())
    : allProducts;

  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const totalPrice = products.reduce((sum, item) => sum + parsePrice(item.price), 0);

  totalCountDiv.textContent = `Items: ${totalItems}`;
  totalPriceDiv.textContent = `Total: $${totalPrice.toFixed(2)}`;
  pageNumberSpan.textContent = totalPages ? `Page ${currentPage} of ${totalPages}` : 'No items';

  clearAllBtn.style.display = totalItems > 0 ? 'block' : 'none';

  if (totalItems === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p>🛍️ No items saved yet!</p>
        <p>Click "Show Save Button" above, then visit any shopping website and click the "Save to Dressing Room" button to get started.</p>
      </div>
    `;
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

  document.getElementById('prev-btn').disabled = currentPage === 1;
  document.getElementById('next-btn').disabled = currentPage >= totalPages;

  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      if (confirm('Are you sure you want to delete this item?')) {
        allProducts.splice(idx, 1);
        chrome.storage.local.set({ products: allProducts }, () => {
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
    const img = document.createElement('img');
    img.className = 'brand-icon';
    img.src = getBrandIcon(store);
    img.alt = store;
    img.title = store;
    
    if (store === filteredStore) {
      img.classList.add('active');
    }

    img.addEventListener('click', () => {
      filteredStore = filteredStore === store ? null : store;
      currentPage = 1;
      renderBrandFilters();
      renderProducts();
    });

    filterDiv.appendChild(img);
  });
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['products'], (result) => {
    allProducts = Array.isArray(result.products) ? result.products : [];
    renderBrandFilters();
    renderProducts();

    // Save button toggle
    document.getElementById('save-toggle-btn').addEventListener('click', toggleSaveButton);

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

    // Clear all button
    document.getElementById('clear-all-btn').addEventListener('click', () => {
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
  });
});