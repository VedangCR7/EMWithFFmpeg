import { GreetingModel } from '../Greeting';

describe('GreetingModel', () => {
  test('should create a valid greeting', () => {
    const greeting = new GreetingModel(
      '1',
      'user1',
      'template1',
      'Happy Birthday!',
      'Wishing you a wonderful birthday',
      'https://example.com/video.mp4',
      { color: 'blue' },
      'published',
      'birthday',
      ['celebration', 'party'],
      true,
      50,
      10,
      4.5
    );

    expect(greeting.id).toBe('1');
    expect(greeting.title).toBe('Happy Birthday!');
    expect(greeting.isValid()).toBe(true);
    expect(greeting.category).toBe('birthday');
  });

  test('should validate greeting correctly', () => {
    const invalidGreeting = new GreetingModel('', '', '', '', '', {});
    expect(invalidGreeting.isValid()).toBe(false);

    const validGreeting = new GreetingModel('1', 'user1', 'template1', 'Title', 'Content');
    expect(validGreeting.isValid()).toBe(true);
  });

  test('should return correct greeting data', () => {
    const greeting = new GreetingModel('1', 'user1', 't1', 'Title', 'Content', 'media', { color: 'red' }, 'draft', 'general', ['tag'], true, 10, 5, 4);
    const data = greeting.getGreetingData();

    expect(data.id).toBe('1');
    expect(data.title).toBe('Title');
    expect(data.category).toBe('general');
    expect(data.isPublic).toBe(true);
  });

  test('should publish greeting', () => {
    const greeting = new GreetingModel('1', 'user1', 't1', 'Title', 'Content');
    expect(greeting.status).toBe('draft');
    expect(greeting.isPublic).toBe(false);

    greeting.publish();
    expect(greeting.status).toBe('published');
    expect(greeting.isPublic).toBe(true);
  });

  test('should archive greeting', () => {
    const greeting = new GreetingModel('1', 'user1', 't1', 'Title', 'Content');
    greeting.publish();
    expect(greeting.status).toBe('published');
    expect(greeting.isPublic).toBe(true);

    greeting.archive();
    expect(greeting.status).toBe('archived');
    expect(greeting.isPublic).toBe(false);
  });

  test('should add comments', () => {
    const greeting = new GreetingModel('1', 'user1', 't1', 'Title', 'Content');
    expect(greeting.comments).toEqual([]);

    greeting.addComment('First comment');
    greeting.addComment('Second comment');

    expect(greeting.comments).toHaveLength(2);
    expect(greeting.comments[0].text).toBe('First comment');
    expect(greeting.comments[1].text).toBe('Second comment');

    // Check comment structure
    expect(greeting.comments[0]).toHaveProperty('id');
    expect(greeting.comments[0]).toHaveProperty('createdAt');
  });

  test('should increment views and downloads', () => {
    const greeting = new GreetingModel('1', 'user1', 't1', 'Title', 'Content');
    expect(greeting.views).toBe(0);
    expect(greeting.downloads).toBe(0);

    greeting.incrementViews();
    greeting.incrementDownloads();

    expect(greeting.views).toBe(1);
    expect(greeting.downloads).toBe(1);
  });

  test('should update rating', () => {
    const greeting = new GreetingModel('1', 'user1', 't1', 'Title', 'Content');
    expect(greeting.rating).toBe(0);

    greeting.updateRating(4.5);
    expect(greeting.rating).toBe(4.5);

    greeting.updateRating(6); // Should cap at 5
    expect(greeting.rating).toBe(5);

    greeting.updateRating(-1); // Should floor at 0
    expect(greeting.rating).toBe(0);
  });

  test('should default to draft status and general category', () => {
    const greeting = new GreetingModel('1', 'user1', 't1', 'Title', 'Content');
    expect(greeting.status).toBe('draft');
    expect(greeting.category).toBe('general');
    expect(greeting.isPublic).toBe(false);
  });
});