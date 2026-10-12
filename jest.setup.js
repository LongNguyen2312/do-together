/* eslint-env jest */
jest.mock('react-native-size-matters', () => ({
  ms: value => value,
  s: value => value,
  vs: value => value,
}));

jest.mock('redux-persist/integration/react', () => ({
  PersistGate: ({ children }) => children,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

jest.mock('@callstack/liquid-glass', () => {
  const { View } = require('react-native');
  return {
    LiquidGlassView: View,
    LiquidGlassContainerView: View,
    isLiquidGlassSupported: false,
  };
});

jest.mock('@maplibre/maplibre-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Camera = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      fitBounds: jest.fn(),
      flyTo: jest.fn(),
      easeTo: jest.fn(),
      jumpTo: jest.fn(),
    }));
    return null;
  });
  return {
    Map: View,
    Camera,
    Marker: View,
    NativeUserLocation: () => null,
    LocationManager: {
      requestPermissions: jest.fn(() => Promise.resolve(true)),
    },
    useCurrentPosition: () => undefined,
  };
});

jest.mock('react-native-compass-heading', () => ({
  __esModule: true,
  default: {
    start: jest.fn(() => Promise.resolve(true)),
    stop: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@react-native-camera-roll/camera-roll', () => ({
  CameraRoll: { saveAsset: jest.fn(() => Promise.resolve({})) },
  iosReadGalleryPermission: jest.fn(() => Promise.resolve('granted')),
  iosRequestAddOnlyGalleryPermission: jest.fn(() => Promise.resolve('granted')),
}));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    config: jest.fn(() => ({
      fetch: jest.fn(() => Promise.resolve({ path: () => '/tmp/photo.jpg' })),
    })),
  },
}));

jest.mock('react-native-nitro-sound', () => ({
  createSound: jest.fn(),
  // Recording format enums used by services/audio.ts.
  OutputFormatAndroidType: { MPEG_4: 2 },
  AudioEncoderAndroidType: { AAC: 3 },
}));

jest.mock('lottie-react-native', () => 'LottieView');

jest.mock('react-native-splash-view', () => ({
  hideSplash: jest.fn(),
  showSplash: jest.fn(),
}));

// Native compression: hand back the same file, as if already small.
jest.mock('react-native-compressor', () => ({
  Image: { compress: jest.fn(uri => Promise.resolve(uri)) },
  Video: {
    compress: jest.fn(uri => Promise.resolve(uri)),
    cancelCompression: jest.fn(),
  },
  createVideoThumbnail: jest.fn(uri =>
    Promise.resolve({
      path: uri,
      size: 0,
      mime: 'image/jpeg',
      width: 0,
      height: 0,
    }),
  ),
}));

jest.mock('react-native-vision-camera', () => {
  const permission = {
    status: 'authorized',
    hasPermission: true,
    canRequestPermission: false,
    requestPermission: jest.fn(() => Promise.resolve(true)),
  };
  return {
    Camera: () => null,
    CommonResolutions: { FHD_16_9: { width: 1080, height: 1920 } },
    useCameraDevice: () => undefined,
    useCameraPermission: () => permission,
    useMicrophonePermission: () => permission,
    usePhotoOutput: () => ({}),
    useVideoOutput: () => ({}),
  };
});

jest.mock('react-native-nitro-image', () => ({
  NativeNitroImage: () => null,
}));
