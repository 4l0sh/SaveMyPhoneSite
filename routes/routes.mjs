import express from "express";
export const router = express.Router();
import { db } from "../server.mjs";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

// Helper to find a repair type by ObjectId or by name (case-insensitive)
function repairLookupQuery(idOrName) {
  const s = (idOrName ?? "").toString();
  if (ObjectId.isValid(s)) {
    try {
      return { _id: new ObjectId(s) };
    } catch {
      // fall through to name-based lookup
    }
  }
  return { naam: { $regex: `^${s}$`, $options: "i" } };
}

// Simple JWT auth middleware for protected admin endpoints
function authenticate(req, res, next) {
  try {
    const auth = req.headers["authorization"] || "";
    const [scheme, token] = auth.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("Auth middleware error: missing JWT_SECRET");
      return res.status(500).json({ error: "Server misconfigured" });
    }
    const payload = jwt.verify(token, secret);
    req.userId = payload?.userId;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// get brands (normalize fields to { _id, name, logo })
router.get("/brands", async (req, res) => {
  try {
    const raw = await db
      .collection("merken")
      .aggregate([
        {
          $project: {
            merk: 1,
            logo: 1,
            sortOrder: { $ifNull: ["$sortOrder", 1000000] },
          },
        },
        { $sort: { sortOrder: 1, merk: 1 } },
      ])
      .toArray();

    const brands = raw.map(({ _id, merk, logo }) => ({
      _id,
      name: merk,
      logo,
    }));
    res.json(brands);
  } catch (err) {
    console.error("/brands error:", err);
    res.status(500).json({ error: "Failed to fetch brands" });
  }
});

// Reorder brands (admin only). Body: { order: [brandId1, brandId2, ...] }
router.put("/brands/reorder", authenticate, async (req, res) => {
  try {
    const order = Array.isArray(req.body?.order) ? req.body.order : [];
    if (!order.length)
      return res.status(400).json({ error: "order array required" });
    const ops = [];
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      if (!ObjectId.isValid(id)) continue;
      ops.push({
        updateOne: {
          filter: { _id: new ObjectId(id) },
          update: { $set: { sortOrder: i } },
        },
      });
    }
    if (!ops.length) return res.status(400).json({ error: "No valid ids" });
    const result = await db.collection("merken").bulkWrite(ops);
    return res.json({ ok: true, modified: result.modifiedCount ?? 0 });
  } catch (err) {
    console.error("PUT /brands/reorder error:", err);
    res.status(500).json({ error: "Failed to reorder brands" });
  }
});

// get models by brand ID (optional q for search)
router.get("/models", async (req, res) => {
  try {
    const { brandId, q } = req.query;
    const match = {};
    if (brandId) {
      try {
        match.merkId = new ObjectId(brandId);
      } catch (e) {
        return res.status(400).json({ error: "Invalid brandId" });
      }
    }
    if (q) match.model = { $regex: q, $options: "i" };

    const docs = await db
      .collection("modellen")
      .aggregate([
        { $match: match },
        {
          $project: {
            model: 1,
            afbeeldingUrl: 1,
            sortOrder: { $ifNull: ["$sortOrder", 1000000] },
          },
        },
        { $sort: { sortOrder: 1, model: 1 } },
      ])
      .toArray();

    const models = docs.map((d) => ({
      _id: d._id,
      name: d.model,
      imageUrl: d.afbeeldingUrl || null,
    }));
    res.json(models);
  } catch (err) {
    console.error("/models error:", err);
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

// Reorder models within a brand (admin only). Body: { brandId, order: [modelId1, modelId2, ...] }
router.put("/models/reorder", authenticate, async (req, res) => {
  try {
    const brandId = (req.body?.brandId ?? "").toString();
    const order = Array.isArray(req.body?.order) ? req.body.order : [];
    if (!ObjectId.isValid(brandId))
      return res.status(400).json({ error: "Invalid brandId" });
    if (!order.length)
      return res.status(400).json({ error: "order array required" });

    const merkId = new ObjectId(brandId);
    // Optional consistency check: ensure ids belong to the brand
    const existing = await db
      .collection("modellen")
      .find(
        {
          _id: {
            $in: order.filter(ObjectId.isValid).map((id) => new ObjectId(id)),
          },
        },
        { projection: { _id: 1, merkId: 1 } }
      )
      .toArray();
    const validIds = new Set(
      existing
        .filter((m) => String(m.merkId) === String(merkId))
        .map((m) => String(m._id))
    );

    const ops = [];
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      if (!ObjectId.isValid(id)) continue;
      if (!validIds.has(String(id))) continue;
      ops.push({
        updateOne: {
          filter: { _id: new ObjectId(id) },
          update: { $set: { sortOrder: i } },
        },
      });
    }
    if (!ops.length)
      return res.status(400).json({ error: "No valid ids for brand" });
    const result = await db.collection("modellen").bulkWrite(ops);
    return res.json({ ok: true, modified: result.modifiedCount ?? 0 });
  } catch (err) {
    console.error("PUT /models/reorder error:", err);
    res.status(500).json({ error: "Failed to reorder models" });
  }
});

// update a model's repair prices (admin only)
router.put("/models/:id/repairs", authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    let _id;
    try {
      _id = new ObjectId(id);
    } catch (e) {
      return res.status(400).json({ error: "Invalid model id" });
    }

    const input = req.body || {};
    const reparatiesInput = Array.isArray(input.reparaties)
      ? input.reparaties
      : [];

    // Validate against existing repair types by naam
    const repTypes = await db
      .collection("reparatietypes")
      .find({}, { projection: { naam: 1 } })
      .toArray();
    const allowedNames = new Set(
      repTypes.map((r) => String(r.naam).trim().toLowerCase())
    );

    const reparaties = reparatiesInput
      .map((r) => ({
        typeNaam: String(r.typeNaam ?? r.naam ?? "").trim(),
        prijs: Number(r.prijs),
      }))
      .filter((r) => r.typeNaam && Number.isFinite(r.prijs) && r.prijs >= 0)
      .filter((r) => allowedNames.has(r.typeNaam.toLowerCase()))
      .map((r) => ({ typeNaam: r.typeNaam, prijs: r.prijs }));

    const update = await db
      .collection("modellen")
      .updateOne({ _id }, { $set: { reparaties } });

    if (update.matchedCount === 0) {
      return res.status(404).json({ error: "Model niet gevonden" });
    }

    return res.json({ ok: true, updated: update.modifiedCount });
  } catch (err) {
    console.error("PUT /models/:id/repairs error:", err);
    return res.status(500).json({ error: "Failed to update repairs" });
  }
});

// create a new model with prices (admin only)
router.post("/models", authenticate, async (req, res) => {
  try {
    const body = req.body || {};
    // Required: brandId, model
    const brandId = (body.brandId ?? "").toString().trim();
    const modelName = (body.model ?? "").toString().trim();
    const apparaat =
      (body.apparaat ?? "smartphone").toString().trim() || "smartphone";
    const afbeeldingUrl =
      (body.imageUrl ?? body.afbeeldingUrl ?? "").toString().trim() || null;
    const jaarRaw = body.jaar ?? body.year ?? null;

    if (!brandId || !modelName) {
      return res.status(400).json({ error: "brandId and model are required" });
    }

    let merkId;
    try {
      merkId = new ObjectId(brandId);
    } catch (e) {
      return res.status(400).json({ error: "Invalid brandId" });
    }

    // Optional year normalization
    let jaar = null;
    if (jaarRaw !== null && jaarRaw !== undefined && jaarRaw !== "") {
      const n = Number(jaarRaw);
      if (!Number.isFinite(n) || n < 1990 || n > 2100) {
        return res.status(400).json({ error: "Invalid year" });
      }
      jaar = n;
    }

    // Reparaties sanitation: accept either `reparaties` array or a `prices` object map
    const pricesMap =
      body.prices && typeof body.prices === "object" ? body.prices : null;
    let reparatiesInput = Array.isArray(body.reparaties) ? body.reparaties : [];
    if (!reparatiesInput.length && pricesMap) {
      reparatiesInput = Object.entries(pricesMap).map(([typeNaam, prijs]) => ({
        typeNaam,
        prijs,
      }));
    }

    // Validate against existing repair types by naam
    const repTypes = await db
      .collection("reparatietypes")
      .find({}, { projection: { naam: 1 } })
      .toArray();
    const allowedNames = new Set(
      repTypes.map((r) => String(r.naam).trim().toLowerCase())
    );

    const reparaties = (reparatiesInput || [])
      .map((r) => ({
        typeNaam: String(r.typeNaam ?? r.naam ?? "").trim(),
        prijs: Number(r.prijs),
      }))
      .filter((r) => r.typeNaam && Number.isFinite(r.prijs) && r.prijs >= 0)
      .filter((r) => allowedNames.has(r.typeNaam.toLowerCase()))
      .map((r) => ({ typeNaam: r.typeNaam, prijs: r.prijs }));

    const doc = {
      merkId,
      model: modelName,
      apparaat,
      jaar,
      afbeeldingUrl,
      reparaties,
    };

    const result = await db.collection("modellen").insertOne(doc);
    return res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (err) {
    console.error("POST /models error:", err);
    return res.status(500).json({ error: "Failed to create model" });
  }
});

// get repairs catalog (now exposing real _id for stable linking)
router.get("/repairs", async (req, res) => {
  try {
    const reps = await db
      .collection("reparatietypes")
      .aggregate([
        {
          $project: {
            naam: 1,
            beschrijving: 1,
            duurMinuten: 1,
            icoon: 1,
            sortOrder: { $ifNull: ["$sortOrder", 1000000] },
          },
        },
        { $sort: { sortOrder: 1, naam: 1 } },
      ])
      .toArray();

    const normalized = reps.map((r) => ({
      id: String(r._id),
      _id: String(r._id),
      naam: r.naam,
      beschrijving: r.beschrijving || "",
      duurMinuten: r.duurMinuten || null,
      icoon: r.icoon || "🛠️",
    }));
    res.json(normalized);
  } catch (err) {
    console.error("/repairs error:", err);
    res.status(500).json({ error: "Failed to fetch repairs" });
  }
});

// get a single repair type by id
router.get("/repairs/:id", async (req, res) => {
  try {
    const query = repairLookupQuery(req.params.id);
    const r = await db.collection("reparatietypes").findOne(query, {
      projection: { naam: 1, beschrijving: 1, duurMinuten: 1, icoon: 1 },
    });
    if (!r) return res.status(404).json({ error: "Niet gevonden" });
    return res.json({
      _id: String(r._id),
      id: String(r._id),
      naam: r.naam,
      beschrijving: r.beschrijving || "",
      duurMinuten: r.duurMinuten ?? null,
      icoon: r.icoon || "🛠️",
    });
  } catch (err) {
    console.error("GET /repairs/:id error:", err);
    res.status(500).json({ error: "Failed to fetch repair type" });
  }
});

// create a new repair type (admin only)
router.post("/repairs", authenticate, async (req, res) => {
  try {
    const body = req.body || {};
    const naam = (body.naam ?? body.name ?? "").toString().trim();
    const beschrijving = (body.beschrijving ?? body.description ?? "")
      .toString()
      .trim();
    const icoon = (body.icoon ?? body.icon ?? "").toString().trim();
    const duurRaw = body.duurMinuten ?? body.duration ?? null;

    if (!naam) return res.status(400).json({ error: "Naam is verplicht" });

    let duurMinuten = null;
    if (duurRaw !== null && duurRaw !== undefined && duurRaw !== "") {
      const n = Number(duurRaw);
      if (!Number.isFinite(n) || n < 0 || n > 24 * 60) {
        return res.status(400).json({ error: "Ongeldige duurMinuten" });
      }
      duurMinuten = Math.round(n);
    }

    // unique name check (case-insensitive)
    const existing = await db
      .collection("reparatietypes")
      .findOne({ naam: { $regex: `^${naam}$`, $options: "i" } });
    if (existing)
      return res.status(409).json({ error: "Reparatietype bestaat al" });

    const doc = {
      naam,
      beschrijving: beschrijving || "",
      duurMinuten,
      icoon: icoon || "🛠️",
    };
    const result = await db.collection("reparatietypes").insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (err) {
    console.error("POST /repairs error:", err);
    res.status(500).json({ error: "Failed to create repair type" });
  }
});

// update a repair type (admin only)
// Reorder repair types (admin only). Body: { order: [id1, id2, ...] }
router.put("/repairs/reorder", authenticate, async (req, res) => {
  try {
    const order = Array.isArray(req.body?.order) ? req.body.order : [];
    if (!order.length) {
      return res.status(400).json({ error: "order array required" });
    }
    // Build bulk updates to set sortOrder by index
    const ops = [];
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      if (!ObjectId.isValid(id)) continue;
      ops.push({
        updateOne: {
          filter: { _id: new ObjectId(id) },
          update: { $set: { sortOrder: i } },
        },
      });
    }
    if (!ops.length) return res.status(400).json({ error: "No valid ids" });
    const result = await db.collection("reparatietypes").bulkWrite(ops);
    return res.json({ ok: true, modified: result.modifiedCount ?? 0 });
  } catch (err) {
    console.error("PUT /repairs/reorder error:", err);
    res.status(500).json({ error: "Failed to reorder repairs" });
  }
});

router.put("/repairs/:id", authenticate, async (req, res) => {
  try {
    const body = req.body || {};
    const naam = (body.naam ?? body.name ?? "").toString().trim();
    const beschrijving = (body.beschrijving ?? body.description ?? "")
      .toString()
      .trim();
    const icoon = (body.icoon ?? body.icon ?? "").toString().trim();
    const duurRaw = body.duurMinuten ?? body.duration ?? null;

    if (!naam) return res.status(400).json({ error: "Naam is verplicht" });

    let duurMinuten = null;
    if (duurRaw !== null && duurRaw !== undefined && duurRaw !== "") {
      const n = Number(duurRaw);
      if (!Number.isFinite(n) || n < 0 || n > 24 * 60) {
        return res.status(400).json({ error: "Ongeldige duurMinuten" });
      }
      duurMinuten = Math.round(n);
    }

    const col = db.collection("reparatietypes");
    const current = await col.findOne(repairLookupQuery(req.params.id));
    if (!current) return res.status(404).json({ error: "Niet gevonden" });

    // unique name check excluding current id
    const clash = await col.findOne({
      _id: { $ne: current._id },
      naam: { $regex: `^${naam}$`, $options: "i" },
    });
    if (clash) return res.status(409).json({ error: "Naam bestaat al" });

    const update = {
      naam,
      beschrijving: beschrijving || "",
      icoon: icoon || "🛠️",
      duurMinuten,
    };
    const result = await col.updateOne({ _id: current._id }, { $set: update });
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Niet gevonden" });
    return res.json({ ok: true, updated: result.modifiedCount });
  } catch (err) {
    console.error("PUT /repairs/:id error:", err);
    res.status(500).json({ error: "Failed to update repair type" });
  }
});

// get a model's repair prices merged with catalog (match by name)
router.get("/models/:id/repairs", async (req, res) => {
  try {
    const id = req.params.id;
    let _id;
    try {
      _id = new ObjectId(id);
    } catch (e) {
      return res.status(400).json({ error: "Invalid model id" });
    }

    const model = await db
      .collection("modellen")
      .findOne(
        { _id },
        {
          projection: {
            model: 1,
            apparaat: 1,
            afbeeldingUrl: 1,
            reparaties: 1,
          },
        }
      );
    if (!model) return res.status(404).json({ error: "Model niet gevonden" });

    const repTypes = await db
      .collection("reparatietypes")
      .aggregate([
        {
          $project: {
            naam: 1,
            beschrijving: 1,
            duurMinuten: 1,
            icoon: 1,
            sortOrder: { $ifNull: ["$sortOrder", 1000000] },
          },
        },
        { $sort: { sortOrder: 1, naam: 1 } },
      ])
      .toArray();

    // Build maps for price and hidden sentinel. We use 999 as a sentinel to hide an option.
    const HIDE_SENTINEL = 999;
    const priceMapRaw = new Map(
      (Array.isArray(model.reparaties) ? model.reparaties : []).map((r) => [
        String(r.typeNaam).toLowerCase(),
        Number(r.prijs),
      ])
    );
    const hiddenSet = new Set(
      Array.from(priceMapRaw.entries())
        .filter(([, price]) => price === HIDE_SENTINEL)
        .map(([name]) => name)
    );

    // Device-specific screen type rules
    // By request: iPads should show Touchscreen + LCD instead of Basic/Premium/Origineel scherm.
    const nameLower = String(model.model || "").toLowerCase();
    const apparaat = String(model.apparaat || "").toLowerCase();
    const isIpad =
      apparaat.includes("tablet") ||
      /\bipad\b/i.test(model.model || "") ||
      nameLower.startsWith("ipad");

    // Helper matchers (normalized lowercase key)
    const isStandardScreen = (key) => {
      if (!key) return false;
      return (
        key === "basic scherm" ||
        key === "premium scherm" ||
        key === "origineel scherm" ||
        key === "originele scherm" ||
        (key.includes("scherm") &&
          (key.includes("basic") ||
            key.includes("premium") ||
            key.includes("origineel") ||
            key.includes("original") ||
            key.includes("oem")))
      );
    };
    const isIpadScreenSpecific = (key) => {
      if (!key) return false;
      return key === "touchscreen" || key === "lcd" || key === "lcd scherm";
    };

    const merged = repTypes.map((r) => {
      const key = String(r.naam).toLowerCase();
      const raw = priceMapRaw.get(key);
      const hidden = hiddenSet.has(key);
      const prijs = hidden ? null : raw ?? null;
      // Apply device-specific visibility rules on top of the sentinel
      const extraHidden = isIpad
        ? isStandardScreen(key)
        : isIpadScreenSpecific(key);
      return {
        id: r.naam,
        naam: r.naam,
        beschrijving: r.beschrijving || "",
        duurMinuten: r.duurMinuten || null,
        icoon: r.icoon || "🛠️",
        prijs,
        hidden: hidden || extraHidden,
      };
    });

    res.json({
      modelId: model._id,
      modelNaam: model.model,
      imageUrl: model.afbeeldingUrl || null,
      reparaties: merged,
    });
  } catch (err) {
    console.error("/models/:id/repairs error:", err);
    res.status(500).json({ error: "Failed to fetch model repairs" });
  }
});

//login
router.post("/login", async (req, res) => {
  try {
    const username = (req.body?.username ?? "").toString().trim();
    const password = (req.body?.password ?? "").toString();

    if (!username || !password) {
      console.warn("/login: missing body or fields", {
        hasBody: !!req.body,
        contentType: req.headers["content-type"],
      });
      return res.status(400).json({ error: "Missing username or password" });
    }

    const user = await db.collection("users").findOne({ username });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const stored = user.password ?? "";
    const looksHashed =
      typeof stored === "string" && /^\$2[aby]?\$\d+\$/.test(stored);
    if (!looksHashed) {
      console.warn(
        "/login: stored password is not bcrypt-hashed for user",
        String(user._id)
      );
      return res.status(401).json({ error: "Invalid credentials" });
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, stored);
    } catch (cmpErr) {
      console.warn("/login: bcrypt compare error", cmpErr?.message);
    }
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("/login error: missing JWT_SECRET");
      return res.status(500).json({ error: "Server misconfigured" });
    }
    const token = jwt.sign({ userId: user._id }, secret, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    console.error("/login error:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Get a single model's details
router.get("/models/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid id" });
    const _id = new ObjectId(id);
    const m = await db.collection("modellen").findOne(
      { _id },
      {
        projection: {
          merkId: 1,
          model: 1,
          apparaat: 1,
          jaar: 1,
          afbeeldingUrl: 1,
        },
      }
    );
    if (!m) return res.status(404).json({ error: "Model niet gevonden" });
    return res.json({
      _id: m._id,
      brandId: m.merkId,
      model: m.model,
      apparaat: m.apparaat || null,
      year: m.jaar ?? null,
      imageUrl: m.afbeeldingUrl || null,
    });
  } catch (err) {
    console.error("GET /models/:id error:", err);
    res.status(500).json({ error: "Failed to fetch model" });
  }
});

// Update a model's core fields (admin only)
router.put("/models/:id", authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid id" });
    const _id = new ObjectId(id);

    const body = req.body || {};
    const updates = {};

    if (body.model != null) {
      const name = String(body.model).trim();
      if (!name)
        return res.status(400).json({ error: "Modelnaam is verplicht" });
      updates.model = name;
    }

    if (body.brandId != null) {
      const s = String(body.brandId);
      if (!ObjectId.isValid(s))
        return res.status(400).json({ error: "Invalid brandId" });
      updates.merkId = new ObjectId(s);
    }

    if (body.year !== undefined) {
      if (body.year === null || body.year === "") {
        updates.jaar = null;
      } else {
        const n = Number(body.year);
        if (!Number.isFinite(n) || n < 1990 || n > 2100)
          return res.status(400).json({ error: "Invalid year" });
        updates.jaar = Math.round(n);
      }
    }

    if (body.imageUrl !== undefined || body.afbeeldingUrl !== undefined) {
      const url = (body.imageUrl ?? body.afbeeldingUrl ?? "").toString().trim();
      updates.afbeeldingUrl = url || null;
    }

    if (body.apparaat !== undefined) {
      const app = String(body.apparaat || "").trim();
      updates.apparaat = app || "smartphone";
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Geen wijzigingen opgegeven" });
    }

    const result = await db
      .collection("modellen")
      .updateOne({ _id }, { $set: updates });
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Model niet gevonden" });
    return res.json({ ok: true, updated: result.modifiedCount });
  } catch (err) {
    console.error("PUT /models/:id error:", err);
    res.status(500).json({ error: "Failed to update model" });
  }
});

// Delete a model (admin only)
router.delete("/models/:id", authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid id" });
    const _id = new ObjectId(id);
    const del = await db.collection("modellen").deleteOne({ _id });
    if (del.deletedCount === 0)
      return res.status(404).json({ error: "Model niet gevonden" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /models/:id error:", err);
    res.status(500).json({ error: "Failed to delete model" });
  }
});

// Contact form submission: store message for follow-up
router.post("/contact", async (req, res) => {
  try {
    const body = req.body || {};
    const name = (body.name ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const phone = (body.phone ?? "").toString().trim();
    const message = (body.message ?? "").toString().trim();

    if (name.length < 2) {
      return res.status(400).json({ error: "Naam is te kort" });
    }
    if (!email && !phone) {
      return res.status(400).json({ error: "E-mail of telefoon is verplicht" });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Ongeldig e-mailadres" });
    }
    if (message.length < 5) {
      return res.status(400).json({ error: "Bericht is te kort" });
    }

    const doc = {
      name,
      email: email || null,
      phone: phone || null,
      message,
      createdAt: new Date(),
      meta: {
        ip:
          req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
          req.socket?.remoteAddress ||
          null,
        ua: req.headers["user-agent"] || null,
      },
    };

    await db.collection("contact_messages").insertOne(doc);
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /contact error:", err);
    res.status(500).json({ error: "Kon bericht niet opslaan" });
  }
});
