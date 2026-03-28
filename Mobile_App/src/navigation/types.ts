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
    selectedBusinessProfile?: any;
  };
  PosterPlayer: {
    selectedPoster: any;
    relatedPosters: any[];
    searchQuery?: string;
    templateSource?: 'greeting' | 'professional' | 'featured';
    businessCategory?: string | { name: string };
    greetingCategory?: string;
    originScreen?: string;
    posterLimit?: number;
    calendarDate?: string;
    selectedBusinessProfile?: any;
    selectedBusinessProfileId?: string;
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
    selectedBusinessProfile?: any;
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
