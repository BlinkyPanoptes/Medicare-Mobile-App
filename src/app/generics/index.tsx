import apiClient from "@/api/client";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Generic = {
  id: number;
  generic_name: string;
};

export default function GenericsScreen() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingGeneric, setEditingGeneric] = useState<Generic | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [genericName, setGenericName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [generics, setGenerics] = useState<Generic[]>([]);
  const [loading, setLoading] = useState(true);

  // — Load all generics on mount —
  useEffect(() => {
    loadGenerics();
  }, []);

  const loadGenerics = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/generics");
      setGenerics(res.data.data ?? res.data);
    } catch {
      Alert.alert("Error", "Could not load generics.");
    } finally {
      setLoading(false);
    }
  };

  const filteredGenerics = useMemo(
    () =>
      generics.filter((g) =>
        g.generic_name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      ),
    [generics, searchQuery],
  );

  const openCreateForm = () => {
    setGenericName("");
    setEditingGeneric(null);
    setIsCreating(true);
  };

  const openEditForm = (generic: Generic) => {
    setGenericName(generic.generic_name);
    setEditingGeneric(generic);
    setIsCreating(true);
  };

  const handleSaveSubmit = async () => {
    if (!genericName.trim()) {
      Alert.alert("Missing Fields", "Please enter a generic name.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingGeneric) {
        // UPDATE
        await apiClient.put(`/generics/${editingGeneric.id}`, {
          generic_name: genericName,
        });
        Alert.alert("Success", `${genericName} has been updated.`, [
          { text: "OK", onPress: () => { setIsCreating(false); loadGenerics(); } },
        ]);
      } else {
        // CREATE
        await apiClient.post("/generics", { generic_name: genericName });
        Alert.alert("Generic Added", `${genericName} has been saved.`, [
          { text: "OK", onPress: () => { setIsCreating(false); loadGenerics(); } },
        ]);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Could not save generic.";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (generic: Generic) => {
    Alert.alert(
      "Delete Generic",
      `Are you sure you want to remove ${generic.generic_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/generics/${generic.id}`);
              loadGenerics();
            } catch {
              Alert.alert("Error", "Could not delete generic.");
            }
          },
        },
      ],
    );
  };

  // ── VIEW 1: Generics List ───────────────────────────────────────────────────
  if (!isCreating) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scroller} contentContainerStyle={styles.content}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.promptHeadline}>Generics</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openCreateForm}>
              <Text style={styles.addBtnText}>+ Add Generic</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search generic name..."
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtnClick}>
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#095c29" style={{ marginTop: 40 }} />
          ) : filteredGenerics.length === 0 && generics.length === 0 ? (
            <Text style={styles.emptyText}>No generics found. Click add to begin.</Text>
          ) : filteredGenerics.length === 0 ? (
            <Text style={styles.emptyText}>No generics match "{searchQuery}".</Text>
          ) : (
            filteredGenerics.map((generic) => (
              <View key={generic.id} style={styles.card}>
                <View style={styles.cardInfoGroup}>
                  <Text style={styles.cardNameText}>{generic.generic_name}</Text>
                </View>
                <View style={styles.cardActionsGroup}>
                  <TouchableOpacity style={styles.editButton} onPress={() => openEditForm(generic)}>
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(generic)}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // ── VIEW 2: Create / Edit Form ──────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroller} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.promptHeadline}>
          {editingGeneric ? "Edit Generic" : "Add a New Generic"}
        </Text>

        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Generic Name</Text>
          <View style={styles.inputContainerRow}>
            <TextInput
              style={styles.fieldInput}
              value={genericName}
              onChangeText={setGenericName}
              placeholder="e.g. Paracetamol"
              placeholderTextColor="#94a3b8"
            />
            {genericName.length > 0 && (
              <TouchableOpacity onPress={() => setGenericName("")} style={styles.clearBtnClick}>
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.infoAlertContainerBox}>
          <Text style={styles.infoBadgeIndicatorIcon}>ⓘ</Text>
          <View style={styles.infoAlertContentBodyTextGroup}>
            <Text style={styles.infoAlertMessageTextInline}>
              Enter the generic (chemical) name of the medication.
            </Text>
            <Text style={styles.infoAlertSubtextInline}>
              Brands will be linked to this generic separately in the Brand Directory.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActionBarWrapper}>
        <TouchableOpacity
          style={[styles.nextActionButtonCall, isSubmitting && { backgroundColor: "#82b27a" }]}
          onPress={handleSaveSubmit}
          disabled={isSubmitting}
          activeOpacity={0.9}
        >
          <Text style={styles.nextActionButtonLabelText}>
            {isSubmitting ? "SAVING..." : "SAVE RECORD"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scroller: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 40 },
  listHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  promptHeadline: { fontSize: 20, fontWeight: "700", color: "#1e293b" },
  addBtn: { backgroundColor: "#095c29", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 14, height: 48, marginBottom: 16 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: "#0f172a", height: "100%" },
  emptyText: { textAlign: "center", color: "#64748b", marginTop: 40, fontSize: 15 },
  card: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardInfoGroup: { flex: 1, gap: 4, marginRight: 12 },
  cardNameText: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  cardActionsGroup: { flexDirection: "row", gap: 12, alignItems: "center" },
  editButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: "#e2e8f0" },
  editButtonText: { color: "#334155", fontWeight: "600", fontSize: 13 },
  deleteButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: "#fee2e2" },
  deleteButtonText: { color: "#ef4444", fontWeight: "600", fontSize: 13 },
  fieldWrapper: { marginBottom: 20 },
  fieldLabelText: { fontSize: 15, fontWeight: "600", color: "#475569", marginBottom: 8 },
  inputContainerRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 14, height: 52 },
  fieldInput: { flex: 1, fontSize: 16, color: "#0f172a", height: "100%" },
  clearBtnClick: { padding: 4, justifyContent: "center", alignItems: "center" },
  clearBtnSymbol: { fontSize: 20, color: "#94a3b8" },
  infoAlertContainerBox: { flexDirection: "row", backgroundColor: "#f0fdf4", borderRadius: 12, padding: 14, gap: 12, marginTop: 12, borderWidth: 1, borderColor: "#dcfce7" },
  infoBadgeIndicatorIcon: { fontSize: 18, color: "#095c29", fontWeight: "bold", marginTop: 1 },
  infoAlertContentBodyTextGroup: { flex: 1, gap: 8 },
  infoAlertMessageTextInline: { fontSize: 14, color: "#166534", lineHeight: 20, fontWeight: "500" },
  infoAlertSubtextInline: { fontSize: 13, color: "#3f6212", lineHeight: 18 },
  bottomActionBarWrapper: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12, backgroundColor: "#ffffff" },
  nextActionButtonCall: { backgroundColor: "#095c29", height: 54, borderRadius: 10, justifyContent: "center", alignItems: "center", shadowColor: "#095c29", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  nextActionButtonLabelText: { color: "#ffffff", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
});