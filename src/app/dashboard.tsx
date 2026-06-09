import { useState } from "react";
import { 
  Modal, 
  Pressable, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  useWindowDimensions, 
  View 
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/components/context/auth-context";
import { ButtonCard, Card } from "@/components/ui";
import { dashboardStyles as styles } from "@/styles/dashboardStyles";
import { Clinic } from "@/types/clinic";
import { UserRole } from "@/types/user";

type ButtonRoute =
  | "/patient-records"
  | "/consultations"
  | "/transactions"
  | "/brand-directory"
  | "/generics"
  | "/diseases"
  | "/medical-certificate";

type ButtonItem = {
  label: string;
  route: ButtonRoute;
  icon: string;
  description: string;
  allowedRoles?: UserRole[];
};

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const { user, logout, clinics, activeClinic, selectClinic } = useAuth();
  const [clinicModalVisible, setClinicModalVisible] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleSelectClinic = async (clinic: Clinic) => {
    await selectClinic(clinic);
    setClinicModalVisible(false);
  };

  const getColumns = () => {
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    if (width >= 600) return 3;
    return 2;
  };

  const columns = getColumns();
  const cardWidth = 100 / columns - 2;

  const clinicButtons: ButtonItem[] = [
    { label: "Patient Records", route: "/patient-records", icon: "🩺", description: "View and manage patient information", allowedRoles: ["doctor", "assistant"] },
    { label: "Consultations", route: "/consultations", icon: "📋", description: "Manage prescriptions and medical certificates", allowedRoles: ["doctor"] },
    { label: "Transactions", route: "/transactions", icon: "💳", description: "View previous consultations", allowedRoles: ["doctor", "assistant"] },
    { label: "Medical Certificate", route: "/medical-certificate", icon: "📄", description: "Generate verified medical clearance files", allowedRoles: ["doctor"] },
  ];

  const drugButtons: ButtonItem[] = [
    { label: "Brand Directory", route: "/brand-directory", icon: "💊", description: "View and manage branded medications", allowedRoles: ["doctor", "assistant"] },
    { label: "Generics", route: "/generics", icon: "🧪", description: "View and manage generic medications", allowedRoles: ["doctor", "assistant"] },
    { label: "Diseases", route: "/diseases", icon: "🦠", description: "View and manage disease information", allowedRoles: ["doctor", "assistant"] },
  ];

  const filterByRole = (btn: ButtonItem) => {
    if (!btn.allowedRoles) return true;
    if (!user) return false;
    return btn.allowedRoles.includes(user.role);
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.greeting}>
              Good Day, {user ? (user.role === "doctor" ? `Dr. ${user.first_name}` : user.first_name) : "Staff"}! 👋
            </Text>
            <Text style={styles.title}>{activeClinic?.clinic_name ?? "Select a Clinic"}</Text>
          </View>

          {clinics.length > 1 && (
            <TouchableOpacity style={styles.clinicSwitcherBtn} onPress={() => setClinicModalVisible(true)} activeOpacity={0.8}>
              <Text style={{ fontSize: 22 }}>🏥</Text>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.clinicSwitcherLabel} numberOfLines={1}>{activeClinic?.clinic_name ?? "Select"}</Text>
                <Text style={styles.clinicSwitcherSub}>Tap to switch</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <Card style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to CraveCare EMR</Text>
          <Text style={styles.welcomeText}>Manage patients, consultations, transactions, and drug information in one organized workspace.</Text>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Clinic Management</Text>
          <Text style={styles.sectionSubtitle}>Core operations</Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 18 }}>
          {clinicButtons.filter(filterByRole).map((btn) => (
            <ButtonCard key={btn.route} label={btn.label} route={btn.route} icon={btn.icon} description={btn.description} cardWidth={cardWidth} />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Drug Information</Text>
          <Text style={styles.sectionSubtitle}>Medication references</Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 18 }}>
          {drugButtons.filter(filterByRole).map((btn) => (
            <ButtonCard key={btn.route} label={btn.label} route={btn.route} icon={btn.icon} description={btn.description} cardWidth={cardWidth} />
          ))}
        </View>

        <TouchableOpacity activeOpacity={0.85} style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out Session</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={clinicModalVisible} transparent animationType="slide" onRequestClose={() => setClinicModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setClinicModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Switch Clinic</Text>
            <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>Select your active branch for this session.</Text>

            <View style={{ gap: 10 }}>
              {clinics.map((clinic) => {
                const isSelected = clinic.id === activeClinic?.id;
                return (
                  <TouchableOpacity 
                    key={clinic.id} 
                    style={[styles.modalCard, isSelected && styles.modalCardSelected]} 
                    onPress={() => handleSelectClinic(clinic)}
                  >
                    <View style={[styles.modalCardAccent, isSelected && styles.modalCardAccentSelected]} />
                    <View style={styles.modalCardBody}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalCardName}>{clinic.clinic_name}</Text>
                        {clinic.address && <Text style={styles.modalCardAddress}>{clinic.address}</Text>}
                      </View>
                      <View style={isSelected ? styles.badgeActive : styles.badgeAvailable}>
                        <Text style={isSelected ? styles.badgeActiveText : styles.badgeAvailableText}>
                          {isSelected ? "Active" : "Switch"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.modalDismissBtn} onPress={() => setClinicModalVisible(false)}>
              <Text style={styles.modalDismissBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}