/**
 * AboutScreen — full page describing the SINOP Vault app.
 */

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function AboutScreen({ navigation }) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Bumalik"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={26} color={colors.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>About</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Description */}
        <View style={[styles.card, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>What is SINOP?</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            SINOP Vault is a personal document and ID management app built for
            privacy-conscious individuals. It lets you securely store all your
            important identification cards — PhilSys ID, Driver's License,
            Passport, SSS, GSIS, TIN, and more — in one safe place on your device.
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            This system was built with an offline-first approach, meaning all
            your data stays entirely on your device. No internet connection is
            required, no accounts needed, and no data is ever uploaded to any
            server or cloud storage.
          </Text>
        </View>

        {/* Features */}
        <View style={[styles.card, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Features</Text>
          <FeatureRow icon="lock-closed-outline" text="Fully offline — your data never leaves your device" colors={colors} />
          <FeatureRow icon="id-card-outline" text="Store ID details: name, type, number, and expiry date" colors={colors} />
          <FeatureRow icon="camera-outline" text="Attach a photo of your physical ID card" colors={colors} />
          <FeatureRow icon="copy-outline" text="Quick Copy — copy your ID number to clipboard instantly" colors={colors} />
          <FeatureRow icon="eye-off-outline" text="Masked ID numbers — only the last 4 digits are shown by default" colors={colors} />
          <FeatureRow icon="warning-outline" text="Expiry warnings — expired IDs are highlighted automatically" colors={colors} />
          <FeatureRow icon="moon-outline" text="Dark and Light mode support" colors={colors} />
        </View>

        {/* Privacy */}
        <View style={[styles.card, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy & Security</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            SINOP Vault does not collect, transmit, or share any of your
            personal information. There are no analytics, no crash reporters,
            no third-party SDKs that phone home. What you put in the app
            stays in the app — period.
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            All data is stored locally using the device's secure storage.
            ID photos are saved in the app's private document directory
            and are not accessible to other apps.
          </Text>
        </View>

        {/* Creator */}
        <View style={[styles.card, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Creator</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Built by Carl Ivan Ken Simbulan.
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Built with React Native and Expo SDK 57.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureRow({ icon, text, colors }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name={icon} size={18} color={colors.accent} style={styles.featureIcon} />
      <Text style={[styles.featureText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 2,
  },
  featureIcon: {
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
