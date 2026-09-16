import { z } from "zod";

const cnicRegex = /^\d{5}-\d{7}-\d$/;

const addressSchema = z.object({
  uc: z.string().trim().min(1, "UC is required"),
  tehsil: z.string().trim().min(1, "Tehsil is required"),
  district: z.string().trim().min(1, "District is required"),
});

const newCaseSchema = z.object({
  caseType: z.literal("new"),
  name: z.string().trim().min(1, "Name is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]),
  guardianRelation: z.enum(["S/O", "D/O"]),
  sonOf: z.string().trim().min(1, "Son/Daughter of is required"),
  spouse: z.string().trim().optional().or(z.literal("")),
  dob: z.coerce.date({ errorMap: () => ({ message: "Valid date of birth is required" }) }),
  cnic: z.string().regex(cnicRegex, "CNIC must be in the form 00000-0000000-0"),
  qualification: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().min(1, "Phone number is required"),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  assistiveDevices: z.string().trim().optional().or(z.literal("")),
  // "Hearing" and "Mentally" are the pre-rename labels, kept valid so
  // existing cases saved under them can still be edited/re-saved — the KDF
  // form itself only offers the current five going forward.
  disabilityType: z.enum([
    "Physically",
    "Visually",
    "Hearing",
    "Hearing and Speech",
    "Mentally",
    "Mentally Retarded",
    "Multiple Disabilities",
  ]),
  // Left to Social Welfare to fill in once they've actually assessed the
  // applicant — not required at KDF intake.
  natureOfDisability: z.string().trim().optional().or(z.literal("")),
  causeOfDisability: z.string().trim().optional().or(z.literal("")),
  jobType: z.string().trim().optional().or(z.literal("")),
  sourceOfIncome: z.string().trim().optional().or(z.literal("")),
  presentAddress: addressSchema,
  permanentAddress: addressSchema,
});

const oldCaseSchema = z.object({
  caseType: z.literal("old"),
  name: z.string().trim().min(1, "Name is required"),
  guardianRelation: z.enum(["S/O", "D/O"]),
  sonOf: z.string().trim().min(1, "Father's/husband's name is required"),
  natureOfDisability: z.string().trim().min(1, "Type/nature of disability is required"),
  fitness: z.enum(["Fit", "Unfit"]),
  dob: z.coerce.date({ errorMap: () => ({ message: "Valid date of birth is required" }) }),
  cnic: z.string().regex(cnicRegex, "CNIC must be in the form 00000-0000000-0"),
  address: addressSchema,
  phone: z.string().trim().min(1, "Contact number is required"),
  certificateNo: z.string().trim().min(1, "Certificate number is required"),
});

export const caseCreateSchema = z.discriminatedUnion("caseType", [newCaseSchema, oldCaseSchema]);

// Verifying a case records the assessment board's actual findings — fitness
// and nature of disability — which is why they're required only for a
// "verified" decision, not a "rejected" one.
export const decisionSchema = z
  .object({
    decision: z.enum(["verified", "rejected"]),
    fitness: z.enum(["Fit", "Unfit"]).optional(),
    natureOfDisability: z.string().trim().optional(),
    causeOfDisability: z.string().trim().optional().or(z.literal("")),
    jobType: z.string().trim().optional().or(z.literal("")),
    sourceOfIncome: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.decision !== "verified") return;
    if (!data.fitness) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fitness"], message: "Fitness status is required" });
    }
    if (!data.natureOfDisability?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["natureOfDisability"],
        message: "Nature of disability is required",
      });
    }
  });

export const certificateNoSchema = z.object({
  certificateNo: z.string().trim().min(1, "Certificate number is required"),
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
