// ============================================
// BACKGROUND SERVICE WORKER (FIXED VERSION)
// ============================================
// Handles sync between Chrome Storage and Supabase
// Runs in the background, always listening

import supabaseClient from './supabase-client.js';

console.log('🪞 DRESSING ROOM: Background worker loaded');

// Sync state
let syncInProgress = false;
let lastSyncTime = null;

// ============================================
// INITIALIZATION
// ============================================

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('🪞 Extension installed/updated:', details.reason);
  
  // Initialize Supabase client
  const initialized = await supabaseClient.initialize();
  if (!initialized) {
    console.error('❌ Failed to initialize Supabase. Check config.js');
  } else {
    console.log('✅ Supabase initialized successfully');
  }
  
  // Set default settings
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      syncEnabled: false,
      autoSync: true,
      syncInterval: 300000, // 5 minutes
      lastSyncTime: null
    });
  }
});

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('🪞 Browser started, initializing...');
  const initialized = await supabaseClient.initialize();
  
  if (!initialized) {
    console.error('❌ Failed to initialize Supabase on startup');
    return;
  }
  
  // Auto-sync if enabled
  const { syncEnabled, autoSync } = await chrome.storage.local.get(['syncEnabled', 'autoSync']);
  if (syncEnabled && autoSync) {
    syncFromBackend();
  }
});

// ============================================
// MESSAGE HANDLER
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Background received message:', request.action);
  
  // Handle async responses
  (async () => {
    try {
      switch (request.action) {
        case 'signIn':
          await handleSignIn();
          sendResponse({ success: true });
          break;
          
        case 'signOut':
          await handleSignOut();
          sendResponse({ success: true });
          break;
          
        case 'syncProduct':
          await syncProductToBackend(request.product);
          sendResponse({ success: true });
          break;
          
        case 'syncAll':
          await syncAllProducts();
          sendResponse({ success: true });
          break;
          
        case 'pullFromBackend':
          await syncFromBackend();
          sendResponse({ success: true });
          break;
          
        case 'checkSyncStatus':
          const status = await getSyncStatus();
          sendResponse(status);
          break;
          
        case 'configureSupabase':
          await supabaseClient.configure(request.url, request.key);
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('❌ Background error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // Keep message channel open for async response
});

// ============================================
// AUTHENTICATION
// ============================================

async function handleSignIn() {
  console.log('🔐 Starting sign in...');
  
  // Make sure Supabase is initialized
  const initialized = await supabaseClient.initialize();
  if (!initialized) {
    throw new Error('Supabase not initialized. Check config.js');
  }
  
  try {
    // Open auth URL in new tab
    const { data, error } = await supabaseClient.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: chrome.identity.getRedirectURL(),
        skipBrowserRedirect: false
      }
    });
    
    if (error) {
      console.error('❌ Auth error:', error);
      throw error;
    }
    
    console.log('✅ Auth URL generated:', data.url);
    
    // Open in new tab
    if (data.url) {
      chrome.tabs.create({ url: data.url });
    }
    
  } catch (error) {
    console.error('❌ Sign in failed:', error);
    throw error;
  }
}

async function handleSignOut() {
  console.log('🔐 Signing out...');
  await supabaseClient.signOut();
  
  // Disable sync
  await chrome.storage.local.set({ syncEnabled: false });
  
  // Notify popup
  notifyPopup({ action: 'syncDisabled' });
}

// ============================================
// SYNC LOGIC
// ============================================

// Sync single product to backend
async function syncProductToBackend(product) {
  if (!supabaseClient.isAuthenticated()) {
    console.log('⏭️  Not authenticated, skipping sync');
    return;
  }
  
  console.log('☁️  Syncing product to backend:', product.name);
  
  try {
    // Check if product already exists
    const existing = await supabaseClient.productExists(product.url);
    
    if (existing) {
      // Update existing product
      console.log('📝 Updating existing product');
      
      // Add new price to history if different
      const oldPrice = existing.price;
      const newPrice = product.price;
      
      if (oldPrice !== newPrice) {
        const priceEntry = {
          price: newPrice,
          timestamp: new Date().toISOString(),
          numericPrice: parsePrice(newPrice),
          isSale: product.priceHistory?.[product.priceHistory.length - 1]?.isSale || false,
          confidence: product.detectionConfidence || 0.7,
          method: product.detectionMethod || 'manual'
        };
        
        await supabaseClient.updatePrice(existing.id, newPrice, priceEntry);
      } else {
        // Just update timestamp
        await supabaseClient.updateProduct(existing.id, {
          last_checked: new Date().toISOString()
        });
      }
    } else {
      // Create new product
      console.log('✨ Creating new product');
      await supabaseClient.createProduct(product);
    }
    
    // Update last sync time
    lastSyncTime = new Date().toISOString();
    await chrome.storage.local.set({ lastSyncTime });
    
    console.log('✅ Sync complete');
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

// Sync all local products to backend
async function syncAllProducts() {
  if (syncInProgress) {
    console.log('⏭️  Sync already in progress');
    return;
  }
  
  if (!supabaseClient.isAuthenticated()) {
    console.log('⏭️  Not authenticated');
    return;
  }
  
  syncInProgress = true;
  console.log('🔄 Starting full sync...');
  
  try {
    // Get all local products
    const { products } = await chrome.storage.local.get(['products']);
    const localProducts = products || [];
    
    console.log(`📦 Found ${localProducts.length} local products`);
    
    // Sync each product
    for (const product of localProducts) {
      await syncProductToBackend(product);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ Full sync complete');
    
    // Update sync status
    await chrome.storage.local.set({
      lastSyncTime: new Date().toISOString(),
      syncEnabled: true
    });
    
    // Notify popup
    notifyPopup({ action: 'syncComplete' });
  } catch (error) {
    console.error('❌ Full sync failed:', error);
  } finally {
    syncInProgress = false;
  }
}

// Pull products from backend
async function syncFromBackend() {
  if (!supabaseClient.isAuthenticated()) {
    console.log('⏭️  Not authenticated');
    return;
  }
  
  console.log('⬇️  Pulling from backend...');
  
  try {
    // Fetch all products from Supabase
    const backendProducts = await supabaseClient.fetchProducts();
    
    // Get local products
    const { products: localProducts } = await chrome.storage.local.get(['products']);
    
    // Merge (backend takes precedence for now - can implement smarter merge later)
    const merged = mergeProducts(localProducts || [], backendProducts);
    
    // Save merged products locally
    await chrome.storage.local.set({ products: merged });
    
    console.log(`✅ Pulled ${backendProducts.length} products from backend`);
    
    // Update last sync time
    lastSyncTime = new Date().toISOString();
    await chrome.storage.local.set({ lastSyncTime });
    
    // Notify popup to refresh
    notifyPopup({ action: 'productsUpdated' });
  } catch (error) {
    console.error('❌ Pull from backend failed:', error);
  }
}

// Merge local and backend products
function mergeProducts(localProducts, backendProducts) {
  const merged = [];
  const seenUrls = new Set();
  
  // Add backend products first (they're the source of truth)
  for (const product of backendProducts) {
    merged.push(convertFromSupabase(product));
    seenUrls.add(product.url);
  }
  
  // Add local products that aren't in backend
  for (const product of localProducts) {
    if (!seenUrls.has(product.url)) {
      merged.push(product);
    }
  }
  
  return merged;
}

// Convert Supabase format to extension format
function convertFromSupabase(supabaseProduct) {
  return {
    name: supabaseProduct.name,
    url: supabaseProduct.url,
    store: supabaseProduct.store,
    price: supabaseProduct.price,
    image: supabaseProduct.image,
    images: supabaseProduct.images || [],
    colors: supabaseProduct.colors || [],
    sizes: supabaseProduct.sizes || [],
    material: supabaseProduct.material,
    isFavorite: supabaseProduct.is_favorite,
    priceHistory: supabaseProduct.price_history || [],
    savedAt: supabaseProduct.saved_at,
    updatedAt: supabaseProduct.updated_at,
    lastChecked: supabaseProduct.last_checked,
    detectionMethod: supabaseProduct.detection_method,
    detectionConfidence: supabaseProduct.detection_confidence,
    supabaseId: supabaseProduct.id // Keep track of backend ID
  };
}

// ============================================
// SYNC STATUS
// ============================================

async function getSyncStatus() {
  const isAuthenticated = supabaseClient.isAuthenticated();
  const user = supabaseClient.getUser();
  const { syncEnabled, lastSyncTime } = await chrome.storage.local.get(['syncEnabled', 'lastSyncTime']);
  
  return {
    isAuthenticated,
    user: user ? { email: user.email, id: user.id } : null,
    syncEnabled: syncEnabled || false,
    lastSyncTime: lastSyncTime,
    syncInProgress
  };
}

// ============================================
// AUTO SYNC
// ============================================

// Set up periodic sync
chrome.alarms.create('autoSync', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'autoSync') {
    const { syncEnabled, autoSync } = await chrome.storage.local.get(['syncEnabled', 'autoSync']);
    
    if (syncEnabled && autoSync) {
      console.log('⏰ Auto-sync triggered');
      await syncFromBackend();
    }
  }
});

// ============================================
// STORAGE CHANGE LISTENER
// ============================================

// Sync when products change locally
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'local' && changes.products) {
    const { syncEnabled } = await chrome.storage.local.get(['syncEnabled']);
    
    if (syncEnabled && !syncInProgress) {
      console.log('📦 Local products changed, syncing...');
      // Don't sync immediately to avoid conflicts, wait a bit
      setTimeout(() => syncFromBackend(), 2000);
    }
  }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[,$£€¥₹]/g, '').trim();
  const match = cleaned.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

function notifyPopup(message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Popup might not be open, that's okay
  });
}

console.log('✅ Background worker ready');
