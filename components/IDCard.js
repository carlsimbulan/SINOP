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

export default function IDCard({ entry, isAuthenticated, onEdit, onDelete, onCopy }) {
  // Whether the user has explicitly tapped "reveal" for this card
  const [revealed, setRevealed] = useState(false);

  // Expiry check — only when an expiry date is stored
  const expired = entry.expiryDate ? isExpired(entry.expiryDate) : false;

  // Show unmasked ID only when authenticated AND the reveal toggle is active
  const displayIdNumber =
    isAuthenticated && revealed ? entry.idNumber : maskIdNumber(entry.idNumber);

  // Photo is shown when a URI exists and the file wasn't flagged as missing
  const hasPhoto = entry.photoUri && !entry.photoMissing;

  return (
    <View style={styles.card}>
      {/* ── Top row: photo thumbnail + name / type ── */}
      <View style={styles.topRow}>
        {/* Photo / placeholder area */}
        <View style={styles.photoArea}>
          {hasPhoto ? (
            <Image
              source={{ uri: entry.photoUri }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="id-card-outline" size={32} color="#555" />
          )}
        </View>

        {/* Name and ID type */}
        <View style={styles.nameBlock}>
          <Text style={styles.nameText} numberOfLines={1}>
            {entry.name}
          </Text>
          <Text style={styles.idTypeText} numberOfLines={1}>
            {entry.idType}
          </Text>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── ID Number row ── */}
      <View style={styles.idNumberRow}>
        <View style={styles.idNumberWrapper}>
          <Text style={styles.idNumberLabel}>ID: </Text>
          <Text style={styles.idNumberValue}>{displayIdNumber}</Text>

          {/* Blur overlay when NOT authenticated */}
          {!isAuthenticated && (
            <View style={styles.blurOverlay} />
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
            color={isAuthenticated ? '#AAAAAA' : '#444444'}
          />
        </TouchableOpacity>

        {/* Quick Copy button — Req 4.4, 4.5 */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onCopy(entry.idNumber)}
          accessibilityLabel="Copy ID number"
        >
          <Ionicons name="copy-outline" size={20} color="#AAAAAA" />
        </TouchableOpacity>
      </View>

      {/* ── Expiry date row ── */}
      {entry.expiryDate ? (
        <Text style={[styles.expiryText, expired && styles.expiryExpired]}>
          Expires: {entry.expiryDate}
        </Text>
      ) : (
        <Text style={styles.expiryText}>No expiry date</Text>
      )}

      {/* ── Action buttons: edit + delete ── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onEdit(entry)}
          accessibilityLabel="Edit entry"
        >
          <Ionicons name="create-outline" size={20} color="#AAAAAA" />
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
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A4A',
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
    backgroundColor: '#2A2A4A',
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
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  idTypeText: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 2,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: '#2A2A4A',
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
    color: '#AAAAAA',
    fontSize: 13,
  },
  idNumberValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  /* Semi-transparent grey overlay that "blurs" the ID number when unauthenticated */
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    borderRadius: 4,
  },

  /* Expiry */
  expiryText: {
    color: '#AAAAAA',
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
