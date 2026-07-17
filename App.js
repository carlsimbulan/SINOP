import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import DrawerContent from './components/DrawerContent';
import DashboardScreen from './screens/DashboardScreen';
import AddEditScreen from './screens/AddEditScreen';
import AboutScreen from './screens/AboutScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

/**
 * Inner stack: Dashboard + AddEdit + About (all accessible from the stack,
 * About is also reachable via the drawer button).
 */
function MainStack({ navigation: drawerNavigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard">
        {(props) => (
          <DashboardScreen
            {...props}
            openDrawer={() => drawerNavigation.openDrawer()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="AddEdit" component={AddEditScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { isDark, colors } = useTheme();

  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerType: 'slide',
          drawerStyle: {
            width: 300,
            backgroundColor: colors.drawerBackground,
          },
          overlayColor: 'rgba(0,0,0,0.55)',
          swipeEdgeWidth: 60,
        }}
      >
        <Drawer.Screen name="MainStack" component={MainStack} />
      </Drawer.Navigator>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
