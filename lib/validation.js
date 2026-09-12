import { z } from "zod";

const cnicRegex = /^\d{5}-\d{7}-\d$/;

const addressSchema = z.object({
  uc: z.string().trim().min(1, "UC is required"),
  tehsil: z.string().trim().min(1, "Tehsil is required"),
  district: z.string().trim().min(1, "District is required"),
});

export const caseCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]),
  sonOf: z.string().trim().min(1, "Son/Daughter of is required"),
  spouse: z.string().trim().optional().or(z.literal("")),
  dob: z.coerce.date({ errorMap: () => ({ message: "Valid date of birth is required" }) }),
  cnic: z.string().regex(cnicRegex, "CNIC must be in the form 00000-0000000-0"),
  qualification: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().min(1, "Phone number is required"),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  assistiveDevices: z.string().trim().optional().or(z.literal("")),
  disabilityType: z.enum(["Physically", "Visually", "Hearing", "Mentally"]),
  natureOfDisability: z.string().trim().min(1, "Nature of disability is required"),
  causeOfDisability: z.string().trim().optional().or(z.literal("")),
  jobType: z.string().trim().optional().or(z.literal("")),
  sourceOfIncome: z.string().trim().optional().or(z.literal("")),
  presentAddress: addressSchema,
  permanentAddress: addressSchema,
});

export const decisionSchema = z.object({
  decision: z.enum(["verified", "rejected"]),
});

export const userCreateSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .regex(/^[a-z0-9._-]+$/i, "Use only letters, numbers, dots, underscores or hyphens"),
  displayName: z.string().trim().min(1, "Display name is required"),
  role: z.enum(["kdf", "swd", "admin"]),
  office: z.string().trim().optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});
