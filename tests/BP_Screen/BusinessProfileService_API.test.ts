// Business Profile Service Tests
// Tests for business profile API service functions

describe('BusinessProfileService', () => {
  // Mock service functions
  const mockGetUserBusinessProfiles = jest.fn();
  const mockCreateBusinessProfile = jest.fn();
  const mockUpdateBusinessProfile = jest.fn();
  const mockDeleteBusinessProfile = jest.fn();
  const mockSearchBusinessProfiles = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get user business profiles', async () => {
    const userId = 'test-user-id';
    const mockProfiles = [
      {
        id: '1',
        name: 'Test Business',
        category: 'Test Category',
        description: 'Test Description'
      }
    ];

    mockGetUserBusinessProfiles.mockResolvedValue(mockProfiles);

    const result = await mockGetUserBusinessProfiles(userId);
    
    expect(mockGetUserBusinessProfiles).toHaveBeenCalledWith(userId);
    expect(result).toEqual(mockProfiles);
    expect(result).toHaveLength(1);
  });

  test('should create new business profile', async () => {
    const profileData = {
      name: 'New Business',
      category: 'Category',
      description: 'Description',
      phone: '+1234567890',
      email: 'test@example.com'
    };

    const mockCreatedProfile = { id: 'new-id', ...profileData };
    mockCreateBusinessProfile.mockResolvedValue(mockCreatedProfile);

    const result = await mockCreateBusinessProfile(profileData);
    
    expect(mockCreateBusinessProfile).toHaveBeenCalledWith(profileData);
    expect(result).toEqual(mockCreatedProfile);
    expect(result.id).toBe('new-id');
  });

  test('should update business profile', async () => {
    const profileId = 'profile-id';
    const updateData = {
      name: 'Updated Business',
      description: 'Updated Description'
    };

    const mockUpdatedProfile = { id: profileId, ...updateData };
    mockUpdateBusinessProfile.mockResolvedValue(mockUpdatedProfile);

    const result = await mockUpdateBusinessProfile(profileId, updateData);
    
    expect(mockUpdateBusinessProfile).toHaveBeenCalledWith(profileId, updateData);
    expect(result).toEqual(mockUpdatedProfile);
  });

  test('should delete business profile', async () => {
    const profileId = 'profile-to-delete';
    mockDeleteBusinessProfile.mockResolvedValue(true);

    const result = await mockDeleteBusinessProfile(profileId);
    
    expect(mockDeleteBusinessProfile).toHaveBeenCalledWith(profileId);
    expect(result).toBe(true);
  });

  test('should search business profiles', async () => {
    const searchQuery = 'test';
    const mockSearchResults = [
      {
        id: '1',
        name: 'Test Business',
        category: 'Test'
      }
    ];

    mockSearchBusinessProfiles.mockResolvedValue(mockSearchResults);

    const result = await mockSearchBusinessProfiles(searchQuery);
    
    expect(mockSearchBusinessProfiles).toHaveBeenCalledWith(searchQuery);
    expect(result).toEqual(mockSearchResults);
  });

  test('should handle API errors gracefully', async () => {
    const userId = 'test-user-id';
    const errorMessage = 'API Error';
    
    mockGetUserBusinessProfiles.mockRejectedValue(new Error(errorMessage));

    await expect(mockGetUserBusinessProfiles(userId)).rejects.toThrow(errorMessage);
  });
});
