# Implementation Plan: Sinop Vault

## Overview

Implement the Sinop offline-first Personal Document & ID Vault using Expo SDK 57 (React Native 0.86, React 19.2). Tasks proceed from dependency installation through service layer, screen implementation, and wiring, with property-based and unit tests co-located near the code they validate.

All implementation uses JavaScript (not TypeScript). The design's pseudocode algorithm descriptions serve as implementation guidance only.

---

## Tasks

- [x] 1. Install dependencies and configure app.json
  - [x] 1.1 Install all required runtime and dev dependencies
    - Run `npx expo install @react-native-async-storage/async-storage@2.2.0 expo-file-system expo-image-picker expo-local-authentication expo-clipboard @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context @expo/vector-icons`
    - Run `npx expo install --dev fast-check`
    - Verify `package.json` reflects all installed versions
    - _Requirements: 7.2, 7.3, 8.1, 8.2, 9.2, 9.3, 9.5, 9.6_

  - [x] 1.2 Update `app.json` with required configuration
    - Set `userInterfaceStyle` to `"dark"`
    - Add `splash` block with a `backgroundColor` whose relative luminance is ≤ 0.10 and `resizeMode: "contain"` pointing to `./assets/splash-icon.png`
    - Add `plugins` array with `expo-image-picker` entry (non-empty `cameraPermission` and `photosPermission` strings)
    - Add `expo-local-authentication` plugin entry with non-empty `faceIDPermission` string
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 2. Implement utility functions
  - [x] 2.1 Create `utils/idUtils.js` with `maskIdNumber` and `isExpired`
    - Implement `maskIdNumber(idNumber)`: strings > 4 chars → bullet-prefix + last 4; strings ≤ 4 → unchanged; empty string → empty string
    - Implement `isExpired(isoDate)`: compares `isoDate + 'T00:00:00'` against local midnight; returns `boolean`
    - Export both functions
    - _Requirements: 2.4, 2.5_

  - [ ]* 2.2 Write property test for `maskIdNumber` (Property 6)
    - **Property 6: ID number masking always shows exactly the last 4 characters**
    - **Validates: Requirements 2.4**
    - File: `__tests__/utils/idUtils.test.js`
    - Use `fc.string({ minLength: 0, maxLength: 30 })` arbitrary
    - Assert length preservation, last-4 visibility, and bullet-prefix for strings ≥ 5
    - Assert identity for strings ≤ 4
    - Tag comment: `// Feature: sinop-vault, Property 6`
    - `numRuns: 100`

  - [ ]* 2.3 Write property test for `isExpired` (Property 7)
    - **Property 7: Expiry check is consistent with date ordering**
    - **Validates: Requirements 2.5**
    - File: `__tests__/utils/idUtils.test.js`
    - Use `fc.date()` mapped to ISO `YYYY-MM-DD` string
    - Assert determinism (two calls same run return same result)
    - Assert `isExpired` returns `false` for a hard-coded future date and `true` for a hard-coded past date
    - Tag comment: `// Feature: sinop-vault, Property 7`
    - `numRuns: 100`

- [x] 3. Implement AuthService
  - [x] 3.1 Create `services/AuthService.js`
    - Implement `checkCapability()`: calls `LocalAuthentication.hasHardwareAsync()` and `LocalAuthentication.isEnrolledAsync()`; returns `{ capable: true }` only when both are `true`; otherwise returns `{ capable: false, reason: 'no_hardware' | 'not_enrolled' }`
    - Implement `authenticate(promptMessage)`: calls `LocalAuthentication.authenticateAsync({ promptMessage, disableDeviceFallback: false })`; PIN fallback always enabled; propagates the `LocalAuthenticationResult` directly
    - No screen or component may import `expo-local-authentication` directly
    - _Requirements: 1.2, 1.3, 1.4, 1.6, 1.7, 9.3_

  - [ ]* 3.2 Write property test for `AuthService.checkCapability` (Property 2)
    - **Property 2: Auth_Service only prompts when device is capable**
    - **Validates: Requirements 1.7**
    - File: `__tests__/services/AuthService.test.js`
    - Mock `expo-local-authentication` to accept `(hasHardware, isEnrolled)` booleans
    - Use `fc.record({ hw: fc.boolean(), enrolled: fc.boolean() })` arbitrary
    - Assert `checkCapability()` returns `capable: true` iff `hw && enrolled`; otherwise `capable: false`
    - Tag comment: `// Feature: sinop-vault, Property 2`
    - `numRuns: 100`

  - [ ]* 3.3 Write unit tests for `AuthService`
    - File: `__tests__/services/AuthService.test.js`
    - Test: returns `no_hardware` when `hasHardwareAsync` → false
    - Test: returns `not_enrolled` when hardware present but `isEnrolledAsync` → false
    - Test: `authenticate()` called only when `capable === true`
    - _Requirements: 1.6, 1.7_

- [x] 4. Implement StorageService
  - [x] 4.1 Create `services/StorageService.js` — core CRUD
    - Import only from `@react-native-async-storage/async-storage` and `expo-file-system` (`File`, `Directory`, `Paths`) — never the legacy procedural API
    - Implement `saveEntry(entry)`: validates that `name`, `idType`, and `idNumber` are non-empty/non-whitespace (throws `ValidationError` otherwise); generates a UUID-style `id`; persists to `SINOP_VAULT_ENTRIES` key as `JSON.stringify(IDEntry[])`; re-throws a `StorageError` on `AsyncStorage.setItem` failure
    - Implement `loadEntries()`: reads `SINOP_VAULT_ENTRIES`; silently skips corrupt/missing-required-field entries; for each entry with a `photoUri`, checks file existence using the class-based API and sets `entry.photoMissing = true` if absent
    - Implement `updateEntry(id, updates)`: merges updates into the matching entry; preserves original `id`; re-throws `StorageError` on write failure
    - Implement `deleteEntry(id)`: removes entry metadata; best-effort deletes photo file (failure swallowed); throws `StorageError` if `AsyncStorage.removeItem` fails
    - _Requirements: 3.3, 5.2, 6.2, 7.1, 7.2, 7.4, 7.5, 7.6, 9.2_

  - [x] 4.2 Create `services/StorageService.js` — photo file operations
    - Implement `copyPhotoToVault(pickerUri)`: creates `new Directory(Paths.document)`, `new File(pickerUri)`, calls `src.copy(destDir)`; derives permanent URI as `Paths.document + '/' + filename`; re-throws `FileSystemError` on failure
    - Implement `deletePhoto(vaultUri)`: creates `new File(vaultUri)` and calls `.delete()`; swallows errors; logs in `__DEV__` only
    - _Requirements: 3.8, 3.9, 5.4, 5.5, 6.4, 7.3, 7.4, 9.2_

  - [ ]* 4.3 Write property test for storage round-trip (Property 3)
    - **Property 3: Storage round-trip preserves every field of an ID entry**
    - **Validates: Requirements 3.3, 5.2, 7.2**
    - File: `__tests__/services/StorageService.test.js`
    - Mock `AsyncStorage` in-memory
    - Use `fc.record({ name: fc.string({ minLength: 1 }), idType: fc.string({ minLength: 1 }), idNumber: fc.string({ minLength: 1 }), expiryDate: fc.option(fc.string()), photoUri: fc.option(fc.string()) })` arbitrary
    - Assert saved entry reappears with all fields intact after `loadEntries()`; assert `id` is non-empty and stable
    - Tag comment: `// Feature: sinop-vault, Property 3`
    - `numRuns: 100`

  - [ ]* 4.4 Write property test for delete removes entry (Property 8)
    - **Property 8: Delete entry removes it from all subsequent loads**
    - **Validates: Requirements 6.2**
    - File: `__tests__/services/StorageService.test.js`
    - Mock `AsyncStorage` in-memory; mock file deletion
    - Use same `idEntryArbitrary` as P3
    - Assert `loadEntries()` after `deleteEntry(id)` contains no entry with matching `id`
    - Tag comment: `// Feature: sinop-vault, Property 8`
    - `numRuns: 100`

  - [ ]* 4.5 Write property test for validation rejection (Property 9)
    - **Property 9: Validation rejects entries with any empty required field**
    - **Validates: Requirements 3.4**
    - File: `__tests__/services/StorageService.test.js`
    - Use `fc.record(...)` where at least one of `name`, `idType`, `idNumber` is `''` or whitespace-only
    - Assert `saveEntry` throws / rejects and `AsyncStorage.setItem` is never called
    - Tag comment: `// Feature: sinop-vault, Property 9`
    - `numRuns: 100`

  - [ ]* 4.6 Write property test for resilient load (Property 11)
    - **Property 11: Resilient load skips corrupt entries and returns the rest**
    - **Validates: Requirements 7.6**
    - File: `__tests__/services/StorageService.test.js`
    - Use `fc.array(fc.oneof(validEntryJsonArbitrary, corruptJsonArbitrary))`
    - Seed `AsyncStorage` directly with the mixed array; call `loadEntries()`
    - Assert returned count equals valid-entry count; assert no throw
    - Tag comment: `// Feature: sinop-vault, Property 11`
    - `numRuns: 100`

  - [ ]* 4.7 Write property test for photo URI permanence (Property 5)
    - **Property 5: Copied photo URIs are always under Paths.document**
    - **Validates: Requirements 3.8, 3.9, 7.3, 7.5**
    - File: `__tests__/services/StorageService.test.js`
    - Mock `File` and `Directory` constructors; capture copy destination
    - Use `fc.webUrl()` arbitrary for picker URIs
    - Assert returned URI starts with `Paths.document`
    - Tag comment: `// Feature: sinop-vault, Property 5`
    - `numRuns: 100`

  - [ ]* 4.8 Write unit tests for `StorageService`
    - File: `__tests__/services/StorageService.test.js`
    - Test: corrupt-entry skip does not crash `loadEntries`
    - Test: `photoMissing: true` set when file does not exist
    - Test: `updateEntry` preserves original `id`
    - Test: `deleteEntry` calls `AsyncStorage.removeItem`; photo deletion failure does not propagate
    - _Requirements: 7.5, 7.6_

- [x] 5. Checkpoint — service layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Set up navigation and App.js
  - [x] 6.1 Refactor `App.js` as navigator-only root
    - Import `NavigationContainer` from `@react-navigation/native`
    - Import `createNativeStackNavigator` from `@react-navigation/native-stack`
    - Create a `Stack` with `initialRouteName="Lock"`
    - Register `LockScreen`, `DashboardScreen`, and `AddEditScreen` as stack screens (files not yet implemented; use placeholder components until screens are ready)
    - Handle `AppState` subscription at the root level: on transition to `'active'`, navigate to `Lock` screen
    - No business logic, no service calls, no data access in `App.js`
    - _Requirements: 1.8, 9.1, 9.4_

- [x] 7. Implement LockScreen
  - [x] 7.1 Create `screens/LockScreen.js`
    - On mount, call `AuthService.checkCapability()`
    - If `capable: false`, render an informational message telling the user to set up device security; do not trigger the auth prompt
    - If `capable: true`, call `AuthService.authenticate('Unlock your Sinop Vault')`
    - On `result.success === true`, call `navigation.replace('Dashboard')`
    - On `result.success === false`, display a human-readable error derived from `result.error`; stay on LockScreen
    - Render a `BlurPreviewPlaceholder` (a `View` with blur/grey overlay) in the background — no real ID data is visible
    - Use `AppState.addEventListener('change', ...)` to re-trigger auth whenever `nextState === 'active'`; clean up subscription on unmount
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ]* 7.2 Write property test for auth gate navigation (Property 1)
    - **Property 1: Authentication gate controls navigation**
    - **Validates: Requirements 1.3, 1.4**
    - File: `__tests__/screens/LockScreen.test.js`
    - Mock `AuthService.authenticate` to return arbitrary `{ success: boolean, error?: string }`
    - Use `fc.record({ success: fc.boolean(), error: fc.option(fc.string()) })` arbitrary
    - Assert `navigation.replace('Dashboard')` is called iff `success === true`; assert user stays on LockScreen when `success === false`
    - Tag comment: `// Feature: sinop-vault, Property 1`
    - `numRuns: 100`

  - [ ]* 7.3 Write unit tests for `LockScreen`
    - File: `__tests__/screens/LockScreen.test.js`
    - Test: `BlurPreviewPlaceholder` is rendered before auth resolves
    - Test: "Set up device security" message shown when `capable: false`
    - Test: descriptive error message shown on failed auth
    - Test: `AppState` change to `'active'` re-triggers `authenticate()`
    - _Requirements: 1.1, 1.5, 1.6, 1.8_

- [x] 8. Implement DashboardScreen and IDCard component
  - [x] 8.1 Create `screens/DashboardScreen.js` with empty-state and list rendering
    - On mount (and on `navigation.addListener('focus', ...)`) call `StorageService.loadEntries()` to populate state
    - Render a dark background (`#0D0D0D` or equivalent with relative luminance ≤ 0.05) as root `View` background
    - When `entries` is empty, render centred empty-state message: "No IDs added yet. Tap the button below to add one."
    - When entries exist, render a `FlatList` / `ScrollView` of `IDCard` components, one per entry
    - Render the FAB fixed at bottom-right with label "Mag-sinop ng Bagong ID"; tapping navigates to `AddEdit` with `{ mode: 'add' }`
    - Pass `isAuthenticated` flag to each `IDCard`; flag is `true` after successful LockScreen auth and reset to `false` whenever the screen re-locks
    - _Requirements: 2.1, 2.2, 2.3, 2.7, 3.1, 4.1, 4.2_

  - [x] 8.2 Create `components/IDCard.js` with masking, expiry badge, and photo thumbnail
    - Accept props: `entry`, `isAuthenticated`, `onEdit`, `onDelete`, `onCopy`
    - Always display `entry.name` and `entry.idType` in full
    - Display `maskIdNumber(entry.idNumber)` by default; render a "Reveal" toggle button that toggles to full `idNumber` only when `isAuthenticated === true`
    - When `isAuthenticated === false`, render the ID number field and photo area as `BlurPreviewPlaceholder` (bullet-only / grey overlay)
    - Display `entry.expiryDate`; if `isExpired(entry.expiryDate)` is `true`, render the date in a warning colour (e.g. `#FF4444`)
    - If `entry.photoUri` exists and `!entry.photoMissing`, render an `Image` thumbnail; if `entry.photoMissing` or no `photoUri`, render a placeholder icon (`@expo/vector-icons`)
    - Render a Quick_Copy button (`@expo/vector-icons` clipboard icon) adjacent to the ID number field; calls `onCopy(entry.idNumber)`
    - Render Edit and Delete action buttons/icons per card
    - _Requirements: 2.4, 2.5, 2.6, 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 9.6_

  - [x] 8.3 Implement Quick_Copy logic in `DashboardScreen.js`
    - Import `setStringAsync` from `expo-clipboard` — never from `react-native`
    - Implement `handleCopy(idNumber)`: calls `Clipboard.setStringAsync(idNumber)`; on success, show a Toast/inline message for 2–4 seconds using `setTimeout` to dismiss; on failure, show an error message
    - Pass `handleCopy` as `onCopy` prop to `IDCard`
    - _Requirements: 4.4, 4.5, 4.6, 4.7, 9.5_

  - [ ]* 8.4 Write property test for dashboard auth gate rendering (Property 4)
    - **Property 4: DashboardScreen never renders real ID data before authentication**
    - **Validates: Requirements 4.1, 4.2**
    - File: `__tests__/components/IDCard.test.js`
    - Use `fc.record({ entry: idEntryArbitrary, isAuthenticated: fc.boolean() })` arbitrary
    - When `isAuthenticated === false`: assert rendered output contains no raw `idNumber` substring and no real `photoUri`; assert bullet characters present
    - When `isAuthenticated === true`: assert unmasked `idNumber` and photo URI can appear
    - Tag comment: `// Feature: sinop-vault, Property 4`
    - `numRuns: 100`

  - [ ]* 8.5 Write property test for Quick_Copy passes unmasked value (Property 12)
    - **Property 12: Quick_Copy passes the unmasked ID number to the clipboard**
    - **Validates: Requirements 4.5**
    - File: `__tests__/components/IDCard.test.js`
    - Mock `expo-clipboard`; capture argument to `setStringAsync`
    - Use `idEntryArbitrary` with `isAuthenticated: true`
    - Simulate tap on Quick_Copy button; assert `setStringAsync` called with `entry.idNumber` (never masked)
    - Tag comment: `// Feature: sinop-vault, Property 12`
    - `numRuns: 100`

  - [ ]* 8.6 Write unit tests for `DashboardScreen` and `IDCard`
    - File: `__tests__/screens/DashboardScreen.test.js`
    - Test: empty-state message rendered when `entries === []`
    - Test: FAB renders with label "Mag-sinop ng Bagong ID"
    - Test: `IDCard` rendered for each entry
    - Test: delete action triggers confirmation dialog
    - Test: clipboard feedback message shown for 2–4 s then auto-dismissed
    - _Requirements: 2.2, 2.3, 2.7, 4.6, 4.7_

- [x] 9. Implement AddEditScreen
  - [x] 9.1 Create `screens/AddEditScreen.js` — form fields and validation
    - Read route param `{ mode, entry }` from `navigation.route.params`
    - In `"edit"` mode, pre-populate all form fields from `entry` (`name`, `idType`, `idNumber`, `expiryDate`, `photoUri`)
    - In `"add"` mode, all fields start empty
    - Render `TextInput` for Name (required), ID Type (required), ID Number (required), and an optional date text input for Expiry Date
    - On Save: validate that `name`, `idType`, and `idNumber` are non-empty/non-whitespace; if any are empty, display per-field inline error messages and do NOT call `StorageService`
    - On valid Save in `"add"` mode: call `StorageService.saveEntry(entry)`; on success navigate to `Dashboard`; on `StorageError` remain on screen and display error
    - On valid Save in `"edit"` mode: call `StorageService.updateEntry(id, updates)`; on success navigate to `Dashboard`; on `StorageError` remain on screen and display error, preserve unsaved edits
    - _Requirements: 3.2, 3.3, 3.4, 3.10, 3.12, 5.1, 5.2, 5.3_

  - [x] 9.2 Add photo picker to `AddEditScreen.js`
    - Render a photo picker area showing current photo thumbnail (if any) or a placeholder
    - Provide two options: "Camera" and "Library"
    - Camera option: call `ImagePicker.requestCameraPermissionsAsync()`; if denied show permission-denied message with `Linking.openSettings()` button; if granted call `ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: false })`
    - Library option: call `ImagePicker.requestMediaLibraryPermissionsAsync()`; same denial handling; if granted call `ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] })`
    - On non-cancelled result, call `StorageService.copyPhotoToVault(result.assets[0].uri)`; on success store returned URI in form state; on `FileSystemError` proceed without photo and display notification
    - In `"edit"` mode, when user picks a new photo, first copy new photo, then on success call `StorageService.deletePhoto(oldUri)` and update form state
    - When user explicitly removes photo in edit mode, call `StorageService.deletePhoto(photoUri)` and set `photoUri` state to `null`
    - Use `mediaTypes: ['images']` string array — never `MediaTypeOptions` enum
    - _Requirements: 3.5, 3.6, 3.7, 3.8, 3.9, 3.11, 5.4, 5.5, 8.5, 8.6_

  - [ ]* 9.3 Write property test for edit mode pre-population (Property 10)
    - **Property 10: Form pre-population in edit mode exactly matches stored entry**
    - **Validates: Requirements 5.1**
    - File: `__tests__/screens/AddEditScreen.test.js`
    - Use `idEntryArbitrary`; render `AddEditScreen` with `{ mode: 'edit', entry }`
    - Assert each form field value strictly equals the corresponding entry field
    - Assert no field is blank and no field contains a value from a different entry
    - Tag comment: `// Feature: sinop-vault, Property 10`
    - `numRuns: 100`

  - [ ]* 9.4 Write unit tests for `AddEditScreen`
    - File: `__tests__/screens/AddEditScreen.test.js`
    - Test: per-field validation errors shown when required fields empty
    - Test: Save not called when validation fails
    - Test: camera permission denied → message + `Linking.openSettings()` button rendered
    - Test: library permission denied → message + `Linking.openSettings()` button rendered
    - Test: already-granted permission → picker launched without re-requesting
    - _Requirements: 3.4, 8.5, 8.6_

- [x] 10. Final wiring and integration checks
  - [x] 10.1 Wire `App.js` with real screen components
    - Replace placeholder components with the real screen imports
    - Confirm `AppState` subscription in root navigates to `Lock` on `'active'`
    - Verify `App.js` contains no service calls, no AsyncStorage imports, no `expo-local-authentication` imports
    - _Requirements: 1.8, 9.1, 9.4_

  - [x] 10.2 Add static import guard tests
    - File: `__tests__/integration/importGuards.test.js`
    - Test: `screens/LockScreen.js` does NOT import `expo-local-authentication`
    - Test: `screens/DashboardScreen.js` does NOT import `@react-native-async-storage/async-storage` or `expo-file-system`
    - Test: `screens/AddEditScreen.js` does NOT import `@react-native-async-storage/async-storage` or `expo-file-system`
    - Test: no file imports `Clipboard` from `react-native`
    - Test: `app.json` declares `expo-image-picker` and `expo-local-authentication` plugins with non-empty permission strings and `userInterfaceStyle: "dark"`
    - _Requirements: 9.2, 9.3, 9.5_

- [x] 11. Final checkpoint — full test suite
  - Ensure all tests pass (`npx jest --watchAll=false`), ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery; they must NOT be auto-implemented.
- All code is JavaScript (`.js`); no TypeScript files.
- All `expo-file-system` usage must use the class-based v57 API (`File`, `Directory`, `Paths`) — never `import * as FileSystem from 'expo-file-system'`.
- `mediaTypes` in `expo-image-picker` must be the string array `['images']` — the `MediaTypeOptions` enum is removed in SDK 57.
- Property tests use `fast-check` with `numRuns: 100` minimum; each test file comments link back to the property number.
- Checkpoints (tasks 5 and 11) are execution pauses — they are not coding tasks.
- Each task references specific requirement numbers for full traceability.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3", "4.2"] },
    { "id": 3, "tasks": ["4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "6.1"] },
    { "id": 4, "tasks": ["7.1"] },
    { "id": 5, "tasks": ["7.2", "7.3", "8.1"] },
    { "id": 6, "tasks": ["8.2", "8.3"] },
    { "id": 7, "tasks": ["8.4", "8.5", "8.6", "9.1"] },
    { "id": 8, "tasks": ["9.2"] },
    { "id": 9, "tasks": ["9.3", "9.4", "10.1"] },
    { "id": 10, "tasks": ["10.2"] }
  ]
}
```
