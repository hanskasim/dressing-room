# The Dressing Room - Chrome Extension

A Chrome extension to save and track fashion items from any store with cloud sync.

## 🔒 Security Setup (IMPORTANT)

This project uses Supabase for cloud sync. **Your credentials are sensitive and should never be committed to Git.**

### First-Time Setup:

1. **Create your config file:**
   ```bash
   cp config.example.js config.js
   ```

2. **Add your Supabase credentials:**
   - Go to [https://supabase.com](https://supabase.com)
   - Create a new project or use an existing one
   - Go to Settings > API
   - Copy your credentials:
     - Project URL
     - anon/public key
   - Paste them into `config.js`

3. **Verify config.js is in .gitignore:**
   - The `.gitignore` file already excludes `config.js`
   - Never commit `config.js` to version control

## 📦 Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this directory

## 🚀 Features

- Save fashion items from any website
- Track price history
- Multi-image support
- Brand filters and search
- Cloud sync with Supabase
- Compare items side-by-side

## 🔐 Security Notes

**Files that contain sensitive data (already in .gitignore):**
- `config.js` - Contains your Supabase credentials
- `.env*` - Environment files

**Safe to commit:**
- `config.example.js` - Template file with no real credentials
- All other `.js`, `.html`, `.css` files
- `manifest.json`

## 📝 Development

The extension uses:
- Manifest V3
- Supabase for backend/auth
- Chrome Storage API for local caching
- Content scripts for product detection

## ⚠️ Before Pushing to GitHub

1. Make sure `config.js` is NOT staged for commit
2. Check `.gitignore` includes `config.js`
3. Never share your Supabase credentials publicly

To verify what will be committed:
```bash
git status
```

Make sure `config.js` does NOT appear in the list!
