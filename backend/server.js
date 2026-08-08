import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEADS_FILE = path.join(__dirname, "data", "leads.json");
const QUESTIONS_FILE = path.join(__dirname, "data", "questions.json");

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" })); // limite maior por causa do PDF em base64

// ---------------------------------------------------------------------------
// Helpers de armazenamento em arquivo (troque por um banco de dados real
// como PostgreSQL/MongoDB/Supabase quando for para producao em escala)
// ---------------------------------------------------------------------------

function readJSON(file) {
  try {
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw || "[]");
  } catch (e) {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

app.get("/api/leads", (req, res) => {
  const leads = readJSON(LEADS_FILE);
  res.json(leads);
});

app.post("/api/leads", (req, res) => {
  const leads = readJSON(LEADS_FILE);
  const lead = {
    id: `lead-${Date.now()}`,
    ...req.body,
    status: "Novo",
    createdAt: new Date().toISOString(),
  };
  leads.unshift(lead);
  writeJSON(LEADS_FILE, leads);
  res.status(201).json(lead);
});

app.patch("/api/leads/:id", (req, res) => {
  const leads = readJSON(LEADS_FILE);
  const idx = leads.findIndex((l) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Lead não encontrado" });
  leads[idx] = { ...leads[idx], ...req.body };
  writeJSON(LEADS_FILE, leads);
  res.json(leads[idx]);
});

// ---------------------------------------------------------------------------
// Perguntas personalizadas (adicionadas pelo administrador)
// ---------------------------------------------------------------------------

app.get("/api/questions", (req, res) => {
  res.json(readJSON(QUESTIONS_FILE));
});

app.post("/api/questions", (req, res) => {
  const questions = readJSON(QUESTIONS_FILE);
  const question = { key: `custom_${Date.now()}`, ...req.body };
  questions.push(question);
  writeJSON(QUESTIONS_FILE, questions);
  res.status(201).json(question);
});

app.delete("/api/questions/:key", (req, res) => {
  const questions = readJSON(QUESTIONS_FILE).filter((q) => q.key !== req.params.key);
  writeJSON(QUESTIONS_FILE, questions);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Envio do orçamento em PDF por e-mail
// ---------------------------------------------------------------------------

app.post("/api/send-quote", async (req, res) => {
  const { answers, pdfBase64 } = req.body;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({
      error: "Configure SMTP_USER e SMTP_PASS no arquivo .env do backend (veja .env.example).",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const nome = answers?.nome || "Lead sem nome";
    const empresa = answers?.empresa ? ` (${answers.empresa})` : "";

    const summaryLines = Object.entries(answers || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    await transporter.sendMail({
      from: `"Formulário prog.vps" <${process.env.SMTP_USER}>`,
      to: process.env.TO_EMAIL || "prog.vps@gmail.com",
      subject: `Orçamento - ${nome}${empresa}`,
      text: `Novo lead recebido pelo formulário de briefing:\n\n${summaryLines}`,
      attachments: pdfBase64
        ? [
            {
              filename: `Orcamento-${nome.replace(/\s+/g, "_")}.pdf`,
              content: Buffer.from(pdfBase64, "base64"),
              contentType: "application/pdf",
            },
          ]
        : [],
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err.message);
    res.status(500).json({ error: "Falha ao enviar o e-mail. Verifique as credenciais SMTP no .env." });
  }
});

app.get("/", (req, res) => {
  res.send("API prog.vps rodando. Endpoints: /api/leads, /api/questions, /api/send-quote");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend prog.vps rodando em http://localhost:${PORT}`);
});
