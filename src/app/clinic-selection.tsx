import { Clinic } from '@/types/clinic';
import { Stack, useRouter } from 'expo-router';
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/components/context/auth-context';

export default function ClinicSelectionScreen() {
  const router = useRouter();
  const { clinics, selectClinic, user } = useAuth();

  const handleSelectClinic = async (clinic: Clinic) => {
  await selectClinic(clinic);
  // Both doctor and assistant land on dashboard
  // (dashboard already filters buttons by role)
  router.replace("/dashboard");
};

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#095c29" />

        {/* Green banner with logo */}
        <View style={styles.headerBanner}>
          <Image
            source={require('@/assets/images/CraveCare-Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* White curved sheet */}
        <View style={styles.formSheet}>
          <Text style={styles.promptHeadline}>Select a Clinic</Text>
          <Text style={styles.subTitle}>Choose your assigned clinic branch to proceed.</Text>

          <View style={styles.clinicList}>
            {clinics.map((clinic) => (
              <TouchableOpacity
                key={clinic.id}
                style={styles.card}
                onPress={() => handleSelectClinic(clinic)}
                activeOpacity={0.75}
              >
                <View style={styles.cardAccentBar} />

                <View style={styles.cardBody}>
                  <View style={styles.cardTextGroup}>
                    <Text style={styles.cardNameText}>{clinic.clinic_name}</Text>
                    {clinic.address && (
                      <Text style={styles.cardAddress}>{clinic.address}</Text>
                    )}
                  </View>

                  <View style={styles.statusBadgeActive}>
                    <Text style={styles.statusBadgeActiveText}>Available</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.footerNote}>
            Only active branches are accessible. Contact your administrator to enable additional branches.
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#095c29",
  },
  headerBanner: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 10,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  formSheet: {
    flex: 3,
    backgroundColor: "#f5f7fb",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  promptHeadline: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 24,
    lineHeight: 20,
  },
  clinicList: {
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardAccentBar: {
    width: 5,
    backgroundColor: "#095c29",
  },
  cardBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  cardTextGroup: {
    flex: 1,
    gap: 4,
  },
  cardNameText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardAddress: {
    fontSize: 13,
    color: "#64748b",
  },
  statusBadgeActive: {
    backgroundColor: "#dcfce7",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusBadgeActiveText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#095c29",
  },
  footerNote: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});