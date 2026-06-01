export type UserRole = "doctor" | "assistant" | "admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  prcNumber?: string; // doctors only
  specialty?: string; // doctors only
  clinic?: {
    name: string;
    room: string;
    city: string;
    province: string;
    contactNumber: string;
  };
}
