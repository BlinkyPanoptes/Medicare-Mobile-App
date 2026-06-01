import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  MOCK_GENERICS
} from "@/mocks";
import { Generic } from "@/types/generic";
const testGenerics = MOCK_GENERICS;

export default function GenericsScreen() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingGenericId, setEditingGenericId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [name, setName] = useState("");
  const [uses, setUses] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [GenericDatabase, setGenericDatabase] =
    useState<Generic[]>(testGenerics);

  const filteredGenerics = useMemo(
    () =>
      GenericDatabase.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      ),
    [GenericDatabase, searchQuery],
  );

  const openCreateForm = () => {
    setName("");
    setUses("");
    setEditingGenericId(null);
    setIsCreating(true);
  };

  const openEditForm = (Generic: Generic) => {
    setName(Generic.name);
    setUses(Generic.uses);
    setEditingGenericId(Generic.id);
    setIsCreating(true);
  };

  const handleClearField = (field: "name" | "uses") => {
    if (field === "name") setName("");
    if (field === "uses") setUses("");
  };

  const handleSaveSubmit = async () => {
    if (!name.trim() || !uses.trim()) {
      Alert.alert(
        "Missing Fields",
        "Please complete the Generic name and uses.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingGenericId) {
        setGenericDatabase((prev) =>
          prev.map((item) =>
            item.id === editingGenericId ? { ...item, name, uses } : item,
          ),
        );
        Alert.alert(
          "Success",
          `Generic record for ${name} has been modified successfully.`,
          [{ text: "OK", onPress: () => setIsCreating(false) }],
        );
      } else {
        const newGeneric: Generic = {
          id: Date.now().toString(),
          name,
          uses,
        };
        setGenericDatabase((prev) => [...prev, newGeneric]);
        Alert.alert(
          "Generic Added",
          `Record saved for ${name} in the directory.`,
          [{ text: "OK", onPress: () => setIsCreating(false) }],
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Submission Error",
        "Could not process form database schema parameters.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGeneric = (id: string, name: string) => {
    Alert.alert(
      "Delete Generic",
      `Are you sure you want to permanently remove the record for ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setGenericDatabase((prev) => prev.filter((m) => m.id !== id));
          },
        },
      ],
    );
  };

  // ── VIEW 1: Generics List ───────────────────────────────────────────────────
  if (!isCreating) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={styles.content}
        >
          <View style={styles.listHeaderRow}>
            <Text style={styles.promptHeadline}>Generic Generics</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openCreateForm}>
              <Text style={styles.addBtnText}>+ Add Generic</Text>
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search generic Generic name..."
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearBtnClick}
              >
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredGenerics.length === 0 && GenericDatabase.length === 0 ? (
            <Text style={styles.emptyText}>
              No Generic records found. Click add to begin.
            </Text>
          ) : filteredGenerics.length === 0 ? (
            <Text style={styles.emptyText}>
              No Generics match "{searchQuery}".
            </Text>
          ) : (
            filteredGenerics.map((Generic) => (
              <View key={Generic.id} style={styles.card}>
                <View style={styles.cardInfoGroup}>
                  <Text style={styles.cardNameText}>{Generic.name}</Text>
                  <Text style={styles.cardSubDetails} numberOfLines={2}>
                    💊 {Generic.uses}
                  </Text>
                </View>

                <View style={styles.cardActionsGroup}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditForm(Generic)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() =>
                      handleDeleteGeneric(Generic.id, Generic.name)
                    }
                  >
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
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.promptHeadline}>
          {editingGenericId ? "Edit Generic Record" : "Add a New Generic"}
        </Text>

        {/* Generic NAME INPUT */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Generic Name</Text>
          <View style={styles.inputContainerRow}>
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter Generic name"
              placeholderTextColor="#94a3b8"
            />
            {name.length > 0 && (
              <TouchableOpacity
                onPress={() => handleClearField("name")}
                style={styles.clearBtnClick}
              >
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Generic USES INPUT */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Generic Uses</Text>
          <View style={[styles.inputContainerRow, styles.textAreaContainer]}>
            <TextInput
              style={[styles.fieldInput, styles.textArea]}
              value={uses}
              onChangeText={setUses}
              placeholder="Describe the uses of this Generic"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {uses.length > 0 && (
              <TouchableOpacity
                onPress={() => handleClearField("uses")}
                style={[
                  styles.clearBtnClick,
                  { alignSelf: "flex-start", marginTop: 4 },
                ]}
              >
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* INFO BOX */}
        <View style={styles.infoAlertContainerBox}>
          <Text style={styles.infoBadgeIndicatorIcon}>ⓘ</Text>
          <View style={styles.infoAlertContentBodyTextGroup}>
            <Text style={styles.infoAlertMessageTextInline}>
              Provide a clear and complete description of uses.
            </Text>
            <Text style={styles.infoAlertSubtextInline}>
              This information will be used as a reference during patient
              consultations and prescription.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* SUBMIT BUTTON */}
      <View style={styles.bottomActionBarWrapper}>
        <TouchableOpacity
          style={[
            styles.nextActionButtonCall,
            isSubmitting && { backgroundColor: "#82b27a" },
          ]}
          onPress={handleSaveSubmit}
          disabled={isSubmitting}
          activeOpacity={0.9}
        >
          <Text style={styles.nextActionButtonLabelText}>
            {isSubmitting ? "PROCESSING..." : "SAVE RECORD"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scroller: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  promptHeadline: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  addBtn: {
    backgroundColor: "#095c29",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    height: "100%",
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 40,
    fontSize: 15,
  },
  card: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfoGroup: {
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  cardNameText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardSubDetails: {
    fontSize: 14,
    color: "#64748b",
  },
  cardActionsGroup: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#e2e8f0",
  },
  editButtonText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 13,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#fee2e2",
  },
  deleteButtonText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 13,
  },
  fieldWrapper: {
    marginBottom: 20,
  },
  fieldLabelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  inputContainerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 52,
  },
  textAreaContainer: {
    height: "auto",
    minHeight: 120,
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
    height: "100%",
  },
  textArea: {
    height: undefined,
    minHeight: 96,
  },
  clearBtnClick: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  clearBtnSymbol: {
    fontSize: 20,
    color: "#94a3b8",
  },
  infoAlertContainerBox: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  infoBadgeIndicatorIcon: {
    fontSize: 18,
    color: "#095c29",
    fontWeight: "bold",
    marginTop: 1,
  },
  infoAlertContentBodyTextGroup: {
    flex: 1,
    gap: 8,
  },
  infoAlertMessageTextInline: {
    fontSize: 14,
    color: "#166534",
    lineHeight: 20,
    fontWeight: "500",
  },
  infoAlertSubtextInline: {
    fontSize: 13,
    color: "#3f6212",
    lineHeight: 18,
  },
  bottomActionBarWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: "#ffffff",
  },
  nextActionButtonCall: {
    backgroundColor: "#095c29",
    height: 54,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#095c29",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  nextActionButtonLabelText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
