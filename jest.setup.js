/* global jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);
jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `uuid-${++n}` };
});
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
// ikon memuat huruf secara async; di test cukup komponen kosong
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
