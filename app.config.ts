import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Identitas aplikasi. Owner dan EXPO_PROJECT_ID diisi lewat .env.dev / .env.prod.
 * Build development memakai package id.sion.mobile.dev supaya bisa dipasang berdampingan.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const env = process.env.ENV ?? 'development';
  const isProd = env === 'production';
  const expoProjectId = process.env.EXPO_PROJECT_ID;
  const appId = isProd ? 'id.sion.mobile' : 'id.sion.mobile.dev';

  const expoConfig: ExpoConfig = {
    ...config,
    name: process.env.EXPO_NAME ?? (isProd ? 'SION' : 'SION Dev'),
    slug: process.env.EXPO_SLUG ?? 'sion-mobile',
    owner: process.env.EXPO_OWNER || undefined,
    ios: {
      ...config.ios,
      bundleIdentifier: process.env.EXPO_IOS_BUNDLE_IDENTIFIER ?? appId,
      infoPlist: {
        NSCameraUsageDescription:
          'Kamera dipakai untuk foto absen, foto timbangan, foto hasil, dan scan QR wadah.',
        NSLocationWhenInUseUsageDescription:
          'Lokasi dipakai untuk menandai absen di lokasi kerja atau di luar lokasi.',
        NSPhotoLibraryUsageDescription: 'Galeri dipakai untuk memilih foto bukti pembayaran.',
      },
    },
    android: {
      ...config.android,
      package: process.env.EXPO_ANDROID_PACKAGE ?? appId,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
      blockedPermissions: ['android.permission.RECORD_AUDIO'],
    },
    web: {
      ...config.web,
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/icon-1024.png',
    },
    ...(expoProjectId ? { updates: { url: `https://u.expo.dev/${expoProjectId}` } } : {}),
    extra: {
      ...config.extra,
      ...(expoProjectId ? { eas: { projectId: expoProjectId } } : {}),
      env,
      apiUrl: process.env.API_URL ?? 'http://localhost:8000',
    },
    plugins: [
      'expo-router',
      'expo-asset',
      'expo-secure-store',
      [
        'expo-camera',
        {
          cameraPermission:
            'Kamera dipakai untuk foto absen, foto timbangan, foto hasil, dan scan QR wadah.',
          recordAudioAndroid: false,
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Lokasi dipakai untuk menandai absen di lokasi kerja atau di luar lokasi.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Galeri dipakai untuk memilih foto bukti pembayaran.',
          cameraPermission: 'Kamera dipakai untuk memotret bukti pembayaran.',
        },
      ],
      [
        'expo-font',
        {
          fonts: [
            './node_modules/@expo-google-fonts/google-sans-flex/400Regular/GoogleSansFlex_400Regular.ttf',
            './node_modules/@expo-google-fonts/google-sans-flex/500Medium/GoogleSansFlex_500Medium.ttf',
            './node_modules/@expo-google-fonts/google-sans-flex/600SemiBold/GoogleSansFlex_600SemiBold.ttf',
            './node_modules/@expo-google-fonts/google-sans-flex/700Bold/GoogleSansFlex_700Bold.ttf',
          ],
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#F7F5F0',
          image: './assets/images/splash.png',
          imageWidth: 390,
          resizeMode: 'cover',
        },
      ],
    ],
    experiments: {
      typedRoutes: false,
    },
  };
  return expoConfig;
};
