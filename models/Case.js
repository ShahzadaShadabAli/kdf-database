import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    uc: { type: String, required: true },
    tehsil: { type: String, required: true },
    district: { type: String, required: true },
  },
  { _id: false }
);

const AuditEntrySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ["submitted", "updated", "withdrawn", "restored", "verified", "rejected"],
    },
    byUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SwdSchema = new mongoose.Schema(
  {
    decision: { type: String, enum: ["verified", "rejected"] },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    decidedAt: { type: Date },
  },
  { _id: false }
);

const CaseSchema = new mongoose.Schema({
  caseNo: { type: String, required: true, unique: true },
  cnic: {
    type: String,
    required: true,
    unique: true,
    index: true,
    match: /^\d{5}-\d{7}-\d$/,
  },
  name: { type: String, required: true },
  gender: {
    type: String,
    required: true,
    enum: ["Male", "Female", "Other"],
  },
  maritalStatus: {
    type: String,
    required: true,
    enum: ["Single", "Married", "Divorced", "Widowed"],
  },
  sonOf: { type: String, required: true },
  spouse: { type: String },
  dob: { type: Date, required: true },
  qualification: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  assistiveDevices: { type: String },
  disabilityType: {
    type: String,
    required: true,
    enum: ["Physically", "Visually", "Hearing", "Mentally"],
  },
  natureOfDisability: { type: String, required: true },
  causeOfDisability: { type: String },
  jobType: { type: String },
  sourceOfIncome: { type: String },
  presentAddress: { type: AddressSchema, required: true },
  permanentAddress: { type: AddressSchema, required: true },
  status: {
    type: String,
    required: true,
    enum: ["referred", "verified", "rejected", "withdrawn"],
    default: "referred",
  },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  submittedAt: { type: Date, default: Date.now },
  swd: { type: SwdSchema, default: () => ({}) },
  auditLog: { type: [AuditEntrySchema], default: [] },
});

// Every case list page fetches everything sorted by submittedAt and then
// splits it by status — this compound index serves that sort directly
// instead of scanning and sorting in memory as the collection grows.
CaseSchema.index({ status: 1, submittedAt: -1 });

export default mongoose.models.Case || mongoose.model("Case", CaseSchema);
