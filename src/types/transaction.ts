export type MedicationEntry = {
  name: string;
  dosage: string;
};

export type Prescription = {
  id: string;
  type: "prescription";
  dateIssued: string; // ISO string e.g. "2025-01-15"
  patient: {
    firstName: string;
    lastName: string;
  };
  medications: MedicationEntry[];
  notes: string;
};

export type MedicalCertificate = {
  id: string;
  type: "medical-certificate";
  dateIssued: string;
  patient: {
    firstName: string;
    lastName: string;
  };
  medicalNotes: string;
};

export type Transaction = Prescription | MedicalCertificate;
