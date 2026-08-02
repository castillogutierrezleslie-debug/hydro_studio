require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { getPool } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ------------------------------------------------------------------
   Sesiones en memoria (suficiente para pruebas; se pierden si
   reinicias el servidor -- para produccion real se necesitaria algo
   persistente, ej. JWT o una tabla de sesiones).
------------------------------------------------------------------ */
const sessions = new Map(); // token -> { userId, email }

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = sessions.get(token);
  if (!session) return res.status(401).json({ error: "No autorizado. Inicia sesion de nuevo." });
  req.user = session;
  next();
}

/* ------------------------------------------------------------------
   Mapeo de tipo de punto -> tabla SQL y columnas propias
------------------------------------------------------------------ */
const TABLE_MAP = {
  pozo: {
    table: "Pozos",
    fields: {
      proyecto: "Proyecto",
      profundidad: "Profundidad", diametro: "Diametro",
      nivel_estatico: "NivelEstatico", nivel_dinamico: "NivelDinamico",
      caudal_bombeo: "CaudalBombeo", capacidad_especifica: "CapacidadEspecifica",
      uso: "Uso", litologia: "Litologia", obs: "Obs"
    }
  },
  manantial: {
    table: "Manantiales",
    fields: {
      proyecto: "Proyecto",
      caudal: "Caudal", temp: "Temp", metodo: "Metodo",
      tipo_aflor: "TipoAflor", vegetacion: "Vegetacion", obs: "Obs"
    }
  },
  calidad: {
    table: "CalidadAgua",
    fields: {
      proyecto: "Proyecto",
      ph: "PH", ce: "CE", temp: "Temp", od: "OD", std: "STD",
      turbidez: "Turbidez", ca: "Ca", mg: "Mg", na: "Na", k: "K",
      hco3: "Hco3", cl: "Cl", so4: "So4", obs: "Obs"
    }
  },
  geologia: {
    table: "PuntosGeologicos",
    fields: {
      proyecto: "Proyecto",
      formacion: "Formacion", litologia: "Litologia", rumbo: "Rumbo",
      buzamiento: "Buzamiento", estructuras: "Estructuras", obs: "Obs"
    }
  }
};

const NUMERIC_COLUMNS = new Set([
  "Profundidad", "Diametro", "NivelEstatico", "NivelDinamico", "CaudalBombeo", "CapacidadEspecifica",
  "Caudal", "Temp", "PH", "CE", "OD", "STD", "Turbidez", "Ca", "Mg", "Na", "K", "Hco3", "Cl", "So4"
]);

/* ------------------------------------------------------------------
   Salud del servidor (para el boton "Guardar y conectar" de la app)
------------------------------------------------------------------ */
app.get("/api/health", async (req, res) => {
  try {
    await getPool();
    res.json({ ok: true, db: "conectado" });
  } catch (err) {
    res.status(500).json({ ok: false, error: "No se pudo conectar a MySQL: " + err.message });
  }
});

/* ------------------------------------------------------------------
   Autenticacion
------------------------------------------------------------------ */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: "Correo y contrasena (minimo 6 caracteres) son obligatorios." });
    }
    const pool = await getPool();
    const [existing] = await pool.execute("SELECT Id FROM Usuarios WHERE Email = ?", [email]);
    if (existing.length) {
      return res.status(409).json({ error: "Ese correo ya esta registrado." });
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.execute("INSERT INTO Usuarios (Email, PasswordHash) VALUES (?, ?)", [email, hash]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor: " + err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Correo y contrasena son obligatorios." });
    const pool = await getPool();
    const [rows] = await pool.execute("SELECT Id, Email, PasswordHash FROM Usuarios WHERE Email = ?", [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Credenciales invalidas." });
    const valid = await bcrypt.compare(password, user.PasswordHash);
    if (!valid) return res.status(401).json({ error: "Credenciales invalidas." });
    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, { userId: user.Id, email: user.Email });
    res.json({ token, email: user.Email });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor: " + err.message });
  }
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  sessions.delete(token);
  res.json({ ok: true });
});

app.post("/api/auth/password", requireAuth, async (req, res) => {
  try {
    const { newPassword } = req.body || {};
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "La nueva contrasena debe tener al menos 6 caracteres." });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    const pool = await getPool();
    await pool.execute("UPDATE Usuarios SET PasswordHash = ? WHERE Id = ?", [hash, req.user.userId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor: " + err.message });
  }
});

/* ------------------------------------------------------------------
   Registros: insertar uno nuevo de un tipo
------------------------------------------------------------------ */
app.post("/api/records/:tipo", requireAuth, async (req, res) => {
  const cfg = TABLE_MAP[req.params.tipo];
  if (!cfg) return res.status(400).json({ error: "Tipo de punto invalido." });
  const body = req.body || {};

  try {
    const pool = await getPool();

    const columns = ["LocalId", "Codigo", "Fecha", "Lat", "Lon", "Alt", "GpsPrecision", "CreatedByEmail"];
    const values = [
      body.local_id || null,
      body.codigo || null,
      body.fecha ? new Date(body.fecha) : new Date(),
      body.lat ?? null,
      body.lon ?? null,
      body.alt ?? null,
      body.precision ?? null,
      req.user.email
    ];

    Object.entries(cfg.fields).forEach(([appKey, sqlCol]) => {
      const raw = body[appKey];
      columns.push(sqlCol);
      if (NUMERIC_COLUMNS.has(sqlCol)) {
        const num = raw !== undefined && raw !== null && raw !== "" ? parseFloat(raw) : null;
        values.push(isNaN(num) ? null : num);
      } else {
        values.push(raw !== undefined && raw !== null ? String(raw) : null);
      }
    });

    const placeholders = columns.map(() => "?").join(", ");
    const query = `INSERT INTO ${cfg.table} (${columns.join(", ")}) VALUES (${placeholders})`;
    const [result] = await pool.execute(query, values);
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Error al guardar: " + err.message });
  }
});

/* ------------------------------------------------------------------
   Registros: traer todos, agrupados por tipo
------------------------------------------------------------------ */
app.get("/api/records", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const out = {};
    for (const [tipo, cfg] of Object.entries(TABLE_MAP)) {
      const [rows] = await pool.query(`SELECT * FROM ${cfg.table} ORDER BY CreatedAt ASC`);
      out[tipo] = rows;
    }
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: "Error al leer registros: " + err.message });
  }
});

app.get("/api/records/:tipo", requireAuth, async (req, res) => {
  const cfg = TABLE_MAP[req.params.tipo];
  if (!cfg) return res.status(400).json({ error: "Tipo de punto invalido." });
  try {
    const pool = await getPool();
    const [rows] = await pool.query(`SELECT * FROM ${cfg.table} ORDER BY CreatedAt ASC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al leer registros: " + err.message });
  }
});

/* ------------------------------------------------------------------
   IA (Nivel 1): normalizar litologia en texto libre, y explicar
   anomalias detectadas por Inteligencia en lenguaje simple.
   Requiere ANTHROPIC_API_KEY en el .env -- la clave NUNCA sale de
   este servidor, el navegador solo habla con estos dos endpoints.
------------------------------------------------------------------ */
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";

async function callClaude(systemPrompt, userMessage) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }]
    })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error("Anthropic API error " + res.status + ": " + text.slice(0, 300));
  }
  const json = await res.json();
  const textBlock = (json.content || []).find(b => b.type === "text");
  return textBlock ? textBlock.text : "";
}

app.post("/api/ai/normalize-litologia", requireAuth, async (req, res) => {
  if (!ANTHROPIC_KEY) {
    return res.status(503).json({ error: "Este servidor no tiene configurada ANTHROPIC_API_KEY. Revisa el archivo .env." });
  }
  try {
    const { values } = req.body || {};
    if (!Array.isArray(values) || values.length === 0) {
      return res.status(400).json({ error: "Falta la lista de valores de litologia." });
    }
    const system = "Eres un asistente de hidrogeologia. Recibiras una lista de descripciones de litologia " +
      "escritas por geologos de campo, en texto libre y posiblemente inconsistente (mayusculas distintas, " +
      "sinonimos, abreviaturas). Tu tarea es agruparlas en categorias litologicas estandar en espanol " +
      "(ej: Arena, Grava, Arcilla, Limo, Caliza, Roca fracturada, Arenisca, etc. -- usa las que correspondan, " +
      "no inventes categorias que no reflejen el texto). Responde SOLO con un objeto JSON valido, sin texto " +
      "adicional ni markdown, con la forma exacta: {\"mapping\": {\"texto original 1\": \"categoria sugerida\", ...}}. " +
      "Debes incluir TODOS los valores originales recibidos como llaves, exactamente como se escribieron.";
    const userMsg = "Valores a normalizar:\n" + values.map(v => "- " + v).join("\n");
    const raw = await callClaude(system, userMsg);
    let parsed;
    try {
      const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.status(502).json({ error: "La IA no devolvio un JSON valido. Intenta de nuevo." });
    }
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: "Error al consultar la IA: " + err.message });
  }
});

app.post("/api/ai/explain-anomaly", requireAuth, async (req, res) => {
  if (!ANTHROPIC_KEY) {
    return res.status(503).json({ error: "Este servidor no tiene configurada ANTHROPIC_API_KEY. Revisa el archivo .env." });
  }
  try {
    const { issue, context } = req.body || {};
    if (!issue) {
      return res.status(400).json({ error: "Falta describir la anomalia a explicar." });
    }
    const system = "Eres un asistente de hidrogeologia de campo. Te dare una alerta generada por reglas " +
      "automaticas sobre un dato capturado (por ejemplo coordenadas duplicadas, elevacion fuera de rango, " +
      "o un pozo cercano a otro ya registrado), junto con los datos del punto. Da 1 o 2 hipotesis breves y " +
      "concretas sobre la posible causa (ej: error de GPS, dos visitas al mismo pozo con codigos distintos, " +
      "zona genuinamente alta), en un tono profesional y directo. Maximo 60 palabras. No uses markdown ni listas, " +
      "solo texto corrido en espanol.";
    const userMsg = "Alerta: " + issue + "\n\nDatos del punto:\n" + JSON.stringify(context || {}, null, 2);
    const explanation = await callClaude(system, userMsg);
    res.json({ explanation: explanation.trim() });
  } catch (err) {
    res.status(500).json({ error: "Error al consultar la IA: " + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("=========================================================");
  console.log(" Hidrocampo -- servidor listo (MySQL)");
  console.log(" Puerto: " + PORT);
  console.log("=========================================================");
  console.log("");
});
