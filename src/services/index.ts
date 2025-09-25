// API Services Index
// This file exports all API services for easy importing

// Authentication API
export { default as authApi } from './authApi';
export type {
  RegisterRequest,
  LoginRequest,
  GoogleAuthRequest,
  UserProfile,
  UpdateProfileRequest,
  AuthResponse,
  ProfileResponse,
} from './authApi';

// Subscription API
export { default as subscriptionApi } from './subscriptionApi';
export type {
  SubscriptionPlan,
  SubscribeRequest,
  SubscriptionStatus,
  SubscriptionHistory,
  PlansResponse,
  SubscriptionResponse,
  HistoryResponse,
} from './subscriptionApi';

// Templates and Banners API
export { default as templatesBannersApi } from './templatesBannersApi';
export type {
  Template,
  TemplateFilters,
  Banner,
  CreateBannerRequest,
  UpdateBannerRequest,
  BannerFilters,
  Language,
  TemplatesResponse,
  TemplateResponse,
  LanguagesResponse,
  BannerResponse,
  BannersResponse,
  ShareRequest,
} from './templatesBannersApi';

// Media Management API
export { default as mediaApi } from './mediaApi';
export type {
  MediaAsset,
  MediaFilters,
  UploadMediaRequest,
  UpdateMediaRequest,
  SearchMediaRequest,
  MediaStats,
  MediaResponse,
  MediaListResponse,
  MediaStatsResponse,
} from './mediaApi';

// Dashboard and Analytics API
export { default as dashboardApi } from './dashboardApi';
export type {
  DashboardData,
  BannerStats,
  TemplateUsage,
  Activity,
  DashboardResponse,
  BannerStatsResponse,
  TemplateUsageResponse,
  ActivityResponse,
} from './dashboardApi';

// Login APIs - Comprehensive Authentication Service
export { default as loginAPIs } from './loginAPIs';
export type {
  UserRegistrationRequest,
  UserLoginRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  ChangePasswordRequest,
  EmailVerificationRequest,
} from './loginAPIs';

// Base API instance
export { default as api } from './api';
