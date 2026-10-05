# DoTogether

A React Native app for finding people nearby to do things together — running, coffee, football, coworking and more.

## Requirements

- Node >= 22.11
- Yarn 1
- Xcode + CocoaPods (iOS), Android Studio (Android)
- [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment)

## Getting Started

```sh
yarn install

# iOS only
bundle install
cd ios && bundle exec pod install && cd ..
```

## Running

```sh
yarn start      # start Metro
yarn ios        # run on iOS
yarn android    # run on Android
```

## Scripts

- `yarn lint` — run ESLint
- `yarn test` — run Jest
- `yarn reset` — reinstall node_modules and pods

## Project Structure

```
src/
├── components/    # reusable UI
├── hooks/         # custom hooks
├── navigators/    # navigation
├── screens/       # app screens
├── services/      # API calls
├── store/         # Redux store
├── theme/         # colors, fonts
├── translations/  # en / vi
├── types/         # shared types
└── utils/         # helpers, constants
```

See [`CODING_GUIDELINES.md`](./CODING_GUIDELINES.md) for coding conventions.
