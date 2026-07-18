/**
 * DrawerContent — sidebar with editable welcome header, Home, About,
 * and dark/light toggle.
 */

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { loadUsername, saveUsername } from '../services/StorageService';

export default function DrawerContent({ navigation }) {
  const { isDark, colors, toggleTheme } = useTheme();

  const [username, setUsername] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  // Load stored name on mount
  useEffect(() => {
    loadUsername().then((stored) => {
      if (stored) setUsername(stored);
    });
  }, []);

  // Auto-focus the input when edit mode is activated
  useEffect(() => {
    if (editing) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editing]);

  function startEditing() {
    setDraft(username);
    setEditing(true);
  }

  async function confirmEdit() {
    const trimmed = draft.trim();
    const newName = trimmed || username; // keep old name if user clears it
    setUsername(newName);
    await saveUsername(newName);
    setEditing(false);
    Keyboard.dismiss();
  }

  function cancelEdit() {
    setEditing(false);
    Keyboard.dismiss();
  }

  function goHome() {
    navigation.navigate('MainStack', { screen: 'Dashboard' });
    navigation.closeDrawer();
  }

  function goToAbout() {
    navigation.navigate('MainStack', { screen: 'About' });
    navigation.closeDrawer();
  }

  const displayName = username || 'User';

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.drawerBackground }]}
      edges={['top', 'bottom', 'left']}
    >
      {/* ── Welcome header ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              ref={inputRef}
              style={[
                styles.nameInput,
                {
                  color: colors.text,
                  borderColor: colors.accent,
                  backgroundColor: colors.surfaceVariant,
                },
              ]}
              value={draft}
              onChangeText={setDraft}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={confirmEdit}
            />
            <TouchableOpacity
              onPress={confirmEdit}
              style={styles.editActionBtn}
              accessibilityLabel="Save name"
              accessibilityRole="button"
            >
              <Ionicons name="checkmark" size={22} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={cancelEdit}
              style={styles.editActionBtn}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.welcomeRow}>
            <View style={styles.welcomeTextBlock}>
              <Text style={[styles.welcomeLabel, { color: colors.textSecondary }]}>
                Welcome,
              </Text>
              <Text
                style={[styles.welcomeName, { color: colors.text }]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={startEditing}
              style={styles.editIconBtn}
              accessibilityLabel="Edit name"
              accessibilityRole="button"
            >
              <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Menu items ── */}
      <View style={styles.menu}>

        {/* Home */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={goHome}
          accessibilityRole="button"
          accessibilityLabel="Home"
        >
          <Ionicons name="home-outline" size={22} color={colors.accent} />
          <Text style={[styles.menuLabel, { color: colors.text }]}>Home</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* About */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={goToAbout}
          accessibilityRole="button"
          accessibilityLabel="About"
        >
          <Ionicons name="information-circle-outline" size={22} color={colors.accent} />
          <Text style={[styles.menuLabel, { color: colors.text }]}>About</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Dark / Light mode toggle */}
        <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={22}
            color={colors.accent}
          />
          <Text style={[styles.menuLabel, { color: colors.text }]}>
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#CCCCCC', true: colors.accent }}
            thumbColor="#FFFFFF"
            accessibilityLabel="I-toggle ang dark mode"
            accessibilityRole="switch"
          />
        </View>

      </View>

      {/* ── Footer ── */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          SINOP Vault v1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  /* Welcome header */
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeTextBlock: {
    flex: 1,
  },
  welcomeLabel: {
    fontSize: 12,
    letterSpacing: 0.4,
  },
  welcomeName: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  editIconBtn: {
    padding: 6,
    marginLeft: 8,
  },

  /* Edit mode */
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
  },
  editActionBtn: {
    padding: 6,
  },

  /* Menu */
  menu: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12,
  },
});
