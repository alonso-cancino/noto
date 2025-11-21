# Google OAuth Setup for Noto

This guide walks you through setting up Google OAuth credentials to enable Google Drive synchronization in Noto.

## Overview

Noto uses Google's OAuth 2.0 to securely authenticate with your Google Drive account. This allows the app to:
- Upload and download your notes and PDFs
- Sync files across multiple devices
- Work offline with automatic sync when reconnected

## Prerequisites

- A Google account
- Noto development environment set up (Node.js installed, repo cloned)

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter a project name (e.g., "Noto Desktop App")
4. Click **Create**
5. Wait for the project to be created (this takes a few seconds)

### 2. Enable Google Drive API

1. In the Google Cloud Console, select your new project
2. Go to **APIs & Services** → **Library**
3. Search for "Google Drive API"
4. Click on **Google Drive API** in the results
5. Click **Enable**
6. Wait for the API to be enabled

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (unless you have a Google Workspace account)
3. Click **Create**

4. Fill in the required fields:
   - **App name:** Noto
   - **User support email:** Your email address
   - **Developer contact information:** Your email address
5. Click **Save and Continue**

6. On the **Scopes** page:
   - Click **Add or Remove Scopes**
   - Search for "Google Drive API"
   - Select these scopes:
     - `https://www.googleapis.com/auth/drive.file` (View and manage Drive files created by this app)
     - `https://www.googleapis.com/auth/drive.appdata` (View and manage app data)
   - Click **Update**
   - Click **Save and Continue**

7. On the **Test users** page:
   - Click **Add Users**
   - Enter your Google email address
   - Click **Add**
   - Click **Save and Continue**

8. Review the summary and click **Back to Dashboard**

### 4. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type:** Desktop app
4. Enter a name (e.g., "Noto Desktop Client")
5. Click **Create**

6. A dialog will appear with your credentials:
   - **Client ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-abc123def456`)
7. Click **Download JSON** to save the credentials
8. Click **OK** to close the dialog

### 5. Configure Noto with Your Credentials

1. In the Noto repository, copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in a text editor

3. Fill in your credentials from step 4:
   ```bash
   GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
   GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
   ```

   **Important:** The redirect URI must be exactly `http://localhost:3000/oauth/callback`

4. Save the file

### 6. Add Redirect URI to Google Cloud

1. Go back to **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID (the one you just created)
3. Under **Authorized redirect URIs**, click **Add URI**
4. Enter: `http://localhost:3000/oauth/callback`
5. Click **Save**

### 7. Test the Setup

1. Start Noto in development mode:
   ```bash
   npm run dev
   ```

2. In the app, go to **Settings** (gear icon in sidebar)
3. Click **Connect to Google Drive**
4. You should see a Google sign-in window open
5. Sign in with the email you added as a test user
6. Grant the requested permissions
7. You should be redirected back to Noto

If this works, your OAuth setup is complete!

## Troubleshooting

### Error: "Access blocked: This app's request is invalid"

**Problem:** The redirect URI doesn't match what's configured in Google Cloud.

**Solution:**
1. Verify the redirect URI in your `.env` file is exactly: `http://localhost:3000/oauth/callback`
2. Verify the same URI is added to "Authorized redirect URIs" in Google Cloud Console
3. Make sure there are no extra spaces or typos

### Error: "Access blocked: Noto has not completed the Google verification process"

**Problem:** Your app is still in testing mode and the user isn't added as a test user.

**Solution:**
1. Go to **OAuth consent screen** in Google Cloud Console
2. Scroll to **Test users**
3. Add the Google email you're trying to sign in with
4. Try again

### Error: "invalid_client"

**Problem:** The Client ID or Client Secret is incorrect.

**Solution:**
1. Go to **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Copy the Client ID and Client Secret again
4. Update your `.env` file
5. Restart Noto

### Browser Window Doesn't Open

**Problem:** Electron can't open the OAuth window.

**Solution:**
1. Check the Electron console for errors (View → Toggle Developer Tools)
2. Verify your `.env` file is in the root directory of the project
3. Try restarting the app

### "Drive sync will not work" Warning

**Problem:** Noto can't find your OAuth credentials.

**Solution:**
1. Make sure your `.env` file exists in the project root
2. Check that the variable names are correct:
   - `GOOGLE_CLIENT_ID` (not `CLIENT_ID`)
   - `GOOGLE_CLIENT_SECRET` (not `CLIENT_SECRET`)
3. Restart the app for environment variables to be loaded

## Security Notes

- **Never commit your `.env` file** - It's already in `.gitignore` to prevent this
- **Keep your Client Secret private** - Don't share it publicly
- **Test users only:** While in testing mode, only users you explicitly add can sign in
- **Publishing:** To allow any Google user to sign in, you need to submit your app for Google verification (only necessary if you're distributing Noto publicly)

## Production Deployment

If you're building Noto for production distribution:

1. **App Verification:** Submit your app for Google's verification process
2. **Environment Variables:** Use build-time environment variables or a secure configuration system
3. **Redirect URI:** Update to use a secure production callback URL
4. **Scopes:** Only request the minimum necessary permissions

For development and personal use, the setup above is sufficient.

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [Electron OAuth Guide](https://www.electronjs.org/docs/latest/tutorial/oauth)

## Need Help?

If you encounter issues not covered here:
1. Check the Electron console for detailed error messages
2. Verify all steps above were completed correctly
3. Open an issue on the Noto GitHub repository with details about the error
