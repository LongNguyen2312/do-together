import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';

import LiquidTabBar from '@/components/LiquidTabBar';
import ActivitiesScreen from '@/screens/Activities';
import DiscoverScreen from '@/screens/Discover';
import HomeScreen from '@/screens/Home';
import ProfileScreen from '@/screens/Profile';
import type { MainTabParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

const renderTabBar = (props: BottomTabBarProps) => <LiquidTabBar {...props} />;

export default function MainTabNavigator() {
  return (
    <Tab.Navigator tabBar={renderTabBar} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Activities" component={ActivitiesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
