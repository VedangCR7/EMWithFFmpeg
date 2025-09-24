export const LOGO_ASSETS = {
  test: require('../assets/vidlogo/test.png'),
};

export const getLogoAssetSource = (logoName: string) => {
  const logoAsset = LOGO_ASSETS[logoName as keyof typeof LOGO_ASSETS];
  if (!logoAsset) {
    console.warn(`Logo asset not found: ${logoName}`);
    return null;
  }
  return logoAsset;
};

export const getLogoAssetUri = (logoName: string): string => {
  const logoAsset = LOGO_ASSETS[logoName as keyof typeof LOGO_ASSETS];
  if (!logoAsset) {
    console.warn(`Logo asset not found: ${logoName}`);
    return '';
  }
  return `asset://${logoName}.png`;
};

export const getRandomLogoFromAssets = (): string => {
  const logoNames = Object.keys(LOGO_ASSETS);
  const randomIndex = Math.floor(Math.random() * logoNames.length);
  return logoNames[randomIndex];
};

export const getLogoAssetInfo = (logoName: string) => {
  const logoAsset = LOGO_ASSETS[logoName as keyof typeof LOGO_ASSETS];
  if (!logoAsset) {
    return null;
  }
  return {
    name: logoName,
    source: logoAsset,
    uri: getLogoAssetUri(logoName),
  };
};

export const getAvailableLogoNames = (): string[] => {
  return Object.keys(LOGO_ASSETS);
};
