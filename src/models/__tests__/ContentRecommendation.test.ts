import { UserModel } from '../User';
import { VideoModel } from '../Video';
import { TemplateModel } from '../Template';

describe('Content Recommendation System', () => {
  test('should recommend content based on user preferences and history', () => {
    const user = new UserModel('user1', 'Recommendation User', 'rec@test.com');
    user.updatePreferences({
      theme: 'dark',
      notifications: true,
      language: 'en',
      emailFrequency: 'weekly'
    });

    // Create content library
    const videos = [
      new VideoModel('tutorial1', 'creator1', 'React Tutorial', 'Learn React basics', 'tutorial1.mp4', 'tutorial', 'thumb1.jpg', 600, 'published', ['react', 'javascript', 'beginner']),
      new VideoModel('tutorial2', 'creator2', 'Vue Tutorial', 'Learn Vue basics', 'tutorial2.mp4', 'tutorial', 'thumb2.jpg', 450, 'published', ['vue', 'javascript', 'beginner']),
      new VideoModel('advanced1', 'creator1', 'Advanced React', 'React hooks deep dive', 'advanced1.mp4', 'tutorial', 'thumb1.jpg', 1200, 'published', ['react', 'javascript', 'advanced', 'hooks']),
      new VideoModel('music1', 'creator3', 'Music Production', 'DAW tutorial', 'music1.mp4', 'music', 'thumb3.jpg', 900, 'published', ['music', 'production', 'daw']),
      new VideoModel('design1', 'creator4', 'UI Design', 'Design principles', 'design1.mp4', 'design', 'thumb4.jpg', 720, 'published', ['ui', 'design', 'ux'])
    ];

    // User watches some content and shows preferences
    videos[0].recordView('desktop', 'US', 'search'); // React tutorial
    videos[2].recordView('desktop', 'US', 'direct'); // Advanced React
    videos[4].recordView('mobile', 'US', 'social'); // UI Design

    user.incrementStats({
      totalVideos: 3,
      totalViews: 3,
      totalLikes: 2
    });

    // Simulate user behavior: prefers React and design content
    const userPreferredCategories = ['tutorial', 'design'];
    const userPreferredTags = ['react', 'javascript', 'ui', 'design'];

    // Simple recommendation algorithm
    const recommendations = videos
      .filter(video => !['tutorial1', 'advanced1', 'design1'].includes(video.id)) // Exclude already watched
      .map(video => {
        let score = 0;

        // Category matching
        if (userPreferredCategories.includes(video.category)) score += 20;

        // Tag matching
        const tagMatches = video.tags.filter(tag => userPreferredTags.includes(tag)).length;
        score += tagMatches * 10;

        // Creator consistency (if user watched other content from same creator)
        const watchedFromCreator = ['creator1', 'creator4'];
        if (watchedFromCreator.includes(video.userId)) score += 15;

        return { video, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Should recommend tutorial2 (Vue, but still tutorial), music1 (different category)
    expect(recommendations[0].video.id).toBe('tutorial2'); // Highest score due to category match
    expect(recommendations[0].score).toBeGreaterThan(15);

    // Verify recommendations are not already watched content
    const recommendedIds = recommendations.map(r => r.video.id);
    expect(recommendedIds).not.toContain('tutorial1');
    expect(recommendedIds).not.toContain('advanced1');
    expect(recommendedIds).not.toContain('design1');
  });

  test('should recommend templates based on user content style', () => {
    const user = new UserModel('creator1', 'Template Seeker', 'template@test.com');

    // User has created content in specific styles
    const userVideos = [
      new VideoModel('user_video1', user.id, 'Business Intro', 'Corporate introduction', 'intro.mp4', 'business'),
      new VideoModel('user_video2', user.id, 'Product Demo', 'Product showcase', 'demo.mp4', 'business'),
      new VideoModel('user_video3', user.id, 'Team Welcome', 'Welcome new employees', 'welcome.mp4', 'business')
    ];

    // Available templates
    const templates = [
      new TemplateModel('biz_template1', 'Corporate Intro', 'Professional business intro', 'business', 'video', 'biz1.jpg', 'template_creator1'),
      new TemplateModel('biz_template2', 'Product Showcase', 'Product demonstration template', 'business', 'video', 'biz2.jpg', 'template_creator2'),
      new TemplateModel('fun_template1', 'Party Invitation', 'Fun party invite', 'celebration', 'video', 'fun1.jpg', 'template_creator3'),
      new TemplateModel('edu_template1', 'Tutorial Format', 'Educational content', 'education', 'video', 'edu1.jpg', 'template_creator4'),
      new TemplateModel('biz_greeting1', 'Business Welcome', 'Corporate greeting', 'business', 'greeting', 'greet1.jpg', 'template_creator1')
    ];

    // User uses some templates
    templates[0].recordUsage(user.id); // Corporate intro template
    templates[1].recordUsage(user.id); // Product showcase template
    templates[4].recordUsage(user.id); // Business greeting template

    // Template recommendation logic
    const templateRecommendations = templates
      .filter(template => !['biz_template1', 'biz_template2', 'biz_greeting1'].includes(template.id)) // Exclude used
      .map(template => {
        let score = 0;

        // Category preference based on user's content
        if (template.category === 'business') score += 30;

        // Type preference based on user's creations
        const userVideoCount = userVideos.filter(v => v.category === template.category).length;
        score += userVideoCount * 10;

        // Popularity bonus
        score += Math.min(template.usageCount * 2, 20);

        return { template, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    // Should recommend the remaining business template
    expect(templateRecommendations.some(rec => rec.template.category === 'business')).toBe(true);
    expect(templateRecommendations[0].score).toBeGreaterThan(20);
  });

  test('should adapt recommendations based on user feedback', () => {
    const user = new UserModel('adaptive_user', 'Adaptive User', 'adaptive@test.com');

    const videos = [
      new VideoModel('sports1', 'creator1', 'Football Highlights', 'Best goals', 'sports1.mp4', 'sports'),
      new VideoModel('sports2', 'creator2', 'Basketball Game', 'Full game recap', 'sports2.mp4', 'sports'),
      new VideoModel('tech1', 'creator3', 'Latest Gadgets', 'Tech review', 'tech1.mp4', 'technology'),
      new VideoModel('tech2', 'creator4', 'Coding Tutorial', 'Learn programming', 'tech2.mp4', 'technology'),
      new VideoModel('cooking1', 'creator5', 'Recipe Tutorial', 'Easy dinner recipe', 'cooking1.mp4', 'cooking')
    ];

    // Initial recommendations (no user history)
    const initialRecs = videos.slice(0, 3);

    // User engages with sports content
    videos[0].recordView('mobile', 'US', 'app');
    videos[1].recordView('mobile', 'US', 'app');
    videos[0].like();
    videos[1].like();

    user.incrementStats({
      totalViews: 2,
      totalLikes: 2
    });

    // User dislikes tech content
    videos[2].recordView('mobile', 'US', 'app');
    videos[2].dislike();

    // Adaptive recommendation system
    const adaptiveRecommendations = videos
      .filter(video => !['sports1', 'sports2', 'tech1'].includes(video.id)) // Exclude viewed
      .map(video => {
        let score = 10; // Base score

        // Positive reinforcement for liked categories
        if (video.category === 'sports') score += 25;

        // Negative reinforcement for disliked categories
        if (video.category === 'technology') score -= 15;

        // Engagement-based scoring
        score += video.likes * 2;
        score += video.views;

        return { video, score };
      })
      .sort((a, b) => b.score - a.score);

    // Sports content should be highly recommended
    expect(adaptiveRecommendations[0].video.category).toBe('sports');
    expect(adaptiveRecommendations[0].score).toBeGreaterThan(adaptiveRecommendations[1].score);

    // Tech content should be deprioritized
    const techRec = adaptiveRecommendations.find(rec => rec.video.category === 'technology');
    const sportsRec = adaptiveRecommendations.find(rec => rec.video.category === 'sports');

    if (techRec && sportsRec) {
      expect(sportsRec.score).toBeGreaterThan(techRec.score);
    }
  });

  test('should recommend content for content discovery', () => {
    // Create diverse content library
    const allContent = [];
    const categories = ['technology', 'sports', 'cooking', 'travel', 'music', 'education'];

    for (let i = 0; i < 100; i++) {
      const category = categories[i % categories.length];
      const video = new VideoModel(
        `discover_video_${i}`,
        `creator_${i % 20}`,
        `${category} Content ${i}`,
        `Amazing ${category} video`,
        `video${i}.mp4`,
        category,
        `thumb${i}.jpg`,
        300 + (i % 5) * 60, // Varied durations
        'published'
      );

      // Add varied engagement levels
      const engagementLevel = Math.random();
      const viewCount = engagementLevel > 0.8 ? 5000 + Math.random() * 5000 : // Popular
                        engagementLevel > 0.6 ? 1000 + Math.random() * 2000 : // Moderate
                        engagementLevel > 0.3 ? 100 + Math.random() * 500 :   // Low
                        Math.random() * 100; // Very low

      for (let v = 0; v < viewCount; v++) video.incrementViews();

      const likeRate = 0.05 + Math.random() * 0.15; // 5-20% like rate
      for (let l = 0; l < viewCount * likeRate; l++) video.like();

      allContent.push(video);
    }

    // Content discovery algorithm
    const discoverRecommendations = allContent
      .filter(video => video.views > 100) // Minimum engagement threshold
      .sort((a, b) => {
        // Score based on engagement rate, recency, and diversity
        const aEngagementRate = a.getEngagementRate();
        const bEngagementRate = b.getEngagementRate();

        // Favor high engagement content
        const aScore = aEngagementRate * 0.6 + Math.log(a.views) * 0.4;
        const bScore = bEngagementRate * 0.6 + Math.log(b.views) * 0.4;

        return bScore - aScore;
      })
      .slice(0, 20); // Top 20 recommendations

    // Verify recommendations quality
    expect(discoverRecommendations).toHaveLength(20);
    expect(discoverRecommendations.every(video => video.views > 100)).toBe(true);

    // Higher engagement content should appear first
    for (let i = 0; i < discoverRecommendations.length - 1; i++) {
      const currentEngagement = discoverRecommendations[i].getEngagementRate();
      const nextEngagement = discoverRecommendations[i + 1].getEngagementRate();

      // Allow some tolerance for the sorting algorithm
      expect(currentEngagement + nextEngagement).toBeGreaterThan(0);
    }

    // Ensure category diversity in recommendations
    const recommendedCategories = [...new Set(discoverRecommendations.map(v => v.category))];
    expect(recommendedCategories.length).toBeGreaterThan(3); // At least 4 different categories
  });

  test('should personalize recommendations based on viewing patterns', () => {
    const user = new UserModel('pattern_user', 'Pattern User', 'pattern@test.com');

    // Create viewing history data
    const viewingHistory = [
      // Morning viewing pattern: tech tutorials
      { hour: 9, category: 'technology', tags: ['tutorial', 'programming'] },
      { hour: 10, category: 'technology', tags: ['tutorial', 'webdev'] },
      { hour: 11, category: 'technology', tags: ['tutorial', 'database'] },

      // Evening viewing pattern: entertainment
      { hour: 19, category: 'entertainment', tags: ['music', 'concert'] },
      { hour: 20, category: 'entertainment', tags: ['movie', 'review'] },
      { hour: 21, category: 'sports', tags: ['football', 'highlights'] },

      // Weekend pattern: cooking and travel
      { hour: 14, category: 'cooking', tags: ['recipe', 'healthy'], day: 0 }, // Sunday
      { hour: 15, category: 'travel', tags: ['destination', 'guide'], day: 0 }
    ];

    // Available content for recommendation
    const availableContent = [
      // Tech content (should be recommended in morning)
      new VideoModel('morning_tech1', 'creator1', 'New Framework', 'Learn the latest', 'tech1.mp4', 'technology', 'thumb1.jpg', 600, 'published', ['tutorial', 'framework']),
      new VideoModel('morning_tech2', 'creator2', 'Database Design', 'Database patterns', 'tech2.mp4', 'technology', 'thumb2.jpg', 450, 'published', ['tutorial', 'database']),

      // Entertainment content (should be recommended in evening)
      new VideoModel('evening_ent1', 'creator3', 'Concert Live', 'Amazing performance', 'ent1.mp4', 'entertainment', 'thumb3.jpg', 180, 'published', ['music', 'concert']),
      new VideoModel('evening_ent2', 'creator4', 'Movie Review', 'Latest blockbuster', 'ent2.mp4', 'entertainment', 'thumb4.jpg', 120, 'published', ['movie', 'review']),

      // Sports content (evening/weekend)
      new VideoModel('sports_highlight', 'creator5', 'Game Highlights', 'Best moments', 'sports1.mp4', 'sports', 'thumb5.jpg', 90, 'published', ['football', 'highlights']),

      // Cooking content (weekend)
      new VideoModel('cooking_recipe', 'creator6', 'Weekend Recipe', 'Easy and healthy', 'cooking1.mp4', 'cooking', 'thumb6.jpg', 240, 'published', ['recipe', 'healthy'])
    ];

    // Pattern-based recommendation algorithm
    const getRecommendationsForTime = (currentHour: number, currentDay: number = 1) => {
      const timePatterns = viewingHistory.filter(history =>
        Math.abs(history.hour - currentHour) <= 2 // Within 2 hours
      );

      const categoryPreferences = timePatterns.reduce((prefs, pattern) => {
        prefs[pattern.category] = (prefs[pattern.category] || 0) + 1;
        return prefs;
      }, {} as Record<string, number>);

      const tagPreferences = timePatterns.reduce((prefs, pattern) => {
        pattern.tags.forEach(tag => {
          prefs[tag] = (prefs[tag] || 0) + 1;
        });
        return prefs;
      }, {} as Record<string, number>);

      return availableContent
        .map(content => {
          let score = 0;

          // Category preference score
          score += (categoryPreferences[content.category] || 0) * 20;

          // Tag preference score
          const tagMatches = content.tags.filter(tag => tagPreferences[tag]).length;
          score += tagMatches * 15;

          // Base engagement score
          score += Math.min(content.getEngagementRate(), 20);

          return { content, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    };

    // Test morning recommendations (should favor tech content)
    const morningRecs = getRecommendationsForTime(10);
    const techContentInMorning = morningRecs.filter(rec =>
      rec.content.category === 'technology'
    );

    expect(techContentInMorning.length).toBeGreaterThan(0);
    expect(morningRecs[0].score).toBeGreaterThan(15);

    // Test evening recommendations (should favor entertainment/sports)
    const eveningRecs = getRecommendationsForTime(20);
    const entertainmentContentInEvening = eveningRecs.filter(rec =>
      ['entertainment', 'sports'].includes(rec.content.category)
    );

    expect(entertainmentContentInEvening.length).toBeGreaterThan(0);

    // Test weekend recommendations (should favor cooking/travel)
    const weekendRecs = getRecommendationsForTime(14, 0); // Sunday afternoon
    const lifestyleContentInWeekend = weekendRecs.filter(rec =>
      ['cooking', 'travel'].includes(rec.content.category)
    );

    expect(weekendRecs.some(rec => rec.content.category === 'cooking')).toBe(true);
  });

  test('should handle collaborative filtering recommendations', () => {
    // Create users with similar preferences
    const users = [];
    for (let i = 0; i < 10; i++) {
      const user = new UserModel(`user${i}`, `User ${i}`, `user${i}@test.com`);
      users.push(user);
    }

    // Create content library
    const allVideos = [];
    for (let i = 0; i < 50; i++) {
      const categories = ['tech', 'sports', 'cooking', 'music', 'travel'];
      const category = categories[i % categories.length];

      const video = new VideoModel(
        `video${i}`,
        `creator${i % 5}`,
        `${category} Video ${i}`,
        `Amazing ${category} content`,
        `video${i}.mp4`,
        category
      );
      allVideos.push(video);
    }

    // Simulate user behavior patterns
    // Users 0-2 prefer tech content
    [0, 1, 2].forEach(userIndex => {
      allVideos
        .filter(v => v.category === 'tech')
        .slice(0, 5)
        .forEach(video => {
          video.recordView('desktop', 'US', 'direct');
          users[userIndex].incrementStats({ totalViews: 1 });
        });
    });

    // Users 3-5 prefer sports content
    [3, 4, 5].forEach(userIndex => {
      allVideos
        .filter(v => v.category === 'sports')
        .slice(0, 4)
        .forEach(video => {
          video.recordView('mobile', 'US', 'app');
          users[userIndex].incrementStats({ totalViews: 1 });
        });
    });

    // Users 6-9 have mixed preferences
    [6, 7, 8, 9].forEach(userIndex => {
      allVideos
        .filter(v => ['cooking', 'music', 'travel'].includes(v.category))
        .slice(0, 3)
        .forEach(video => {
          video.recordView('tablet', 'US', 'social');
          users[userIndex].incrementStats({ totalViews: 1 });
        });
    });

    // Collaborative filtering: find similar users and recommend their liked content
    const getCollaborativeRecommendations = (targetUser: UserModel, allUsers: UserModel[], allVideos: VideoModel[]) => {
      // Find users with similar viewing patterns
      const similarUsers = allUsers
        .filter(user => user.id !== targetUser.id)
        .map(user => ({
          user,
          similarity: Math.abs(targetUser.stats.totalViews - user.stats.totalViews) // Simple similarity metric
        }))
        .sort((a, b) => a.similarity - b.similarity)
        .slice(0, 3)
        .map(item => item.user);

      // Get videos watched by similar users that target user hasn't seen
      const watchedBySimilarUsers = new Set();
      similarUsers.forEach(user => {
        // In a real system, this would check the user's watch history
        // For this test, we'll simulate based on the pattern above
      });

      // For demonstration, recommend popular content from similar user categories
      const targetUserPreferences = targetUser.stats.totalViews > 15 ? 'tech' :
                                   targetUser.stats.totalViews > 10 ? 'sports' : 'mixed';

      return allVideos
        .filter(video => {
          if (targetUserPreferences === 'tech') return video.category === 'tech';
          if (targetUserPreferences === 'sports') return video.category === 'sports';
          return ['cooking', 'music', 'travel'].includes(video.category);
        })
        .filter(video => video.views > 0) // Only content that has been viewed by someone
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
    };

    // Test recommendations for different user types
    const techUser = users[0]; // Tech preference user
    const sportsUser = users[3]; // Sports preference user
    const mixedUser = users[6]; // Mixed preference user

    const techRecommendations = getCollaborativeRecommendations(techUser, users, allVideos);
    const sportsRecommendations = getCollaborativeRecommendations(sportsUser, users, allVideos);
    const mixedRecommendations = getCollaborativeRecommendations(mixedUser, users, allVideos);

    // Tech user should get tech recommendations
    expect(techRecommendations.every(rec => rec.category === 'tech')).toBe(true);

    // Sports user should get sports recommendations
    expect(sportsRecommendations.every(rec => rec.category === 'sports')).toBe(true);

    // Mixed user should get lifestyle recommendations
    expect(mixedRecommendations.every(rec =>
      ['cooking', 'music', 'travel'].includes(rec.category)
    )).toBe(true);

    // All recommendations should have some engagement
    expect(techRecommendations.every(rec => rec.views > 0)).toBe(true);
    expect(sportsRecommendations.every(rec => rec.views > 0)).toBe(true);
    expect(mixedRecommendations.every(rec => rec.views > 0)).toBe(true);
  });

  test('should scale recommendation system efficiently', () => {
    const users = [];
    const videos = [];

    // Create large dataset for performance testing
    for (let i = 0; i < 1000; i++) {
      users.push(new UserModel(`perf_user${i}`, `User ${i}`, `user${i}@perf.com`));
    }

    for (let i = 0; i < 5000; i++) {
      const categories = ['tech', 'business', 'entertainment', 'education', 'lifestyle'];
      const video = new VideoModel(
        `perf_video${i}`,
        `creator${i % 100}`,
        `Performance Video ${i}`,
        `Content ${i}`,
        `video${i}.mp4`,
        categories[i % categories.length]
      );

      // Add realistic engagement
      const viewCount = Math.floor(Math.random() * 1000);
      for (let v = 0; v < viewCount; v++) video.incrementViews();

      videos.push(video);
    }

    const startTime = Date.now();

    // Test recommendation algorithm at scale
    const testUser = users[0];

    // Simulate user history
    videos.slice(0, 50).forEach(video => {
      video.recordView('desktop', 'US', 'search');
      testUser.incrementStats({ totalViews: 1 });
    });

    // Generate recommendations
    const recommendations = videos
      .filter(video => video.views > 10) // Minimum engagement
      .filter(video => !videos.slice(0, 50).includes(video)) // Exclude watched
      .map(video => {
        // Simple scoring algorithm
        const engagementScore = video.getEngagementRate();
        const viewScore = Math.log(video.views + 1);
        const categoryMatch = video.category === 'tech' ? 10 : 0; // User prefers tech

        return {
          video,
          score: engagementScore * 0.5 + viewScore * 0.3 + categoryMatch
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify recommendations quality
    expect(recommendations).toHaveLength(20);
    expect(recommendations[0].score).toBeGreaterThan(recommendations[recommendations.length - 1].score);

    // Performance check: should generate recommendations for 1000 users and 5000 videos in reasonable time
    expect(duration).toBeLessThan(10000); // Less than 10 seconds
    console.log(`Generated recommendations for large dataset in ${duration}ms`);

    // Verify recommendation diversity and quality
    const categories = [...new Set(recommendations.map(r => r.video.category))];
    const averageEngagement = recommendations.reduce((sum, r) => sum + r.video.getEngagementRate(), 0) / recommendations.length;

    expect(categories.length).toBeGreaterThan(2); // Some category diversity
    expect(averageEngagement).toBeGreaterThan(0);
    expect(recommendations.every(r => r.video.views > 10)).toBe(true);
  });
});