# Supabase OAuth Setup for Chrome Extension

## Step 1: Get Your Extension ID

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Load your extension (if not already loaded)
4. **Copy your Extension ID** - it looks like: `abcdefghijklmnopqrstuvwxyz123456`

## Step 2: Configure Supabase OAuth

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **Authentication** > **URL Configuration**
3. Add your redirect URL to **Redirect URLs**:

   ```
   https://YOUR_EXTENSION_ID.chromiumapp.org/oauth-callback.html
   ```

   Replace `YOUR_EXTENSION_ID` with the actual ID from Step 1.

   Example:
   ```
   https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/oauth-callback.html
   ```

4. Click **Save**

## Step 3: Enable Google OAuth Provider

1. In Supabase, go to **Authentication** > **Providers**
2. Find **Google** in the list
3. Toggle it to **Enabled**
4. You'll need:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)

### Getting Google OAuth Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
5. Choose **Web application**
6. Add Authorized redirect URIs:
   - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**
8. Paste them into Supabase Google provider settings

## Step 4: Test the OAuth Flow

1. Reload your Chrome extension
2. Open the extension popup
3. Click "Connect" button
4. You should see:
   - Google sign-in page opens
   - After signing in, you're redirected to the callback page
   - The callback page shows "Completing sign in..."
   - The tab closes automatically
   - Extension shows "Synced" status

## Troubleshooting

### "Site cannot be reached" error
- **Cause**: Redirect URL not configured in Supabase
- **Fix**: Make sure you added the correct extension ID to Supabase redirect URLs

### OAuth callback page doesn't close
- **Cause**: Extension ID mismatch or callback not handled
- **Fix**: Check browser console (F12) on the callback page for errors

### "Not authenticated" after sign-in
- **Cause**: Session not established
- **Fix**: Check background service worker console for errors

## Checking Logs

### Extension Background Worker Console:
1. Go to `chrome://extensions/`
2. Find your extension
3. Click "service worker" link
4. Check console for OAuth logs

### OAuth Callback Page Console:
1. When the callback page opens, quickly press F12
2. Check console for token extraction logs

## Security Notes

- The `oauth-callback.html` page is only accessible from your extension
- Tokens are never exposed to external websites
- All communication happens securely through Chrome extension messaging
