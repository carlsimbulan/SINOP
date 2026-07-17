/**
 * Static import guard tests — verify that the service-layer import boundaries
 * defined in Requirement 9 are not violated by any screen file.
 *
 * Requirements: 9.2, 9.3, 9.5
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

// ── Req 9.3: LockScreen must NOT import expo-local-authentication ────────

describe('LockScreen import boundaries', () => {
  const src = readFile('screens/LockScreen.js');

  test('does NOT directly import expo-local-authentication', () => {
    expect(src).not.toMatch(/from\s+['"]expo-local-authentication['"]/);
    expect(src).not.toMatch(/require\s*\(\s*['"]expo-local-authentication['"]\s*\)/);
  });
});

// ── Req 9.2: DashboardScreen must NOT import AsyncStorage or expo-file-system

describe('DashboardScreen import boundaries', () => {
  const src = readFile('screens/DashboardScreen.js');

  test('does NOT directly import @react-native-async-storage/async-storage', () => {
    expect(src).not.toMatch(
      /from\s+['"]@react-native-async-storage\/async-storage['"]/
    );
  });

  test('does NOT directly import expo-file-system', () => {
    expect(src).not.toMatch(/from\s+['"]expo-file-system['"]/);
    expect(src).not.toMatch(/from\s+['"]expo-file-system\/legacy['"]/);
  });
});

// ── Req 9.2: AddEditScreen must NOT import AsyncStorage or expo-file-system

describe('AddEditScreen import boundaries', () => {
  const src = readFile('screens/AddEditScreen.js');

  test('does NOT directly import @react-native-async-storage/async-storage', () => {
    expect(src).not.toMatch(
      /from\s+['"]@react-native-async-storage\/async-storage['"]/
    );
  });

  test('does NOT directly import expo-file-system', () => {
    expect(src).not.toMatch(/from\s+['"]expo-file-system['"]/);
    expect(src).not.toMatch(/from\s+['"]expo-file-system\/legacy['"]/);
  });
});

// ── Req 9.5: No file imports Clipboard from react-native ──────────────────

describe('Clipboard import boundary', () => {
  const screenFiles = [
    'screens/LockScreen.js',
    'screens/DashboardScreen.js',
    'screens/AddEditScreen.js',
    'App.js',
  ];

  screenFiles.forEach((relPath) => {
    test(`${relPath} does NOT import Clipboard from react-native`, () => {
      const src = readFile(relPath);
      // Match: import { ..., Clipboard, ... } from 'react-native'
      // or:   import Clipboard from 'react-native'
      expect(src).not.toMatch(/Clipboard.*from\s+['"]react-native['"]/);
    });
  });
});

// ── Req 8.3: app.json declares required plugins with non-empty strings ────

describe('app.json configuration', () => {
  const appJson = JSON.parse(readFile('app.json'));
  const expoConfig = appJson.expo;

  test('userInterfaceStyle is "dark"', () => {
    expect(expoConfig.userInterfaceStyle).toBe('dark');
  });

  test('plugins array exists', () => {
    expect(Array.isArray(expoConfig.plugins)).toBe(true);
    expect(expoConfig.plugins.length).toBeGreaterThan(0);
  });

  test('expo-image-picker plugin has non-empty cameraPermission', () => {
    const pickerPlugin = expoConfig.plugins.find(
      (p) => Array.isArray(p) && p[0] === 'expo-image-picker'
    );
    expect(pickerPlugin).toBeTruthy();
    const opts = pickerPlugin[1];
    expect(typeof opts.cameraPermission).toBe('string');
    expect(opts.cameraPermission.trim().length).toBeGreaterThan(0);
  });

  test('expo-image-picker plugin has non-empty photosPermission', () => {
    const pickerPlugin = expoConfig.plugins.find(
      (p) => Array.isArray(p) && p[0] === 'expo-image-picker'
    );
    const opts = pickerPlugin[1];
    expect(typeof opts.photosPermission).toBe('string');
    expect(opts.photosPermission.trim().length).toBeGreaterThan(0);
  });

  test('expo-local-authentication plugin has non-empty faceIDPermission', () => {
    const authPlugin = expoConfig.plugins.find(
      (p) => Array.isArray(p) && p[0] === 'expo-local-authentication'
    );
    expect(authPlugin).toBeTruthy();
    const opts = authPlugin[1];
    expect(typeof opts.faceIDPermission).toBe('string');
    expect(opts.faceIDPermission.trim().length).toBeGreaterThan(0);
  });
});
