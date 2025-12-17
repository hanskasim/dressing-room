# 🪞 The Dressing Room - Chrome Extension

Save and track fashion items from any online store. Your personal virtual dressing room for curating the perfect wardrobe!

## ✨ Features

- **💾 Save Items**: One-click save from any fashion website
- **📊 Price Tracking**: Automatic price history and trend detection
- **🏷️ Sale Detection**: Identifies sale items and original prices
- **⚖️ Compare Mode**: Side-by-side comparison of saved items
- **🔍 Smart Filters**: Filter by brand, favorites, price range
- **📈 Price Alerts**: See when prices drop or increase
- **📸 Multi-Image Support**: Save product galleries
- **🎨 Beautiful UI**: Warm, dressing room-inspired design

## 🚀 Installation

### Install from Chrome Web Store
*(Coming soon - extension under review)*

### Install Locally (Developer Mode)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dressing-room` folder

## 📖 How to Use

### Saving Items

1. Click the extension icon and click **"Show Save Button"**
2. Visit any fashion website (Uniqlo, H&M, Zara, Nike, etc.)
3. On a product page, click the **"🪞 Save to Dressing Room"** button
4. Item is saved with price, images, and metadata!

### Viewing Your Collection

1. Click the extension icon to open your dressing room
2. Browse all saved items with images and prices
3. Filter by brand using the brand icons
4. Click the star (⭐) to favorite items
5. Use the sort dropdown to organize by price, date, brand, or name

### Tracking Prices

1. Click **"🔄 Refresh Prices"** to check current prices
2. See price trends with up/down indicators
3. Click **"📊 Price History"** on any item to see historical data
4. Items show freshness indicators (🟢 Fresh, 🟡 Recent, 🟠 Stale)

### Comparing Items

1. Save at least 2 items
2. Click **"⚖️ Compare"** button
3. View items side-by-side with detailed comparisons
4. See price differences, images, and specifications

## 🛠️ Technical Details

- **Manifest V3** compliant
- **Local storage** via Chrome Storage API
- **Smart detection** for product names, prices, images
- **Structured data** parsing (JSON-LD)
- **Sale detection** across multiple retailers
- **No external dependencies** - works completely offline

## 🏪 Supported Stores

Works on virtually any e-commerce site, with enhanced detection for:

- Uniqlo
- H&M
- Zara
- Nike
- Adidas
- Gap, Old Navy, Banana Republic
- J.Crew, Madewell
- Aritzia
- Forever 21
- And many more!

## 🔒 Privacy & Security

- **100% local** - all data stored on your device
- **No tracking** - we don't collect any personal information
- **No accounts required** - works immediately
- **Offline-first** - internet only needed for price checks

## 🗂️ File Structure

```
dressing-room/
├── manifest.json          # Extension configuration
├── content.js            # Product detection & save button
├── popup.html           # Main UI
├── popup.js             # UI logic
├── background.js        # Background worker
├── compare.html         # Comparison view
├── compare.js           # Comparison logic
├── config.example.js    # Configuration template
└── README.md            # This file
```

## 🔮 Future Features

Cloud sync and web app access are planned for v3.0! Files for this feature are in `future-features/cloud-sync/`.

Planned features:
- ☁️ Cloud sync across devices
- 🌐 Web app version
- 📱 Mobile companion app
- 🤝 Share collections with friends
- 🤖 AI-powered style recommendations

## 🐛 Troubleshooting

### Save button not appearing?
- Make sure you clicked "Show Save Button" in the extension popup
- Refresh the product page
- Check that you're on a product detail page (not a category/listing page)

### Price detection not working?
- Some sites have complex layouts - detection works best on major retailers
- Structured data (when available) provides most accurate results

### Items not saving?
- Check Chrome Storage permissions in `chrome://extensions/`
- Clear extension data and try again

## 📝 Development

### Setting Up

```bash
git clone https://github.com/hanskasim/dressing-room.git
cd dressing-room
```

### Making Changes

1. Edit the files
2. Go to `chrome://extensions/`
3. Click reload (🔄) on the extension
4. Test your changes

### Configuration

Create `config.js` from `config.example.js`:
```bash
cp config.example.js config.js
```

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License - feel free to use and modify!

## 🙏 Credits

Built with ❤️ by Hans Kasim

Powered by:
- Chrome Extension APIs
- Vanilla JavaScript
- Love for fashion and organization

---

**Note:** This extension does not collect, store, or transmit any personal data. All information is stored locally on your device.
