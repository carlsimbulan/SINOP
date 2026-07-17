/**
 * StorageService — core CRUD operations for the Sinop Vault.
 *
 * All AsyncStorage and expo-file-system interactions are isolated here.
 * No screen or component file may import AsyncStorage or expo-file-system directly.
 *
 * AsyncStorage key:  SINOP_VAULT_ENTRIES  →  JSON.stringify(IDEntry[])
 *
 * @typedef {Object} IDEntry
 * @property {string}      id          - UUID-style, generated on first save
 * @property {string}      name        - Human-readable label (required)
 * @property {string}      idType      - Type of document, e.g. "PhilSys ID" (required)
 * @property {string}      idNumber    - Raw ID number, unmasked (required)
 * @property {string|null} expiryDate  - "YYYY-MM-DD" or null
 * @property {string|null} photoUri    - Paths.document-based file:// URI or null
 * @property {number}      createdAt   - Unix timestamp ms
 * @property {number}      updatedAt   - Unix timestamp ms
 *
 * @typedef {Object} IDEntryInput
 * @property {string}      name
 * @property {string}      idType
 * @property {string}      idNumber
 * @property {string|null} [expiryDate]
 * @property {string|null} [photoUri]
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const STORAGE_KEY = 'SINOP_VAULT_ENTRIES';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Generate a UUID-style identifier without any external package.
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Load the raw IDEntry array from AsyncStorage.
 * Returns an empty array when no data is stored.
 * Does NOT perform photo-existence checks — that is loadEntries' responsibility.
 *
 * @returns {Promise<IDEntry[]>}
 */
async function _readRaw() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persist an array of IDEntry objects to AsyncStorage.
 * Re-throws a StorageError-tagged Error on failure.
 *
 * @param {IDEntry[]} entries
 * @returns {Promise<void>}
 */
async function _writeRaw(entries) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    const storageErr = new Error(`StorageError: failed to write vault — ${err.message}`);
    storageErr.name = 'StorageError';
    throw storageErr;
  }
}

/**
 * Validate that a required string field is non-empty and non-whitespace.
 * @param {*} value
 * @returns {boolean}
 */
function _isValidField(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate that an entry object has the three required fields.
 * Throws a ValidationError if any are missing/empty/whitespace-only.
 *
 * @param {IDEntryInput} entry
 */
function _validateEntry(entry) {
  const missing = [];
  if (!_isValidField(entry.name)) missing.push('name');
  if (!_isValidField(entry.idType)) missing.push('idType');
  if (!_isValidField(entry.idNumber)) missing.push('idNumber');

  if (missing.length > 0) {
    const validationErr = new Error(
      'ValidationError: name, idType, and idNumber are required'
    );
    validationErr.name = 'ValidationError';
    throw validationErr;
  }
}

// ---------------------------------------------------------------------------
// Public API — CRUD
// ---------------------------------------------------------------------------

/**
 * Persist a new ID entry.
 *
 * Validates that `name`, `idType`, and `idNumber` are non-empty/non-whitespace.
 * Throws a ValidationError (synchronously, before any async work) if validation fails.
 * Re-throws a StorageError if the AsyncStorage write fails.
 *
 * @param {IDEntryInput} entry
 * @returns {Promise<IDEntry>} the saved entry including generated id and timestamps
 * @throws {ValidationError} if required fields are missing or blank
 * @throws {StorageError}    if AsyncStorage write fails
 */
export async function saveEntry(entry) {
  // Throws synchronously if invalid — before any I/O
  _validateEntry(entry);

  const now = Date.now();
  const newEntry = {
    id: generateId(),
    name: entry.name.trim(),
    idType: entry.idType.trim(),
    idNumber: entry.idNumber.trim(),
    expiryDate: entry.expiryDate ?? null,
    photoUri: entry.photoUri ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const existing = await _readRaw();
  existing.push(newEntry);
  await _writeRaw(existing); // throws StorageError on failure

  return newEntry;
}

/**
 * Load all valid ID entries from AsyncStorage.
 *
 * Corrupt or incomplete records are silently skipped (Requirement 7.6).
 * For each entry with a `photoUri`, the file's existence is checked using the
 * class-based expo-file-system v57 API; if absent, `entry.photoMissing = true`
 * is set so the DashboardScreen can render a placeholder (Requirement 7.7).
 *
 * @returns {Promise<IDEntry[]>}
 */
export async function loadEntries() {
  const raw = await _readRaw();
  const validEntries = [];

  for (const item of raw) {
    try {
      // Require all three key fields to be non-empty strings
      if (!_isValidField(item.name) || !_isValidField(item.idType) || !_isValidField(item.idNumber)) {
        // Corrupt / incomplete — skip silently
        continue;
      }
      // id is also required; if it's somehow missing skip the entry
      if (!item.id || typeof item.id !== 'string') {
        continue;
      }

      const entry = {
        id: item.id,
        name: item.name,
        idType: item.idType,
        idNumber: item.idNumber,
        expiryDate: item.expiryDate ?? null,
        photoUri: item.photoUri ?? null,
        createdAt: item.createdAt ?? 0,
        updatedAt: item.updatedAt ?? 0,
      };

      // Check photo file existence using the class-based API (Requirement 7.5, 7.7)
      // Skip on web — expo-file-system File class is not available in browsers
      if (entry.photoUri && Platform.OS !== 'web') {
        try {
          const file = new File(entry.photoUri);
          if (!file.exists) {
            entry.photoMissing = true;
          }
        } catch {
          entry.photoMissing = true;
        }
      }

      validEntries.push(entry);
    } catch {
      // Skip any entry that throws during field access
    }
  }

  return validEntries;
}

/**
 * Update an existing entry by id, preserving the original id and createdAt.
 * Merges `updates` into the found entry and refreshes `updatedAt`.
 *
 * Re-throws a StorageError on AsyncStorage write failure.
 *
 * @param {string} id
 * @param {Partial<IDEntryInput>} updates
 * @returns {Promise<IDEntry>} the updated entry
 * @throws {StorageError} if AsyncStorage write fails
 */
export async function updateEntry(id, updates) {
  const entries = await _readRaw();
  const idx = entries.findIndex((e) => e.id === id);

  if (idx === -1) {
    const err = new Error(`StorageError: entry with id "${id}" not found`);
    err.name = 'StorageError';
    throw err;
  }

  const updated = {
    ...entries[idx],
    ...updates,
    id,                         // always preserve original id
    createdAt: entries[idx].createdAt, // preserve creation timestamp
    updatedAt: Date.now(),
  };

  entries[idx] = updated;
  await _writeRaw(entries); // throws StorageError on failure

  return updated;
}

/**
 * Delete an entry's metadata from AsyncStorage, then best-effort delete
 * the associated photo file (failure is swallowed — logged in __DEV__ only).
 *
 * Throws a StorageError if the AsyncStorage operation fails so the UI can
 * leave the card visible and show an error (Requirement 6.3).
 *
 * @param {string} id
 * @returns {Promise<void>}
 * @throws {StorageError} if AsyncStorage removal fails
 */
export async function deleteEntry(id) {
  const entries = await _readRaw();
  const idx = entries.findIndex((e) => e.id === id);
  const photoUri = idx !== -1 ? entries[idx].photoUri : null;

  const filtered = entries.filter((e) => e.id !== id);

  // Persist the filtered array — throws StorageError on failure
  // (photo deletion must NOT happen until metadata is safely removed)
  await _writeRaw(filtered);

  // Best-effort photo cleanup — errors are intentionally swallowed
  if (photoUri && Platform.OS !== 'web') {
    try {
      const file = new File(photoUri);
      await file.delete();
    } catch (err) {
      if (__DEV__) {
        console.warn('[StorageService] deleteEntry: photo file deletion failed:', err);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public API — Photo file operations
// ---------------------------------------------------------------------------

/**
 * Copy a photo from the image-picker's temporary URI to Paths.document.
 * Uses the class-based expo-file-system v57 API exclusively.
 *
 * Re-throws any error — the caller (AddEditScreen) is responsible for handling
 * copy failures (e.g. saving the entry without a photoUri and showing a notice).
 *
 * @param {string} pickerUri  — the asset URI returned by expo-image-picker
 * @returns {Promise<string>} the permanent Paths.document-based URI
 * @throws {Error} if the copy operation fails
 */
export async function copyPhotoToVault(pickerUri) {
  if (Platform.OS === 'web') {
    // On web, just return the picker URI as-is (no file system access)
    return pickerUri;
  }
  const destDir = new Directory(Paths.document);
  const src = new File(pickerUri);
  await src.copy(destDir); // copies file into Paths.document preserving filename
  const filename = pickerUri.split('/').pop();
  return Paths.document.uri + filename; // permanent URI — note: Paths.document is a Directory instance, use .uri property
}

/**
 * Delete a photo file from Paths.document. Errors are swallowed (best-effort cleanup).
 * Only logs in __DEV__ mode to aid debugging without surfacing errors to the user.
 *
 * @param {string} vaultUri
 * @returns {Promise<void>}
 */
export async function deletePhoto(vaultUri) {
  if (!vaultUri) return;
  if (Platform.OS === 'web') return; // no file system on web
  try {
    const file = new File(vaultUri);
    await file.delete();
  } catch (err) {
    if (__DEV__) {
      console.warn('[StorageService] deletePhoto failed:', err);
    }
  }
}
