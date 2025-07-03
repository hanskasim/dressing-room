const ITEMS_PER_PAGE = 5;
let currentPage = 1;
let allProducts = [];
let filteredStore = null;

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const match = priceStr.replace(/,/g, '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
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
  pageNumberSpan.textContent = totalPages ? `Page ${currentPage} of ${totalPages}` : '';

  if (totalItems === 0) {
    list.innerHTML = '<p>No items saved yet.</p>';
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

    productDiv.innerHTML = `
      <img src="${item.image}" alt="${item.name}" />
      <div class="info">
        <p><a href="${item.url}" target="_blank" rel="noopener noreferrer"><strong>${item.name}</strong></a></p>
        <p>${item.price}</p>
        <p style="font-size:11px; color:gray;">${item.store}</p>
      </div>
      <button data-index="${allProducts.indexOf(item)}" class="delete-btn" aria-label="Delete item">🗑️</button>
    `;

    list.appendChild(productDiv);
  });

  document.getElementById('prev-btn').disabled = currentPage === 1;
  document.getElementById('next-btn').disabled = currentPage >= totalPages;

  // Delete buttons
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      allProducts.splice(idx, 1);
      chrome.storage.local.set({ products: allProducts }, () => {
        if (currentPage > Math.ceil(allProducts.length / ITEMS_PER_PAGE)) {
          currentPage--;
        }
        renderBrandFilters();
        renderProducts();
      });
    });
  });
}

function renderBrandFilters() {
  const filterDiv = document.getElementById('brand-filters');
  filterDiv.innerHTML = '';

  const uniqueStores = [...new Set(allProducts.map(p => p.store?.trim()).filter(Boolean))];

  uniqueStores.forEach(store => {
    const img = document.createElement('img');
    img.className = 'brand-icon';
    img.src = getBrandIcon(store);
    img.alt = store;
    if (store === filteredStore) img.classList.add('active');

    img.addEventListener('click', () => {
      filteredStore = filteredStore === store ? null : store;
      currentPage = 1;
      renderBrandFilters();
      renderProducts();
    });

    filterDiv.appendChild(img);
  });
}

function getBrandIcon(store) {
  const normalized = store?.toLowerCase().trim();
  const knownIcons = {
    "uniqlo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Uniqlo_logo.svg/80px-Uniqlo_logo.svg.png",
    "h&m": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/H%26M-Logo.svg/80px-H%26M-Logo.svg.png",
    "everlane": "https://seeklogo.com/images/E/everlane-logo-CE271C8C52-seeklogo.com.png",
    "zara": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Zara_Logo.svg/80px-Zara_Logo.svg.png"
  };

  return knownIcons[normalized] || `https://via.placeholder.com/32?text=${store[0].toUpperCase()}`;
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['products'], (result) => {
    allProducts = Array.isArray(result.products) ? result.products : [];
    renderBrandFilters();
    renderProducts();

    document.getElementById('prev-btn').addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderProducts();
      }
    });

    document.getElementById('next-btn').addEventListener('click', () => {
      const products = filteredStore
        ? allProducts.filter(p => p.store === filteredStore)
        : allProducts;
      if ((currentPage * ITEMS_PER_PAGE) < products.length) {
        currentPage++;
        renderProducts();
      }
    });
  });
});
