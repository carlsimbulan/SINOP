/**
 * AuthService.js
 *
 * Wraps expo-local-authentication. This is the ONLY file in the project
 * that may import expo-local-authentication — no screen or component may
 * import it directly (Requirement 9.3).
 */
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/**
 * Check whether the device has suitable hardware AND an enrolled credential.
 * Always returns { capable: false, reason: 'no_hardware' } on web.
 */
export async function checkCapability() {
  if (Platform.OS === 'web') {
    return { capable: false, reason: 'no_hardware' };
  }
  const hasHardware = await LocalAuthentication.hasHardwareAsync();

  if (!hasHardware) {
    return { capable: false, reason: 'no_hardware' };
  }

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!isEnrolled) {
    return { capable: false, reason: 'not_enrolled' };
  }

  return { capable: true };
}

/**
 * Prompt the user for biometric or PIN authentication.
 * PIN fallback is always enabled (disableDeviceFallback: false).
 * Returns { success: true } immediately on web (no native auth available).
 */
export async function authenticate(promptMessage) {
  if (Platform.OS === 'web') {
    return { success: true };
  }
  return LocalAuthentication.authenticateAsync({
    promptMessage,
    disableDeviceFallback: false,
    cancelLabel: 'Kanselahin',
  });
}
