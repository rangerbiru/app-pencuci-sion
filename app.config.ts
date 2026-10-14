import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Identitas aplikasi. Owner dan project ID EAS ditulis langsung di sini (bukan rahasia) supaya build
 * cloud EAS, yang tidak membawa .env, tetap benar. API_URL: eas.json "env" (build cloud) menang atas .env.
 * Build development memakai package id.sion.mobile.dev supaya bisa dipasang berdampingan.
 */
const EAS_OWNER = 'rafizaweb';
const EAS_PROJECT_ID = '80696f49-4622-4fd6-8d96-3dc22f8d03d5';

export default ({ config }: ConfigContext): ExpoConfig => {
  const env = process.env.ENV ?? 'development';
  const isProd = env === 'production';
  const appId = isProd ? 'id.sion.mobile' : 'id.sion.mobile.dev';

  const expoConfig: ExpoConfig = {
    ...config,
    name: process.env.EXPO_NAME ?? (isProd ? 'SION' : 'SION Dev'),
    slug: process.env.EXPO_SLUG ?? 'sion-mobile',
    owner: EAS_OWNER,
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
      // keyboard memperkecil layar (bukan menutupi): form login bisa digulir, tombol Masuk terjangkau
      softwareKeyboardLayoutMode: 'resize',
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
    updates: { url: `https://u.expo.dev/${EAS_PROJECT_ID}` },
    extra: {
      ...config.extra,
      eas: { projectId: EAS_PROJECT_ID },
      env,
      apiUrl: process.env.API_URL ?? 'http://127.0.0.1:8000/api/v1',
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
            './node_modules/@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf',
            './node_modules/@expo-google-fonts/plus-jakarta-sans/500Medium/PlusJakartaSans_500Medium.ttf',
            './node_modules/@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf',
            './node_modules/@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf',
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
