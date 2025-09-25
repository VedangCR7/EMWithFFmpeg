-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subadmins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "role" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedCategories" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "subadmins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "business_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "category" TEXT NOT NULL,
    "businessCategoryId" TEXT,
    "tags" TEXT,
    "fileSize" INTEGER NOT NULL,
    "dimensions" TEXT,
    "format" TEXT NOT NULL,
    "adminUploaderId" TEXT,
    "subadminUploaderId" TEXT,
    "uploaderType" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "isMobileSynced" BOOLEAN NOT NULL DEFAULT false,
    "mobileSyncAt" TIMESTAMP(3),
    "mobileTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "category" TEXT NOT NULL,
    "businessCategoryId" TEXT,
    "tags" TEXT,
    "duration" INTEGER,
    "fileSize" INTEGER NOT NULL,
    "resolution" TEXT,
    "format" TEXT NOT NULL,
    "adminUploaderId" TEXT,
    "subadminUploaderId" TEXT,
    "uploaderType" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "isMobileSynced" BOOLEAN NOT NULL DEFAULT false,
    "mobileSyncAt" TIMESTAMP(3),
    "mobileVideoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installed_users" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "appVersion" TEXT,
    "installDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "downloadAttempts" INTEGER NOT NULL DEFAULT 0,
    "isConverted" BOOLEAN NOT NULL DEFAULT false,
    "convertedAt" TIMESTAMP(3),
    "convertedToCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installed_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "deviceId" TEXT,
    "selectedBusinessCategoryId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'INACTIVE',
    "subscriptionStartDate" TIMESTAMP(3),
    "subscriptionEndDate" TIMESTAMP(3),
    "subscriptionAmount" DOUBLE PRECISION,
    "paymentMethod" TEXT,
    "appVersion" TEXT,
    "lastActiveAt" TIMESTAMP(3),
    "totalDownloads" INTEGER NOT NULL DEFAULT 0,
    "businessName" TEXT,
    "businessPhone" TEXT,
    "businessEmail" TEXT,
    "businessWebsite" TEXT,
    "businessAddress" TEXT,
    "businessLogo" TEXT,
    "businessDescription" TEXT,
    "businessCategory" TEXT,
    "convertedFromInstalledUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'YEARLY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "paymentId" TEXT,
    "paymentMethod" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "subadminId" TEXT,
    "customerId" TEXT,
    "installedUserId" TEXT,
    "userType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION NOT NULL,
    "targetAudience" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_metrics" (
    "id" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "marketing_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_users" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "appVersion" TEXT,
    "platform" TEXT,
    "fcmToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_business_profiles" (
    "id" TEXT NOT NULL,
    "mobileUserId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "category" TEXT NOT NULL,
    "logo" TEXT,
    "description" TEXT,
    "website" TEXT,
    "socialMedia" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "type" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sourceImageId" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "category" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "type" TEXT NOT NULL,
    "duration" INTEGER,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sourceVideoId" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "featured_content" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "videoUrl" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "featured_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upcoming_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upcoming_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_languages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "greeting_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "greeting_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "greeting_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "greeting_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stickers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stickers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emojis" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unicode" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emojis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "period" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_subscriptions" (
    "id" TEXT NOT NULL,
    "mobileUserId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentId" TEXT,
    "paymentMethod" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_activities" (
    "id" TEXT NOT NULL,
    "mobileUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mobile_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_likes" (
    "id" TEXT NOT NULL,
    "mobileUserId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mobile_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_downloads" (
    "id" TEXT NOT NULL,
    "mobileUserId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mobile_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_likes" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "mobileUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_downloads" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "mobileUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_likes" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "mobileUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_downloads" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "mobileUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "greeting_likes" (
    "id" TEXT NOT NULL,
    "greetingId" TEXT NOT NULL,
    "mobileUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "greeting_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "greeting_downloads" (
    "id" TEXT NOT NULL,
    "greetingId" TEXT NOT NULL,
    "mobileUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "greeting_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_transactions" (
    "id" TEXT NOT NULL,
    "mobileUserId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "orderId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL,
    "plan" TEXT,
    "planName" TEXT,
    "description" TEXT,
    "paymentMethod" TEXT,
    "paymentId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subadmins_email_key" ON "subadmins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "business_categories_name_key" ON "business_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "images_mobileTemplateId_key" ON "images"("mobileTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "videos_mobileVideoId_key" ON "videos"("mobileVideoId");

-- CreateIndex
CREATE UNIQUE INDEX "installed_users_deviceId_key" ON "installed_users"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "installed_users_email_key" ON "installed_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mobile_users_deviceId_key" ON "mobile_users"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "mobile_users_email_key" ON "mobile_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mobile_templates_sourceImageId_key" ON "mobile_templates"("sourceImageId");

-- CreateIndex
CREATE UNIQUE INDEX "mobile_videos_sourceVideoId_key" ON "mobile_videos"("sourceVideoId");

-- CreateIndex
CREATE UNIQUE INDEX "template_categories_name_key" ON "template_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "template_languages_code_key" ON "template_languages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "greeting_categories_name_key" ON "greeting_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "mobile_likes_mobileUserId_resourceType_resourceId_key" ON "mobile_likes"("mobileUserId", "resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "template_likes_templateId_mobileUserId_key" ON "template_likes"("templateId", "mobileUserId");

-- CreateIndex
CREATE UNIQUE INDEX "video_likes_videoId_mobileUserId_key" ON "video_likes"("videoId", "mobileUserId");

-- CreateIndex
CREATE UNIQUE INDEX "greeting_likes_greetingId_mobileUserId_key" ON "greeting_likes"("greetingId", "mobileUserId");

-- CreateIndex
CREATE UNIQUE INDEX "mobile_transactions_transactionId_key" ON "mobile_transactions"("transactionId");

-- AddForeignKey
ALTER TABLE "subadmins" ADD CONSTRAINT "subadmins_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_categories" ADD CONSTRAINT "business_categories_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_businessCategoryId_fkey" FOREIGN KEY ("businessCategoryId") REFERENCES "business_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_adminUploaderId_fkey" FOREIGN KEY ("adminUploaderId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_subadminUploaderId_fkey" FOREIGN KEY ("subadminUploaderId") REFERENCES "subadmins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_businessCategoryId_fkey" FOREIGN KEY ("businessCategoryId") REFERENCES "business_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_adminUploaderId_fkey" FOREIGN KEY ("adminUploaderId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_subadminUploaderId_fkey" FOREIGN KEY ("subadminUploaderId") REFERENCES "subadmins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_selectedBusinessCategoryId_fkey" FOREIGN KEY ("selectedBusinessCategoryId") REFERENCES "business_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_subadminId_fkey" FOREIGN KEY ("subadminId") REFERENCES "subadmins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_installedUserId_fkey" FOREIGN KEY ("installedUserId") REFERENCES "installed_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_metrics" ADD CONSTRAINT "marketing_metrics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_metrics" ADD CONSTRAINT "marketing_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_business_profiles" ADD CONSTRAINT "mobile_business_profiles_mobileUserId_fkey" FOREIGN KEY ("mobileUserId") REFERENCES "mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_templates" ADD CONSTRAINT "mobile_templates_sourceImageId_fkey" FOREIGN KEY ("sourceImageId") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_videos" ADD CONSTRAINT "mobile_videos_sourceVideoId_fkey" FOREIGN KEY ("sourceVideoId") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_subscriptions" ADD CONSTRAINT "mobile_subscriptions_mobileUserId_fkey" FOREIGN KEY ("mobileUserId") REFERENCES "mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_subscriptions" ADD CONSTRAINT "mobile_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "mobile_subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_activities" ADD CONSTRAINT "mobile_activities_mobileUserId_fkey" FOREIGN KEY ("mobileUserId") REFERENCES "mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_likes" ADD CONSTRAINT "mobile_likes_mobileUserId_fkey" FOREIGN KEY ("mobileUserId") REFERENCES "mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_downloads" ADD CONSTRAINT "mobile_downloads_mobileUserId_fkey" FOREIGN KEY ("mobileUserId") REFERENCES "mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_likes" ADD CONSTRAINT "template_likes_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "mobile_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_likes" ADD CONSTRAINT "template_likes_mobileUserId_fkey" FOREIGN KEY ("mobileUserId") REFERENCES "mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_downloads" ADD CONSTRAINT "template_downloads_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "mobile_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_downloads" ADD CONSTRAINT "template_downloads_mobileUserId_fkey" FOREIGN KEY ("mobileUserId") REFERENCES "mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_likes" ADD CONSTRAINT "video_likes_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "mobile_videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_likes" ADD CONSTRAINT "video_likes_mobileUserId_fkey" FOREIGN KEY ("mobileUserId") REFERENCES "mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_downloads" ADD CONSTRAINT "video_downloads_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "mobile_videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_downloads" ADD CONSTRAINT "video_downloads_mobileUserId_fkey" FOREIGN KEY ("mobileUserId") REFERENCES "mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "greeting_likes" ADD CONSTRAINT "greeting_likes_greetingId_fkey" FOREIGN KEY ("greetingId") REFERENCES "greeting_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "greeting_likes" ADD CONSTRAINT "greeting_likes_mobileUserId_fkey" FOREIGN KEY ("mobileUserId") REFERENCES "mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "greeting_downloads" ADD CONSTRAINT "greeting_downloads_greetingId_fkey" FOREIGN KEY ("greetingId") REFERENCES "greeting_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "greeting_downloads" ADD CONSTRAINT "greeting_downloads_mobileUserId_fkey" FOREIGN KEY ("mobileUserId") REFERENCES "mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
