import express from "express";
import nodemailer from "nodemailer";
export const router = express.Router();
import { db } from "../server.mjs";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

// Minimal HTML escaping for safe email templates
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildContactHtml({
  title,
  name,
  email,
  phone,
  message,
  brand = "Save My Phone",
}) {
  const escName = escapeHtml(name);
  const escEmail = escapeHtml(email || "");
  const escPhone = escapeHtml(phone || "");
  const escMessage = escapeHtml(message || "").replace(/\n/g, "<br>");
  const accent = "#f97316"; // subtle orange accent
  const textColor = "#111827"; // gray-900
  const muted = "#6b7280"; // gray-500
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;padding:24px;background:#f8fafc;color:${textColor};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Helvetica Neue',Arial,'Noto Sans','Apple Color Emoji','Segoe UI Emoji',sans-serif;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="background:${accent};color:#fff;padding:16px 20px;font-weight:600;font-size:16px;">
          ${escapeHtml(brand)}
        </div>
        <div style="padding:20px 20px 8px 20px;">
          <h1 style="margin:0 0 12px 0;font-size:18px;line-height:1.3;color:${textColor};">${escapeHtml(
    title
  )}</h1>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-top:8px;margin-bottom:16px;">
            <tbody>
              <tr>
                <td style="padding:6px 0;width:120px;color:${muted};font-size:14px;">Naam</td>
                <td style="padding:6px 0;font-size:14px;color:${textColor};">${escName}</td>
              </tr>
              ${
                email
                  ? `<tr>
                <td style="padding:6px 0;width:120px;color:${muted};font-size:14px;">E‑mail</td>
                <td style="padding:6px 0;font-size:14px;color:${textColor};">${escEmail}</td>
              </tr>`
                  : ""
              }
              ${
                phone
                  ? `<tr>
                <td style="padding:6px 0;width:120px;color:${muted};font-size:14px;">Telefoon</td>
                <td style="padding:6px 0;font-size:14px;color:${textColor};">${escPhone}</td>
              </tr>`
                  : ""
              }
            </tbody>
          </table>
          <div style="margin-top:8px;margin-bottom:6px;color:${muted};font-size:13px;">Bericht</div>
          <div style="white-space:normal;word-break:break-word;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;font-size:14px;color:${textColor};background:#fafafa;">${escMessage}</div>
        </div>
        <div style="padding:14px 20px;color:${muted};font-size:12px;background:#fafafa;border-top:1px solid #f1f5f9;">
          Dit bericht is verzonden via het contactformulier op ${escapeHtml(
            brand
          )}.
        </div>
      </div>
    </body>
  </html>`;
}

// ===== Email helper for contact form =====
const SMTP_HOST = process.env.SMTP_HOST || "mail.mijndomein.nl";

function buildTransportConfigs() {
  const user = process.env.MIJNDOMEINMAIL || "";
  const pass = process.env.MIJNDOMEINWACHTWOORD || "";
  if (!user || !pass) return [];
  return [
    {
      host: SMTP_HOST,
      port: 465,
      secure: true,
      auth: { user, pass },
      greetingTimeout: 8000,
      connectionTimeout: 8000,
    },
    {
      host: SMTP_HOST,
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
      greetingTimeout: 8000,
      connectionTimeout: 8000,
    },
  ];
}

async function sendContactEmails({ name, email, phone, message }) {
  try {
    const transports = buildTransportConfigs();
    if (!transports.length) {
      console.warn(
        "Contact email skipped: missing MIJNDOMEINMAIL/MIJNDOMEINWACHTWOORD"
      );
      return { skipped: true };
    }
    const owner =
      (process.env.CONTACT_OWNER_EMAIL || "").trim() || transports[0].auth.user;
    const baseTitleOwner = "Nieuw bericht via contactformulier";
    const baseTitleUser = "We hebben je bericht ontvangen";
    const ownerHtml = buildContactHtml({
      title: baseTitleOwner,
      name,
      email,
      phone,
      message,
    });
    const confirmHtml = buildContactHtml({
      title: baseTitleUser,
      name,
      email,
      phone,
      message,
    });
    const textOwner = `${name}\nEmail: ${email || "-"}\nTelefoon: ${
      phone || "-"
    }\n\n${message}`;
    const textUser = `Beste ${name},\n\nBedankt voor je bericht. We nemen zo snel mogelijk contact met je op.\n\nJe bericht:\n${message}\n\nGroeten,\nSave My Phone`;

    let lastErr;
    for (const cfg of transports) {
      try {
        const transporter = nodemailer.createTransport(cfg);
        // Optional verify (don't fail if verification errors)
        await transporter.verify().catch(() => {});
        const tasks = [];
        if (owner) {
          tasks.push(
            transporter.sendMail({
              from: `"Save My Phone" <${cfg.auth.user}>`,
              to: owner,
              subject: `Contact: ${name}`,
              html: ownerHtml,
              text: textOwner,
            })
          );
        }
        if (email) {
          tasks.push(
            transporter.sendMail({
              from: `"Save My Phone" <${cfg.auth.user}>`,
              to: email,
              subject: baseTitleUser,
              html: confirmHtml,
              text: textUser,
            })
          );
        }
        await Promise.all(tasks);
        return { ok: true, transportPort: cfg.port };
      } catch (err) {
        lastErr = err;
        console.warn(
          "Contact email transport failed",
          cfg.port,
          err?.message || err
        );
      }
    }
    console.error(
      "All contact email transports failed",
      lastErr?.message || lastErr
    );
    return { ok: false, error: lastErr?.message };
  } catch (fatal) {
    console.error("sendContactEmails fatal error", fatal?.message || fatal);
    return { ok: false, error: fatal?.message };
  }
}

function buildBookingHtml({
  title,
  firstName,
  lastName,
  email,
  phone,
  device,
  repairs,
  start,
  end,
  additionalNotes,
  brand = "Save My Phone",
}) {
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || "(onbekend)";
  const escName = escapeHtml(fullName);
  const escEmail = escapeHtml(email || "");
  const escPhone = escapeHtml(phone || "");
  const escDevice = escapeHtml(device || "");
  const escNotes = escapeHtml(additionalNotes || "").replace(/\n/g, "<br>");
  const accent = "#f97316";
  const textColor = "#111827";
  const muted = "#6b7280";
  const escStart = escapeHtml(start || "");
  const escEnd = escapeHtml(end || "");
  const repairsRows = (repairs || [])
    .map((r) => {
      const name = escapeHtml(r.name || r.naam || "?");
      const price = r.price ? `€${escapeHtml(String(r.price))}` : "";
      const duration =
        r.duration || r.duurMinuten
          ? `${escapeHtml(String(r.duration || r.duurMinuten))} min`
          : "";
      return `<tr><td style=\"padding:6px 8px;border-bottom:1px solid #f1f5f9;\">${name}</td><td style=\"padding:6px 8px;border-bottom:1px solid #f1f5f9;white-space:nowrap;\">${price}</td><td style=\"padding:6px 8px;border-bottom:1px solid #f1f5f9;white-space:nowrap;\">${duration}</td></tr>`;
    })
    .join("");
  const repairsTable = repairsRows
    ? `<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"width:100%;border-collapse:collapse;margin-top:8px;margin-bottom:16px;font-size:13px;\"><thead><tr style=\"background:#fff5f2;\"><th style=\"text-align:left;padding:6px 8px;font-weight:600;\">Reparatie</th><th style=\"text-align:left;padding:6px 8px;font-weight:600;\">Prijs</th><th style=\"text-align:left;padding:6px 8px;font-weight:600;\">Duur</th></tr></thead><tbody>${repairsRows}</tbody></table>`
    : `<p style=\"margin:8px 0 16px;color:${muted};font-size:13px;\">Geen reparaties opgegeven.</p>`;
  return `<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>${escapeHtml(
    title
  )}</title></head><body style=\"margin:0;padding:24px;background:#f8fafc;color:${textColor};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Helvetica Neue',Arial,'Noto Sans','Apple Color Emoji','Segoe UI Emoji',sans-serif;\"><div style=\"max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;\"><div style=\"background:${accent};color:#fff;padding:16px 22px;font-weight:600;font-size:16px;\">${escapeHtml(
    brand
  )}</div><div style=\"padding:22px 22px 12px 22px;\"><h1 style=\"margin:0 0 14px;font-size:19px;line-height:1.35;color:${textColor};\">${escapeHtml(
    title
  )}</h1><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"width:100%;border-collapse:collapse;margin-top:4px;margin-bottom:14px;font-size:14px;\"><tbody><tr><td style=\"padding:6px 0;width:140px;color:${muted};\">Klant</td><td style=\"padding:6px 0;\">${escName}</td></tr>${
    email
      ? `<tr><td style=\"padding:6px 0;width:140px;color:${muted};\">E‑mail</td><td style=\"padding:6px 0;\">${escEmail}</td></tr>`
      : ""
  }${
    phone
      ? `<tr><td style=\"padding:6px 0;width:140px;color:${muted};\">Telefoon</td><td style=\"padding:6px 0;\">${escPhone}</td></tr>`
      : ""
  }${
    device
      ? `<tr><td style=\"padding:6px 0;width:140px;color:${muted};\">Toestel</td><td style=\"padding:6px 0;\">${escDevice}</td></tr>`
      : ""
  }<tr><td style=\"padding:6px 0;width:140px;color:${muted};\">Start</td><td style=\"padding:6px 0;\">${escStart}</td></tr><tr><td style=\"padding:6px 0;width:140px;color:${muted};\">Einde</td><td style=\"padding:6px 0;\">${escEnd}</td></tr></tbody></table><div style=\"margin-top:4px;margin-bottom:6px;color:${muted};font-size:13px;\">Reparaties</div>${repairsTable}${
    additionalNotes
      ? `<div style=\"margin-top:10px;margin-bottom:6px;color:${muted};font-size:13px;\">Opmerking</div><div style=\"white-space:normal;word-break:break-word;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;font-size:14px;color:${textColor};background:#fafafa;\">${escNotes}</div>`
      : ""
  }</div><div style=\"padding:14px 22px;color:${muted};font-size:12px;background:#fafafa;border-top:1px solid #f1f5f9;\">Deze bevestiging is gegenereerd door ${escapeHtml(
    brand
  )}. Bewaar dit voor je administratie.</div></div></body></html>`;
}

async function sendBookingEmails({
  firstName,
  lastName,
  email,
  phone,
  device,
  repairs,
  start,
  end,
  additionalNotes,
}) {
  try {
    const transports = buildTransportConfigs();
    if (!transports.length) return { skipped: true };
    const owner =
      (process.env.CONTACT_OWNER_EMAIL || "").trim() || transports[0].auth.user;
    const titleOwner = "Nieuwe afspraak geboekt";
    const titleUser = "Bevestiging van je afspraak";
    const ownerHtml = buildBookingHtml({
      title: titleOwner,
      firstName,
      lastName,
      email,
      phone,
      device,
      repairs,
      start,
      end,
      additionalNotes,
    });
    const userHtml = buildBookingHtml({
      title: titleUser,
      firstName,
      lastName,
      email,
      phone,
      device,
      repairs,
      start,
      end,
      additionalNotes,
    });
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Klant";
    const textOwner = `${titleOwner}\nNaam: ${fullName}\nEmail: ${
      email || "-"
    }\nTelefoon: ${phone || "-"}\nStart: ${start}\nEinde: ${end}\nToestel: ${
      device || "-"
    }\nReparaties: ${(repairs || [])
      .map((r) => r.name || r.naam || "?")
      .join(", ")}\n\nOpmerking:\n${additionalNotes || "-"}`;
    const textUser = `Beste ${fullName},\n\nDit is je afspraakbevestiging.\nStart: ${start}\nEinde: ${end}\nToestel: ${
      device || "-"
    }\nReparaties: ${(repairs || [])
      .map((r) => r.name || r.naam || "?")
      .join(", ")}\n\nOpmerking:\n${
      additionalNotes || "-"
    }\n\nTot snel!\nSave My Phone`;
    let lastErr;
    for (const cfg of transports) {
      try {
        const transporter = nodemailer.createTransport(cfg);
        await transporter.verify().catch(() => {});
        const tasks = [];
        if (owner) {
          tasks.push(
            transporter.sendMail({
              from: `"Save My Phone" <${cfg.auth.user}>`,
              to: owner,
              subject: `Afspraak: ${fullName}`,
              html: ownerHtml,
              text: textOwner,
            })
          );
        }
        if (email) {
          tasks.push(
            transporter.sendMail({
              from: `"Save My Phone" <${cfg.auth.user}>`,
              to: email,
              subject: titleUser,
              html: userHtml,
              text: textUser,
            })
          );
        }
        await Promise.all(tasks);
        return { ok: true, transportPort: cfg.port };
      } catch (err) {
        lastErr = err;
        console.warn(
          "sendBookingEmails transport failed",
          cfg.port,
          err?.message || err
        );
      }
    }
    console.error(
      "All booking email transports failed",
      lastErr?.message || lastErr
    );
    return { ok: false, error: lastErr?.message };
  } catch (fatal) {
    console.error("sendBookingEmails fatal", fatal?.message || fatal);
    return { ok: false, error: fatal?.message };
  }
}

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

// Escape a string for safe use inside a RegExp pattern
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    const oldName = String(current.naam || "");
    const nameChanged =
      oldName.localeCompare(naam, undefined, {
        sensitivity: "accent",
      }) !== 0;

    const result = await col.updateOne({ _id: current._id }, { $set: update });
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Niet gevonden" });

    let modelsUpdated = 0;
    if (nameChanged && oldName) {
      try {
        const pattern = `^${escapeRegex(oldName)}$`;
        const mres = await db.collection("modellen").updateMany(
          { "reparaties.typeNaam": { $regex: pattern, $options: "i" } },
          { $set: { "reparaties.$[elem].typeNaam": naam } },
          {
            arrayFilters: [
              { "elem.typeNaam": { $regex: pattern, $options: "i" } },
            ],
          }
        );
        modelsUpdated = mres.modifiedCount || 0;
      } catch (propErr) {
        console.error(
          "Failed to propagate repair type rename to models:",
          propErr
        );
      }
    }

    return res.json({
      ok: true,
      updated: result.modifiedCount,
      modelsUpdated,
      renamed: nameChanged,
    });
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

    const model = await db.collection("modellen").findOne(
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
// Build an array of transport configs (always include 465 + 587 for reliability)

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

    // Fire-and-forget email sending (owner + optional confirmation to user)
    sendContactEmails(doc).catch((err) => {
      console.warn("sendContactEmails failed", err?.message);
    });
    return res.json({ ok: true, mailed: !!email });
  } catch (err) {
    console.error("POST /contact error:", err);
    res.status(500).json({ error: "Kon bericht niet opslaan" });
  }
});

// ====== REM booking integration ======
// Uses REM_API or VITE_REM_API as Bearer token to call https://api.roapp.io
const REM_API_KEY = process.env.REM_API || process.env.VITE_REM_API || "";

const REM_BASE = "https://api.roapp.io";

async function remFetch(path, { method = "GET", body } = {}) {
  if (!REM_API_KEY) throw new Error("Missing REM API key (REM_API)");
  const headers = {
    accept: "application/json",
    authorization: `Bearer ${REM_API_KEY}`,
  };
  const opts = { method, headers };
  if (body) {
    headers["content-type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const resp = await fetch(`${REM_BASE}${path}`, opts);
  const textCt = resp.headers.get("content-type") || "";
  const isJson = textCt.toLowerCase().includes("application/json");
  const data = isJson ? await resp.json().catch(() => null) : null;
  if (!resp.ok) {
    const msg = data?.message || data?.error || `REM HTTP ${resp.status}`;
    const err = new Error(msg);
    err.status = resp.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Normalize Dutch phone to match REM format (e.g., 06xxxx -> 316xxxx, drop '+')
function normalizeNlPhone(p) {
  const digits = String(p || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("31")) return digits; // already E.164 without plus
  if (digits.startsWith("0") && digits.length >= 10) {
    return `31${digits.slice(1)}`;
  }
  return digits; // fallback
}

async function remFindPerson({ email, phone }) {
  // Iterate all pages of contacts to locate a match by email or phone
  let page = 1;
  const normEmail = String(email || "")
    .trim()
    .toLowerCase();
  const normPhone = normalizeNlPhone(phone);
  // First page to get total_pages
  const first = await remFetch(`/contacts/people?page=${page}`);
  const totalPages = Number(first?.total_pages || 1);
  const scan = (arr) => {
    for (const p of arr || []) {
      const e = String(p.email || "")
        .trim()
        .toLowerCase();
      if (normEmail && e && e === normEmail) return p;
      if (normPhone && Array.isArray(p.phones)) {
        for (const ph of p.phones) {
          const hp = normalizeNlPhone(ph?.phone);
          if (hp && hp === normPhone) return p;
        }
      }
    }
    return null;
  };
  let hit = scan(first?.data);
  if (hit) return hit;
  for (page = 2; page <= totalPages; page++) {
    const resp = await remFetch(`/contacts/people?page=${page}`);
    hit = scan(resp?.data);
    if (hit) return hit;
  }
  return null;
}

async function remCreatePerson({ firstName, lastName, email, phone }) {
  const payload = {
    first_name: String(firstName || "").trim() || "",
    last_name: String(lastName || "").trim() || "",
    email: String(email || "").trim() || "",
    phones: phone
      ? [
          {
            title: "Werk",
            phone: normalizeNlPhone(phone),
            notify: false,
            has_viber: false,
            has_whatsapp: false,
          },
        ]
      : [],
  };
  // Remove empty email/phones to avoid validation errors
  if (!payload.email) delete payload.email;
  if (!payload.phones.length) delete payload.phones;
  const created = await remFetch(`/contacts/people`, {
    method: "POST",
    body: payload,
  });
  return created;
}

function toIsoRange(dateStr, timeStr, minutes = 60) {
  // Build local date/time and return ISO strings for start and end
  const [y, m, d] = (dateStr || "").split("-").map((n) => Number(n));
  const [hh, mm] = (timeStr || "00:00").split(":").map((n) => Number(n));
  const start = new Date(Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0));
  const end = new Date(start.getTime() + Math.max(15, minutes) * 60000);
  return { start: start.toISOString(), end: end.toISOString() };
}

router.post("/booking", async (req, res) => {
  try {
    if (!REM_API_KEY) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: missing REM_API key" });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      preferredDate,
      preferredTime,
      additionalNotes,
      device, // e.g., "Apple iPhone 12"
      repairs = [], // array of { name, duration, price }
      branchId, // optional for now; will be configured later
    } = req.body || {};

    if (!preferredDate || !preferredTime) {
      return res.status(400).json({ error: "preferredDate/time required" });
    }

    // Compute duration from repairs (sum minutes); fallback 60
    const parseMinutes = (v) => {
      if (v == null) return 0;
      if (typeof v === "number" && Number.isFinite(v)) return v;
      const m = String(v).match(/(\d{1,3})/);
      return m ? Number(m[1]) : 0;
    };
    const totalMin = Math.max(
      30,
      repairs.reduce(
        (sum, r) => sum + parseMinutes(r?.duurMinuten || r?.duration),
        0
      ) || 60
    );
    const { start, end } = toIsoRange(preferredDate, preferredTime, totalMin);

    // Find or create contact
    let person = await remFindPerson({ email, phone });
    if (!person) {
      person = await remCreatePerson({ firstName, lastName, email, phone });
    }
    const clientId = person?.id || person?.data?.id || person?._id;
    if (!clientId) {
      return res.status(502).json({ error: "Failed to resolve client id" });
    }

    // Determine branch and assignee
    const resolvedBranchId =
      branchId || process.env.REM_BRANCH_ID || process.env.VITE_REM_BRANCH_ID;
    if (!resolvedBranchId) {
      return res
        .status(400)
        .json({ error: "branchId is required for booking" });
    }
    const assigneeId = Number(process.env.REM_ASSIGNEE_ID || 286802);

    const commentParts = [];
    if (device) commentParts.push(`Device: ${device}`);
    if (repairs?.length) {
      commentParts.push(
        `Repairs: ${repairs
          .map(
            (r) =>
              `${r.name || r.naam || "?"}${r.price ? ` (€${r.price})` : ""}`
          )
          .join(", ")}`
      );
    }
    if (additionalNotes) commentParts.push(`Comment: ${additionalNotes}`);
    const comment = commentParts.join(" | ");

    const bookingPayload = {
      branch_id: Number(resolvedBranchId),
      assignee_id: Number(assigneeId),
      client_id: Number(clientId),
      scheduled_for: start,
      scheduled_to: end,
      comment,
    };

    const booking = await remFetch(`/bookings`, {
      method: "POST",
      body: bookingPayload,
    });

    // Fire-and-forget booking emails (owner + user confirmation)
    const mailPayload = {
      firstName,
      lastName,
      email,
      phone,
      device,
      repairs,
      start,
      end,
      additionalNotes,
    };
    sendBookingEmails(mailPayload).catch((err) => {
      console.warn("sendBookingEmails failed", err?.message);
    });
    return res.json({ ok: true, clientId, booking, mailed: !!email });
  } catch (err) {
    console.error("POST /booking error:", err?.status || "", err?.data || err);
    const status = err?.status || 500;
    return res
      .status(status)
      .json({ error: err?.message || "Failed to create booking" });
  }
});

// ====== Blog endpoints ======
// List all blogs (public)
router.get("/blogs", async (req, res) => {
  try {
    const docs = await db
      .collection("blogs")
      .find(
        {},
        {
          projection: {
            title: 1,
            slug: 1,
            content: 1,
            createdAt: 1,
            imageUrl: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .toArray();
    // Provide an excerpt for convenience
    const blogs = docs.map((b) => ({
      _id: b._id,
      title: b.title,
      slug: b.slug,
      createdAt: b.createdAt,
      imageUrl: b.imageUrl || null,
      excerpt: (b.content || "").replace(/\s+/g, " ").slice(0, 220),
    }));
    res.json(blogs);
  } catch (err) {
    console.error("GET /blogs error:", err);
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

// Get a single blog by slug (public)
router.get("/blogs/:slug", async (req, res) => {
  try {
    const slug = (req.params.slug || "").toString().trim().toLowerCase();
    if (!slug) return res.status(400).json({ error: "Invalid slug" });
    const doc = await db.collection("blogs").findOne(
      { slug },
      {
        projection: {
          title: 1,
          slug: 1,
          content: 1,
          createdAt: 1,
          imageUrl: 1,
        },
      }
    );
    if (!doc) return res.status(404).json({ error: "Blog niet gevonden" });
    res.json(doc);
  } catch (err) {
    console.error("GET /blogs/:slug error:", err);
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

// Create a new blog (admin only)
router.post("/admin/blogs", authenticate, async (req, res) => {
  try {
    const body = req.body || {};
    const title = (body.title || "").toString().trim();
    const content = (body.content || "").toString().trim();
    const imageUrlRaw = (body.imageUrl || body.cover || "").toString().trim();
    if (!title || !content) {
      return res.status(400).json({ error: "Titel en content zijn verplicht" });
    }
    // Generate slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!baseSlug) {
      return res.status(400).json({ error: "Ongeldige titel voor slug" });
    }
    let slug = baseSlug;
    let i = 2;
    while (await db.collection("blogs").findOne({ slug })) {
      slug = `${baseSlug}-${i++}`;
    }
    let imageUrl = null;
    if (imageUrlRaw) {
      // Basic validation: must start with http(s)
      if (/^https?:\/\//i.test(imageUrlRaw)) {
        imageUrl = imageUrlRaw;
      } else {
        return res
          .status(400)
          .json({ error: "Afbeelding URL moet met http(s) beginnen" });
      }
    }
    const doc = {
      title,
      slug,
      content,
      createdAt: new Date(),
      authorId: req.userId || null,
      imageUrl,
    };
    const result = await db.collection("blogs").insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (err) {
    console.error("POST /admin/blogs error:", err);
    res.status(500).json({ error: "Failed to create blog" });
  }
});

// Admin: list all blogs with full fields
router.get("/admin/blogs", authenticate, async (req, res) => {
  try {
    const docs = await db
      .collection("blogs")
      .find(
        {},
        {
          projection: {
            title: 1,
            slug: 1,
            content: 1,
            createdAt: 1,
            imageUrl: 1,
            authorId: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .toArray();
    res.json(docs);
  } catch (err) {
    console.error("GET /admin/blogs error:", err);
    res.status(500).json({ error: "Failed to fetch admin blogs" });
  }
});

// Admin: update a blog by id (regenerate slug if title changed)
router.put("/admin/blogs/:id", authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid id" });
    const _id = new ObjectId(id);
    const existing = await db.collection("blogs").findOne({ _id });
    if (!existing) return res.status(404).json({ error: "Blog niet gevonden" });

    const body = req.body || {};
    const updates = {};
    let titleChanged = false;
    if (body.title !== undefined) {
      const t = (body.title || "").toString().trim();
      if (!t)
        return res.status(400).json({ error: "Titel mag niet leeg zijn" });
      if (t !== existing.title) {
        titleChanged = true;
        updates.title = t;
      }
    }
    if (body.content !== undefined) {
      const c = (body.content || "").toString();
      updates.content = c;
    }
    if (body.imageUrl !== undefined) {
      const raw = (body.imageUrl || "").toString().trim();
      if (raw && !/^https?:\/\//i.test(raw)) {
        return res
          .status(400)
          .json({ error: "Afbeelding URL moet met http(s) beginnen" });
      }
      updates.imageUrl = raw || null;
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "Geen wijzigingen" });
    }
    if (titleChanged) {
      const baseSlug = updates.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (!baseSlug) {
        return res.status(400).json({ error: "Ongeldige titel voor slug" });
      }
      let slug = baseSlug;
      let i = 2;
      while (
        await db.collection("blogs").findOne({ slug, _id: { $ne: _id } })
      ) {
        slug = `${baseSlug}-${i++}`;
      }
      updates.slug = slug;
    }
    await db.collection("blogs").updateOne({ _id }, { $set: updates });
    const updated = await db.collection("blogs").findOne(
      { _id },
      {
        projection: {
          title: 1,
          slug: 1,
          content: 1,
          createdAt: 1,
          imageUrl: 1,
        },
      }
    );
    res.json({ ok: true, blog: updated });
  } catch (err) {
    console.error("PUT /admin/blogs/:id error:", err);
    res.status(500).json({ error: "Failed to update blog" });
  }
});

// Admin: delete a blog by id
router.delete("/admin/blogs/:id", authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid id" });
    const _id = new ObjectId(id);
    const del = await db.collection("blogs").deleteOne({ _id });
    if (!del.deletedCount)
      return res.status(404).json({ error: "Blog niet gevonden" });
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /admin/blogs/:id error:", err);
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

// Diagnostic endpoint to test SMTP connectivity (secured by DIAG_KEY env)
// (Email functionality removed; diagnostic & ping endpoints deleted.)

// ====== Phones for sale ======
// Public: list available phones for sale
router.get("/phones", async (req, res) => {
  try {
    const onlyAvailable = String(req.query.available || "1") !== "0";
    const match = onlyAvailable ? { available: { $ne: false } } : {};
    const docs = await db
      .collection("phones_for_sale")
      .find(match, {
        projection: {
          title: 1,
          brand: 1,
          model: 1,
          storage: 1,
          color: 1,
          price: 1,
          imageUrl: 1,
          imageUrls: 1,
          description: 1,
          available: 1,
          batteryPercentage: 1,
          createdAt: 1,
          condition: 1,
        },
      })
      .sort({ createdAt: -1 })
      .toArray();
    // Normalize legacy + new fields
    const normalized = docs.map((d) => {
      const imgs = Array.isArray(d.imageUrls)
        ? d.imageUrls.filter((u) => typeof u === "string" && u.trim())
        : [];
      return {
        ...d,
        imageUrls: imgs,
        imageUrl: d.imageUrl || imgs[0] || null,
        condition: d.condition || null,
      };
    });
    res.json(normalized);
  } catch (err) {
    console.error("GET /phones error:", err);
    res.status(500).json({ error: "Failed to fetch phones" });
  }
});

// Admin: list all phones including IMEI
router.get("/admin/phones", authenticate, async (req, res) => {
  try {
    const docs = await db
      .collection("phones_for_sale")
      .find(
        {},
        {
          projection: {
            title: 1,
            brand: 1,
            model: 1,
            storage: 1,
            color: 1,
            price: 1,
            imageUrl: 1,
            imageUrls: 1,
            description: 1,
            available: 1,
            batteryPercentage: 1,
            createdAt: 1,
            condition: 1,
            imei: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .toArray();
    const normalized = docs.map((d) => {
      const imgs = Array.isArray(d.imageUrls)
        ? d.imageUrls.filter((u) => typeof u === "string" && u.trim())
        : [];
      return {
        ...d,
        imageUrls: imgs,
        imageUrl: d.imageUrl || imgs[0] || null,
        condition: d.condition || null,
        imei: d.imei || null,
      };
    });
    res.json(normalized);
  } catch (err) {
    console.error("GET /admin/phones error:", err);
    res.status(500).json({ error: "Failed to fetch phones" });
  }
});

// Admin: add a phone for sale
router.post("/admin/phones", authenticate, async (req, res) => {
  try {
    const body = req.body || {};
    const title = (body.title || "").toString().trim();
    const brand = (body.brand || "").toString().trim();
    const model = (body.model || "").toString().trim();
    const storage = (body.storage || "").toString().trim();
    const color = (body.color || "").toString().trim();
    const priceNum = Number(body.price);
    const imageUrlRaw = (body.imageUrl || "").toString().trim();
    const description = (body.description || "").toString().trim();
    const available = body.available === false ? false : true;
    const batteryRaw = body.batteryPercentage;
    const imeiRaw = (body.imei || "").toString().replace(/\s+/g, "");
    const conditionRaw = (body.condition || "").toString().trim().toLowerCase();
    const allowedConditions = [
      "nieuw",
      "zo goed als nieuw",
      "refurbished",
      "zeer goed",
      "goed",
      "acceptabel",
    ];

    if (!title) return res.status(400).json({ error: "Titel is verplicht" });
    if (!brand || !model)
      return res.status(400).json({ error: "Merk en model zijn verplicht" });
    if (!Number.isFinite(priceNum) || priceNum <= 0)
      return res.status(400).json({ error: "Ongeldige prijs" });

    let batteryPercentage = null;
    if (batteryRaw !== undefined && batteryRaw !== null && batteryRaw !== "") {
      const b = Number(batteryRaw);
      if (!Number.isFinite(b) || b < 0 || b > 100)
        return res.status(400).json({ error: "Ongeldige batterij% (0-100)" });
      batteryPercentage = Math.round(b);
    }

    let imageUrl = null;
    if (imageUrlRaw) {
      if (!/^https?:\/\//i.test(imageUrlRaw)) {
        return res
          .status(400)
          .json({ error: "Afbeelding URL moet met http(s) beginnen" });
      }
      imageUrl = imageUrlRaw;
    }

    // Collect up to 3 image URLs
    let imageUrls = [];
    if (Array.isArray(body.imageUrls)) {
      imageUrls = body.imageUrls
        .map((u) => (u || "").toString().trim())
        .filter((u) => u && /^https?:\/\//i.test(u))
        .slice(0, 3);
    } else {
      const extra = [
        imageUrlRaw,
        (body.imageUrl1 || "").toString().trim(),
        (body.imageUrl2 || "").toString().trim(),
        (body.imageUrl3 || "").toString().trim(),
      ].filter((u, i) => u && /^https?:\/\//i.test(u) && i < 3);
      imageUrls = extra.slice(0, 3);
    }
    if (!imageUrl && imageUrls.length) imageUrl = imageUrls[0];

    let condition = null;
    if (conditionRaw) {
      if (!allowedConditions.includes(conditionRaw)) {
        return res.status(400).json({ error: "Ongeldige staat (condition)" });
      }
      condition = conditionRaw;
    }

    let imei = null;
    if (imeiRaw) {
      // Basic validation: numeric string length 10-20
      if (!/^\d{10,20}$/.test(imeiRaw)) {
        return res
          .status(400)
          .json({ error: "Ongeldige IMEI (10-20 cijfers)" });
      }
      imei = imeiRaw;
    }

    const doc = {
      title,
      brand,
      model,
      storage,
      color,
      price: Math.round(priceNum),
      imageUrl,
      imageUrls,
      description,
      available,
      batteryPercentage,
      createdAt: new Date(),
      authorId: req.userId || null,
      condition,
      imei,
    };
    const result = await db.collection("phones_for_sale").insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (err) {
    console.error("POST /admin/phones error:", err);
    res.status(500).json({ error: "Failed to add phone" });
  }
});

// Admin: update a phone
router.put("/admin/phones/:id", authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid id" });
    const _id = new ObjectId(id);
    const body = req.body || {};
    const updates = {};

    if (body.title !== undefined) {
      const t = (body.title || "").toString().trim();
      if (!t) return res.status(400).json({ error: "Titel is verplicht" });
      updates.title = t;
    }
    if (body.brand !== undefined)
      updates.brand = String(body.brand || "").trim();
    if (body.model !== undefined)
      updates.model = String(body.model || "").trim();
    if (body.storage !== undefined)
      updates.storage = String(body.storage || "").trim();
    if (body.color !== undefined)
      updates.color = String(body.color || "").trim();
    if (body.description !== undefined)
      updates.description = String(body.description || "").trim();
    if (body.available !== undefined) updates.available = !!body.available;
    if (body.price !== undefined) {
      const p = Number(body.price);
      if (!Number.isFinite(p) || p <= 0)
        return res.status(400).json({ error: "Ongeldige prijs" });
      updates.price = Math.round(p);
    }
    if (body.imageUrl !== undefined) {
      const raw = (body.imageUrl || "").toString().trim();
      if (raw && !/^https?:\/\//i.test(raw))
        return res
          .status(400)
          .json({ error: "Afbeelding URL moet met http(s) beginnen" });
      updates.imageUrl = raw || null;
    }
    if (body.batteryPercentage !== undefined) {
      const b = Number(body.batteryPercentage);
      if (!Number.isFinite(b) || b < 0 || b > 100)
        return res.status(400).json({ error: "Ongeldige batterij% (0-100)" });
      updates.batteryPercentage = Math.round(b);
    }

    if (Array.isArray(body.imageUrls)) {
      const arr = body.imageUrls
        .map((u) => (u || "").toString().trim())
        .filter((u) => u && /^https?:\/\//i.test(u))
        .slice(0, 3);
      updates.imageUrls = arr;
      if (!updates.imageUrl && arr.length) updates.imageUrl = arr[0];
    }

    if (body.condition !== undefined) {
      const cond = (body.condition || "").toString().trim().toLowerCase();
      if (cond) {
        const allowedConditions = [
          "nieuw",
          "zo goed als nieuw",
          "refurbished",
          "zeer goed",
          "goed",
          "acceptabel",
        ];
        if (!allowedConditions.includes(cond)) {
          return res.status(400).json({ error: "Ongeldige staat" });
        }
        updates.condition = cond;
      } else {
        updates.condition = null;
      }
    }

    if (body.imei !== undefined) {
      const imeiRaw = (body.imei || "").toString().replace(/\s+/g, "");
      if (imeiRaw) {
        if (!/^\d{10,20}$/.test(imeiRaw)) {
          return res.status(400).json({ error: "Ongeldige IMEI" });
        }
        updates.imei = imeiRaw;
      } else {
        updates.imei = null;
      }
    }

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ error: "Geen wijzigingen" });

    const result = await db
      .collection("phones_for_sale")
      .updateOne({ _id }, { $set: updates });
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Niet gevonden" });
    return res.json({ ok: true, updated: result.modifiedCount });
  } catch (err) {
    console.error("PUT /admin/phones/:id error:", err);
    res.status(500).json({ error: "Failed to update phone" });
  }
});

// Admin: delete a phone
router.delete("/admin/phones/:id", authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid id" });
    const _id = new ObjectId(id);
    const del = await db.collection("phones_for_sale").deleteOne({ _id });
    if (!del.deletedCount)
      return res.status(404).json({ error: "Niet gevonden" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /admin/phones/:id error:", err);
    res.status(500).json({ error: "Failed to delete phone" });
  }
});
