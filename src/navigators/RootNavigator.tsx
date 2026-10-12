import { useMemo } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { withModalRoots } from '@/components/ModalScreenRoot';
import MainTabNavigator from '@/navigators/MainTabNavigator';
import ActivitiesScreen from '@/screens/Activities';
import ActivityDetailScreen from '@/screens/ActivityDetail';
import CommunitiesScreen from '@/screens/Communities';
import ForgotPasswordScreen from '@/screens/ForgotPassword';
import FreeNearbyListScreen from '@/screens/FreeNearbyList';
import FreeNearbyMapScreen from '@/screens/FreeNearbyMap';
import GroupChatScreen from '@/screens/GroupChat';
import GroupChatInfoScreen from '@/screens/GroupChatInfo';
import GroupMediaScreen from '@/screens/GroupMedia';
import GroupMembersScreen from '@/screens/GroupMembers';
import HotActivitiesScreen from '@/screens/HotActivities';
import ImFreeScreen from '@/screens/ImFree';
import LoginScreen from '@/screens/Login';
import OnboardingScreen from '@/screens/Onboarding';
import SignUpScreen from '@/screens/SignUp';
import StoryCameraScreen from '@/screens/StoryCamera';
import StoryEditorScreen from '@/screens/StoryEditor';
import MediaGalleryScreen from '@/screens/MediaGallery';
import StoryViewerScreen from '@/screens/StoryViewer';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';
import type { RootStackParamList } from '@/types/navigation';

// Native modals: they need their own gesture and dialog roots.
const StoryCameraModal = withModalRoots(StoryCameraScreen);
const StoryEditorModal = withModalRoots(StoryEditorScreen);
const StoryViewerModal = withModalRoots(StoryViewerScreen);

const Stack = createNativeStackNavigator<RootStackParamList>();

// TODO: temporary — skips onboarding and auth so the app opens on Home.
const SKIP_TO_MAIN = true;

export default function RootNavigator() {
  const { colors, isDark } = useTheme();
  const hasCompletedOnboarding = useAppSelector(
    state => state.app.hasCompletedOnboarding,
  );
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [colors, isDark]);

  const mainScreens = (
    <Stack.Group>
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="ImFree" component={ImFreeScreen} />
      <Stack.Screen name="ActivityHistory" component={ActivitiesScreen} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
      <Stack.Screen name="GroupChatInfo" component={GroupChatInfoScreen} />
      <Stack.Screen name="GroupMedia" component={GroupMediaScreen} />
      <Stack.Screen name="GroupMembers" component={GroupMembersScreen} />
      <Stack.Screen name="FreeNearbyMap" component={FreeNearbyMapScreen} />
      <Stack.Screen name="FreeNearbyList" component={FreeNearbyListScreen} />
      <Stack.Screen name="HotActivities" component={HotActivitiesScreen} />
      <Stack.Screen name="Communities" component={CommunitiesScreen} />
      <Stack.Screen
        name="StoryGallery"
        component={MediaGalleryScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="ChatGallery"
        component={MediaGalleryScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="StoryCamera"
        component={StoryCameraModal}
        // Sideways swipes change the filter.
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="StoryEditor"
        component={StoryEditorModal}
        // Swiping it away would lose the edits without asking.
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="StoryViewer"
        component={StoryViewerModal}
        // See-through, so a pull down to close reveals the screen beneath.
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack.Group>
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {SKIP_TO_MAIN ? (
          mainScreens
        ) : !hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !isAuthenticated ? (
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />
          </Stack.Group>
        ) : (
          mainScreens
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
