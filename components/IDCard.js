/**
 * IDCard — wallet-card style component for a single ID_Entry.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { maskIdNumber, isExpired } from '../utils/idUtils';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function IDCard({ entry, isAuthenticated, onEdit, onDelete, onCopy }) {
  const { colors, isDark } = useTheme();
  const [revealed, setRevealed] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  const expired = entry.expiryDate ? isExpired(entry.expiryDate) : false;
  const displayIdNumber =
    isAuthenticated && revealed ? entry.idNumber : maskIdNumber(entry.idNumber);
  const hasPhoto = entry.photoUri && !entry.photoMissing;

  const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const cardBorder = isDark ? '#2A2A4A' : '#E0E0E0';
  const photoBg = isDark ? '#2A2A4A' : '#F0F0F0';
  const dividerColor = isDark ? '#2A2A4A' : '#EEEEEE';
  const blurOverlayColor = isDark ? 'rgba(20,20,30,0.88)' : 'rgba(240,240,240,0.88)';
  const iconSecondary = isDark ? '#AAAAAA' : '#888888';

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>

      {/* ── Top row: photo thumbnail + name / type ── */}
      <View style={styles.topRow}>
        <View style={[styles.photoArea, { backgroundColor: photoBg }]}>
          {hasPhoto ? (
            <Image source={{ uri: entry.photoUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <Ionicons name="id-card-outline" size={32} color={iconSecondary} />
          )}
        </View>
        <View style={styles.nameBlock}>
          <Text style={[styles.nameText, { color: colors.text }]} numberOfLines={1}>
            {entry.name}
          </Text>
          <Text style={[styles.idTypeText, { color: colors.textSecondary }]} numberOfLines={1}>
            {entry.idType}
          </Text>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />

      {/* ── ID Number row ── */}
      <View style={styles.idNumberRow}>
        <View style={styles.idNumberWrapper}>
          <Text style={[styles.idNumberLabel, { color: colors.textSecondary }]}>ID: </Text>
          <Text style={[styles.idNumberValue, { color: colors.text }]}>{displayIdNumber}</Text>
          {!isAuthenticated && (
            <View style={[styles.blurOverlay, { backgroundColor: blurOverlayColor }]} />
          )}
        </View>

        {/* Reveal toggle */}
        <TouchableOpacity
          style={[styles.iconButton, !isAuthenticated && styles.iconButtonDisabled]}
          onPress={() => isAuthenticated && setRevealed((prev) => !prev)}
          disabled={!isAuthenticated}
          accessibilityLabel={revealed ? 'Hide ID number' : 'Reveal ID number'}
        >
          <Ionicons
            name={revealed ? 'eye-off' : 'eye'}
            size={20}
            color={isAuthenticated ? iconSecondary : '#444444'}
          />
        </TouchableOpacity>

        {/* Quick Copy */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onCopy(entry.idNumber)}
          accessibilityLabel="Copy ID number"
        >
          <Ionicons name="copy-outline" size={20} color={iconSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Expiry ── */}
      <Text
        style={[
          styles.expiryText,
          { color: expired ? colors.danger : colors.textSecondary },
        ]}
      >
        {entry.expiryDate
          ? `Expires: ${entry.expiryDate}${expired ? '  ⚠ Expired' : ''}`
          : 'No expiry date'}
      </Text>

      {/* ── View Full Photo button ── */}
      {hasPhoto && (
        <TouchableOpacity
          style={[styles.viewPhotoButton, { borderColor: colors.accent }]}
          onPress={() => setPhotoModalVisible(true)}
          accessibilityLabel="View full photo"
        >
          <Ionicons name="image-outline" size={16} color={colors.accent} />
          <Text style={[styles.viewPhotoText, { color: colors.accent }]}>View Full Photo</Text>
        </TouchableOpacity>
      )}

      {/* ── Actions: edit + delete ── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onEdit(entry)}
          accessibilityLabel="Edit entry"
        >
          <Ionicons name="create-outline" size={20} color={iconSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onDelete(entry.id)}
          accessibilityLabel="Delete entry"
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {/* ── Full Photo Modal ── */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <StatusBar hidden />
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setPhotoModalVisible(false)}
            accessibilityLabel="Close photo"
          >
            <Ionicons name="close-circle" size={36} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={{ uri: entry.photoUri }}
            style={styles.fullPhoto}
            resizeMode="contain"
          />
          <Text style={styles.modalCaption}>{entry.name} — {entry.idType}</Text>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoArea: {
    width: 60,
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  photo: {
    width: 60,
    height: 40,
    borderRadius: 4,
  },
  nameBlock: { flex: 1 },
  nameText: { fontSize: 15, fontWeight: '600' },
  idTypeText: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginBottom: 10 },
  idNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  idNumberWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  idNumberLabel: { fontSize: 13 },
  idNumberValue: { fontSize: 13, fontFamily: 'monospace', letterSpacing: 1 },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
  },
  expiryText: { fontSize: 12, marginBottom: 10 },

  /* View Full Photo button */
  viewPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  viewPhotoText: { fontSize: 13, fontWeight: '600' },

  /* Actions */
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  iconButton: { padding: 6, marginLeft: 4 },
  iconButtonDisabled: { opacity: 0.4 },

  /* Full photo modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
  },
  fullPhoto: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  modalCaption: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
