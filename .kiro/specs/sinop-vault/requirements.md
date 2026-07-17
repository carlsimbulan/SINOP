# Requirements Document

## Introduction

Sinop is an offline-first, highly secure Personal Document & ID Vault mobile application built with Expo SDK 57 (React Native 0.86, React 19.2). The app allows users to securely store, view, and manage physical ID documents and personal identification cards entirely on-device without any network connectivity requirement. All data remains local to the device, protected by biometric or device PIN authentication before access is granted.

## Glossary

- **Sinop_App**: The Expo/React Native mobile application described in this document.
- **Vault**: The secure collection of ID entries stored on the device.
- **ID_Entry**: A single stored record consisting of ID metadata (Name, ID Type, ID Number, Expiry Date) and an optional photo of the physical ID.
- **LockScreen**: The authentication screen presented on app launch, requiring biometric or device PIN verification.
- **DashboardScreen**: The main screen displaying all ID cards in the Vault after successful authentication.
- **AddEditScreen**: The screen for creating a new ID_Entry or editing an existing one.
- **Storage_Service**: The utility layer that encapsulates all `@react-native-async-storage/async-storage` and `expo-file-system` operations.
- **Auth_Service**: The utility layer that encapsulates all `expo-local-authentication` biometric authentication operations.
- **ID_Card**: The UI component on the DashboardScreen that visually represents a single ID_Entry in a wallet-card style.
- **FAB**: Floating Action Button — the primary call-to-action button labeled "Mag-sinop ng Bagong ID" on the DashboardScreen.
- **Blur_Preview**: A blurred or placeholder visual state applied to ID_Card contents before authentication succeeds.
- **Quick_Copy**: The feature that copies an ID Number to the device clipboard with a single button tap.
- **Paths.document**: The permanent document directory exposed by `expo-file-system` v57 (`import { Paths } from 'expo-file-system'`) — files stored here are not deleted by the OS.
- **MediaType**: The string union type `'images' | 'videos' | 'livePhotos'` accepted by `expo-image-picker` v57's `mediaTypes` option (the deprecated `MediaTypeOptions` enum must NOT be used).
- **LocalAuthenticationResult**: The result object returned by `expo-local-authentication` v57's `authenticateAsync`, shaped as `{ success: true }` or `{ success: false, error: LocalAuthenticationError }`.

---

## Requirements

### Requirement 1: Biometric/PIN Lock on App Launch

**User Story:** As a user, I want the app to require biometric or PIN authentication every time I open it, so that no one else can access my stored IDs without my consent.

#### Acceptance Criteria

1. WHEN the Sinop_App is launched, THE LockScreen SHALL be displayed as the first screen before any Vault content is accessible.
2. WHEN the LockScreen is displayed, THE Auth_Service SHALL trigger the device's biometric or PIN authentication prompt, with PIN as an allowed fallback if biometric fails or is unavailable.
3. WHEN authentication succeeds, THE LockScreen SHALL navigate the user to the DashboardScreen.
4. WHEN authentication fails or is cancelled, THE LockScreen SHALL display a descriptive error message and remain on the LockScreen without navigating away.
5. WHILE the LockScreen is displayed, THE Sinop_App SHALL render a Blur_Preview placeholder instead of any real ID card content.
6. WHEN the device has no biometric enrollment and no device PIN set, THE LockScreen SHALL display a message informing the user to set up device security before using the Vault.
7. THE Auth_Service SHALL verify that the device has the necessary hardware support and that at least one biometric or PIN credential is enrolled before triggering the authentication prompt; IF neither is available, THE Auth_Service SHALL report an unenrolled state to the LockScreen rather than triggering the prompt.
8. WHEN the Sinop_App returns from background to foreground, THE LockScreen SHALL be re-presented and authentication SHALL be required again before the DashboardScreen is accessible.

---

### Requirement 2: Dark-Themed Dashboard with ID Card List

**User Story:** As a user, I want to see all my stored IDs displayed as clean wallet-style cards on a dark-themed dashboard, so that the app feels like a premium, secure wallet.

#### Acceptance Criteria

1. THE DashboardScreen SHALL use a dark background colour with a relative luminance of 0.05 or below for all root view backgrounds.
2. WHEN the user is on the DashboardScreen, THE DashboardScreen SHALL render a vertically scrollable list of ID_Cards, one per ID_Entry stored in the Vault.
3. WHEN the Vault is empty, THE DashboardScreen SHALL display a single centred message indicating no IDs have been added and instructing the user to tap the FAB; no ID_Card components SHALL be rendered.
4. THE ID_Card SHALL display the ID_Entry's Name and ID Type in full, and SHALL display the ID Number masked to show only the last four characters with the preceding characters replaced by bullet characters (•); the masked representation SHALL update to show the full ID Number only after the user explicitly taps an "Reveal" or equivalent control on that card.
5. THE ID_Card SHALL display the Expiry Date of the ID_Entry; IF the Expiry Date is in the past relative to the device's current date, THE ID_Card SHALL render the Expiry Date in a visually distinct warning colour.
6. WHERE an ID_Entry has an associated photo, THE ID_Card SHALL display a thumbnail of that photo occupying a fixed area within the card; IF the photo file cannot be loaded, THE ID_Card SHALL display a placeholder icon in the same area instead of leaving it blank or throwing an error.
7. THE DashboardScreen SHALL include a FAB labelled "Mag-sinop ng Bagong ID" permanently positioned at the bottom-right corner of the screen, above the system navigation bar, and visible at all times regardless of scroll position.

---

### Requirement 3: Add New ID Entry

**User Story:** As a user, I want to add a new ID by filling in its details and optionally attaching a photo, so that I can build my personal document vault.

#### Acceptance Criteria

1. WHEN the user taps the FAB on the DashboardScreen, THE Sinop_App SHALL navigate to the AddEditScreen in "add" mode.
2. THE AddEditScreen SHALL provide input fields for: Name (text, required), ID Type (text or picker, required), ID Number (text, required), and Expiry Date (date input or text, optional).
3. WHEN the user taps the Save button on the AddEditScreen and all required fields (Name, ID Type, ID Number) are filled, THE Storage_Service SHALL persist the ID_Entry metadata to AsyncStorage.
4. IF the user taps the Save button and one or more required fields are empty, THEN THE AddEditScreen SHALL display a validation error message adjacent to each empty required field and SHALL NOT persist the incomplete ID_Entry.
5. THE AddEditScreen SHALL provide an option to attach a photo by either capturing an image with the device camera or selecting an image from the device photo library.
6. WHEN the user selects the camera option, THE Sinop_App SHALL request camera permission if not already granted, then invoke the camera image capture flow with image-only media type.
7. WHEN the user selects the library option, THE Sinop_App SHALL request media library permission if not already granted, then invoke the image library picker with image-only media type.
8. WHEN an image is selected and the picker is not cancelled, THE Storage_Service SHALL copy the image file from the picker's returned URI to a permanent location under `Paths.document` using the new class-based `expo-file-system` v57 API.
9. WHEN the photo is stored, THE Storage_Service SHALL persist the `Paths.document`-based file URI in the ID_Entry's AsyncStorage record so the photo path survives app restarts.
10. WHEN the Storage_Service successfully persists the ID_Entry, THE Sinop_App SHALL navigate back to the DashboardScreen and render the newly added ID_Card in the list.
11. IF the photo file copy to `Paths.document` fails, THEN THE Storage_Service SHALL save the ID_Entry metadata without a photo URI, navigate back to the DashboardScreen, and display an error notification informing the user that the photo could not be saved.
12. IF the AsyncStorage write fails, THEN THE AddEditScreen SHALL remain on-screen, display an error message to the user, and make no navigation change.

---

### Requirement 4: View ID Entry Details with Authentication Gate

**User Story:** As a user, I want to view the full details of a stored ID only after authentication is confirmed, so that sensitive data is never displayed to unauthorized users.

#### Acceptance Criteria

1. WHEN the user taps an ID_Card on the DashboardScreen and the current session is authenticated, THE Sinop_App SHALL display the full ID_Entry details, comprising the label (Name), ID Type, unmasked ID Number, Expiry Date, and photo (if present).
2. WHILE the current session has not been authenticated (for example, immediately after the app resumes from background), THE ID_Card SHALL render the ID Number field and photo area in Blur_Preview state, obscuring all content.
3. WHEN the Sinop_App returns from background to foreground, THE LockScreen SHALL be re-presented, requiring authentication before the DashboardScreen content is accessible again.
4. WHEN full ID details are displayed, THE Sinop_App SHALL render a Quick_Copy button immediately adjacent to the ID Number field.
5. WHEN the user taps the Quick_Copy button, THE Sinop_App SHALL write the unmasked ID Number to the device clipboard.
6. WHEN the clipboard write succeeds, THE Sinop_App SHALL display a feedback message that is visible for 2 to 4 seconds and then dismissed automatically, without requiring any user interaction.
7. IF the clipboard write fails, THEN THE Sinop_App SHALL display an error message indicating the copy was unsuccessful.

---

### Requirement 5: Edit Existing ID Entry

**User Story:** As a user, I want to edit the details of a previously stored ID, so that I can update information when it changes (e.g., renewal date).

#### Acceptance Criteria

1. WHEN the user selects the edit action on an ID_Card, THE Sinop_App SHALL navigate to the AddEditScreen in "edit" mode, pre-populated with all fields of the existing ID_Entry data.
2. WHEN the user taps the Save button on the AddEditScreen in "edit" mode, THE Storage_Service SHALL update the existing ID_Entry record in AsyncStorage, preserving the original entry identifier.
3. IF the AsyncStorage update fails, THEN THE AddEditScreen SHALL remain on-screen, display an error message to the user, and preserve the unsaved edits in the form fields.
4. WHEN the user replaces the photo during edit, THE Storage_Service SHALL first write the new image to `Paths.document`; IF the write succeeds, THEN THE Storage_Service SHALL update the photo URI in AsyncStorage and delete the previously stored image file from `Paths.document`; IF the write fails, THEN THE Storage_Service SHALL abort the photo replacement and preserve the original photo URI.
5. WHEN the user removes the photo during edit, THE Storage_Service SHALL delete the previously stored image file from `Paths.document` and set the photo URI in AsyncStorage to null.
6. WHEN the Storage_Service successfully persists the edited ID_Entry, THE Sinop_App SHALL navigate back to the DashboardScreen and reload the ID_Card list from storage to reflect the changes.

---

### Requirement 6: Delete ID Entry

**User Story:** As a user, I want to delete an ID entry I no longer need, so that my vault stays organised and free of outdated documents.

#### Acceptance Criteria

1. WHEN the user selects the delete action on an ID_Card, THE Sinop_App SHALL display a confirmation dialog asking the user to confirm the deletion.
2. WHEN the user confirms deletion, THE Storage_Service SHALL remove the ID_Entry metadata from AsyncStorage.
3. IF the AsyncStorage deletion fails, THEN THE Sinop_App SHALL display an error message and leave the ID_Card visible in the DashboardScreen list.
4. WHEN the ID_Entry metadata is successfully removed and the deleted ID_Entry has an associated photo file stored under `Paths.document`, THE Storage_Service SHALL attempt to delete that photo file using the `expo-file-system` v57 new class-based API.
5. IF the photo file deletion fails, THEN THE Sinop_App SHALL log the failure silently without displaying an error to the user, since the metadata has already been removed.
6. WHEN the metadata is successfully deleted, THE DashboardScreen SHALL no longer display the deleted ID_Card.
7. WHEN the user cancels the confirmation dialog, THE Sinop_App SHALL dismiss the dialog and make no changes to the Vault.

---

### Requirement 7: Offline-First Persistent Storage

**User Story:** As a user, I want all my ID data to be stored entirely on my device and available without any internet connection, so that my sensitive documents are never transmitted to any server.

#### Acceptance Criteria

1. THE Sinop_App SHALL perform all Vault operations (create, read, update, and delete of ID_Entries) without making any outbound network requests.
2. THE Storage_Service SHALL persist all ID_Entry metadata — comprising at minimum a unique entry identifier, a human-readable label, all user-supplied field values, and the photo file path (or null) — using `@react-native-async-storage/async-storage` version 2.2.0.
3. THE Storage_Service SHALL store all ID photo files in `Paths.document` (the permanent document directory) using `expo-file-system` v57's class-based API (`import { File, Directory, Paths } from 'expo-file-system'`).
4. THE Storage_Service SHALL NOT use the legacy procedural `expo-file-system` API (`import * as FileSystem from 'expo-file-system'`) as it throws at runtime in Expo SDK 57.
5. WHEN the app is restarted, THE DashboardScreen SHALL display only those ID_Entries for which both the metadata was successfully parsed from AsyncStorage and, where a photo URI is stored, the photo file exists at that URI.
6. WHEN a stored metadata entry cannot be parsed (for example, due to corruption), THE Storage_Service SHALL skip that entry and continue loading the remaining entries without crashing.
7. WHEN an ID_Entry references a photo URI that does not resolve to an existing file on the device, THE DashboardScreen SHALL display the ID_Card with a missing-photo placeholder indicator rather than omitting the card or throwing an error.

---

### Requirement 8: Permissions and App Configuration

**User Story:** As a developer, I want the app to declare all required permissions and config plugin entries, so that native builds work correctly for camera, photo library, and biometric features.

#### Acceptance Criteria

1. THE Sinop_App's `app.json` SHALL declare the `expo-image-picker` config plugin with non-empty `cameraPermission` and `photosPermission` strings that describe, in plain language, why the app requires each permission.
2. THE Sinop_App's `app.json` SHALL declare the `expo-local-authentication` config plugin with a non-empty `faceIDPermission` string that describes why the app requires Face ID access.
3. THE Sinop_App's `app.json` SHALL set `userInterfaceStyle` to `"dark"`.
4. THE Sinop_App's `app.json` SHALL include a `splash` configuration with a `backgroundColor` whose relative luminance is 0.10 or below and a `resizeMode` of `"contain"`.
5. WHEN the user triggers a camera or photo library action and the corresponding permission has not yet been granted, THE Sinop_App SHALL request that permission before launching the picker; IF the permission is already granted, THE Sinop_App SHALL launch the picker directly without re-requesting.
6. IF the user denies a required permission, THEN THE Sinop_App SHALL display a message that names the denied permission, states the feature it enables, and includes a button that opens the device's application settings screen directly so the user can grant the permission manually.

---

### Requirement 9: Code Structure and Separation of Concerns

**User Story:** As a developer, I want the codebase to be split into focused screen files and a service layer, so that the code is maintainable and each module has a single responsibility.

#### Acceptance Criteria

1. THE Sinop_App SHALL implement navigation across separate screen component files: `screens/LockScreen.js`, `screens/DashboardScreen.js`, and `screens/AddEditScreen.js`.
2. THE Sinop_App SHALL implement a `services/StorageService.js` module that encapsulates all AsyncStorage reads/writes and all `expo-file-system` file operations; no screen or component file SHALL directly import `@react-native-async-storage/async-storage` or `expo-file-system`.
3. THE Sinop_App SHALL implement a `services/AuthService.js` module that encapsulates all `expo-local-authentication` calls; no screen or component file SHALL directly import `expo-local-authentication`.
4. THE Sinop_App's `App.js` SHALL contain only navigator configuration and the root component definition; it SHALL NOT contain business logic, direct service calls, or data-access code.
5. THE Sinop_App SHALL use `expo-clipboard` for all clipboard operations; no file SHALL import the `Clipboard` API from `react-native`.
6. THE Sinop_App SHALL use `@expo/vector-icons` for icons; icon usage SHALL be limited to navigation controls and primary action buttons, with a maximum of one icon per interactive control.
