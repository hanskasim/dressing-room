// Compare.js - Handles product comparison functionality

let allProducts = [];
let filteredProducts = [];
let compareSlots = [null, null, null, null]; // Up to 4 items
let currentBrandFilter = 'all';
let currentFavoritesFilter = 'all';

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
});

function setupEventListeners() {
  document.getElementById('close-window').addEventListener('click', () => {
    window.close();
  });

  document.getElementById('clear-all').addEventListener('click', () => {
    if (confirm('Clear all compared items?')) {
      compareSlots = [null, null, null, null];
      renderCompareSlots();
      renderSidebar();
    }
  });

  document.getElementById('brand-filter').addEventListener('change', (e) => {
    currentBrandFilter = e.target.value;
    applyFilters();
  });

  document.getElementById('favorites-filter').addEventListener('change', (e) => {
    currentFavoritesFilter = e.target.value;
    applyFilters();
  });
}

function loadProducts() {
  chrome.storage.local.get(['products'], (result) => {
    allProducts = Array.isArray(result.products) ? result.products : [];
    console.log(`Loaded ${allProducts.length} products`);

    // Initialize filters and render
    populateBrandFilter();
    applyFilters();
    renderCompareSlots();
    setupEventListeners();
  });
}

function populateBrandFilter() {
  const brands = [...new Set(allProducts.map(p => p.store).filter(Boolean))].sort();
  const brandFilter = document.getElementById('brand-filter');

  brands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    brandFilter.appendChild(option);
  });
}

function applyFilters() {
  filteredProducts = allProducts.filter(product => {
    // Brand filter
    if (currentBrandFilter !== 'all' && product.store !== currentBrandFilter) {
      return false;
    }

    // Favorites filter
    if (currentFavoritesFilter === 'favorites' && !product.isFavorite) {
      return false;
    }

    return true;
  });

  renderSidebar();
}

function renderSidebar() {
  const sidebar = document.getElementById('saved-items-list');
  sidebar.innerHTML = '';

  if (filteredProducts.length === 0) {
    sidebar.innerHTML = '<p style="text-align: center; color: var(--text-medium); padding: 20px;">No items match your filters</p>';
    return;
  }

  filteredProducts.forEach(product => {
    const slotIndex = compareSlots.findIndex(slot => slot && slot.url === product.url);
    const isSelected = slotIndex !== -1;

    const item = document.createElement('div');
    item.className = `sidebar-item${isSelected ? ' selected' : ''}`;
    item.draggable = true;
    item.dataset.url = product.url;

    item.innerHTML = `
      ${isSelected ? `<div class="selection-badge">${slotIndex + 1}</div>` : ''}
      <div class="sidebar-item-content">
        <img src="${product.image || 'https://via.placeholder.com/50?text=No+Image'}"
             alt="${product.name}"
             class="sidebar-item-image">
        <div class="sidebar-item-info">
          <div class="sidebar-item-name">${product.name}</div>
          <div class="sidebar-item-details">
            <span class="sidebar-item-store">${product.store || 'Unknown'}</span>
            <span class="sidebar-item-price">${product.price}</span>
          </div>
        </div>
      </div>
    `;

    // Drag event listeners
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', product.url);
      item.style.opacity = '0.5';
    });

    item.addEventListener('dragend', (e) => {
      item.style.opacity = '1';
    });

    sidebar.appendChild(item);
  });
}

function renderCompareSlots() {
  const grid = document.getElementById('compare-grid');
  grid.innerHTML = '';

  compareSlots.forEach((product, index) => {
    const slot = document.createElement('div');
    slot.className = `compare-slot ${product ? 'filled' : 'empty'}`;

    if (product) {
      slot.innerHTML = `
        <button class="remove-btn" data-index="${index}">Ã—</button>
        <button class="favorite-btn ${product.isFavorite ? 'active' : ''}"
                data-index="${index}"
                data-tooltip="${product.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
          ${product.isFavorite ? 'â˜…' : 'â˜†'}
        </button>
        <div class="product-card">
          <img src="${product.image || 'https://via.placeholder.com/200?text=No+Image'}"
               alt="${product.name}"
               class="product-image">
          <div class="product-store">${product.store || 'Unknown'}</div>
          <div class="product-name">${product.name}</div>
          <div class="product-price">
            ${product.price}
            ${isCurrentlySale(product) ? '<span class="sale-badge">SALE</span>' : ''}
          </div>
          <div class="product-details">
            <div class="detail-row">
              <span class="detail-label">Saved:</span>
              <span>${new Date(product.savedAt).toLocaleDateString()}</span>
            </div>
            ${product.priceHistory && product.priceHistory.length > 1 ? `
              <div class="detail-row">
                <span class="detail-label">Price History:</span>
                <span>${product.priceHistory.length} entries</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Lowest Price:</span>
                <span>${getLowestPrice(product)}</span>
              </div>
            ` : ''}
            ${product.updatedAt ? `
              <div class="detail-row">
                <span class="detail-label">Last Updated:</span>
                <span>${new Date(product.updatedAt).toLocaleDateString()}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      // Add remove button listener
      slot.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromSlot(index);
      });

      // Add favorite button listener
      slot.querySelector('.favorite-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(product);
      });
    } else {
      slot.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">âž•</div>
          <p>Drag item here</p>
        </div>
      `;
    }

    // Add drop zone listeners to all slots (empty or filled)
    slot.dataset.slotIndex = index;

    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      slot.classList.add('drag-over');
    });

    slot.addEventListener('dragleave', (e) => {
      slot.classList.remove('drag-over');
    });

    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      slot.classList.remove('drag-over');

      const productUrl = e.dataTransfer.getData('text/plain');
      const product = allProducts.find(p => p.url === productUrl);

      if (product) {
        addToSlot(index, product);
      }
    });

    grid.appendChild(slot);
  });
}

function isCurrentlySale(product) {
  if (!product.priceHistory || product.priceHistory.length === 0) return false;
  const latestEntry = product.priceHistory[product.priceHistory.length - 1];
  return latestEntry.isSale || false;
}

function getLowestPrice(product) {
  if (!product.priceHistory || product.priceHistory.length === 0) return product.price;

  const prices = product.priceHistory.map(entry => entry.numericPrice || parsePrice(entry.price));
  const lowest = Math.min(...prices);
  return `$${lowest.toFixed(2)}`;
}

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[,$Â£â‚¬Â¥â‚¹]/g, '').trim();
  const match = cleaned.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

function addToSlot(index, product) {
  // Check if product is already in another slot
  const existingIndex = compareSlots.findIndex(slot => slot && slot.url === product.url);

  if (existingIndex !== -1 && existingIndex !== index) {
    // Swap: remove from old slot and add to new slot
    compareSlots[existingIndex] = null;
  }

  compareSlots[index] = product;
  renderCompareSlots();
  renderSidebar(); // Update sidebar to show selection badges
}

function removeFromSlot(index) {
  compareSlots[index] = null;
  renderCompareSlots();
  renderSidebar(); // Update sidebar to remove selection badges
}

function toggleFavorite(product) {
  // Toggle favorite status
  product.isFavorite = !product.isFavorite;

  // Find the product in allProducts and update it
  const productIndex = allProducts.findIndex(p => p.url === product.url);
  if (productIndex !== -1) {
    allProducts[productIndex].isFavorite = product.isFavorite;
  }

  // Update compareSlots to reflect the change
  compareSlots.forEach((slot, index) => {
    if (slot && slot.url === product.url) {
      compareSlots[index].isFavorite = product.isFavorite;
    }
  });

  // Update filteredProducts
  filteredProducts.forEach((p, index) => {
    if (p.url === product.url) {
      filteredProducts[index].isFavorite = product.isFavorite;
    }
  });

  // Save to Chrome storage
  chrome.storage.local.set({ products: allProducts }, () => {
    console.log(`Product ${product.isFavorite ? 'favorited' : 'unfavorited'}`);
  });

  // Re-render both compare slots and sidebar
  renderCompareSlots();
  renderSidebar();
}