/**
 * AddEditScreen — create or edit a single ID entry.
 *
 * Tasks 9.1 (form + validation) and 9.2 (photo picker) combined.
 *
 * Requirements: 3.2–3.12, 5.1–5.5, 8.5, 8.6
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  saveEntry,
  updateEntry,
  copyPhotoToVault,
  deletePhoto,
} from '../services/StorageService';

export default function AddEditScreen({ navigation, route }) {
  const isEdit = route.params?.mode === 'edit';
  const existingEntry = route.params?.entry ?? null;

  // ── Form state ──────────────────────────────────────────────────────────
  const [name, setName] = useState(isEdit ? existingEntry.name : '');
  const [idType, setIdType] = useState(isEdit ? existingEntry.idType : '');
  const [idNumber, setIdNumber] = useState(isEdit ? existingEntry.idNumber : '');
  const [expiryDate, setExpiryDate] = useState(
    isEdit ? (existingEntry.expiryDate ?? '') : ''
  );
  const [photoUri, setPhotoUri] = useState(isEdit ? existingEntry.photoUri : null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  // ── Validation ─────────────────────────────────────────────────────────

  function validate() {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Kailangan ang Pangalan.';
    if (!idType.trim()) newErrors.idType = 'Kailangan ang Uri ng ID.';
    if (!idNumber.trim()) newErrors.idNumber = 'Kailangan ang Numero ng ID.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Save ───────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        idType: idType.trim(),
        idNumber: idNumber.trim(),
        expiryDate: expiryDate.trim() || null,
        photoUri,
      };
      if (isEdit) {
        await updateEntry(existingEntry.id, payload);
      } else {
        await saveEntry(payload);
      }
      navigation.navigate('Dashboard');
    } catch {
      Alert.alert('Error', 'Hindi na-save. Subukan ulit.');
    } finally {
      setSaving(false);
    }
  }

  // ── Photo picker ───────────────────────────────────────────────────────

  async function handlePickPhoto(source) {
    try {
      let permResult;
      if (source === 'camera') {
        permResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permResult.granted) {
        setPhotoError(
          source === 'camera'
            ? 'Kailangan ang pahintulot sa camera.'
            : 'Kailangan ang pahintulot sa photo library.'
        );
        return;
      }
      setPhotoError(null);

      // SDK 57: mediaTypes must be string array ['images'], NOT MediaTypeOptions enum
      const pickerResult =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: false,
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: false,
              quality: 0.8,
            });

      if (pickerResult.canceled) return;

      const pickerUri = pickerResult.assets[0].uri;
      try {
        const oldUri = photoUri;
        const permanentUri = await copyPhotoToVault(pickerUri);
        setPhotoUri(permanentUri);
        if (oldUri) {
          // best-effort cleanup; deletePhoto swallows errors internally
          await deletePhoto(oldUri);
        }
      } catch {
        setPhotoError(
          'Hindi na-save ang larawan. Maaaring mag-save nang walang larawan.'
        );
      }
    } catch {
      setPhotoError('May error sa pagkuha ng larawan.');
    }
  }

  async function handleRemovePhoto() {
    if (photoUri) {
      await deletePhoto(photoUri); // swallows errors
      setPhotoUri(null);
    }
  }

  function handleOpenSettings() {
    Linking.openSettings();
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Bumalik"
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? 'I-edit ang ID' : 'Bagong ID'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <Text style={styles.label}>Pangalan *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={name}
          onChangeText={setName}
          placeholder="Hal. Juan dela Cruz"
          placeholderTextColor="#555"
          autoCapitalize="words"
        />
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

        {/* ID Type */}
        <Text style={styles.label}>Uri ng ID *</Text>
        <TextInput
          style={[styles.input, errors.idType && styles.inputError]}
          value={idType}
          onChangeText={setIdType}
          placeholder="Hal. PhilSys ID, Driver's License"
          placeholderTextColor="#555"
          autoCapitalize="words"
        />
        {errors.idType ? (
          <Text style={styles.errorText}>{errors.idType}</Text>
        ) : null}

        {/* ID Number */}
        <Text style={styles.label}>Numero ng ID *</Text>
        <TextInput
          style={[styles.input, errors.idNumber && styles.inputError]}
          value={idNumber}
          onChangeText={setIdNumber}
          placeholder="Hal. 1234-5678-9012"
          placeholderTextColor="#555"
          autoCapitalize="characters"
        />
        {errors.idNumber ? (
          <Text style={styles.errorText}>{errors.idNumber}</Text>
        ) : null}

        {/* Expiry Date */}
        <Text style={styles.label}>Petsa ng Expiry (opsyonal)</Text>
        <TextInput
          style={styles.input}
          value={expiryDate}
          onChangeText={setExpiryDate}
          placeholder="YYYY-MM-DD  hal. 2030-12-31"
          placeholderTextColor="#555"
          keyboardType="numbers-and-punctuation"
        />

        {/* Photo section */}
        <Text style={styles.label}>Larawan ng ID (opsyonal)</Text>

        {photoUri ? (
          <View style={styles.photoPreviewContainer}>
            <Image
              source={{ uri: photoUri }}
              style={styles.photoPreview}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={handleRemovePhoto}
            >
              <Ionicons name="trash-outline" size={18} color="#FF4444" />
              <Text style={styles.removePhotoText}>Alisin</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoPickerRow}>
            <TouchableOpacity
              style={styles.photoPickerButton}
              onPress={() => handlePickPhoto('camera')}
            >
              <Ionicons name="camera-outline" size={20} color="#F5A623" />
              <Text style={styles.photoPickerText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoPickerButton}
              onPress={() => handlePickPhoto('library')}
            >
              <Ionicons name="images-outline" size={20} color="#F5A623" />
              <Text style={styles.photoPickerText}>Library</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Photo permission error */}
        {photoError ? (
          <View style={styles.photoErrorContainer}>
            <Text style={styles.photoErrorText}>{photoError}</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleOpenSettings}
            >
              <Text style={styles.settingsButtonText}>Buksan ang Settings</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityLabel="I-Save"
          accessibilityRole="button"
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Nag-se-save...' : 'I-Save'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A4A',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },

  /* Form */
  label: {
    color: '#AAAAAA',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1A1A2E',
    color: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A4A',
    padding: 12,
    fontSize: 15,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
  },

  /* Photo section */
  photoPickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoPickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A4A',
    paddingVertical: 12,
  },
  photoPickerText: {
    color: '#F5A623',
    fontSize: 14,
    fontWeight: '600',
  },
  photoPreviewContainer: {
    alignItems: 'flex-start',
    gap: 8,
  },
  photoPreview: {
    width: '100%',
    height: 160,
    borderRadius: 8,
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removePhotoText: {
    color: '#FF4444',
    fontSize: 14,
  },

  /* Photo error */
  photoErrorContainer: {
    marginTop: 8,
  },
  photoErrorText: {
    color: '#FF4444',
    fontSize: 13,
    marginBottom: 8,
  },
  settingsButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A2E',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F5A623',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  settingsButtonText: {
    color: '#F5A623',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Save button */
  saveButton: {
    marginTop: 32,
    backgroundColor: '#F5A623',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#0D0D0D',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
