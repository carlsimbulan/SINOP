import React, { useRef, useEffect } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import LockScreen from './screens/LockScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddEditScreen from './screens/AddEditScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        navigationRef.current?.navigate('Lock');
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="Lock"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Lock" component={LockScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="AddEdit" component={AddEditScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
