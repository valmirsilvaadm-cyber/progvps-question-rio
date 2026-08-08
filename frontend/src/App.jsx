import React, { useState, useRef, useEffect, useMemo } from "react";
import { jsPDF } from "jspdf";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  MessageCircle,
  LayoutDashboard,
  Search,
  Download,
  X,
  ChevronRight,
  Plus,
  Trash2,
  Mail,
  FileText,
  Users,
  ListPlus,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ---------------------------------------------------------------------------
// Config / brand
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const WHATSAPP_NUMBER = "5511999999999"; // substitua pelo número real da empresa
const COMPANY_EMAIL = "prog.vps@gmail.com";

const BG = "#06070B";
const SURFACE = "#0F121B";
const SURFACE_SOFT = "#12151F";
const BORDER = "rgba(255,255,255,0.08)";
const BORDER_STRONG = "rgba(255,255,255,0.14)";
const TEXT = "#F3F4F8";
const TEXT_DIM = "#9AA1B4";
const TEXT_FAINT = "#5B6070";
const BLUE = "#3B82F6";
const PURPLE = "#A855F7";
const GRADIENT = `linear-gradient(90deg, ${BLUE}, ${PURPLE})`;
const GRADIENT_SOFT = `linear-gradient(90deg, rgba(59,130,246,0.16), rgba(168,85,247,0.16))`;

// ---------------------------------------------------------------------------
// Steps config (fixas)
// ---------------------------------------------------------------------------

const BASE_STEPS = [
  { key: "nome", type: "text", label: "Qual é o seu nome?", placeholder: "Digite seu nome completo" },
  { key: "empresa", type: "text", label: "Qual é o nome da sua empresa?", placeholder: "Nome da empresa" },
  { key: "whatsapp", type: "tel", label: "Qual é o seu WhatsApp?", placeholder: "(11) 91234-5678" },
  { key: "email", type: "email", label: "Qual é o seu e-mail?", placeholder: "voce@empresa.com" },
  { key: "negocio_status", type: "choice", label: "Você já possui um negócio funcionando?", options: ["Sim", "Não", "Ainda estou planejando"] },
  { key: "tipo_app", type: "choice", label: "Qual tipo de aplicativo você deseja?", options: ["Delivery", "Marketplace", "Agendamento", "Gestão Empresarial", "Rede Social", "Educação", "Saúde", "Financeiro", "Outro"] },
  { key: "objetivo", type: "choice", label: "Qual é o principal objetivo do aplicativo?", options: ["Vender mais", "Automatizar processos", "Melhorar atendimento", "Organizar a empresa", "Criar uma comunidade", "Outro"] },
  { key: "plataforma", type: "choice", label: "O aplicativo será para:", options: ["Android", "iPhone", "Ambos"] },
  { key: "login", type: "choice", label: "O aplicativo precisará de login?", options: ["Sim", "Não", "Ainda não sei"] },
  { key: "pagamentos", type: "choice", label: "Haverá pagamentos dentro do aplicativo?", options: ["Sim", "Não", "Talvez"] },
  { key: "gps", type: "choice", label: "O aplicativo precisará de localização (GPS)?", options: ["Sim", "Não"] },
  { key: "notificacoes", type: "choice", label: "O aplicativo enviará notificações?", options: ["Sim", "Não"] },
  { key: "identidade_visual", type: "choice", label: "Você já possui identidade visual?", options: ["Sim", "Não"] },
  { key: "app_atual", type: "choice", label: "Você já possui um aplicativo atualmente?", options: ["Sim", "Não"] },
  { key: "prazo", type: "choice", label: "Quando pretende iniciar o projeto?", options: ["Imediatamente", "Em até 30 dias", "Em até 3 meses", "Apenas pesquisando"] },
  { key: "investimento", type: "choice", label: "Qual é o investimento previsto?", options: ["Até R$ 5.000", "R$ 5.000 a R$ 10.000", "R$ 10.000 a R$ 30.000", "Acima de R$ 30.000", "Ainda não defini"] },
  { key: "ideia", type: "textarea", label: "Descreva resumidamente sua ideia", placeholder: "Conte com suas palavras como imagina o aplicativo funcionando..." },
];

const STATUS_OPTIONS = ["Novo", "Em contato", "Proposta enviada", "Fechado"];
const STATUS_COLORS = {
  "Novo": "#60A5FA",
  "Em contato": "#FBBF24",
  "Proposta enviada": "#C084FC",
  "Fechado": "#34D399",
};

const LABELS = {
  nome: "Nome", empresa: "Empresa", whatsapp: "WhatsApp", email: "E-mail",
  negocio_status: "Negócio em funcionamento", tipo_app: "Tipo de aplicativo", objetivo: "Objetivo principal",
  plataforma: "Plataforma", login: "Precisa de login", pagamentos: "Pagamentos no app", gps: "Localização (GPS)",
  notificacoes: "Notificações", identidade_visual: "Identidade visual", app_atual: "Já possui app",
  prazo: "Prazo para iniciar", investimento: "Investimento previsto", ideia: "Ideia do projeto",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskPhone(value) {
  const v = value.replace(/\D/g, "").slice(0, 11);
  if (v.length > 6) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  if (v.length > 2) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length > 0) return `(${v.slice(0, 2)}`;
  return v;
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toCSV(leads) {
  if (leads.length === 0) return "";
  const cols = ["nome", "empresa", "whatsapp", "email", "tipo_app", "objetivo", "investimento", "prazo", "status", "createdAt"];
  const header = cols.join(";");
  const rows = leads.map((l) => cols.map((c) => `"${String(l[c] ?? "").replace(/"/g, '""')}"`).join(";"));
  return [header, ...rows].join("\n");
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Gera um PDF real (não é impressão de HTML) usando jsPDF
function buildQuotePDF(answers, allSteps) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  const pageWidth = 595;
  let y = 60;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 30);
  doc.text("prog.vps", marginX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 135);
  doc.text("Desenvolvimento de Aplicativos", marginX, y + 16);

  y += 44;
  doc.setDrawColor(220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 30;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 30);
  doc.text(`Orcamento - ${answers.nome || "Cliente"}`, marginX, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(130, 130, 145);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, marginX, y);
  y += 30;

  allSteps.forEach((s) => {
    const label = LABELS[s.key] || s.label;
    const value = String(answers[s.key] || "-");
    if (y > 760) {
      doc.addPage();
      y = 60;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 105);
    doc.text(label, marginX, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(25, 25, 35);
    const lines = doc.splitTextToSize(value, pageWidth - marginX * 2);
    doc.text(lines, marginX, y + 14);
    y += 14 + lines.length * 13 + 12;
  });

  return doc;
}

// ---------------------------------------------------------------------------
// Brand pieces
// ---------------------------------------------------------------------------

function LogoMark({ size = 36 }) {
  return (
    <div style={{ height: size, width: size, borderRadius: "9999px", padding: 1.5, background: `conic-gradient(from 180deg, ${BLUE}, ${PURPLE}, ${BLUE})`, flexShrink: 0 }}>
      <div style={{ height: "100%", width: "100%", borderRadius: "9999px", background: "#000000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 800, fontSize: size * 0.36, background: GRADIENT, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", letterSpacing: "-0.03em" }}>
          {"</>"}
        </span>
      </div>
    </div>
  );
}

function Wordmark({ size = "text-lg" }) {
  return (
    <span className={`${size} font-extrabold tracking-tight`}>
      <span style={{ color: TEXT }}>prog</span>
      <span style={{ color: BLUE }}>.</span>
      <span style={{ background: GRADIENT, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>vps</span>
    </span>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
      <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${value}%`, background: GRADIENT }} />
    </div>
  );
}

function AssistantBadge() {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: "#8FB3FF" }}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: BLUE }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: BLUE }} />
      </span>
      Assistente de descoberta
    </div>
  );
}

function GradientButton({ children, onClick, className = "", disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-2 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60 disabled:hover:translate-y-0 ${className}`} style={{ background: GRADIENT, boxShadow: "0 8px 30px -8px rgba(139,92,246,0.45)" }}>
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export default function App() {
  const [view, setView] = useState("intro"); // intro | form | thanks | admin
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [entering, setEntering] = useState(true);
  const [leads, setLeads] = useState([]);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [emailStatus, setEmailStatus] = useState("idle"); // idle | sending | sent | error
  const [emailErrorMsg, setEmailErrorMsg] = useState("");
  const inputRef = useRef(null);

  const allSteps = useMemo(() => [...BASE_STEPS, ...customQuestions], [customQuestions]);

  // Carrega leads e perguntas personalizadas do backend ao iniciar
  useEffect(() => {
    fetch(`${API_BASE}/api/leads`).then((r) => r.json()).then(setLeads).catch(() => {});
    fetch(`${API_BASE}/api/questions`).then((r) => r.json()).then(setCustomQuestions).catch(() => {});
  }, []);

  useEffect(() => {
    setEntering(true);
    const t = setTimeout(() => setEntering(false), 30);
    if (inputRef.current) inputRef.current.focus();
    return () => clearTimeout(t);
  }, [step, view]);

  const current = allSteps[step];
  const progress = view === "form" ? Math.round((step / allSteps.length) * 100) : 0;

  function updateAnswer(key, value) {
    setAnswers((a) => ({ ...a, [key]: value }));
    setError("");
  }

  function validateCurrent() {
    const val = (answers[current.key] || "").toString().trim();
    if (current.type === "textarea") return "";
    if (!val) return "Esse campo é obrigatório.";
    if (current.type === "email" && !isValidEmail(val)) return "Digite um e-mail válido.";
    if (current.type === "tel" && val.replace(/\D/g, "").length < 10) return "Digite um WhatsApp válido com DDD.";
    return "";
  }

  function goNext() {
    const err = validateCurrent();
    if (err) {
      setError(err);
      return;
    }
    if (step < allSteps.length - 1) {
      setStep((s) => s + 1);
    } else {
      finalizeSubmit(answers);
    }
  }

  function goBack() {
    setError("");
    if (step === 0) setView("intro");
    else setStep((s) => s - 1);
  }

  function selectChoice(value) {
    updateAnswer(current.key, value);
    const isLast = step === allSteps.length - 1;
    setTimeout(() => {
      if (isLast) finalizeSubmit({ ...answers, [current.key]: value });
      else setStep((s) => s + 1);
    }, 280);
  }

  async function finalizeSubmit(finalAnswers) {
    setAnswers(finalAnswers);
    setView("thanks");

    // 1) Salva o lead no backend
    fetch(`${API_BASE}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalAnswers),
    })
      .then((r) => r.json())
      .then((saved) => setLeads((ls) => [saved, ...ls]))
      .catch(() => {
        // Backend indisponível: mantém o lead apenas localmente para não travar a demo
        setLeads((ls) => [{ id: `local-${Date.now()}`, ...finalAnswers, status: "Novo", createdAt: new Date().toISOString() }, ...ls]);
      });

    // 2) Gera o PDF do orçamento e envia por e-mail para a equipe
    setEmailStatus("sending");
    try {
      const doc = buildQuotePDF(finalAnswers, allSteps);
      const pdfBase64 = doc.output("datauristring").split(",")[1];

      const res = await fetch(`${API_BASE}/api/send-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers, pdfBase64 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao enviar e-mail.");
      }
      setEmailStatus("sent");
    } catch (e) {
      setEmailStatus("error");
      setEmailErrorMsg(e.message || "Não foi possível enviar o e-mail. Verifique se o backend está rodando.");
    }
  }

  function startOver() {
    setAnswers({});
    setStep(0);
    setError("");
    setEmailStatus("idle");
    setView("intro");
  }

  function downloadQuotePDF(a) {
    const doc = buildQuotePDF(a, allSteps);
    doc.save(`Orcamento-${(a.nome || "cliente").replace(/\s+/g, "_")}.pdf`);
  }

  async function updateLeadStatus(id, status) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await fetch(`${API_BASE}/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      // Se o backend estiver fora do ar, a mudança fica só local
    }
  }

  async function addCustomQuestion(question) {
    try {
      const res = await fetch(`${API_BASE}/api/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(question),
      });
      const saved = await res.json();
      setCustomQuestions((qs) => [...qs, saved]);
    } catch (e) {
      setCustomQuestions((qs) => [...qs, { key: `custom_${Date.now()}`, ...question }]);
    }
  }

  async function removeCustomQuestion(key) {
    setCustomQuestions((qs) => qs.filter((q) => q.key !== key));
    try {
      await fetch(`${API_BASE}/api/questions/${key}`, { method: "DELETE" });
    } catch (e) {}
  }

  const whatsappHref = useMemo(() => {
    const nome = answers.nome || "";
    const tipo = answers.tipo_app || "um aplicativo";
    const msg = encodeURIComponent(`Olá! Sou ${nome} e acabei de preencher o formulário sobre o desenvolvimento de ${tipo}. Gostaria de conversar sobre o meu projeto.`);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  }, [answers]);

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: BG, color: TEXT, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      <header className="w-full sticky top-0 z-20 backdrop-blur" style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(6,7,11,0.85)" }}>
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark size={30} />
            <Wordmark size="text-base" />
          </div>
          <button onClick={() => setView(view === "admin" ? "intro" : "admin")} className="text-xs font-medium flex items-center gap-1.5 transition-colors" style={{ color: TEXT_DIM }}>
            <LayoutDashboard size={14} />
            {view === "admin" ? "Fechar painel" : "Painel administrativo"}
          </button>
        </div>
        {view === "form" && (
          <div className="max-w-3xl mx-auto px-5 pb-3">
            <ProgressBar value={progress} />
            <p className="text-[11px] mt-1.5 font-medium" style={{ color: TEXT_FAINT }}>Pergunta {step + 1} de {allSteps.length}</p>
          </div>
        )}
      </header>

      <main className="flex-1 flex items-start justify-center px-5 py-10 relative overflow-hidden">
        {view === "intro" && (
          <>
            <div className="pointer-events-none absolute rounded-full blur-3xl opacity-20" style={{ width: 420, height: 420, background: BLUE, top: -120, left: "8%" }} />
            <div className="pointer-events-none absolute rounded-full blur-3xl opacity-20" style={{ width: 420, height: 420, background: PURPLE, top: -60, right: "8%" }} />
          </>
        )}

        {view === "intro" && <IntroScreen onStart={() => setView("form")} />}

        {view === "form" && current && (
          <div className={`w-full max-w-lg transition-all duration-300 ${entering ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"}`}>
            <AssistantBadge />
            <QuestionCard step={current} value={answers[current.key] || ""} onChange={(v) => updateAnswer(current.key, v)} onChoice={selectChoice} onNext={goNext} error={error} inputRef={inputRef} />
            <div className="flex items-center justify-between mt-6">
              <button onClick={goBack} className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: TEXT_DIM }}>
                <ArrowLeft size={16} /> Voltar
              </button>
              {current.type !== "choice" && (
                <GradientButton onClick={goNext}>
                  {step === allSteps.length - 1 ? "Enviar respostas" : "Próximo"}
                  <ArrowRight size={16} />
                </GradientButton>
              )}
            </div>
          </div>
        )}

        {view === "thanks" && (
          <ThanksScreen answers={answers} whatsappHref={whatsappHref} onRestart={startOver} emailStatus={emailStatus} emailErrorMsg={emailErrorMsg} onDownloadPDF={() => downloadQuotePDF(answers)} />
        )}

        {view === "admin" && (
          <AdminPanel leads={leads} updateLeadStatus={updateLeadStatus} customQuestions={customQuestions} addCustomQuestion={addCustomQuestion} removeCustomQuestion={removeCustomQuestion} onClose={() => setView(answers.nome ? "thanks" : "intro")} onDownloadLeadPDF={(lead) => downloadQuotePDF(lead)} />
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Intro
// ---------------------------------------------------------------------------

function IntroScreen({ onStart }) {
  return (
    <div className="w-full max-w-lg text-center mt-6 relative">
      <div className="flex justify-center mb-5"><LogoMark size={64} /></div>
      <div className="mb-1"><Wordmark size="text-3xl" /></div>
      <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-8" style={{ color: TEXT_FAINT }}>Desenvolvimento de Aplicativos</p>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight" style={{ color: TEXT }}>Vamos criar o aplicativo ideal para você!</h1>
      <p className="mt-4 text-[15px] leading-relaxed max-w-md mx-auto" style={{ color: TEXT_DIM }}>
        Responda algumas perguntas em menos de 3 minutos para entendermos sua necessidade e prepararmos a melhor solução.
      </p>

      <div className="mt-8 flex justify-center">
        <GradientButton onClick={onStart} className="px-8 py-3.5">Começar<ArrowRight size={18} /></GradientButton>
      </div>

      <div className="flex items-center justify-center gap-6 mt-10 text-xs" style={{ color: TEXT_FAINT }}>
        <span className="flex items-center gap-1.5"><Check size={14} style={{ color: BLUE }} /> Leva ~3 minutos</span>
        <span className="flex items-center gap-1.5"><Check size={14} style={{ color: PURPLE }} /> Sem compromisso</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Question Card
// ---------------------------------------------------------------------------

function QuestionCard({ step, value, onChange, onChoice, onNext, error, inputRef }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && step.type !== "textarea") {
      e.preventDefault();
      onNext();
    }
  };
  const inputStyle = { background: SURFACE_SOFT, border: `1px solid ${BORDER}`, color: TEXT };

  return (
    <div className="rounded-2xl p-6 sm:p-8" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-5 leading-snug" style={{ color: TEXT }}>{step.label}</h2>

      {step.type === "text" && <input ref={inputRef} type="text" value={value} placeholder={step.placeholder} onChange={(e) => onChange(e.target.value)} onKeyDown={handleKeyDown} style={inputStyle} className="w-full text-base rounded-xl px-4 py-3.5 outline-none transition-all placeholder:text-[#4B5063] focus:border-blue-500" />}
      {step.type === "email" && <input ref={inputRef} type="email" value={value} placeholder={step.placeholder} onChange={(e) => onChange(e.target.value)} onKeyDown={handleKeyDown} style={inputStyle} className="w-full text-base rounded-xl px-4 py-3.5 outline-none transition-all placeholder:text-[#4B5063] focus:border-blue-500" />}
      {step.type === "tel" && <input ref={inputRef} type="tel" value={value} placeholder={step.placeholder} onChange={(e) => onChange(maskPhone(e.target.value))} onKeyDown={handleKeyDown} style={inputStyle} className="w-full text-base rounded-xl px-4 py-3.5 outline-none transition-all placeholder:text-[#4B5063] focus:border-blue-500" />}
      {step.type === "textarea" && <textarea ref={inputRef} value={value} placeholder={step.placeholder} onChange={(e) => onChange(e.target.value)} rows={5} style={inputStyle} className="w-full text-base rounded-xl px-4 py-3.5 outline-none transition-all resize-none placeholder:text-[#4B5063] focus:border-blue-500" />}

      {step.type === "choice" && (
        <div className={`grid gap-3 ${step.options.length > 4 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
          {step.options.map((opt) => {
            const active = value === opt;
            return (
              <button key={opt} onClick={() => onChoice(opt)} className="group flex items-center justify-between text-left px-5 py-3.5 rounded-xl font-medium text-[15px] transition-all" style={{ border: active ? `1px solid ${BLUE}` : `1px solid ${BORDER}`, background: active ? GRADIENT_SOFT : "transparent", color: active ? "#BFD4FF" : "#D5D8E2" }}>
                {opt}
                <ChevronRight size={16} style={{ color: active ? BLUE : TEXT_FAINT }} />
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-sm mt-3 font-medium" style={{ color: "#F87171" }}>{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thanks
// ---------------------------------------------------------------------------

function ThanksScreen({ answers, whatsappHref, onRestart, emailStatus, emailErrorMsg, onDownloadPDF }) {
  return (
    <div className="w-full max-w-lg text-center mt-6">
      <div className="mx-auto mb-6 h-16 w-16 rounded-full flex items-center justify-center" style={{ background: GRADIENT_SOFT, border: `1px solid ${BORDER_STRONG}` }}>
        <Check size={30} style={{ color: BLUE }} />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: TEXT }}>Obrigado{answers.nome ? `, ${answers.nome.split(" ")[0]}` : ""}!</h1>
      <p className="mt-3 text-[15px] leading-relaxed max-w-sm mx-auto" style={{ color: TEXT_DIM }}>
        Recebemos suas informações e nossa equipe analisará sua ideia. Em breve entraremos em contato pelo WhatsApp.
      </p>

      <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_DIM }}>
        {emailStatus === "sending" && (<><Loader2 size={15} className="animate-spin" style={{ color: BLUE }} />Gerando orçamento e enviando para nossa equipe...</>)}
        {emailStatus === "sent" && (<><Mail size={15} style={{ color: "#34D399" }} />Orçamento enviado para <span style={{ color: TEXT }}>&nbsp;{COMPANY_EMAIL}</span></>)}
        {emailStatus === "error" && (<><AlertTriangle size={15} style={{ color: "#F87171" }} />{emailErrorMsg || "Não foi possível enviar o e-mail."}</>)}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:brightness-110" style={{ background: "#16A34A", boxShadow: "0 8px 30px -8px rgba(22,163,74,0.45)" }}>
          <MessageCircle size={18} />Falar com um consultor
        </a>
        <button onClick={onDownloadPDF} className="inline-flex items-center justify-center gap-2 font-semibold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5" style={{ background: SURFACE, border: `1px solid ${BORDER_STRONG}`, color: TEXT }}>
          <FileText size={18} />Baixar orçamento (PDF)
        </button>
      </div>

      <div><button onClick={onRestart} className="mt-6 text-sm font-medium underline underline-offset-4" style={{ color: TEXT_FAINT }}>Preencher um novo formulário</button></div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin Panel
// ---------------------------------------------------------------------------

function AdminPanel({ leads, updateLeadStatus, customQuestions, addCustomQuestion, removeCustomQuestion, onClose, onDownloadLeadPDF }) {
  const [tab, setTab] = useState("leads");
  const [query, setQuery] = useState("");

  const filtered = leads.filter((l) => {
    const q = query.toLowerCase();
    return (l.nome || "").toLowerCase().includes(q) || (l.empresa || "").toLowerCase().includes(q);
  });

  const total = leads.length;
  const last7 = leads.filter((l) => Date.now() - new Date(l.createdAt).getTime() < 1000 * 60 * 60 * 24 * 7).length;

  const tipoCounts = useMemo(() => {
    const counts = {};
    leads.forEach((l) => {
      const t = l.tipo_app || "Não informado";
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [leads]);

  const topTipo = tipoCounts[0]?.name || "—";

  const investimentoMap = { "Até R$ 5.000": 2500, "R$ 5.000 a R$ 10.000": 7500, "R$ 10.000 a R$ 30.000": 20000, "Acima de R$ 30.000": 35000 };
  const known = leads.filter((l) => investimentoMap[l.investimento]);
  const avgInvest = known.length ? Math.round(known.reduce((s, l) => s + investimentoMap[l.investimento], 0) / known.length) : 0;

  function exportCSV() {
    downloadFile(toCSV(filtered), "leads.csv", "text/csv;charset=utf-8;");
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: TEXT }}>Painel administrativo</h1>
          <p className="text-sm mt-1" style={{ color: TEXT_DIM }}>Leads recebidos e configuração do formulário.</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: TEXT_DIM }}><X size={20} /></button>
      </div>

      <div className="flex gap-2 mb-6">
        <TabButton active={tab === "leads"} onClick={() => setTab("leads")} icon={<Users size={14} />}>Leads</TabButton>
        <TabButton active={tab === "perguntas"} onClick={() => setTab("perguntas")} icon={<ListPlus size={14} />}>Perguntas do formulário</TabButton>
      </div>

      {tab === "leads" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total de leads" value={total} />
            <StatCard label="Últimos 7 dias" value={last7} />
            <StatCard label="Mais solicitado" value={topTipo} small />
            <StatCard label="Investimento médio" value={`R$ ${avgInvest.toLocaleString("pt-BR")}`} small />
          </div>

          <div className="rounded-2xl p-5 mb-6" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#C6CAD6" }}>Tipos de aplicativo mais solicitados</h3>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={tipoCounts} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: TEXT_FAINT }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: TEXT_FAINT }} />
                  <Tooltip cursor={{ fill: "rgba(59,130,246,0.08)" }} contentStyle={{ background: "#12151F", border: `1px solid ${BORDER_STRONG}`, borderRadius: 8, color: TEXT }} />
                  <Bar dataKey="value" fill={BLUE} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: TEXT_FAINT }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome ou empresa..." style={{ background: SURFACE_SOFT, border: `1px solid ${BORDER}`, color: TEXT }} className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none transition-all focus:border-blue-500 placeholder:text-[#4B5063]" />
            </div>
            <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors" style={{ border: `1px solid ${BORDER}`, color: "#C6CAD6" }}>
              <Download size={14} /> Excel (CSV)
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide" style={{ background: SURFACE_SOFT, color: TEXT_FAINT }}>
                    <th className="text-left px-4 py-3 font-semibold">Nome</th>
                    <th className="text-left px-4 py-3 font-semibold">Empresa</th>
                    <th className="text-left px-4 py-3 font-semibold">Tipo</th>
                    <th className="text-left px-4 py-3 font-semibold">Investimento</th>
                    <th className="text-left px-4 py-3 font-semibold">Data</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Orçamento</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td className="px-4 py-3 font-medium" style={{ color: TEXT }}>{l.nome}</td>
                      <td className="px-4 py-3" style={{ color: TEXT_DIM }}>{l.empresa}</td>
                      <td className="px-4 py-3" style={{ color: TEXT_DIM }}>{l.tipo_app}</td>
                      <td className="px-4 py-3" style={{ color: TEXT_DIM }}>{l.investimento}</td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: TEXT_FAINT }}>{formatDate(l.createdAt)}</td>
                      <td className="px-4 py-3">
                        <select value={l.status} onChange={(e) => updateLeadStatus(l.id, e.target.value)} style={{ color: STATUS_COLORS[l.status], background: SURFACE_SOFT, border: `1px solid ${BORDER}` }} className="text-xs font-semibold rounded-lg px-2 py-1.5 outline-none cursor-pointer">
                          {STATUS_OPTIONS.map((s) => (<option key={s} value={s} style={{ color: "#000" }}>{s}</option>))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => onDownloadLeadPDF(l)} className="text-xs font-semibold flex items-center gap-1" style={{ color: BLUE }}><FileText size={13} /> PDF</button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (<tr><td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: TEXT_FAINT }}>Nenhum lead encontrado.</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs mt-4" style={{ color: TEXT_FAINT }}>
            * Os leads são salvos pelo backend em <code>backend/data/leads.json</code>. Para produção em escala, troque por um banco de dados real.
          </p>
        </>
      )}

      {tab === "perguntas" && (
        <QuestionManager customQuestions={customQuestions} addCustomQuestion={addCustomQuestion} removeCustomQuestion={removeCustomQuestion} />
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all" style={{ background: active ? GRADIENT_SOFT : "transparent", border: active ? `1px solid ${BLUE}` : `1px solid ${BORDER}`, color: active ? "#BFD4FF" : TEXT_DIM }}>
      {icon}{children}
    </button>
  );
}

function StatCard({ label, value, small }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_FAINT }}>{label}</p>
      <p className={`font-extrabold mt-1 ${small ? "text-base" : "text-2xl"}`} style={{ color: TEXT }}>{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Question Manager
// ---------------------------------------------------------------------------

function QuestionManager({ customQuestions, addCustomQuestion, removeCustomQuestion }) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");
  const [optionsText, setOptionsText] = useState("");
  const [formError, setFormError] = useState("");

  function handleAdd() {
    if (!label.trim()) { setFormError("Digite o texto da pergunta."); return; }
    if (type === "choice") {
      const opts = optionsText.split(",").map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) { setFormError("Adicione ao menos duas opções separadas por vírgula."); return; }
      addCustomQuestion({ type: "choice", label: label.trim(), options: opts });
    } else {
      addCustomQuestion({ type, label: label.trim(), placeholder: "Digite sua resposta" });
    }
    setLabel(""); setOptionsText(""); setFormError("");
  }

  const inputStyle = { background: SURFACE_SOFT, border: `1px solid ${BORDER}`, color: TEXT };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr,1.1fr]">
      <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "#C6CAD6" }}>Adicionar nova pergunta</h3>

        <label className="text-xs font-medium mb-1.5 block" style={{ color: TEXT_DIM }}>Texto da pergunta</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Você já tem um site?" style={inputStyle} className="w-full text-sm rounded-xl px-3.5 py-2.5 outline-none mb-4 placeholder:text-[#4B5063] focus:border-blue-500" />

        <label className="text-xs font-medium mb-1.5 block" style={{ color: TEXT_DIM }}>Tipo de resposta</label>
        <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle} className="w-full text-sm rounded-xl px-3.5 py-2.5 outline-none mb-4 cursor-pointer">
          <option value="text" style={{ color: "#000" }}>Texto curto</option>
          <option value="textarea" style={{ color: "#000" }}>Texto longo</option>
          <option value="choice" style={{ color: "#000" }}>Múltipla escolha</option>
        </select>

        {type === "choice" && (
          <>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: TEXT_DIM }}>Opções (separadas por vírgula)</label>
            <input value={optionsText} onChange={(e) => setOptionsText(e.target.value)} placeholder="Ex: Sim, Não, Talvez" style={inputStyle} className="w-full text-sm rounded-xl px-3.5 py-2.5 outline-none mb-4 placeholder:text-[#4B5063] focus:border-blue-500" />
          </>
        )}

        {formError && <p className="text-sm mb-3" style={{ color: "#F87171" }}>{formError}</p>}

        <button onClick={handleAdd} className="w-full flex items-center justify-center gap-2 text-white font-semibold px-4 py-3 rounded-xl transition-all hover:brightness-110" style={{ background: GRADIENT }}>
          <Plus size={16} /> Adicionar pergunta
        </button>
        <p className="text-[11px] mt-3" style={{ color: TEXT_FAINT }}>
          A pergunta é salva pelo backend em <code>backend/data/questions.json</code> e passa a aparecer no final do formulário para todos os visitantes.
        </p>
      </div>

      <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "#C6CAD6" }}>Perguntas personalizadas ({customQuestions.length})</h3>
        {customQuestions.length === 0 && <p className="text-sm" style={{ color: TEXT_FAINT }}>Nenhuma pergunta personalizada ainda.</p>}
        <div className="flex flex-col gap-2.5">
          {customQuestions.map((q, i) => (
            <div key={q.key} className="flex items-start justify-between gap-3 rounded-xl px-4 py-3" style={{ background: SURFACE_SOFT, border: `1px solid ${BORDER}` }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: TEXT_FAINT }}>
                  Pergunta {BASE_STEPS.length + i + 1} · {q.type === "text" ? "Texto curto" : q.type === "textarea" ? "Texto longo" : "Múltipla escolha"}
                </p>
                <p className="text-sm font-medium" style={{ color: TEXT }}>{q.label}</p>
                {q.type === "choice" && <p className="text-xs mt-1" style={{ color: TEXT_DIM }}>{q.options.join(" · ")}</p>}
              </div>
              <button onClick={() => removeCustomQuestion(q.key)} className="p-1.5 rounded-lg shrink-0" style={{ color: "#F87171" }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
