export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
  timezone?: string;
  emailFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
}

export interface UserStats {
  totalVideos: number;
  totalGreetings: number;
  totalViews: number;
  totalLikes: number;
  totalDislikes: number;
  totalShares: number;
  totalDownloads: number;
  totalComments: number;
  totalSaves: number;
  joinedDate: string;
  lastLoginDate?: string;
  lastActivityDate?: string;
  contentQualityScore: number;
  followerCount: number;
  followingCount: number;
  reputationScore: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessId?: string;
  planId?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  website?: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  isActive: boolean;
  isVerified: boolean;
  role: 'user' | 'admin' | 'business' | 'creator';
  preferences: UserPreferences;
  stats: UserStats;
  badges: string[];
  achievements: string[];
  createdAt: string;
  updatedAt: string;
}

export class UserModel implements User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessId?: string;
  planId?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  website?: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  isActive: boolean;
  isVerified: boolean;
  role: 'user' | 'admin' | 'business' | 'creator';
  preferences: UserPreferences;
  stats: UserStats;
  badges: string[];
  achievements: string[];
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    name: string,
    email: string,
    phone?: string,
    businessId?: string,
    planId?: string,
    avatar?: string,
    banner?: string,
    bio?: string,
    website?: string,
    socialLinks: { twitter?: string; linkedin?: string; instagram?: string; youtube?: string } = {},
    isActive: boolean = true,
    isVerified: boolean = false,
    role: 'user' | 'admin' | 'business' | 'creator' = 'user',
    preferences: UserPreferences = { theme: 'light', notifications: true, language: 'en', emailFrequency: 'weekly' },
    stats?: Partial<UserStats>,
    badges: string[] = [],
    achievements: string[] = [],
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.businessId = businessId;
    this.planId = planId;
    this.avatar = avatar;
    this.banner = banner;
    this.bio = bio;
    this.website = website;
    this.socialLinks = socialLinks;
    this.isActive = isActive;
    this.isVerified = isVerified;
    this.role = role;
    this.preferences = preferences;
    this.stats = {
      totalVideos: 0,
      totalGreetings: 0,
      totalViews: 0,
      totalLikes: 0,
      totalDislikes: 0,
      totalShares: 0,
      totalDownloads: 0,
      totalComments: 0,
      totalSaves: 0,
      joinedDate: new Date().toISOString(),
      lastLoginDate: undefined,
      lastActivityDate: undefined,
      contentQualityScore: 0,
      followerCount: 0,
      followingCount: 0,
      reputationScore: 0,
      ...stats
    };
    this.badges = badges;
    this.achievements = achievements;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  // Validation methods
  isValid(): boolean {
    return !!(this.email && this.email.includes('@') && this.name && this.name.length > 0);
  }

  // Get display name
  getDisplayName(): string {
    return this.name || this.email;
  }

  // Check user roles
  isAdmin(): boolean {
    return this.role === 'admin';
  }

  isCreator(): boolean {
    return this.role === 'creator';
  }

  isBusiness(): boolean {
    return this.role === 'business';
  }

  // Profile management
  updateProfile(updates: Partial<Pick<User, 'name' | 'bio' | 'website' | 'avatar' | 'banner'>>): void {
    if (updates.name) this.name = updates.name;
    if (updates.bio !== undefined) this.bio = updates.bio;
    if (updates.website !== undefined) this.website = updates.website;
    if (updates.avatar !== undefined) this.avatar = updates.avatar;
    if (updates.banner !== undefined) this.banner = updates.banner;
    this.updatedAt = new Date().toISOString();
  }

  // Social links management
  updateSocialLinks(links: Partial<User['socialLinks']>): void {
    this.socialLinks = { ...this.socialLinks, ...links };
    this.updatedAt = new Date().toISOString();
  }

  // Preferences management
  updatePreferences(newPreferences: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.updatedAt = new Date().toISOString();
  }

  // Status management
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date().toISOString();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date().toISOString();
  }

  verify(): void {
    this.isVerified = true;
    this.updatedAt = new Date().toISOString();
  }

  // Statistics tracking
  incrementStats(updates: Partial<Pick<UserStats, 'totalVideos' | 'totalGreetings' | 'totalViews' | 'totalLikes' | 'totalDislikes' | 'totalShares' | 'totalDownloads' | 'totalComments' | 'totalSaves'>>): void {
    if (updates.totalVideos) this.stats.totalVideos += updates.totalVideos;
    if (updates.totalGreetings) this.stats.totalGreetings += updates.totalGreetings;
    if (updates.totalViews) this.stats.totalViews += updates.totalViews;
    if (updates.totalLikes) this.stats.totalLikes += updates.totalLikes;
    if (updates.totalDislikes) this.stats.totalDislikes += updates.totalDislikes;
    if (updates.totalShares) this.stats.totalShares += updates.totalShares;
    if (updates.totalDownloads) this.stats.totalDownloads += updates.totalDownloads;
    if (updates.totalComments) this.stats.totalComments += updates.totalComments;
    if (updates.totalSaves) this.stats.totalSaves += updates.totalSaves;
    this.stats.lastActivityDate = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  updateLastLogin(): void {
    this.stats.lastLoginDate = new Date().toISOString();
    this.stats.lastActivityDate = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  updateContentQualityScore(score: number): void {
    this.stats.contentQualityScore = Math.max(0, Math.min(100, score));
    this.updatedAt = new Date().toISOString();
  }

  updateReputationScore(score: number): void {
    this.stats.reputationScore = Math.max(0, Math.min(1000, score));
    this.updatedAt = new Date().toISOString();
  }

  incrementFollowers(): void {
    this.stats.followerCount += 1;
    this.updatedAt = new Date().toISOString();
  }

  decrementFollowers(): void {
    this.stats.followerCount = Math.max(0, this.stats.followerCount - 1);
    this.updatedAt = new Date().toISOString();
  }

  incrementFollowing(): void {
    this.stats.followingCount += 1;
    this.updatedAt = new Date().toISOString();
  }

  decrementFollowing(): void {
    this.stats.followingCount = Math.max(0, this.stats.followingCount - 1);
    this.updatedAt = new Date().toISOString();
  }

  // Badge and achievement system
  addBadge(badge: string): void {
    if (!this.badges.includes(badge)) {
      this.badges.push(badge);
      this.updatedAt = new Date().toISOString();
    }
  }

  addAchievement(achievement: string): void {
    if (!this.achievements.includes(achievement)) {
      this.achievements.push(achievement);
      this.updatedAt = new Date().toISOString();
    }
  }

  // Utility methods
  getProfileCompletion(): number {
    let completed = 0;
    let total = 0;

    const fields = ['avatar', 'banner', 'bio', 'website'];
    fields.forEach(field => {
      total++;
      if (this[field as keyof User]) completed++;
    });

    // Social links count
    total++;
    if (Object.values(this.socialLinks).some(link => link)) completed++;

    return Math.round((completed / total) * 100);
  }

  getEngagementScore(): number {
    const { totalViews, totalLikes, totalShares, totalComments, totalSaves, totalDownloads } = this.stats;
    return totalViews * 1 + totalLikes * 2 + totalShares * 3 + totalComments * 1.5 + totalSaves * 2.5 + totalDownloads * 4;
  }

  getEngagementRate(): number {
    const totalContent = this.stats.totalVideos + this.stats.totalGreetings;
    if (totalContent === 0) return 0;
    return (this.getEngagementScore() / totalContent) / 100; // Average engagement per content
  }

  getLikeRatio(): number {
    const { totalLikes, totalDislikes } = this.stats;
    const totalVotes = totalLikes + totalDislikes;
    if (totalVotes === 0) return 0;
    return (totalLikes / totalVotes) * 100;
  }

  getContentQualityScore(): number {
    // Calculate based on engagement, reputation, and content volume
    const engagementFactor = Math.min(this.getEngagementRate() * 10, 40);
    const reputationFactor = (this.stats.reputationScore / 1000) * 30;
    const volumeFactor = Math.min((this.stats.totalVideos + this.stats.totalGreetings) / 10, 30);

    return Math.round(engagementFactor + reputationFactor + volumeFactor);
  }

  getInfluencerLevel(): string {
    const followers = this.stats.followerCount;
    const engagement = this.getEngagementRate();

    if (followers >= 100000 && engagement >= 5) return 'Mega Influencer';
    if (followers >= 10000 && engagement >= 3) return 'Macro Influencer';
    if (followers >= 1000 && engagement >= 2) return 'Micro Influencer';
    if (followers >= 100 && engagement >= 1) return 'Nano Influencer';
    if (followers >= 10) return 'Emerging Creator';
    return 'Content Creator';
  }

  isActiveUser(): boolean {
    if (!this.stats.lastActivityDate) return false;
    const daysSinceLastActivity = (Date.now() - new Date(this.stats.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastActivity <= 30; // Active if activity within 30 days
  }

  getAccountAgeInDays(): number {
    return Math.floor((Date.now() - new Date(this.stats.joinedDate).getTime()) / (1000 * 60 * 60 * 24));
  }
}