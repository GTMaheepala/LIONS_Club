const mongoose = require("mongoose");
const FoundationContribution = require("../models/FoundationContribution");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toNumNullable(val) {
  if (val === "" || val === undefined || val === null) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function serialize(doc) {
  return {
    id: String(doc._id),
    entryNumber: doc.entryNumber ?? null,
    contributorTag: doc.contributorTag ?? "",
    contributionDate: doc.contributionDate ? doc.contributionDate.toISOString() : null,
    contributorName: doc.contributorName,
    district: doc.district ?? "",
    clubName: doc.clubName ?? "",
    paymentKind: doc.paymentKind,
    cashRupees: doc.cashRupees ?? null,
    cashCents: doc.cashCents ?? null,
    chequeAmount: doc.chequeAmount ?? null,
    chequeBank: doc.chequeBank ?? "",
    chequeNumber: doc.chequeNumber ?? "",
    flagged: Boolean(doc.flagged),
    flagNote: doc.flagNote ?? "",
    notes: doc.notes ?? "",
    updatedAt: doc.updatedAt?.toISOString?.() ?? null,
  };
}

function buildCreate(body) {
  const paymentKind = body.paymentKind;
  if (!["cash", "cheque"].includes(paymentKind)) {
    return { error: "paymentKind must be cash or cheque." };
  }

  const contributorName = String(body.contributorName ?? "").trim();
  if (!contributorName) return { error: "contributorName is required." };

  const contributionDateRaw = body.contributionDate;
  if (contributionDateRaw == null || contributionDateRaw === "") {
    return { error: "contributionDate is required." };
  }
  const contributionDate = new Date(contributionDateRaw);
  if (Number.isNaN(contributionDate.getTime())) return { error: "Invalid contributionDate." };

  let entryNumber = null;
  if (body.entryNumber !== undefined && body.entryNumber !== "") {
    const n = Number(body.entryNumber);
    if (!Number.isFinite(n) || n < 0) return { error: "entryNumber must be zero or greater." };
    entryNumber = n;
  }

  return {
    payload: {
      entryNumber,
      contributorTag: String(body.contributorTag ?? "").trim(),
      contributionDate,
      contributorName,
      district: String(body.district ?? "").trim(),
      clubName: String(body.clubName ?? "").trim(),
      paymentKind,
      cashRupees: toNumNullable(body.cashRupees),
      cashCents: toNumNullable(body.cashCents),
      chequeAmount: toNumNullable(body.chequeAmount),
      chequeBank: String(body.chequeBank ?? "").trim(),
      chequeNumber: String(body.chequeNumber ?? "").trim(),
      flagged: Boolean(body.flagged),
      flagNote: String(body.flagNote ?? "").trim(),
      notes: String(body.notes ?? "").trim(),
    },
  };
}

function applyPatch(doc, body) {
  if (!body || typeof body !== "object") return null;

  if (body.entryNumber !== undefined) {
    if (body.entryNumber === "" || body.entryNumber === null) doc.entryNumber = null;
    else {
      const n = Number(body.entryNumber);
      if (!Number.isFinite(n) || n < 0) return "entryNumber must be zero or greater.";
      doc.entryNumber = n;
    }
  }
  if (body.contributorTag !== undefined) doc.contributorTag = String(body.contributorTag ?? "").trim();
  if (body.contributionDate !== undefined) {
    if (body.contributionDate === "" || body.contributionDate === null) return "contributionDate cannot be empty.";
    const d = new Date(body.contributionDate);
    if (Number.isNaN(d.getTime())) return "Invalid contributionDate.";
    doc.contributionDate = d;
  }
  if (body.contributorName !== undefined) {
    const n = String(body.contributorName ?? "").trim();
    if (!n) return "contributorName cannot be empty.";
    doc.contributorName = n;
  }
  if (body.district !== undefined) doc.district = String(body.district ?? "").trim();
  if (body.clubName !== undefined) doc.clubName = String(body.clubName ?? "").trim();
  if (body.paymentKind !== undefined) {
    if (!["cash", "cheque"].includes(body.paymentKind)) return "paymentKind must be cash or cheque.";
    doc.paymentKind = body.paymentKind;
  }
  if (body.cashRupees !== undefined) doc.cashRupees = toNumNullable(body.cashRupees);
  if (body.cashCents !== undefined) doc.cashCents = toNumNullable(body.cashCents);
  if (body.chequeAmount !== undefined) doc.chequeAmount = toNumNullable(body.chequeAmount);
  if (body.chequeBank !== undefined) doc.chequeBank = String(body.chequeBank ?? "").trim();
  if (body.chequeNumber !== undefined) doc.chequeNumber = String(body.chequeNumber ?? "").trim();
  if (body.flagged !== undefined) doc.flagged = Boolean(body.flagged);
  if (body.flagNote !== undefined) doc.flagNote = String(body.flagNote ?? "").trim();
  if (body.notes !== undefined) doc.notes = String(body.notes ?? "").trim();

  return null;
}

/** GET /api/contributions */
async function list(req, res) {
  const q = {};
  const district = typeof req.query.district === "string" ? req.query.district.trim() : "";
  const club = typeof req.query.club === "string" ? req.query.club.trim() : "";
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const tag = typeof req.query.tag === "string" ? req.query.tag.trim() : "";
  const kind =
    typeof req.query.kind === "string" && ["cash", "cheque"].includes(req.query.kind) ? req.query.kind : "";

  if (district) q.district = new RegExp(`^${escapeRegex(district)}$`, "i");
  if (club) q.clubName = new RegExp(escapeRegex(club), "i");
  if (tag) q.contributorTag = new RegExp(`^${escapeRegex(tag)}$`, "i");
  if (kind) q.paymentKind = kind;

  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    q.$or = [{ contributorName: re }, { clubName: re }, { notes: re }, { flagNote: re }];
  }

  const rows = await FoundationContribution.find(q)
    .sort({ contributionDate: -1, _id: -1 })
    .limit(2000)
    .lean();

  res.json({ contributions: rows.map((r) => serialize(r)) });
}

/** POST /api/contributions */
async function create(req, res) {
  const parsed = buildCreate(req.body || {});
  if (parsed.error) return res.status(400).json({ message: parsed.error });

  const doc = await FoundationContribution.create(parsed.payload);
  res.status(201).json({ contribution: serialize(doc) });
}

/** PATCH /api/contributions/:id */
async function update(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid contribution id." });

  const doc = await FoundationContribution.findById(id);
  if (!doc) return res.status(404).json({ message: "Contribution not found." });

  const patchErr = applyPatch(doc, req.body || {});
  if (patchErr) return res.status(400).json({ message: patchErr });

  await doc.save();
  res.json({ contribution: serialize(doc) });
}

/** DELETE /api/contributions/:id */
async function remove(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid contribution id." });

  const doc = await FoundationContribution.findByIdAndDelete(id);
  if (!doc) return res.status(404).json({ message: "Contribution not found." });

  res.json({ ok: true });
}

/** GET /api/contributions/count — total rows in foundation ledger (admin dashboard). */
async function countLedger(_req, res) {
  const total = await FoundationContribution.countDocuments({});
  res.json({ total });
}

module.exports = {
  list,
  countLedger,
  create,
  update,
  remove,
  serialize,
};
