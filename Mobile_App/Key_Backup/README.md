# 🔐 EventMarketers Keystore Backup

## ⚠️ CRITICAL WARNING
**This folder contains sensitive security credentials for your Android app. Keep it SECURE and PRIVATE!**

---

## 📁 Files in This Backup

| File | Size | Description |
|------|------|-------------|
| `release.keystore` | 2.8 KB | **MOST IMPORTANT** - The signing key for your app |
| `keystore.properties` | 120 bytes | Configuration file with passwords |
| `KEYSTORE_BACKUP_INFO.txt` | 7.2 KB | Complete documentation and instructions |
| `README.md` | This file | Quick reference guide |

---

## 🔑 Quick Credentials Reference

```
Store Password: marketbrand2025
Key Password: marketbrand2025
Key Alias: marketbrand-release
```

**SHA1 Fingerprint:**
```
BA:D4:5C:B0:EB:4F:D9:37:05:03:0A:31:37:A9:52:68:75:42:29:DC
```

---

## 🚀 Quick Commands

### Build Signed AAB (for Google Play)
```bash
cd android
gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Build Signed APK (for direct install)
```bash
cd android
gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

### Verify Keystore
```bash
keytool -list -v -keystore release.keystore -storepass marketbrand2025 -alias marketbrand-release
```

---

## 📋 Backup Checklist

- [ ] Copy to USB drive
- [ ] Upload to Google Drive (encrypted)
- [ ] Email to team members
- [ ] Store in password manager
- [ ] Keep printed copy in safe
- [ ] Test restore process

---

## 🆘 What If You Lose This Keystore?

**If lost BEFORE publishing:**
- Generate new keystore
- Use new one for publishing

**If lost AFTER publishing:**
- ❌ Cannot update existing app
- Must publish as new app
- Lose all users, ratings, reviews
- **THIS IS WHY BACKUP IS CRITICAL!**

---

## 📱 App Information

- **Package Name:** `com.eventmarketers`
- **App Name:** EventMarketers
- **Version Code:** 1
- **Version Name:** 1.0

---

## 🔄 How to Restore

1. Copy `release.keystore` to: `android/app/release.keystore`
2. Copy `keystore.properties` to: `android/keystore.properties`
3. Verify SHA1 fingerprint matches
4. Build and test

---

## 📞 Emergency Resources

- **Google Play Console:** https://play.google.com/console
- **Android Docs:** https://developer.android.com/studio/publish/app-signing
- **Stack Overflow:** Tag: `android-keystore`

---

## 📅 Important Dates

- **Created:** October 10, 2025
- **Expires:** February 25, 2053
- **Valid For:** 27+ years

---

## 🛡️ Security Best Practices

✅ **DO:**
- Keep multiple backups in different locations
- Encrypt before uploading to cloud
- Share only through secure channels
- Use Google Play App Signing
- Test restore process regularly

❌ **DON'T:**
- Commit to Git/GitHub
- Share via email/messaging
- Store in unsecured locations
- Lose track of passwords
- Forget to backup

---

## 📖 More Information

For complete details, troubleshooting, and step-by-step instructions, read:
📄 **KEYSTORE_BACKUP_INFO.txt**

---

**Last Updated:** October 10, 2025  
**Backup Status:** ✅ Complete

---

*Remember: This keystore is the KEY to your app's future. Treat it like gold! 🔑✨*

