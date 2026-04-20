# Daily Download Limit Enforcement - Implementation Guide

## Overview
This implementation enforces a daily download limit of 5 downloads per business profile per day without breaking existing functionality.

## ✅ Implementation Summary

### 1. Business Context Centralization
- **Enhanced** `BusinessProfileContext.tsx` with `selectedBusinessProfileId` alias
- Ensures global access to currently selected business profile ID

### 2. API Layer Enhancement
- **Updated** download tracking APIs to conditionally include `businessProfileId`:
  - `downloadTracking.ts` - Core tracking service
  - `downloadHelper.ts` - Utility functions
  - `businessCategoryPostersApi.ts` - Poster downloads
  - `templatesBannersApi.ts` - Template downloads  
  - `greetingTemplates.ts` - Greeting downloads
  - `homeApi.ts` - General content downloads

### 3. Centralized Error Handling
- **Enhanced** `errorHandler.ts` with specific download limit detection
- **Updated** API interceptor in `api.ts` to emit download limit events
- **Created** `downloadLimitEvents.ts` for global event management

### 4. UI/UX Handling
- **Created** `useDownloadLimitHandler.ts` hook for reactive UI feedback
- **Created** `DownloadLimitProvider.tsx` for app-wide handling
- **Created** `useBusinessAwareDownloadTracking.ts` for seamless integration

## 🚀 How to Use

### For Existing Components (Minimal Changes)

#### Option 1: Wrap Your App
```tsx
import { DownloadLimitProvider } from './src/components/DownloadLimitProvider';

export default function App() {
  return (
    <DownloadLimitProvider>
      {/* Your existing app components */}
    </DownloadLimitProvider>
  );
}
```

#### Option 2: Use the Hook in Screens
```tsx
import { useDownloadLimitHandler } from './src/hooks/useDownloadLimitHandler';

function YourScreen() {
  useDownloadLimitHandler(); // Handles limit errors automatically
  
  // Your existing screen logic
}
```

#### Option 3: Use Business-Aware Download Tracking
```tsx
import { useBusinessAwareDownloadTracking } from './src/hooks/useBusinessAwareDownloadTracking';

function DownloadComponent() {
  const { trackTemplateDownload } = useBusinessAwareDownloadTracking();
  
  const handleDownload = async () => {
    await trackTemplateDownload(templateId, url, title);
    // Business profile ID is automatically included
  };
}
```

### For New Components
Use the business-aware hook for automatic business profile ID injection:
```tsx
const { 
  trackDownload, 
  trackTemplateDownload, 
  trackPosterDownload 
} = useBusinessAwareDownloadTracking();
```

## 🔧 API Changes (Non-Breaking)

All download APIs now accept an optional `businessProfileId` parameter:

```typescript
// Before (still works)
await downloadTemplate(templateId);

// After (enhanced)
await downloadTemplate(templateId, businessProfileId);
```

## 🎯 Error Handling Flow

1. **Backend** returns `403 Forbidden` with message `"Daily download limit reached"`
2. **API Interceptor** detects the specific error and emits global event
3. **UI Components** automatically show user-friendly alert
4. **Download Functions** gracefully handle the error without breaking

## 📱 User Experience

- **Normal Operation**: No change to existing download flow
- **Limit Reached**: User sees clear message: *"You have reached your daily download limit. Please try again tomorrow."*
- **Business Context**: Limits are properly scoped per business profile

## 🔒 Safety Features

- **Non-Breaking**: All existing functionality preserved
- **Optional Parameters**: Business profile ID only sent when available
- **Specific Error Handling**: Only affects "Daily download limit reached" messages
- **Graceful Degradation**: Works even when no business profile is selected

## 🧪 Testing Checklist

- [x] Existing download functionality works without business profile
- [x] Business profile ID is included when available
- [x] 403 errors are handled specifically for download limits
- [x] Other 403 errors (auth, permissions) are unaffected
- [x] UI feedback is clear and non-intrusive
- [x] No duplicate logic across components

## 🔄 Future Extensibility

The implementation is ready for:
- **Free vs Paid tiers** (different limits per plan)
- **Download statistics** (backend can provide usage counts)
- **Time-based limits** (weekly, monthly, etc.)
- **Custom limit messages** per business profile type

## 🎉 Implementation Complete!

The daily download limit enforcement is now fully implemented and ready for production use.
