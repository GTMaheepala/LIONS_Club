const mongoose = require("mongoose");

/**
 * Mirrors the Lanka Lions foundation contributor ledger (spreadsheet §6.3 migration).
 * One row per dated gift (same person may have many rows over time).
 */
const foundationContributionSchema = new mongoose.Schema(
  {
    entryNumber: { type: Number, min: 0, default: null },
    contributorTag: { type: String, trim: true, default: "" },
    contributionDate: { type: Date, required: true },
    contributorName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    phoneNumber: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
    clubName: { type: String, trim: true, default: "" },
    paymentKind: {
      type: String,
      enum: ["cash", "cheque", "bank"],
      required: true,
    },
    cashRupees: { type: Number, default: null },
    cashCents: { type: Number, default: null, min: 0 },
    chequeAmount: { type: Number, default: null },
    chequeBank: { type: String, trim: true, default: "" },
    chequeNumber: { type: String, trim: true, default: "" },
    /** Optional flags aligned with workbook highlights */
    flagged: { type: Boolean, default: false },
    flagNote: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

foundationContributionSchema.index({ contributionDate: -1 });
foundationContributionSchema.index({ district: 1, clubName: 1 });
foundationContributionSchema.index({ contributorName: 1 });

module.exports =
  mongoose.models.FoundationContribution ||
  mongoose.model("FoundationContribution", foundationContributionSchema);
