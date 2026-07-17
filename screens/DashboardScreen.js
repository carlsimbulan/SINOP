/**
 * DashboardScreen — lists all stored ID cards in a themed wallet UI.
 *
 * Responsibilities:
 *   - Loads entries from StorageService on mount and on every navigation focus event
 *   - Manages isAuthenticated state (true after navigating from LockScreen)
 *   - Renders the IDCard list or empty-state message
 *   - Hosts the FAB for navigating to AddEditScreen in "add" mode
 *   - Hosts Quick Copy logic (Task 8.3): copies raw ID number via expo-clipboard
 *   - Shows hamburger button that opens the app drawer
 *
 * Requirements: 2.1, 2.2, 2.3, 2.7, 3.1, 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 9.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { loadEntries, deleteEntry } from '../services/StorageService';
import IDCard from '../components/IDCard';
import { useTheme } from '../context/ThemeContext';

export default function DashboardScreen({ navigation, openDrawer }) {
  const { colors } = useTheme();

  // Full list of IDEntry objects loaded from AsyncStorage
  const [entries, setEntries] = useState([]);

  // True once the user has successfully passed LockScreen for this session.
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Toast feedback for Quick Copy
  const [toastMessage, setToastMessage] = useState(null);
  const [toastIsError, setToastIsError] = useState(false);

  // ── Load entries ──────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    try {
      const loaded = await loadEntries();
      setEntries(loaded);
    } catch {
      // loadEntries is designed never to throw; guard anyway
    }
  }, []);

  // Load on mount
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Reload every time this screen comes back into focus (e.g. after AddEdit)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchEntries();
    });
    return unsubscribe;
  }, [navigation, fetchEntries]);

  // ── Task 8.3 — Quick Copy ─────────────────────────────────────────────────

  /**
   * Copy the raw (unmasked) ID number to the system clipboard.
   * Shows a toast for 3 seconds confirming success or failure.
   */
  const handleCopy = useCallback(async (idNumber) => {
    try {
      await Clipboard.setStringAsync(idNumber);
      setToastMessage('Copied!');
      setToastIsError(false);
    } catch {
      setToastMessage('Could not copy. Please try again.');
      setToastIsError(true);
    }
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = useCallback((id) => {
    Alert.alert(
      'Delete ID?',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(id);
              setEntries((prev) => prev.filter((e) => e.id !== id));
            } catch {
              Alert.alert('Error', 'Could not delete. Please try again.');
            }
          },
        },
      ]
    );
  }, []);

  // ── Edit ──────────────────────────────────────────────────────────────────

  const handleEdit = useCallback(
    (entry) => {
      navigation.navigate('AddEdit', { mode: 'edit', entry });
    },
    [navigation]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        {/* Hamburger / drawer toggle */}
        <TouchableOpacity
          onPress={openDrawer}
          style={styles.headerBtn}
          accessibilityLabel="Buksan ang menu"
          accessibilityRole="button"
        >
          <Ionicons name="menu-outline" size={26} color={colors.iconColor} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>SINOP Vault</Text>

        {/* Right spacer to keep title centred */}
        <View style={styles.headerBtn} />
      </View>

      {/* Content: empty state or card list */}
      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="albums-outline" size={48} color={colors.textSecondary} style={styles.emptyIcon} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No IDs saved yet. Tap the button below to add one.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <IDCard
              entry={item}
              isAuthenticated={isAuthenticated}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCopy={handleCopy}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Toast — absolute, above FAB */}
      {toastMessage !== null && (
        <View
          style={[
            styles.toast,
            { backgroundColor: toastIsError ? '#B00020' : '#4CAF50' },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('AddEdit', { mode: 'add' })}
        accessibilityLabel="Mag-sinop ng Bagong ID"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={32} color="#0D0D0D" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  /* Empty state */
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },

  /* Card list */
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  /* Toast */
  toast: {
    position: 'absolute',
    bottom: 104,
    left: 24,
    right: 24,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
