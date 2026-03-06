require("dotenv").config();

const express = require("express");
const multer = require("multer");
const { parse } = require("csv-parse/sync");
const path = require("path");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const REQUIRED_HEADERS = [
  "timestamp",
  "heart_rate",
  "systolic_bp",
  "temperature"
];

const groqApiKey = process.env.GROQ_API_KEY || "";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/vendor/chart.umd.js", (req, res) => {
  res.sendFile(path.join(__dirname, "node_modules", "chart.js", "dist", "chart.umd.js"));
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  let records;
  try {
    records = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (err) {
    return res.status(400).json({ error: "Failed to parse CSV." });
  }

  if (!records.length) {
    return res.status(400).json({ error: "CSV is empty." });
  }

  const headers = Object.keys(records[0]).map((header) => header.trim());
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length) {
    return res.status(400).json({
      error: "CSV missing required headers.",
      missing
    });
  }

  const rows = records.map((row, index) => {
    const timestamp = String(row.timestamp || "").trim();
    const heartRate = Number.parseFloat(row.heart_rate);
    const systolicBp = Number.parseFloat(row.systolic_bp);
    const temperature = Number.parseFloat(row.temperature);

    if (!timestamp || Number.isNaN(heartRate) || Number.isNaN(systolicBp) || Number.isNaN(temperature)) {
      return {
        error: `Invalid row at index ${index + 1}.`,
        raw: row
      };
    }

    return {
      timestamp,
      heart_rate: heartRate,
      systolic_bp: systolicBp,
      temperature
    };
  });

  const invalidRows = rows.filter((row) => row.error);
  if (invalidRows.length) {
    return res.status(400).json({
      error: "CSV contains invalid rows.",
      invalidRows
    });
  }

  return res.json({ rows });
});

app.post("/chat", async (req, res) => {
  const { message, vitals } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided." });
  
  if (!groqApiKey) {
    // Simulated LLM Response to meet Hackathon Explainability Requirements
    return res.json({
      reply: `[SIMULATED AI RESPONSE]\n\nBased on clinical protocols:\n\n- A Heart Rate outside 60-100 BPM can impair cardiac output.\n- Systolic BP outside 90-120 mmHg indicates potential hyper/hypotension.\n- Temperature outside 36.1-37.2°C suggests infection or hypothermia.\n\nThe reading you asked about triggered a critical threshold. Please verify the patient's condition immediately and alert the attending physician.`
    });
  }

  let systemPrompt = `You are Med-Bot, an expert clinical assistant embedded in the MedChart Vitals Visualizer.
You help nurses and clinical staff quickly understand patient vital sign trends.
Answer concisely and clearly. Always flag critical concerns.

Thresholds for alerts:
- Heart Rate: critical if < 50 BPM or > 120 BPM (normal 60-100)
- Systolic BP: critical if < 80 mmHg or > 160 mmHg (normal 90-120)
- Temperature: critical if < 35.0°C or > 38.5°C (normal 36.1-37.2)`;

  if (vitals && vitals.length) {
    const summary = vitals
      .map((r) => `[${r.timestamp}] HR=${r.heart_rate} BP=${r.systolic_bp} Temp=${r.temperature}`)
      .join("\n");
    systemPrompt += `\n\nCurrent patient data (${vitals.length} readings):\n${summary}`;
  }

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 512,
        temperature: 0.4
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(502).json({ error: `Groq API error: ${errText}` });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || "No response from Groq.";
    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MedChart running at http://localhost:${PORT}`);
  if (!groqApiKey) {
    console.warn("GROQ_API_KEY is not set. Add it to a local .env file.");
  }
});

// ── Demo data endpoint ──
const fs = require("fs");
app.get("/api/demo", (req, res) => {
  const csvPath = path.join(__dirname, "sample_vitals.csv");
  if (!fs.existsSync(csvPath)) return res.status(404).json({ error: "sample_vitals.csv not found." });
  const buf = fs.readFileSync(csvPath);
  let records;
  try {
    records = parse(buf, { columns: true, skip_empty_lines: true, trim: true });
  } catch { return res.status(500).json({ error: "Failed to parse sample CSV." }); }
  const rows = records.map(row => ({
    timestamp:   String(row.timestamp).trim(),
    heart_rate:  parseFloat(row.heart_rate),
    systolic_bp: parseFloat(row.systolic_bp),
    temperature: parseFloat(row.temperature)
  }));
  return res.json({ rows });
});
