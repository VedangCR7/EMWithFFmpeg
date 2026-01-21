import { TemplateModel } from '../Template';

describe('TemplateModel', () => {
  const mockCustomization = {
    colors: ['#FF0000', '#00FF00', '#0000FF'],
    fonts: ['Arial', 'Helvetica', 'Times New Roman'],
    layouts: ['portrait', 'landscape'],
    effects: ['fade', 'zoom']
  };

  test('should create a valid template', () => {
    const template = new TemplateModel(
      '1',
      'Birthday Celebration',
      'A beautiful birthday template with animations',
      'birthday',
      'video',
      'thumbnail.jpg',
      'user1',
      mockCustomization,
      ['celebration', 'party', 'birthday'],
      true,
      true,
      150,
      [],
      'preview.mp4'
    );

    expect(template.id).toBe('1');
    expect(template.name).toBe('Birthday Celebration');
    expect(template.category).toBe('birthday');
    expect(template.type).toBe('video');
    expect(template.isValid()).toBe(true);
    expect(template.isPremium).toBe(true);
    expect(template.usageCount).toBe(150);
  });

  test('should validate template correctly', () => {
    const invalidTemplate = new TemplateModel('', '', '', '', 'video', '', '');
    expect(invalidTemplate.isValid()).toBe(false);

    const validTemplate = new TemplateModel('1', 'Template Name', 'Description', 'category', 'video', 'thumb.jpg', 'creator1');
    expect(validTemplate.isValid()).toBe(true);
  });

  test('should handle template status operations', () => {
    const template = new TemplateModel('1', 'Template', 'Desc', 'cat', 'video', 'thumb.jpg', 'creator');

    expect(template.isActive).toBe(true);
    expect(template.isPremium).toBe(false);

    template.deactivate();
    expect(template.isActive).toBe(false);

    template.activate();
    expect(template.isActive).toBe(true);

    template.markAsPremium();
    expect(template.isPremium).toBe(true);

    template.markAsFree();
    expect(template.isPremium).toBe(false);
  });

  test('should track template usage', () => {
    const template = new TemplateModel('1', 'Template', 'Desc', 'cat', 'video', 'thumb.jpg', 'creator');

    expect(template.usageCount).toBe(0);
    expect(template.usageStats).toEqual([]);

    // First usage by user1
    template.recordUsage('user1');
    expect(template.usageCount).toBe(1);
    expect(template.usageStats).toHaveLength(1);
    expect(template.getUsageByUser('user1')?.count).toBe(1);

    // Second usage by user1
    template.recordUsage('user1');
    expect(template.usageCount).toBe(2);
    expect(template.getUsageByUser('user1')?.count).toBe(2);

    // First usage by user2
    template.recordUsage('user2');
    expect(template.usageCount).toBe(3);
    expect(template.usageStats).toHaveLength(2);
    expect(template.getUsageByUser('user2')?.count).toBe(1);

    // Non-existent user
    expect(template.getUsageByUser('user3')).toBeUndefined();
  });

  test('should manage customization options', () => {
    const template = new TemplateModel('1', 'Template', 'Desc', 'cat', 'video', 'thumb.jpg', 'creator');

    expect(template.customization.colors).toEqual([]);
    expect(template.customization.fonts).toEqual([]);
    expect(template.customization.layouts).toEqual([]);
    expect(template.customization.effects).toEqual([]);

    template.addColor('#FF0000');
    template.addColor('#00FF00');
    template.addColor('#FF0000'); // Duplicate should not be added

    expect(template.customization.colors).toEqual(['#FF0000', '#00FF00']);

    template.addFont('Arial');
    template.addLayout('portrait');
    template.addEffect('fade');

    expect(template.customization.fonts).toEqual(['Arial']);
    expect(template.customization.layouts).toEqual(['portrait']);
    expect(template.customization.effects).toEqual(['fade']);
  });

  test('should manage tags', () => {
    const template = new TemplateModel('1', 'Template', 'Desc', 'cat', 'video', 'thumb.jpg', 'creator');

    expect(template.tags).toEqual([]);

    template.addTag('birthday');
    template.addTag('celebration');
    template.addTag('birthday'); // Duplicate should not be added

    expect(template.tags).toEqual(['birthday', 'celebration']);

    template.removeTag('birthday');
    expect(template.tags).toEqual(['celebration']);

    template.removeTag('nonexistent'); // Should not error
    expect(template.tags).toEqual(['celebration']);
  });

  test('should have default values', () => {
    const template = new TemplateModel('1', 'Template', 'Desc', 'cat', 'video', 'thumb.jpg', 'creator');

    expect(template.customization).toEqual({
      colors: [],
      fonts: [],
      layouts: [],
      effects: []
    });
    expect(template.tags).toEqual([]);
    expect(template.isPremium).toBe(false);
    expect(template.isActive).toBe(true);
    expect(template.usageCount).toBe(0);
    expect(template.usageStats).toEqual([]);
  });
});