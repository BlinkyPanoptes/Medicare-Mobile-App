import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { MOCK_BRANDS, MOCK_GENERICS } from "@/mocks";
import { Brand } from "@/types/brand";
import { Generic } from "@/types/generic";
const testBrands = MOCK_BRANDS;
const testGenerics = MOCK_GENERICS;

export default function BrandDirectoryScreen() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [brandName, setBrandName] = useState("");
  const [selectedGenericIds, setSelectedGenericIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generic picker modal
  const [showGenericPicker, setShowGenericPicker] = useState(false);

  // Brand database
  const [brandDatabase, setBrandDatabase] = useState<Brand[]>(MOCK_BRANDS);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getGenericById = (id: string) => testGenerics.find((g) => g.id === id);

  const getGenericNamesForBrand = (brand: Brand) =>
    brand.generics
      ?.map((g) => g.name)
      .filter(Boolean)
      .join(", ");

  const toggleGenericSelection = (id: string) => {
    setSelectedGenericIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  // ── Form open/close ────────────────────────────────────────────────────────

  const openCreateForm = () => {
    setBrandName("");
    setSelectedGenericIds([]);
    setEditingBrandId(null);
    setIsCreating(true);
  };

  const openEditForm = (brand: Brand) => {
    setBrandName(brand.name);
    setSelectedGenericIds([...(brand.generics?.map((g) => g.id) || [])]);
    setEditingBrandId(brand.id);
    setIsCreating(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSaveSubmit = async () => {
    if (!brandName.trim()) {
      Alert.alert("Missing Fields", "Please enter a brand name.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingBrandId) {
        setBrandDatabase((prev) =>
          prev.map((item) =>
            item.id === editingBrandId
              ? {
                  ...item,
                  name: brandName,
                  generics: selectedGenericIds
                    .map((id) => getGenericById(id))
                    .filter((g): g is Generic => !!g),
                }
              : item,
          ),
        );
        Alert.alert(
          "Success",
          `Brand record for ${brandName} has been modified successfully.`,
          [{ text: "OK", onPress: () => setIsCreating(false) }],
        );
      } else {
        const newBrand: Brand = {
          id: Date.now().toString(),
          name: brandName,
          generics: selectedGenericIds
            .map((id) => getGenericById(id))
            .filter((g): g is Generic => !!g),
        };
        setBrandDatabase((prev) => [...prev, newBrand]);
        Alert.alert(
          "Brand Added",
          `${brandName} has been saved to the brand directory.`,
          [{ text: "OK", onPress: () => setIsCreating(false) }],
        );
      }
    } catch (err: any) {
      Alert.alert("Submission Error", "Could not save the brand record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDeleteBrand = (id: string, name: string) => {
    Alert.alert(
      "Delete Brand",
      `Are you sure you want to permanently remove ${name} from the directory?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            setBrandDatabase((prev) => prev.filter((b) => b.id !== id)),
        },
      ],
    );
  };

  // ── Search filter ──────────────────────────────────────────────────────────
  const filteredBrands = useMemo(
    () =>
      brandDatabase.filter((brand) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;

        // Match by brand name
        if (brand.name.toLowerCase().includes(query)) return true;

        // Match by any linked generic name
        return brand.generics?.some((generic) =>
          generic.name.toLowerCase().includes(query),
        );
      }),
    [brandDatabase, searchQuery],
  );

  // ── VIEW 1: Brand List ─────────────────────────────────────────────────────

  if (!isCreating) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={styles.content}
        >
          <View style={styles.listHeaderRow}>
            <Text style={styles.promptHeadline}>Brand Directory</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openCreateForm}>
              <Text style={styles.addBtnText}>+ Add Brand</Text>
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by brand or generic name..."
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

          {filteredBrands.length === 0 && brandDatabase.length === 0 ? (
            <Text style={styles.emptyText}>
              No brand records found. Click add to begin.
            </Text>
          ) : filteredBrands.length === 0 ? (
            <Text style={styles.emptyText}>
              No brands match "{searchQuery}".
            </Text>
          ) : (
            filteredBrands.map((brand) => (
              <View key={brand.id} style={styles.card}>
                <View style={styles.cardInfoGroup}>
                  <Text style={styles.cardNameText}>{brand.name}</Text>
                  {brand.generics?.length > 0 ? (
                    <Text style={styles.cardSubDetails} numberOfLines={2}>
                      💊 {getGenericNamesForBrand(brand)}
                    </Text>
                  ) : (
                    <Text style={styles.cardSubDetailsMuted}>
                      No generics linked
                    </Text>
                  )}
                </View>

                <View style={styles.cardActionsGroup}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditForm(brand)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteBrand(brand.id, brand.name)}
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

  // ── VIEW 2: Create / Edit Form ─────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.promptHeadline}>
          {editingBrandId ? "Edit Brand Record" : "Add a New Brand"}
        </Text>

        {/* BRAND NAME */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Brand Name</Text>
          <View style={styles.inputContainerRow}>
            <TextInput
              style={styles.fieldInput}
              value={brandName}
              onChangeText={setBrandName}
              placeholder="Enter brand name (e.g. Biogesic)"
              placeholderTextColor="#94a3b8"
            />
            {brandName.length > 0 && (
              <TouchableOpacity
                onPress={() => setBrandName("")}
                style={styles.clearBtnClick}
              >
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* LINKED GENERICS */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Linked Generic Medications</Text>

          {/* Selected generics chips */}
          {selectedGenericIds.length > 0 && (
            <View style={styles.chipsContainer}>
              {selectedGenericIds.map((id) => {
                const generic = getGenericById(id);
                if (!generic) return null;
                return (
                  <View key={id} style={styles.chip}>
                    <Text style={styles.chipText}>{generic.name}</Text>
                    <TouchableOpacity
                      onPress={() => toggleGenericSelection(id)}
                    >
                      <Text style={styles.chipRemove}>×</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={styles.addGenericBtn}
            onPress={() => setShowGenericPicker(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addGenericBtnText}>
              ＋ Select Generic Medications
            </Text>
          </TouchableOpacity>
        </View>

        {/* INFO BOX */}
        <View style={styles.infoAlertContainerBox}>
          <Text style={styles.infoBadgeIndicatorIcon}>ⓘ</Text>
          <View style={styles.infoAlertContentBodyTextGroup}>
            <Text style={styles.infoAlertMessageTextInline}>
              Linking generics does not modify the generic record.
            </Text>
            <Text style={styles.infoAlertSubtextInline}>
              The generic medication remains unchanged in the Generics
              directory. This only associates it with this brand for reference
              purposes.
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
            {isSubmitting ? "PROCESSING..." : "SAVE BRAND"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* GENERIC PICKER MODAL */}
      <Modal
        visible={showGenericPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowGenericPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Generic Medications</Text>
              <TouchableOpacity onPress={() => setShowGenericPicker(false)}>
                <Text style={styles.modalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {testGenerics.map((generic) => {
                const isSelected = selectedGenericIds.includes(generic.id);
                return (
                  <TouchableOpacity
                    key={generic.id}
                    style={[
                      styles.pickerRow,
                      isSelected && styles.pickerRowSelected,
                    ]}
                    onPress={() => toggleGenericSelection(generic.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pickerRowInfo}>
                      <Text style={styles.pickerRowName}>{generic.name}</Text>
                      <Text style={styles.pickerRowUses} numberOfLines={1}>
                        {generic.uses}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
    marginBottom: 25,
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
  cardSubDetailsMuted: {
    fontSize: 13,
    color: "#94a3b8",
    fontStyle: "italic",
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
  fieldInput: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
    height: "100%",
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

  // Chips
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    color: "#166534",
    fontWeight: "600",
  },
  chipRemove: {
    fontSize: 16,
    color: "#166534",
    fontWeight: "700",
  },
  addGenericBtn: {
    borderWidth: 1.5,
    borderColor: "#095c29",
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  addGenericBtnText: {
    color: "#095c29",
    fontWeight: "600",
    fontSize: 14,
  },

  // Info box
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

  // Submit button
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
  },
  modalDoneText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#095c29",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 12,
  },
  pickerRowSelected: {
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  pickerRowInfo: {
    flex: 1,
    gap: 3,
  },
  pickerRowName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  pickerRowUses: {
    fontSize: 13,
    color: "#64748b",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  checkboxSelected: {
    backgroundColor: "#095c29",
    borderColor: "#095c29",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
