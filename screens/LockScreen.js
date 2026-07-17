/**
 * LockScreen — bypasses auth and navigates directly to Dashboard.
 * Fingerprint/biometric lock has been disabled.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LockScreen({ navigation }) {
  useEffect(() => {
    // No auth — go straight to Main (drawer + dashboard)
    navigation.replace('Main');
  }, [navigation]);

  // Render a brief splash while navigating
  return (
    <View style={styles.container}>
      <Ionicons name="shield-checkmark" size={64} color="#F5A623" />
      <Text style={styles.title}>SINOP</Text>
      <Text style={styles.subtitle}>Personal ID Vault</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginTop: 8,
  },
});
