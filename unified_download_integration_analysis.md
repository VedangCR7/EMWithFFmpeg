# UNIFIED DOWNLOAD API & BUSINESS-BASED FILTERING INTEGRATION ANALYSIS

**Analysis Date**: April 2, 2026  
**System Architect**: Senior React Native Analysis  
**Target**: Integration of POST /api/mobile/download and GET /api/mobile/downloads/business/:businessProfileId

---

## 1. CURRENT FLOW ANALYSIS

### PosterPreviewScreen (Download Flow)

**Current Implementation State**:
- ✅ **Already Integrated**: Uses `useCentralizedDownload` hook
- ✅ **Business Profile Context**: Connected via `useBusinessProfile()`
- ✅ **API Service**: Uses `downloadService.downloadContent()` 
- ✅ **businessProfileId**: Passed through centralized system

**Current Download Handler**:
```typescript
// Lines 355-443 in PosterPreviewScreen.tsx
const downloadPoster = async () => {
  if (!capturedImageUri) {
    Alert.alert('Error', 'No poster image available to download');
    return;
  }

  if (isDownloadProcessing) {
    console.log('🔄 Download already in progress, skipping');
    return;
  }

  // Frontend guard: Check if limit is reached
  if (isLimitReached) {
    Alert.alert('Download Limit Reached', 'You have reached your daily download limit. Please try again tomorrow.');
    return;
  }

  try {
    setIsProcessing(true);
    
    // 🔥 CRITICAL: Call backend download API FIRST
    const downloadSuccess = await downloadContent({
      contentId: actualTemplateId,
      contentType: 'poster',
      fileUrl: capturedImageUri,
      businessProfileId: selectedBusinessProfileId, // ✅ Already included
      title: posterTitle,
      thumbnail: capturedImageUri,
      category: posterCategory
    });
    
    if (!downloadSuccess) {
      console.log('❌ Download failed - centralized service returned false');
      return;
    }
    
    // AFTER successful API call, save to gallery
    await CameraRoll.save(capturedImageUri, { type: 'photo' });
    
    // Save poster info locally
    await downloadedPostersService.savePosterInfo({...});
  } catch (error) {
    // Error handling
  }
};
```

**Current State Management**:
- `useCentralizedDownload()` hook provides:
  - `downloadContent()` function with businessProfileId auto-injection
  - `isDownloading` state
  - `downloadCount` tracking
  - `isLimitReached` boolean (5 download limit)

### MyPostersScreen (Display Flow)

**Current Implementation State**:
- ❌ **Mixed Images**: Shows all downloaded posters regardless of business
- ❌ **No Business Filtering**: Uses `downloadedPostersService.getDownloadedPosters(userId)`
- ❌ **Missing Business API**: Not using GET /api/mobile/downloads/business/:businessProfileId

**Current Data Fetching**:
```typescript
// Lines 202-230 in MyPostersScreen.tsx
const loadPosters = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.id;
    
    if (!userId) {
      console.log('❌ [MY POSTERS] No user ID found');
      setPosters([]);
      return;
    }

    // ❌ PROBLEM: Gets ALL user downloads, not business-specific
    const downloadedPosters = await downloadedPostersService.getDownloadedPosters(userId);
    console.log('📊 [MY POSTERS] Loaded posters:', downloadedPosters.length);
    
    setPosters(downloadedPosters);
    
    // Extract categories for filtering
    const uniqueCategories = [...new Set(downloadedPosters.map(p => p.category).filter(Boolean))];
    setCategories(uniqueCategories);
    
  } catch (error) {
    console.error('❌ [MY POSTERS] Error loading posters:', error);
    setError('Failed to load posters. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

**Why It Shows Mixed Images**:
1. `downloadedPostersService.getDownloadedPosters(userId)` returns ALL downloads for user
2. No business profile filtering applied
3. Downloads from multiple business profiles are mixed together
4. Missing integration with new business-specific API

---

## 2. GAP ANALYSIS

### Critical Missing Elements

#### PosterPreviewScreen
- ✅ **NO GAPS**: Already properly integrated with Unified Download API
- ✅ Business profile ID is correctly passed
- ✅ Error handling for 429, 404, generic errors exists
- ✅ Daily limit enforcement implemented

#### MyPostersScreen
- ❌ **Missing Business Filtering**: No businessProfileId usage in data fetching
- ❌ **Wrong API Endpoint**: Not using GET /api/mobile/downloads/business/:businessProfileId
- ❌ **State Management Issue**: No connection to BusinessProfileContext for business changes
- ❌ **Data Source Problem**: Using user-scoped downloads instead of business-scoped

### Integration Gaps Identified

1. **Business Profile Context Disconnect**:
   - MyPostersScreen imports `useBusinessProfile` but doesn't use `selectedBusinessProfileId`
   - No re-fetch when business profile changes
   - Missing `useFocusEffect` or `useEffect` dependency on business profile changes

2. **API Integration Gap**:
   - Should call: `GET /api/mobile/downloads/business/:businessProfileId`
   - Currently calls: `downloadedPostersService.getDownloadedPosters(userId)` (local storage)

3. **State Management Gap**:
   - No business-specific state management
   - Missing refresh mechanism when business switches
   - No loading states for business-specific data

4. **Data Structure Mismatch**:
   - API returns: `{ fileUrl, title, thumbnailUrl, downloadDate, businessProfileId }`
   - Current expects: `DownloadedPoster` interface with different fields

---

## 3. INTEGRATION PLAN (STEP-BY-STEP)

### PosterPreviewScreen Integration

**Status**: ✅ ALREADY COMPLETE - No changes needed

**Current Implementation is Correct**:
1. ✅ Uses `useCentralizedDownload()` hook
2. ✅ Automatically injects `businessProfileId` from context
3. ✅ Calls POST /api/mobile/download through `downloadService.downloadContent()`
4. ✅ Handles 429 (limit reached), 404 (resource missing), generic errors
5. ✅ Triggers actual file download after API success

**No Action Required** - Already production-ready.

### MyPostersScreen Integration

**Step 1: Add Business Profile Context Connection**
```typescript
// In MyPostersScreen.tsx, add to existing imports:
const { selectedBusinessProfile, selectedBusinessProfileId } = useBusinessProfile();
```

**Step 2: Create New API Service Function**
```typescript
// In services/downloadService.ts, add:
async getBusinessDownloads(businessProfileId: string): Promise<DownloadedItem[]> {
  try {
    console.log('📥 [DOWNLOAD SERVICE] Fetching business downloads:', businessProfileId);
    
    const response = await api.get(`/mobile/downloads/business/${businessProfileId}`);
    
    if (response.data?.success) {
      console.log('✅ [DOWNLOAD SERVICE] Business downloads loaded:', response.data.downloads?.length || 0);
      return response.data.downloads || [];
    }
    
    console.warn('⚠️ [DOWNLOAD SERVICE] No downloads found for business:', businessProfileId);
    return [];
  } catch (error) {
    console.error('❌ [DOWNLOAD SERVICE] Error fetching business downloads:', error);
    throw error;
  }
}
```

**Step 3: Replace Data Fetching Logic**
```typescript
// Replace loadPosters() function in MyPostersScreen.tsx:
const loadPosters = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // ❌ REMOVE: User-based fetching
    // const currentUser = authService.getCurrentUser();
    // const userId = currentUser?.id;
    // const downloadedPosters = await downloadedPostersService.getDownloadedPosters(userId);
    
    // ✅ ADD: Business-based fetching
    if (!selectedBusinessProfileId) {
      console.log('❌ [MY POSTERS] No business profile selected');
      setPosters([]);
      return;
    }
    
    const businessDownloads = await downloadService.getBusinessDownloads(selectedBusinessProfileId);
    
    // Transform API response to DownloadedPoster format
    const transformedPosters: DownloadedPoster[] = businessDownloads.map(item => ({
      id: item.id || Date.now().toString(),
      title: item.title || 'Downloaded Poster',
      description: item.description || '',
      imageUri: item.fileUrl,
      thumbnailUri: item.thumbnailUrl || item.fileUrl,
      downloadDate: item.downloadDate || new Date().toISOString(),
      templateId: item.templateId,
      category: item.category,
      tags: item.tags || [],
      userId: selectedBusinessProfileId, // Track business association
      size: item.size
    }));
    
    setPosters(transformedPosters);
    
    // Extract categories for filtering
    const uniqueCategories = [...new Set(transformedPosters.map(p => p.category).filter(Boolean))];
    setCategories(uniqueCategories);
    
  } catch (error) {
    console.error('❌ [MY POSTERS] Error loading business posters:', error);
    setError('Failed to load posters. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

**Step 4: Add Business Change Detection**
```typescript
// Add to existing useEffect hooks:
useEffect(() => {
  // Refresh posters when business profile changes
  if (selectedBusinessProfileId) {
    console.log('🔄 [MY POSTERS] Business profile changed, refreshing posters...');
    loadPosters();
  }
}, [selectedBusinessProfileId]);
```

---

## 4. STATE MANAGEMENT PLAN

### Business Profile Context Integration

**Current State Flow**:
```
BusinessProfileProvider
  ├── selectedBusinessProfile: BusinessProfile | null
  ├── selectedBusinessProfileId: string | null
  ├── selectedBusinessCategory: string | null
  └── setSelectedBusinessProfile: (profile) => Promise<void>
```

**Integration Points**:

#### PosterPreviewScreen
- ✅ **Already Connected**: Uses `selectedBusinessProfileId` from `useBusinessProfile()`
- ✅ **Auto-injection**: `useCentralizedDownload()` automatically adds businessProfileId
- ✅ **State Sync**: Responds to business profile changes automatically

#### MyPostersScreen  
- ❌ **Missing Connection**: Needs to consume `selectedBusinessProfileId`
- ❌ **No Refresh Trigger**: Missing `useEffect([selectedBusinessProfileId])`
- ❌ **Wrong Data Source**: Using user-scoped instead of business-scoped data

### Dependency Handling Strategy

**Navigation Focus Detection**:
```typescript
useFocusEffect(
  useCallback(() => {
    console.log('🔄 [MY POSTERS] Screen focused - loading business posters...');
    if (selectedBusinessProfileId) {
      loadPosters();
    }
  }, [selectedBusinessProfileId]) // ✅ Add business dependency
);
```

**Business Profile Change Detection**:
```typescript
useEffect(() => {
  // Refresh when business profile changes
  if (selectedBusinessProfileId) {
    loadPosters();
  } else {
    // Clear data when no business selected
    setPosters([]);
    setFilteredPosters([]);
  }
}, [selectedBusinessProfileId]);
```

---

## 5. EDGE CASES

### No Business Selected
**Current Behavior**: Shows empty state with message
**Required Behavior**: 
- Show "Please select a business profile to view downloads"
- Disable refresh functionality
- Clear existing data

### API Failure
**Current Handling**: Basic error display
**Required Enhancement**:
- Distinguish between network errors and 404s
- Show retry mechanism
- Fallback to cached data if available

### Empty Downloads
**Current Behavior**: Shows empty grid
**Required Enhancement**:
- Show "No downloads for this business"
- Provide clear call-to-action to download content
- Maintain business context

### Daily Limit Reached
**Current Handling**: ✅ Already implemented in `useCentralizedDownload()`
**Verification**: Ensure MyPostersScreen respects limit state

### Network Issues
**Current Handling**: Basic error display
**Required Enhancement**:
- Show offline indicator
- Provide retry mechanism
- Cache last successful response

---

## 6. RISKS & BREAKING CHANGES

### High Risk Areas

#### Data Migration Risk
- **Risk**: Users with existing mixed downloads may lose access to content
- **Mitigation**: Implement migration script to associate existing downloads with business profiles
- **Fallback**: Maintain backward compatibility during transition

#### API Dependency Risk
- **Risk**: New API endpoints may not be ready
- **Mitigation**: Implement fallback to current local storage approach
- **Rollback**: Keep existing service as backup

#### State Synchronization Risk
- **Risk**: Business profile changes may not propagate correctly
- **Mitigation**: Implement comprehensive dependency arrays
- **Testing**: Verify all navigation scenarios

### Breaking Changes Identified

#### MyPostersScreen Data Structure
- **Current**: `DownloadedPoster[]` from local storage
- **New**: API response format with different field names
- **Solution**: Implement transformation layer in `loadPosters()`

#### Service Dependencies
- **Current**: `downloadedPostersService` (local storage)
- **New**: `downloadService.getBusinessDownloads()` (API-based)
- **Solution**: Replace service calls, maintain interface compatibility

---

## 7. FINAL IMPLEMENTATION CHECKLIST

### API Service Layer
- [ ] Add `getBusinessDownloads(businessProfileId: string)` to `downloadService.ts`
- [ ] Implement proper error handling for 404, 429, network errors
- [ ] Add request/response logging for debugging
- [ ] Test API endpoint integration

### MyPostersScreen Updates
- [ ] Import and use `selectedBusinessProfileId` from `BusinessProfileContext`
- [ ] Replace `loadPosters()` to use business-specific API
- [ ] Add data transformation from API response to `DownloadedPoster` format
- [ ] Add `useEffect([selectedBusinessProfileId])` for business change detection
- [ ] Update `useFocusEffect` dependency array to include business profile
- [ ] Add loading state for business-specific data fetching

### Error Handling Enhancement
- [ ] Add specific error messages for "No business selected"
- [ ] Implement retry mechanism for API failures
- [ ] Add offline/network error detection
- [ ] Maintain backward compatibility during transition

### State Management Updates
- [ ] Verify `BusinessProfileContext` provides `selectedBusinessProfileId`
- [ ] Test business profile change propagation
- [ ] Ensure cleanup when business profile is cleared
- [ ] Validate state consistency across navigation

### Testing & Validation
- [ ] Test download flow with multiple business profiles
- [ ] Verify business-specific filtering works correctly
- [ ] Test edge cases (no business, API failure, empty downloads)
- [ ] Validate daily limit enforcement across business profiles
- [ ] Test navigation scenarios and state persistence

### Documentation & Cleanup
- [ ] Update API documentation references
- [ ] Remove deprecated service calls
- [ ] Add inline comments for business-specific logic
- [ ] Update error messages for business context

---

## 🎯 EXECUTION PRIORITY

### Phase 1: API Integration (Critical)
1. Implement `getBusinessDownloads()` in `downloadService.ts`
2. Update `MyPostersScreen.tsx` data fetching
3. Add business profile context connection

### Phase 2: State Management (High)
1. Add business change detection
2. Implement proper dependency arrays
3. Add error handling for edge cases

### Phase 3: Testing & Validation (Medium)
1. Comprehensive testing of all scenarios
2. Performance optimization
3. Documentation updates

---

## 📊 SUMMARY

**PosterPreviewScreen**: ✅ **READY** - Already integrated with Unified Download API  
**MyPostersScreen**: ❌ **NEEDS WORK** - Missing business-based filtering  
**Primary Gap**: Business-specific data fetching in MyPostersScreen  
**Risk Level**: Medium - Contained to single screen  
**Estimated Effort**: 4-6 hours for complete integration  

The integration is straightforward since the core infrastructure (Unified Download API, Business Profile Context) is already in place. Only MyPostersScreen needs updates to implement business-based filtering.
