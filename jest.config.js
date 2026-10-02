module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: [
    './jest.preSetup.js',
    './node_modules/react-native-gesture-handler/jestSetup.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  resolver: 'react-native-reanimated/jest/resolver',
  watchman: false,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-redux|@reduxjs/toolkit|redux-persist|i18next|react-i18next|immer|reselect|react-native-vector-icons|react-native-gesture-handler|react-native-reanimated|react-native-worklets|react-native-screens|react-native-safe-area-context|react-native-svg|phosphor-react-native)/)',
  ],
};
