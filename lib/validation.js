import { z } from "zod";
import { DISABILITY_TYPES, LEGACY_DISABILITY_TYPES } from "@/lib/caseOptions";

const cnicRegex = /^\d{5}-\d{7}-\d$/;

// A birth date must be a real, past date. Year-only dates (older CNICs)
// arrive as 1 January of that year alongside `dobYearOnly: true`.
const dobSchema = z.coerce
  .date({ errorMap: () => ({ message: "Valid date of birth is required" }) })
  .min(new Date(Date.UTC(1900, 0, 1)), "Date of birth must be in 1900 or later")
  .refine((d) => d <= new Date(), "Date of birth can't be in the future");

// Current five types plus the pre-rename labels, so records saved under
// those stay editable. The forms only offer the current five.
const disabilityTypeSchema = z.enum([...DISABILITY_TYPES, ...Object.keys(LEGACY_DISABILITY_TYPES)]);

// S/O and D/O need the father's name (`sonOf`); W/O needs the husband's,
// stored as `spouse`. Checked on the union below, since which one is
// required depends on the relation. Gender isn't taken from the client at
// all: the routes set it from the relation.
const relationSchema = z.enum(["S/O", "D/O", "W/O"]);
const optionalName = z.string().trim().optional().or(z.literal(""));

const addressSchema = z.object({
  uc: z.string().trim().min(1, "UC is required"),
  tehsil: z.string().trim().min(1, "Tehsil is required"),
  district: z.string().trim().min(1, "District is required"),
});

const newCaseSchema = z.object({
  caseType: z.literal("new"),
  name: z.string().trim().min(1, "Name is required"),
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]),
  guardianRelation: relationSchema,
  sonOf: optionalName,
  spouse: optionalName,
  dob: dobSchema,
  dobYearOnly: z.boolean().optional(),
  cnic: z.string().regex(cnicRegex, "CNIC must be in the form 00000-0000000-0"),
  qualification: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().min(1, "Phone number is required"),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  assistiveDevices: z.string().trim().optional().or(z.literal("")),
  disabilityType: disabilityTypeSchema,
  // Nature of disability, its cause and the type of job the applicant can do
  // (form S. No. 9-11) are deliberately absent: the application form's note
  // leaves them to Social Welfare, who enter them when they verify the case
  // or print the form. Any such keys sent here are stripped.
  sourceOfIncome: z.string().trim().optional().or(z.literal("")),
  presentAddress: addressSchema,
  permanentAddress: addressSchema,
});

const oldCaseSchema = z.object({
  caseType: z.literal("old"),
  name: z.string().trim().min(1, "Name is required"),
  guardianRelation: relationSchema,
  sonOf: optionalName,
  spouse: optionalName,
  disabilityType: disabilityTypeSchema,
  natureOfDisability: z.string().trim().min(1, "Nature of disability is required"),
  fitness: z.enum(["Fit", "Unfit"]),
  dob: dobSchema,
  dobYearOnly: z.boolean().optional(),
  cnic: z.string().regex(cnicRegex, "CNIC must be in the form 00000-0000000-0"),
  address: addressSchema,
  phone: z.string().trim().min(1, "Contact number is required"),
  certificateNo: z.string().trim().min(1, "Certificate number is required"),
});

export const caseCreateSchema = z
  .discriminatedUnion("caseType", [newCaseSchema, oldCaseSchema])
  .superRefine((data, ctx) => {
    if (data.guardianRelation === "W/O") {
      if (!data.spouse) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["spouse"], message: "Husband's name is required for W/O" });
      }
      if (data.caseType === "new" && data.maritalStatus === "Single") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maritalStatus"],
          message: "A W/O (wife of) applicant can't be single",
        });
      }
    } else if (!data.sonOf) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sonOf"], message: "Father's name is required" });
    }
  });

// Verifying a case records the assessment board's actual findings — fitness
// and nature of disability — which is why they're required only for a
// "verified" decision, not a "rejected" one. Source of income is KDF's
// (S. No. 12), so it isn't part of the decision.
export const decisionSchema = z
  .object({
    decision: z.enum(["verified", "rejected"]),
    fitness: z.enum(["Fit", "Unfit"]).optional(),
    natureOfDisability: z.string().trim().optional(),
    causeOfDisability: z.string().trim().optional().or(z.literal("")),
    jobType: z.string().trim().optional().or(z.literal("")),
    category: z.enum(["A", "B", "C"]).optional().or(z.literal("")),
    categoryRemarks: z.string().trim().max(500).optional().or(z.literal("")),
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

const optionalText = z.string().trim().max(200).optional().or(z.literal(""));

// The entries the application form's note asks to be filled in — S. No. 9,
// 10, 11 and 17-21 — which Social Welfare supplies when printing it, plus
// which of field 8's printed boxes are ticked. Every entry may be left blank
// to be filled in by hand on paper; the route itself refuses to blank the
// two that a verified case's register and certificate depend on.
export const assessmentSchema = z.object({
  natureOfDisability: optionalText, // 9
  causeOfDisability: optionalText, // 10
  jobType: optionalText, // 11
  disabledStatus: z.enum(["Disabled", "Not Disabled"]).optional().or(z.literal("")), // 17
  impairment: optionalText, // 18
  fitness: z.enum(["Fit", "Unfit"]).optional().or(z.literal("")), // 19 / 20
  category: z.enum(["A", "B", "C"]).optional().or(z.literal("")), // 21
  // The four boxes printed on the paper form, in its own wording.
  disabilityChecks: z.array(z.enum(["Physically", "Visually", "Hearing", "Mentally"])).max(4),
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
