import express from "express";
export const router = express.Router();
import { db } from "../server.mjs";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

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
      .find({}, { projection: { merk: 1, logo: 1 } })
      .sort({ merk: 1 })
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

// get models by brand ID (optional q for search)
router.get("/models", async (req, res) => {
  try {
    const { brandId, q } = req.query;
    const filter = {};
    if (brandId) {
      try {
        filter.merkId = new ObjectId(brandId);
      } catch (e) {
        return res.status(400).json({ error: "Invalid brandId" });
      }
    }
    if (q) filter.model = { $regex: q, $options: "i" };

    const docs = await db
      .collection("modellen")
      .find(filter, { projection: { model: 1, afbeeldingUrl: 1 } })
      .sort({ model: 1 })
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

// get repairs catalog (match by name in frontend)
router.get("/repairs", async (req, res) => {
  try {
    const reps = await db
      .collection("reparatietypes")
      .find(
        {},
        { projection: { naam: 1, beschrijving: 1, duurMinuten: 1, icoon: 1 } }
      )
      .sort({ naam: 1 })
      .toArray();
    const normalized = reps.map((r) => ({
      id: r.naam, // use naam as id for name-matching approach
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
        { projection: { model: 1, afbeeldingUrl: 1, reparaties: 1 } }
      );
    if (!model) return res.status(404).json({ error: "Model niet gevonden" });

    const repTypes = await db
      .collection("reparatietypes")
      .find(
        {},
        { projection: { naam: 1, beschrijving: 1, duurMinuten: 1, icoon: 1 } }
      )
      .toArray();

    const priceMap = new Map(
      (Array.isArray(model.reparaties) ? model.reparaties : []).map((r) => [
        String(r.typeNaam).toLowerCase(),
        r.prijs,
      ])
    );

    const merged = repTypes.map((r) => ({
      id: r.naam,
      naam: r.naam,
      beschrijving: r.beschrijving || "",
      duurMinuten: r.duurMinuten || null,
      icoon: r.icoon || "🛠️",
      prijs: priceMap.get(String(r.naam).toLowerCase()) ?? null,
    }));

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
