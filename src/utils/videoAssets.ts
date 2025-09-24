export const VIDEO_ASSETS = {
  test: require('../assets/video/test.mp4'),
  // ONLY use videos from src/assets/video folder
  // To add more videos: place them in C:\RSL\EventMarketersWorking\src\assets\video\
  // and add them here like: videoName: require('../assets/video/videoName.mp4')
};

export const getVideoAssetSource = (videoName: string) => {
  const videoAsset = VIDEO_ASSETS[videoName as keyof typeof VIDEO_ASSETS];
  if (!videoAsset) {
    console.warn(`Video asset not found: ${videoName}`);
    return null;
  }
  return videoAsset;
};

export const getVideoAssetUri = (videoName: string): string => {
  const videoAsset = VIDEO_ASSETS[videoName as keyof typeof VIDEO_ASSETS];
  if (!videoAsset) {
    console.warn(`Video asset not found: ${videoName}`);
    return '';
  }
  return `asset://${videoName}.mp4`;
};

export const getRandomVideoFromAssets = (): string => {
  const videoNames = Object.keys(VIDEO_ASSETS);
  const randomIndex = Math.floor(Math.random() * videoNames.length);
  return videoNames[randomIndex];
};

export const getVideoAssetInfo = (videoName: string) => {
  const videoAsset = VIDEO_ASSETS[videoName as keyof typeof VIDEO_ASSETS];
  if (!videoAsset) {
    return null;
  }
  return {
    name: videoName,
    source: videoAsset,
    uri: getVideoAssetUri(videoName),
  };
};

export const getAvailableVideoNames = (): string[] => {
  return Object.keys(VIDEO_ASSETS);
};
