import { VideoModel } from '../Video';

describe('VideoModel', () => {
  test('should create a valid video', () => {
    const video = new VideoModel(
      '1',
      'user1',
      'Sample Video',
      'A test video',
      'https://example.com/video.mp4',
      'https://example.com/thumbnail.jpg',
      120,
      'completed',
      ['test', 'sample'],
      '1080p',
      104857600,
      100,
      25,
      5,
      100
    );

    expect(video.id).toBe('1');
    expect(video.title).toBe('Sample Video');
    expect(video.isValid()).toBe(true);
    expect(video.isProcessed()).toBe(true);
  });

  test('should validate video correctly', () => {
    const invalidVideo = new VideoModel('', '', '', '', '');
    expect(invalidVideo.isValid()).toBe(false);

    const validVideo = new VideoModel('1', 'user1', 'Title', 'Desc', 'https://example.com/video.mp4');
    expect(validVideo.isValid()).toBe(true);
  });

  test('should return correct metadata', () => {
    const video = new VideoModel('1', 'user1', 'Title', 'Desc', 'url', 'thumb', 120, 'completed', ['tag1'], '1080p', 100, 10, 5, 2);
    const metadata = video.getMetadata();

    expect(metadata.id).toBe('1');
    expect(metadata.title).toBe('Title');
    expect(metadata.tags).toEqual(['tag1']);
    expect(metadata.views).toBe(10);
  });

  test('should update processing progress', () => {
    const video = new VideoModel('1', 'user1', 'Title', 'Desc', 'url');
    expect(video.processingProgress).toBe(0);
    expect(video.status).toBe('processing');

    video.updateProgress(50);
    expect(video.processingProgress).toBe(50);
    expect(video.status).toBe('processing');

    video.updateProgress(100);
    expect(video.processingProgress).toBe(100);
    expect(video.status).toBe('completed');
  });

  test('should handle progress boundaries', () => {
    const video = new VideoModel('1', 'user1', 'Title', 'Desc', 'url');

    video.updateProgress(-10);
    expect(video.processingProgress).toBe(0);

    video.updateProgress(150);
    expect(video.processingProgress).toBe(100);
    expect(video.status).toBe('completed');
  });

  test('should handle view increments', () => {
    const video = new VideoModel('1', 'user1', 'Title', 'Desc', 'url');
    expect(video.views).toBe(0);

    video.incrementViews();
    expect(video.views).toBe(1);
  });

  test('should handle likes and shares', () => {
    const video = new VideoModel('1', 'user1', 'Title', 'Desc', 'url');
    expect(video.likes).toBe(0);
    expect(video.shares).toBe(0);

    video.like();
    video.share();

    expect(video.likes).toBe(1);
    expect(video.shares).toBe(1);
  });

  test('should default to processing status', () => {
    const video = new VideoModel('1', 'user1', 'Title', 'Desc', 'url');
    expect(video.status).toBe('processing');
    expect(video.isProcessed()).toBe(false);
  });

  test('should have correct defaults', () => {
    const video = new VideoModel('1', 'user1', 'Title', 'Desc', 'url');
    expect(video.duration).toBe(0);
    expect(video.tags).toEqual([]);
    expect(video.resolution).toBe('1080p');
    expect(video.views).toBe(0);
    expect(video.likes).toBe(0);
    expect(video.shares).toBe(0);
  });
});