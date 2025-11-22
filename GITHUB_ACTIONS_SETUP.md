# GitHub Actions Setup for BudTracker iOS Builds

This guide explains how to set up automated iOS builds using GitHub Actions with your free Apple Developer account.

## Overview

The GitHub Actions workflow automatically triggers EAS builds when you push to the `main` branch or manually from the Actions tab. This uses EAS's free build tier, so you don't need to pay for EAS Build credits or GitHub Actions macOS runners.

## Prerequisites

- Free Apple Developer account
- GitHub repository for BudTracker
- Expo account (free)

## Setup Instructions

### 1. Get Your Expo Access Token

1. Go to [https://expo.dev/accounts/[your-username]/settings/access-tokens](https://expo.dev/settings/access-tokens)
2. Click "Create Token"
3. Give it a name like "GitHub Actions"
4. Copy the token (you won't see it again!)

### 2. Get Your Apple Developer Credentials

You need three pieces of information:

#### Apple ID
- Your Apple ID email (e.g., `your.email@example.com`)

#### App-Specific Password
1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. In the "Sign-In and Security" section, click "App-Specific Passwords"
4. Click "Generate an app-specific password"
5. Enter a label like "EAS Build"
6. Copy the generated password (format: `xxxx-xxxx-xxxx-xxxx`)

#### Team ID
1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Sign in with your Apple ID
3. Your Team ID is shown in the top right (10 characters, e.g., `A1B2C3D4E5`)
4. For free accounts, this is your Personal Team ID

### 3. Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of these:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `EXPO_TOKEN` | Your Expo access token | `abc123...` |
| `EXPO_APPLE_ID` | Your Apple ID email | `your.email@example.com` |
| `EXPO_APPLE_PASSWORD` | App-specific password | `xxxx-xxxx-xxxx-xxxx` |
| `EXPO_APPLE_TEAM_ID` | Your Team ID | `A1B2C3D4E5` |

### 4. Push the Workflow

1. Commit and push the workflow file to your repository:
   ```bash
   git add .github/workflows/build-ios.yml
   git commit -m "Add GitHub Actions iOS build workflow"
   git push origin main
   ```

2. The workflow will trigger automatically on push to `main`

## Using the Workflow

### Automatic Builds
- Every push to the `main` branch triggers a build automatically

### Manual Builds
1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select **Build iOS App** workflow
4. Click **Run workflow** → **Run workflow**

### Downloading Your IPA

1. Wait for the GitHub Action to complete (usually 1-2 minutes)
2. The action submits the build to EAS servers
3. Go to [expo.dev](https://expo.dev) and sign in
4. Navigate to your project → **Builds**
5. Wait for the build to complete (10-20 minutes)
6. Click **Download** to get your `.ipa` file

## Troubleshooting

### Build fails with "Invalid credentials"
- Double-check your GitHub secrets are correct
- Ensure you're using an app-specific password, not your regular Apple ID password
- Verify your Team ID is correct

### Build fails with "Bundle identifier already in use"
- Your bundle ID (`com.rapou7.budtracker`) might be registered to a different team
- Try changing it in `app.json` under `expo.ios.bundleIdentifier`

### "No provisioning profile found"
- EAS will automatically create one on the first build
- Make sure you've accepted the Apple Developer Program License Agreement at [developer.apple.com/account](https://developer.apple.com/account)

### Free account limitations
- Apps built with free accounts expire after 7 days
- You'll need to rebuild and reinstall weekly
- This is an Apple limitation, not a GitHub Actions issue

## Cost Information

✅ **Completely Free:**
- GitHub Actions (workflow just triggers EAS, doesn't use macOS runners)
- EAS Build free tier (limited builds per month)
- Free Apple Developer account

⚠️ **Free Tier Limits:**
- EAS free tier: Check current limits at [expo.dev/pricing](https://expo.dev/pricing)
- If you exceed limits, builds will queue until next month or you can upgrade

## Next Steps

After downloading your `.ipa`:
1. Install on your device using LiveContainer or AltStore
2. Remember to rebuild before the 7-day expiration
3. Consider setting up a weekly scheduled build if needed

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Apple Developer Program](https://developer.apple.com/programs/)
