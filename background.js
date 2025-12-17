// ============================================
// BACKGROUND SERVICE WORKER (Simple Version)
// ============================================
// Handles basic extension functionality without cloud sync

console.log('🪞 DRESSING ROOM: Background worker loaded');

// ============================================
// INITIALIZATION
// ============================================

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('🪞 Extension installed/updated:', details.reason);

  // Set default settings
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      autoSync: false,
      lastSyncTime: null
    });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('🪞 Browser started, extension ready');
});

// ============================================
// AUTO PRICE CHECK (Optional Future Feature)
// ============================================

// Set up periodic price checks (disabled by default)
// Uncomment to enable auto price checking every 6 hours
/*
chrome.alarms.create('autoPriceCheck', { periodInMinutes: 360 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'autoPriceCheck') {
    console.log('⏰ Auto price check triggered');
    // Future: Implement automatic price checking
  }
});
*/

console.log('✅ Background worker ready');
