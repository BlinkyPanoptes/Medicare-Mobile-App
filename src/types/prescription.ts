import { Brand } from "./brand";
import { Generic } from "./generic";
import { Patient } from "./patient";
import { User } from "./user";

export type Medication = {
  generic: Generic;
  brand: Brand;
  dosage: string;
};

export type Prescription = {
  id: string;
  type: "prescription";
  createdBy: User;
  dateIssued: Date; // Date object
  patient: Patient;
  medications: Medication[];
  notes: string;

  // 1. Add the new snapshot fields as optional/nullable properties
  generic_name_snapshot?: string | null;
  brand_name_snapshot?: string | null;

  // 2. Allow the relationships to be null in case the record was deleted
  generic: { id: number; generic_name: string } | null;
  brand: { id: number; brand_name: string } | null;

};
