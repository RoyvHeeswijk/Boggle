import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Boggle Duel',
  slug: 'boggle-duel',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'boggle-duel',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.boggleduel.app',
    infoPlist: {
      NSLocalNetworkUsageDescription:
        'Boggle Duel gebruikt het lokale netwerk om nearby spelers te vinden en realtime wedstrijden te spelen.',
      NSBluetoothAlwaysUsageDescription:
        'Boggle Duel gebruikt Bluetooth om nearby spelers te vinden en te verbinden.',
      NSBonjourServices: ['_boggleduel._tcp'],
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0A1628',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    package: 'com.boggleduel.app',
    permissions: [
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.BLUETOOTH_ADVERTISE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.NEARBY_WIFI_DEVICES',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#0A1628',
      },
    ],
    [
      'expo-nearby-connections',
      {
        bonjourServicesName: 'boggleduel',
        localNetworkUsagePermissionText:
          'Boggle Duel gebruikt het lokale netwerk om nearby spelers te vinden.',
        bluetoothUsagePermissionText:
          'Boggle Duel gebruikt Bluetooth om nearby spelers te vinden en te verbinden.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: 'boggle-duel-project',
    },
  },
});
