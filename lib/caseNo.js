import Counter from "@/models/Counter";

// Atomically reserves the next case number so concurrent submissions never collide.
export async function getNextCaseNo() {
  const counter = await Counter.findOneAndUpdate(
    { _id: "caseNo" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return "KDF-" + String(counter.seq).padStart(6, "0");
}
