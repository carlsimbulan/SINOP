/**
 * AddEditScreen — create or edit a single ID entry.
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
import { useTheme } from '../context/ThemeContext';

export default function AddEditScreen({ navigation, route }) {
  const { colors } = useTheme();
  const isEdit = route.params?.mode === 'edit';
  const existingEntry = route.params?.entry ?? null;

  const [name, setName] = useState(isEdit ? existingEntry.name : '');
  const [idType, setIdType] = useState(isEdit ? existingEntry.idType : '');
  const [idNumber, setIdNumber] = useState(isEdit ? existingEntry.idNumber : '');
  const [expiryDate, setExpiryDate] = useState(isEdit ? (existingEntry.expiryDate ?? '') : '');
  const [photoUri, setPhotoUri] = useState(isEdit ? existingEntry.photoUri : null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  function validate() {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required.';
    if (!idType.trim()) newErrors.idType = 'ID Type is required.';
    if (!idNumber.trim()) newErrors.idNumber = 'ID Number is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

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
      Alert.alert('Error', 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

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
            ? 'Camera permission is required.'
            : 'Photo library permission is required.'
        );
        return;
      }
      setPhotoError(null);

      const pickerResult =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.8 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.8 });

      if (pickerResult.canceled) return;

      const pickerUri = pickerResult.assets[0].uri;
      try {
        const oldUri = photoUri;
        const permanentUri = await copyPhotoToVault(pickerUri);
        setPhotoUri(permanentUri);
        if (oldUri) await deletePhoto(oldUri);
      } catch {
        setPhotoError('Could not save the photo. You can save without a photo.');
      }
    } catch {
      setPhotoError('An error occurred while picking a photo.');
    }
  }

  async function handleRemovePhoto() {
    if (photoUri) {
      await deletePhoto(photoUri);
      setPhotoUri(null);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEdit ? 'Edit ID' : 'New ID'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Name */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: errors.name ? '#FF4444' : colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Juan dela Cruz"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="words"
        />
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

        {/* ID Type */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>ID Type *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: errors.idType ? '#FF4444' : colors.border }]}
          value={idType}
          onChangeText={setIdType}
          placeholder="e.g. PhilSys ID, Driver's License"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="words"
        />
        {errors.idType ? <Text style={styles.errorText}>{errors.idType}</Text> : null}

        {/* ID Number */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>ID Number *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: errors.idNumber ? '#FF4444' : colors.border }]}
          value={idNumber}
          onChangeText={setIdNumber}
          placeholder="e.g. 1234-5678-9012"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="characters"
        />
        {errors.idNumber ? <Text style={styles.errorText}>{errors.idNumber}</Text> : null}

        {/* Expiry Date */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Expiry Date (optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
          value={expiryDate}
          onChangeText={setExpiryDate}
          placeholder="YYYY-MM-DD  e.g. 2030-12-31"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numbers-and-punctuation"
        />

        {/* Photo */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>ID Photo (optional)</Text>

        {photoUri ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
            <TouchableOpacity style={styles.removePhotoButton} onPress={handleRemovePhoto}>
              <Ionicons name="trash-outline" size={18} color="#FF4444" />
              <Text style={styles.removePhotoText}>Remove Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoPickerRow}>
            <TouchableOpacity
              style={[styles.photoPickerButton, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
              onPress={() => handlePickPhoto('camera')}
            >
              <Ionicons name="camera-outline" size={20} color={colors.accent} />
              <Text style={[styles.photoPickerText, { color: colors.accent }]}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoPickerButton, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
              onPress={() => handlePickPhoto('library')}
            >
              <Ionicons name="images-outline" size={20} color={colors.accent} />
              <Text style={[styles.photoPickerText, { color: colors.accent }]}>Photo Library</Text>
            </TouchableOpacity>
          </View>
        )}

        {photoError ? (
          <View style={styles.photoErrorContainer}>
            <Text style={styles.photoErrorText}>{photoError}</Text>
            <TouchableOpacity
              style={[styles.settingsButton, { borderColor: colors.accent }]}
              onPress={() => Linking.openSettings()}
            >
              <Text style={[styles.settingsButtonText, { color: colors.accent }]}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.accent }, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  headerSpacer: { width: 32 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  label: { fontSize: 13, marginBottom: 6, marginTop: 16 },
  input: { borderRadius: 8, borderWidth: 1, padding: 12, fontSize: 15 },
  errorText: { color: '#FF4444', fontSize: 12, marginTop: 4 },
  photoPickerRow: { flexDirection: 'row', gap: 12 },
  photoPickerButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 8, borderWidth: 1, paddingVertical: 12,
  },
  photoPickerText: { fontSize: 14, fontWeight: '600' },
  photoPreviewContainer: { alignItems: 'flex-start', gap: 8 },
  photoPreview: { width: '100%', height: 160, borderRadius: 8 },
  removePhotoButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  removePhotoText: { color: '#FF4444', fontSize: 14 },
  photoErrorContainer: { marginTop: 8 },
  photoErrorText: { color: '#FF4444', fontSize: 13, marginBottom: 8 },
  settingsButton: {
    alignSelf: 'flex-start', borderRadius: 6, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  settingsButtonText: { fontSize: 13, fontWeight: '600' },
  saveButton: { marginTop: 32, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#0D0D0D', fontSize: 16, fontWeight: 'bold' },
});
