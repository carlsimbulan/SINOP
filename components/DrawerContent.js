/**
 * DrawerContent — sidebar with Home, About, and dark/light toggle.
 */

import { View, Text, StyleSheet, TouchableOpacity, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function DrawerContent({ navigation }) {
  const { isDark, colors, toggleTheme } = useTheme();

  function goHome() {
    navigation.navigate('MainStack', { screen: 'Dashboard' });
    navigation.closeDrawer();
  }

  function goToAbout() {
    navigation.navigate('MainStack', { screen: 'About' });
    navigation.closeDrawer();
  }

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.drawerBackground }]}
      edges={['top', 'bottom', 'left']}
    >
      {/* Branding — icon only */}
      <View style={[styles.brand, { borderBottomColor: colors.border }]}>
        <Image
          source={require('../assets/icon.png')}
          style={styles.appIcon}
          resizeMode="contain"
        />
      </View>

      {/* Menu items */}
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

      {/* Footer */}
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
  brand: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  brandTagline: {
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.5,
  },
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
  footer: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12,
  },
});
