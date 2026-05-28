// import { useAuth } from "@/components/context/auth-context";
// import {
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// export default function PatientRecordsScreen() {
//   const { user } = useAuth();

//   return (
//     <ScrollView style={styles.container} contentContainerStyle={styles.content}>
//       <Text style={styles.title}>Patient Records</Text>
//       <Text style={styles.body}>
//         View and manage patient records for your clinic here.
//       </Text>

//       <View style={{ height: 40 }}>
//         {user?.role === "doctor" && (
//           <TouchableOpacity
//             style={styles.doctorButton}
//             onPress={() => console.log("Doctor's test button pressed")}
//           >
//             <Text style={styles.doctorButtonText}>Doctor Login Test</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   doctorButton: {
//     backgroundColor: "#095c29",
//     paddingVertical: 14,
//     paddingHorizontal: 10,
//     borderRadius: 10,
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 10,
//     minHeight: 50,
//   },

//   doctorButtonText: {
//     color: "#fff",
//     fontWeight: "bold",
//   },
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f7fb",
//   },
//   content: {
//     padding: 20,
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: "bold",
//     marginBottom: 12,
//     color: "#1e2a38",
//   },
//   body: {
//     fontSize: 16,
//     color: "#34495e",
//     lineHeight: 24,
//   },
// });
