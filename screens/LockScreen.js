import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkCapability, authenticate } from '../services/AuthService';

export default function LockScreen({ navigation }) {
  const [error, setError] = useState(null);
  const [capable, setCapable] = useState(false);

  const triggerAuth = useCallback(async () => {
    // Web browsers don't support native biometrics — bypass auth for web preview
    if (Platform.OS === 'web') {
      navigation.replace('Dashboard');
      return;
    }
    setError(null);
    try {
      const result = await authenticate('I-unlock ang iyong Sinop Vault');
      if (result.success === true) {
        navigation.replace('Dashboard');
      } else {
        if (result.error === 'user_cancel') {
          setError('Kinansela. Subukan ulit.');
        } else if (result.error === 'lockout') {
          setError('Masyadong maraming pagtatangka. Subukan mamaya.');
        } else {
          setError(`Hindi mapatunayan: ${result.error}`);
        }
      }
    } catch (e) {
      setError(`Hindi mapatunayan: ${e.message}`);
    }
  }, [navigation]);

  useEffect(() => {
    // Web: skip capability check, go straight to dashboard
    if (Platform.OS === 'web') {
      navigation.replace('Dashboard');
      return;
    }
    async function init() {
      const cap = await checkCapability();
      if (!cap.capable) {
        if (cap.reason === 'no_hardware') {
          setError('Ang iyong device ay walang biometric sensor.');
        } else if (cap.reason === 'not_enrolled') {
          setError('Walang nakaenroll na biometric o PIN. I-setup muna ang device security.');
        }
      } else {
        setCapable(true);
        triggerAuth();
      }
    }
    init();
  }, [triggerAuth]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        triggerAuth();
      }
    });
    return () => subscription.remove();
  }, [triggerAuth]);

  return (
    <View style={styles.container}>
      {/* Blur preview placeholder cards — background decoration, no real data */}
      <View style={styles.fakeCard1} />
      <View style={styles.fakeCard2} />

      <Ionicons name="lock-closed" size={64} color="#F5A623" />

      <Text style={styles.title}>SINOP</Text>
      <Text style={styles.subtitle}>Personal ID Vault</Text>

      {error ? (
        <>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={triggerAuth}>
            <Text style={styles.retryButtonText}>Subukan Ulit</Text>
          </TouchableOpacity>
        </>
      ) : capable ? (
        <Text style={styles.verifyingText}>Nagve-verify ng pagkakakilanlan...</Text>
      ) : null}
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
  fakeCard1: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    height: 120,
    backgroundColor: '#888',
    borderRadius: 16,
    opacity: 0.2,
  },
  fakeCard2: {
    position: 'absolute',
    top: 220,
    left: 20,
    right: 20,
    height: 120,
    backgroundColor: '#888',
    borderRadius: 16,
    opacity: 0.2,
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
    marginBottom: 32,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 32,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#0D0D0D',
    fontWeight: 'bold',
    fontSize: 16,
  },
  verifyingText: {
    color: '#888888',
    fontStyle: 'italic',
    fontSize: 14,
  },
});
