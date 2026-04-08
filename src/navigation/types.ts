export type RootStackParamList = {
  MainApp: undefined;
  Login: undefined;
  Registration: undefined;
  ForgotPassword: undefined;
  VerifyResetCode: { email: string };
  ResetPassword: { email: string; code: string };
  EmailVerification: { email: string };
  Splash: undefined;
  PrivacyPolicy: undefined;
};

export type MainStackParamList = {
  MainTabs: { screen?: keyof TabParamList } | undefined;
  PosterEditor: {
    selectedImage: {
      uri: string;
      title?: string;
      description?: string;
    };
    selectedLanguage: string;
    selectedTemplateId: string;
    selectedTemplate?: string;
    posterCategory?: string;
    type?: "business" | "greeting" | "calendar" | "featured";
    categoryName?: string;
  };
  PosterPlayer: {
    selectedPoster: any;
    selectedTemplateId: string;  // ✅ PRIMARY DATA - ID as source of truth
    relatedPosters: any[];
    searchQuery?: string;
    templateSource?: 'greeting' | 'professional' | 'featured';
    greetingCategory?: string;
    originScreen?: string;
    posterLimit?: number;
    calendarDate?: string;
    type?: "business" | "greeting" | "calendar" | "featured";
    categoryName?: string;
  };
  MyBusinessPosterPlayer: undefined;
  AboutUs: undefined;
  PrivacyPolicy: undefined;
  PosterPreview: {
    capturedImageUri: string;
    selectedImage: {
      uri: string;
      title?: string;
      description?: string;
    };
    selectedLanguage: string;
    selectedTemplateId: string;
  };
  VideoEditor: {
    selectedVideo: {
      uri: string;
      title?: string;
      description?: string;
    };
    selectedLanguage: string;
    selectedTemplateId: string;
  };
  VideoPlayer: {
    selectedVideo: any;
    relatedVideos: any[];
  };
  VideoPreview: {
    selectedVideo: {
      uri: string;
      title?: string;
      description?: string;
    };
    selectedLanguage: string;
    selectedTemplateId: string;
    layers: any[];
    selectedProfile?: any;
    processedVideoPath?: string;
    canvasData?: {
      width: number;
      height: number;
      layers: any[];
    };
  };
  BusinessProfiles: undefined;
  Events: undefined;
  Subscription: undefined;
  TransactionHistory: undefined;
  GreetingTemplates: undefined;
  GreetingEditor: {
    template: any;
  };
  MyPosters: undefined;
  HelpSupport: { scrollToFAQ?: boolean } | undefined;
  FeedbackScreen: undefined;
  TodaysPick: undefined;
  Templates: undefined;
  Greetings: undefined;
  Profile: undefined;
};

export type TabParamList = {
  Home: undefined;
  Templates: undefined;
  MyBusiness: undefined;
  Greetings: undefined;
  Profile: undefined;
};
