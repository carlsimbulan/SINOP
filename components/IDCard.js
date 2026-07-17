/**
 * IDCard — wallet-card style component for a single ID_Entry.
 *
 * Props:
 *   entry           {IDEntry}   — the stored ID entry
 *   isAuthenticated {boolean}   — whether the session is currently authenticated
 *   onEdit          {Function}  — called with (entry) when the edit button is tapped
 *   onDelete        {Function}  — called with (entry.id) when the delete button is tapped
 *   onCopy          {Function}  — called with (entry.idNumber) when the copy button is tapped
 *
 * Requirements: 2.4, 2.5, 2.6, 4.1, 4.2, 4.4, 4.5, 9.6
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { maskIdNumber, isExpired } from '../utils/idUtils';
import { useTheme } from '../context/ThemeContext';

export default function IDCard({ entry, isAuthenticated, onEdit, onDelete, onCopy }) {
  const { colors, isDark } = useTheme();

  // Whether the user has explicitly tapped "reveal" for this card
  const [revealed, setRevealed] = useState(false);

  // Expiry check — only when an expiry date is stored
  const expired = entry.expiryDate ? isExpired(entry.expiryDate) : false;

  // Show unmasked ID only when authenticated AND the reveal toggle is active
  const displayIdNumber =
    isAuthenticated && revealed ? entry.idNumber : maskIdNumber(entry.idNumber);

  // Photo is shown when a URI exists and the file wasn't flagged as missing
  const hasPhoto = entry.photoUri && !entry.photoMissing;

  // Derived card colors based on theme
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
        {/* Photo / placeholder area */}
        <View style={[styles.photoArea, { backgroundColor: photoBg }]}>
          {hasPhoto ? (
            <Image
              source={{ uri: entry.photoUri }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="id-card-outline" size={32} color={iconSecondary} />
          )}
        </View>

        {/* Name and ID type */}
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

          {/* Blur overlay when NOT authenticated */}
          {!isAuthenticated && (
            <View style={[styles.blurOverlay, { backgroundColor: blurOverlayColor }]} />
          )}
        </View>

        {/* Reveal/hide toggle — functional only when authenticated */}
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

        {/* Quick Copy button — Req 4.4, 4.5 */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onCopy(entry.idNumber)}
          accessibilityLabel="Copy ID number"
        >
          <Ionicons name="copy-outline" size={20} color={iconSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Expiry date row ── */}
      {entry.expiryDate ? (
        <Text style={[styles.expiryText, { color: colors.textSecondary }, expired && styles.expiryExpired]}>
          Expires: {entry.expiryDate}
        </Text>
      ) : (
        <Text style={[styles.expiryText, { color: colors.textSecondary }]}>No expiry date</Text>
      )}

      {/* ── Action buttons: edit + delete ── */}
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
          <Ionicons name="trash-outline" size={20} color="#FF4444" />
        </TouchableOpacity>
      </View>
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

  /* Top row */
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
  nameBlock: {
    flex: 1,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '600',
  },
  idTypeText: {
    fontSize: 12,
    marginTop: 2,
  },

  /* Divider */
  divider: {
    height: 1,
    marginBottom: 10,
  },

  /* ID Number row */
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
  idNumberLabel: {
    fontSize: 13,
  },
  idNumberValue: {
    fontSize: 13,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  /* Semi-transparent overlay that "blurs" the ID number when unauthenticated */
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
  },

  /* Expiry */
  expiryText: {
    fontSize: 12,
    marginBottom: 10,
  },
  expiryExpired: {
    color: '#FF4444',
  },

  /* Actions */
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 6,
    marginLeft: 4,
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
});
