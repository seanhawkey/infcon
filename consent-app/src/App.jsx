import { useState, useRef, useEffect, useCallback } from "react";

// ─── Consent text ────────────────────────────────────────────────────────────
const CONSENT = {
  en: {
    label: "English",
    title: "Photo & Video Consent",
    body: `Hi! Before we get started, we just need a moment of your time.

We'd like your permission to photograph and/or film you as part of our work. Your image may appear in news articles, documentaries, websites, or social media — always used respectfully and in context.

Here's what that means:
• Photos or video of you may be published or broadcast.
• Images might be cropped or captioned, but never used to mislead.
• You won't be paid unless we've agreed that separately in writing.
• You can ask questions before you sign — please do!

You're giving this permission freely. If you change your mind about future use, just get in touch.`,
    agree: "I've read this, I understand it, and I'm happy to give my consent.",
  },
  es: {
    label: "Español",
    title: "Consentimiento para Fotos y Video",
    body: `¡Hola! Antes de empezar, necesitamos un momento de su tiempo.

Nos gustaría su permiso para fotografiarle y/o filmarle como parte de nuestro trabajo. Su imagen puede aparecer en artículos, documentales, sitios web o redes sociales — siempre utilizada con respeto y en contexto.

Lo que esto significa:
• Fotos o video suyo pueden ser publicados o emitidos.
• Las imágenes pueden ser recortadas o con subtítulos, pero nunca para engañar.
• No recibirá pago a menos que lo hayamos acordado por escrito.
• Puede hacer preguntas antes de firmar — ¡por favor hágalo!

Usted da este permiso libremente.`,
    agree: "He leído esto, lo entiendo y doy mi consentimiento con gusto.",
  },
  fr: {
    label: "Français",
    title: "Consentement Photo & Vidéo",
    body: `Bonjour ! Avant de commencer, nous avons besoin d'un moment de votre temps.

Nous aimerions votre permission pour vous photographier et/ou filmer dans le cadre de notre travail. Votre image peut apparaître dans des articles, documentaires, sites web ou réseaux sociaux — toujours utilisée avec respect.

Ce que cela signifie :
• Des photos ou vidéos de vous peuvent être publiées ou diffusées.
• Les images peuvent être recadrées ou légendées, mais jamais pour induire en erreur.
• Vous ne serez pas rémunéré sauf accord écrit séparé.
• Vous pouvez poser des questions avant de signer — n'hésitez pas !

Vous donnez cette permission librement.`,
    agree: "J'ai lu ceci, je le comprends et je donne mon consentement volontiers.",
  },
  ar: {
    label: "العربية",
    title: "موافقة التصوير والفيديو",
    body: `مرحباً! قبل أن نبدأ، نحتاج لحظة من وقتك.

نود الحصول على إذنك لتصويرك و/أو تصويرك بالفيديو كجزء من عملنا. قد تظهر صورتك في مقالات إخبارية أو وثائقيات أو مواقع ويب أو وسائل التواصل الاجتماعي — دائماً باحترام وفي السياق المناسب.

ما يعنيه ذلك:
• قد يتم نشر أو بث صور أو مقاطع فيديو لك.
• قد يتم اقتصاص الصور أو إضافة تعليقات عليها، لكن لن تُستخدم للتضليل.
• لن تتلقى أي مدفوعات ما لم نتفق على ذلك كتابياً.
• يمكنك طرح أسئلة قبل التوقيع — من فضلك افعل ذلك!

أنت تمنح هذا الإذن بحرية تامة.`,
    agree: "قرأت هذا وفهمته وأنا سعيد بمنح موافقتي.",
  },
};

// ─── Signature Pad ────────────────────────────────────────────────────────────
function SignaturePad({ onSigned, resetKey }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [hasStrokes, setHasStrokes] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    onSigned(null);
  }, [resetKey]);

  const pos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * sx, y: (src.clientY - r.top) * sy };
  };

  const start = (e) => { e.preventDefault(); drawing.current = true; last.current = pos(e, canvasRef.current); };
  const move = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const p = pos(e, canvas);
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 2.8;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    last.current = p;
    setHasStrokes(true);
    onSigned(canvas.toDataURL());
  };
  const end = (e) => { e.preventDefault(); drawing.current = false; };

  return (
    <div style={{ position: "relative" }}>
      <canvas ref={canvasRef} width={640} height={180}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        style={{ width: "100%", height: 150, background: "#f8fafc", borderRadius: 10,
          border: "1.5px solid #e2e8f0", cursor: "crosshair", touchAction: "none", display: "block" }} />
      {!hasStrokes && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", pointerEvents: "none", color: "#94a3b8", fontSize: 14, fontStyle: "italic" }}>
          Draw your signature here
        </div>
      )}
    </div>
  );
}

// ─── Camera ───────────────────────────────────────────────────────────────────
function CameraCapture({ onCapture, photo }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [err, setErr] = useState(null);
  const [facingMode, setFacingMode] = useState("user");

  const startCamera = async (facing = facingMode) => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setActive(true); setErr(null);
    } catch (e) {
      setErr("Camera access denied. Please allow camera permissions and try again.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setActive(false);
  };

  const snap = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    onCapture(canvas.toDataURL("image/jpeg", 0.92));
    stopCamera();
  };

  const flip = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next); startCamera(next);
  };

  useEffect(() => () => stopCamera(), []);

  if (photo) return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
      <img src={photo} alt="Subject" style={{ width: "100%", maxHeight: 280, objectFit: "cover", display: "block", borderRadius: 12 }} />
      <button onClick={() => { onCapture(null); }} style={{
        position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)",
        color: "#fff", border: "none", borderRadius: 20, padding: "6px 14px",
        fontSize: 12, cursor: "pointer", fontFamily: "inherit",
      }}>Retake</button>
    </div>
  );

  if (active) return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#000" }}>
      <video ref={videoRef} autoPlay playsInline muted
        style={{ width: "100%", maxHeight: 320, objectFit: "cover", display: "block" }} />
      <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 16 }}>
        <button onClick={flip} style={{
          background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
          color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "50%",
          width: 48, height: 48, fontSize: 20, cursor: "pointer",
        }}>⇄</button>
        <button onClick={snap} style={{
          background: "#fff", border: "4px solid rgba(255,255,255,0.5)",
          borderRadius: "50%", width: 64, height: 64, cursor: "pointer",
          boxShadow: "0 0 0 3px rgba(255,255,255,0.3)",
        }} />
        <button onClick={stopCamera} style={{
          background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
          color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "50%",
          width: 48, height: 48, fontSize: 18, cursor: "pointer",
        }}>✕</button>
      </div>
    </div>
  );

  return (
    <div>
      <button onClick={() => startCamera()} style={{
        width: "100%", padding: "28px 0", border: "2px dashed #cbd5e1",
        borderRadius: 12, background: "#f8fafc", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        color: "#64748b", fontFamily: "inherit", transition: "all 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#eff6ff"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
      >
        <span style={{ fontSize: 32 }}>📷</span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Take subject photo</span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>Tap to open camera</span>
      </button>
      {err && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 8 }}>{err}</p>}
    </div>
  );
}

// ─── Print record ─────────────────────────────────────────────────────────────
function printRecord({ lang, fullName, guardianName, isMinor, photo, sigData, photographer, project, location, timestamp }) {
  const c = CONSENT[lang];
  const dateStr = timestamp.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = timestamp.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Consent — ${fullName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;font-size:13px;color:#0f172a;background:#fff;padding:48px;max-width:800px;margin:0 auto}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #0f172a}
  .brand{font-family:'DM Serif Display',serif;font-size:28px;color:#0f172a}
  .brand span{color:#3b82f6}
  .meta{text-align:right;font-size:11px;color:#64748b;line-height:1.8}
  .subject-row{display:flex;gap:32px;align-items:flex-start;margin-bottom:28px;padding:20px;background:#f8fafc;border-radius:12px}
  .subject-photo{width:120px;height:120px;object-fit:cover;border-radius:8px;border:2px solid #e2e8f0;flex-shrink:0}
  .subject-photo-placeholder{width:120px;height:120px;border-radius:8px;border:2px dashed #e2e8f0;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:11px;text-align:center;flex-shrink:0}
  .subject-info{flex:1}
  .field-label{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin-bottom:3px}
  .field-value{font-size:16px;font-weight:700;color:#0f172a;margin-bottom:12px}
  .consent-box{background:#eff6ff;border-left:4px solid #3b82f6;padding:20px 24px;border-radius:0 10px 10px 0;margin-bottom:24px}
  .consent-title{font-family:'DM Serif Display',serif;font-size:18px;margin-bottom:12px;color:#1e3a5f}
  .consent-body{font-size:12px;line-height:1.9;color:#334155;white-space:pre-wrap}
  .agree-box{display:flex;gap:10px;align-items:flex-start;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;margin-bottom:24px}
  .checkmark{color:#16a34a;font-size:18px;flex-shrink:0;margin-top:1px}
  .agree-text{font-size:13px;color:#15803d;font-style:italic;line-height:1.6}
  .sig-row{display:flex;gap:32px;align-items:flex-end;margin-bottom:28px}
  .sig-block{flex:1}
  .sig-img{border-bottom:1.5px solid #0f172a;padding-bottom:4px;min-height:70px}
  .sig-img img{height:70px;max-width:100%}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;line-height:1.6}
  @media print{body{padding:24px}button{display:none}}
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="brand">Consent<span>.</span></div>
    <div style="font-size:11px;color:#64748b;margin-top:4px;letter-spacing:1px;text-transform:uppercase">Photography & Video Consent Record</div>
  </div>
  <div class="meta">
    ${dateStr}<br/>${timeStr}<br/>
    ${photographer ? `<strong>${photographer}</strong>` : ""}
  </div>
</div>

<div class="subject-row">
  ${photo
    ? `<img class="subject-photo" src="${photo}" alt="Subject photo"/>`
    : `<div class="subject-photo-placeholder">No photo</div>`}
  <div class="subject-info">
    <div class="field-label">${isMinor ? "Minor's Name" : "Subject Name"}</div>
    <div class="field-value">${fullName}</div>
    ${isMinor ? `<div class="field-label">Parent / Guardian</div><div class="field-value">${guardianName}</div>` : ""}
    ${project ? `<div class="field-label">Project</div><div class="field-value">${project}</div>` : ""}
    ${location ? `<div class="field-label">Location</div><div class="field-value">${location}</div>` : ""}
  </div>
</div>

<div class="consent-box">
  <div class="consent-title">${c.title}</div>
  <div class="consent-body">${c.body}</div>
</div>

<div class="agree-box">
  <div class="checkmark">✓</div>
  <div class="agree-text">${c.agree}</div>
</div>

<div class="sig-row">
  <div class="sig-block">
    <div class="field-label">Signature — ${fullName}</div>
    <div class="sig-img">${sigData ? `<img src="${sigData}"/>` : ""}</div>
  </div>
  <div class="sig-block">
    <div class="field-label">Date</div>
    <div style="font-size:15px;font-weight:700">${dateStr}</div>
    <div style="color:#64748b;font-size:12px;margin-top:2px">${timeStr}</div>
  </div>
</div>

<div style="text-align:center;margin:24px 0">
  <button onclick="window.print()" style="background:#0f172a;color:#fff;border:none;padding:12px 36px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit;letter-spacing:0.5px">
    🖨 Print / Save as PDF
  </button>
  <p style="font-size:11px;color:#94a3b8;margin-top:10px">Use your browser's Print dialog → choose "Save as PDF" → then share via email</p>
</div>

<div class="footer">
  This document constitutes a record of informed consent given voluntarily. Store securely in accordance with applicable data protection law (UK GDPR / GDPR). Reference ID: ${fullName.replace(/\s+/g,"-").toLowerCase()}-${timestamp.getTime()}
</div>
</body>
</html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const STEPS = ["session", "consent", "subject", "sign", "review", "done"];

export default function App() {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState("en");
  const [photographer, setPhotographer] = useState("");
  const [project, setProject] = useState("");
  const [location, setLocation] = useState("");
  const [fullName, setFullName] = useState("");
  const [isMinor, setIsMinor] = useState(false);
  const [guardianName, setGuardianName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [checked, setChecked] = useState(false);
  const [sigData, setSigData] = useState(null);
  const [sigReset, setSigReset] = useState(0);
  const [errors, setErrors] = useState({});
  const [timestamp, setTimestamp] = useState(null);

  const c = CONSENT[lang];

  const reset = () => {
    setStep(0); setLang("en"); setPhotographer(""); setProject(""); setLocation("");
    setFullName(""); setIsMinor(false); setGuardianName(""); setPhoto(null);
    setChecked(false); setSigData(null); setSigReset(r => r + 1); setErrors({}); setTimestamp(null);
  };

  const validate = {
    session: () => true,
    consent: () => {
      if (!checked) { setErrors({ checked: true }); return false; }
      return true;
    },
    subject: () => {
      const e = {};
      if (!fullName.trim()) e.fullName = "Please enter the subject's full name";
      if (isMinor && !guardianName.trim()) e.guardianName = "Please enter the guardian's name";
      if (!photo) e.photo = "A photo is required to identify the subject";
      setErrors(e); return Object.keys(e).length === 0;
    },
    sign: () => {
      if (!sigData) { setErrors({ sig: "Please sign to confirm consent" }); return false; }
      return true;
    },
  };

  const next = () => {
    const key = STEPS[step];
    if (validate[key] && !validate[key]()) return;
    if (key === "sign") setTimestamp(new Date());
    setErrors({});
    setStep(s => s + 1);
  };

  const card = (children, noPad) => (
    <div style={{
      background: "#fff", borderRadius: 16, padding: noPad ? 0 : "28px 24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>{children}</div>
  );

  const label = (txt, req) => (
    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1.8px",
      color: "#94a3b8", marginBottom: 6, fontWeight: 600 }}>
      {txt}{req && <span style={{ color: "#ef4444" }}> *</span>}
    </div>
  );

  const input = (value, onChange, placeholder, err, type = "text") => (
    <div style={{ marginBottom: 16 }}>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 10, boxSizing: "border-box",
          border: `1.5px solid ${err ? "#fca5a5" : "#e2e8f0"}`,
          background: err ? "#fff5f5" : "#f8fafc", fontSize: 15, color: "#0f172a",
          fontFamily: "inherit", outline: "none", transition: "border 0.2s",
        }}
        onFocus={e => e.target.style.borderColor = "#3b82f6"}
        onBlur={e => e.target.style.borderColor = err ? "#fca5a5" : "#e2e8f0"}
      />
      {err && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{err}</div>}
    </div>
  );

  const btnPrimary = (text, onClick, disabled) => (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", padding: "15px 0", background: disabled ? "#e2e8f0" : "#0f172a",
      color: disabled ? "#94a3b8" : "#fff", border: "none", borderRadius: 12,
      fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", letterSpacing: "0.3px", transition: "all 0.15s",
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "#1e3a5f"; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = "#0f172a"; }}
    >{text}</button>
  );

  const btnSecondary = (text, onClick) => (
    <button onClick={onClick} style={{
      width: "100%", padding: "13px 0", background: "transparent",
      color: "#64748b", border: "1.5px solid #e2e8f0", borderRadius: 12,
      fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#94a3b8"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
    >{text}</button>
  );

  const progressBar = (
    <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
      {STEPS.slice(0, -1).map((s, i) => (
        <div key={s} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: i <= step ? "#3b82f6" : "#e2e8f0",
          transition: "background 0.3s",
        }} />
      ))}
    </div>
  );

  const stepLabel = ["Session", "Consent", "Subject", "Signature", "Review", "Done"];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "32px 16px 60px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap" rel="stylesheet" />

      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: "#0f172a", letterSpacing: "-0.5px" }}>
            Consent<span style={{ color: "#3b82f6" }}>.</span>
          </div>
          {step < 5 && (
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, letterSpacing: "1px", textTransform: "uppercase" }}>
              {stepLabel[step]}
            </div>
          )}
        </div>

        {step < 5 && progressBar}

        {/* ── Step 0: Session ── */}
        {step === 0 && card(
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#0f172a", marginBottom: 6 }}>
              Session details
            </div>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Optional — these appear on the consent record.
            </p>

            {label("Your name / organisation")}
            {input(photographer, e => setPhotographer(e.target.value), "e.g. Sean Murphy Photography")}

            {label("Project / assignment")}
            {input(project, e => setProject(e.target.value), "e.g. Cerrejón Documentary")}

            {label("Location")}
            {input(location, e => setLocation(e.target.value), "e.g. La Guajira, Colombia")}

            <div style={{ marginBottom: 20 }}>
              {label("Consent language")}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(CONSENT).map(([k, v]) => (
                  <button key={k} onClick={() => setLang(k)} style={{
                    padding: "8px 16px", borderRadius: 20, border: "1.5px solid",
                    borderColor: lang === k ? "#3b82f6" : "#e2e8f0",
                    background: lang === k ? "#eff6ff" : "#f8fafc",
                    color: lang === k ? "#1d4ed8" : "#64748b",
                    fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: lang === k ? 600 : 400,
                    transition: "all 0.2s",
                  }}>{v.label}</button>
                ))}
              </div>
            </div>

            {btnPrimary("Next →", next)}
          </div>
        )}

        {/* ── Step 1: Consent text ── */}
        {step === 1 && card(
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#0f172a", marginBottom: 4 }}>
              {c.title}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20, textTransform: "uppercase", letterSpacing: "1px" }}>
              Please read carefully
            </div>

            <div style={{
              background: "#f8fafc", borderRadius: 12, padding: "20px",
              fontSize: 14, lineHeight: 1.9, color: "#334155",
              whiteSpace: "pre-wrap", marginBottom: 20, maxHeight: 300, overflowY: "auto",
              border: "1px solid #e2e8f0",
            }}>{c.body}</div>

            <div onClick={() => { setChecked(v => !v); setErrors({}); }}
              style={{
                display: "flex", gap: 14, alignItems: "flex-start",
                background: checked ? "#f0fdf4" : errors.checked ? "#fff5f5" : "#f8fafc",
                border: `1.5px solid ${checked ? "#86efac" : errors.checked ? "#fca5a5" : "#e2e8f0"}`,
                borderRadius: 12, padding: "14px 16px", cursor: "pointer",
                marginBottom: 20, transition: "all 0.2s",
              }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? "#16a34a" : "#cbd5e1"}`,
                background: checked ? "#16a34a" : "#fff", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s", marginTop: 1,
              }}>
                {checked && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
              </div>
              <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.6 }}>{c.agree}</div>
            </div>
            {errors.checked && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, marginTop: -12 }}>Please tick the box to continue</div>}

            <div style={{ display: "flex", gap: 10 }}>
              {btnSecondary("← Back", () => setStep(0))}
              {btnPrimary("Next →", next)}
            </div>
          </div>
        )}

        {/* ── Step 2: Subject ── */}
        {step === 2 && card(
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#0f172a", marginBottom: 4 }}>
              About the subject
            </div>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              A photo helps clearly identify who gave consent.
            </p>

            <div style={{ marginBottom: 20 }}>
              {label("Subject photo", true)}
              <CameraCapture photo={photo} onCapture={setPhoto} />
              {errors.photo && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{errors.photo}</div>}
            </div>

            <div style={{ marginBottom: 8 }}>
              {label("Full name", true)}
              {input(fullName, e => { setFullName(e.target.value); setErrors(v => ({ ...v, fullName: null })); },
                "Subject's full name", errors.fullName)}
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
              padding: "12px 14px", background: "#f8fafc", borderRadius: 10,
              border: "1.5px solid #e2e8f0", cursor: "pointer",
            }} onClick={() => setIsMinor(v => !v)}>
              <div style={{
                width: 20, height: 20, borderRadius: 5, border: `2px solid ${isMinor ? "#3b82f6" : "#cbd5e1"}`,
                background: isMinor ? "#3b82f6" : "#fff", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isMinor && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: 14, color: "#334155" }}>Subject is under 18 — parent/guardian signing</span>
            </div>

            {isMinor && (
              <div>
                {label("Parent / Guardian name", true)}
                {input(guardianName, e => { setGuardianName(e.target.value); setErrors(v => ({ ...v, guardianName: null })); },
                  "Guardian's full name", errors.guardianName)}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              {btnSecondary("← Back", () => setStep(1))}
              {btnPrimary("Next →", next)}
            </div>
          </div>
        )}

        {/* ── Step 3: Signature ── */}
        {step === 3 && card(
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#0f172a", marginBottom: 4 }}>
              Sign to confirm
            </div>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              {isMinor ? `${guardianName} (guardian) should sign below.` : `${fullName}, please sign below.`}
            </p>

            <SignaturePad onSigned={d => { setSigData(d); setErrors({}); }} resetKey={sigReset} />
            {errors.sig && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{errors.sig}</div>}

            <button onClick={() => { setSigReset(r => r + 1); setSigData(null); }}
              style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 12,
                cursor: "pointer", marginTop: 8, textDecoration: "underline", fontFamily: "inherit" }}>
              Clear signature
            </button>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {btnSecondary("← Back", () => setStep(2))}
              {btnPrimary("Review →", next)}
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && card(
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#0f172a", marginBottom: 4 }}>
              Review & confirm
            </div>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>Everything look right?</p>

            {/* Subject photo + info */}
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start",
              background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              {photo
                ? <img src={photo} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "2px solid #e2e8f0", flexShrink: 0 }} />
                : <div style={{ width: 80, height: 80, borderRadius: 8, background: "#e2e8f0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👤</div>
              }
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{fullName}</div>
                {isMinor && <div style={{ fontSize: 13, color: "#64748b" }}>Guardian: {guardianName}</div>}
                {photographer && <div style={{ fontSize: 13, color: "#64748b" }}>📸 {photographer}</div>}
                {project && <div style={{ fontSize: 13, color: "#64748b" }}>🎬 {project}</div>}
                {location && <div style={{ fontSize: 13, color: "#64748b" }}>📍 {location}</div>}
              </div>
            </div>

            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#15803d" }}>
              ✓ Consent given · {CONSENT[lang].label}
            </div>

            {sigData && (
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1.5px", color: "#94a3b8", marginBottom: 8 }}>Signature</div>
                <img src={sigData} style={{ height: 70, maxWidth: "100%" }} />
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              {btnSecondary("← Back", () => setStep(3))}
              <button onClick={() => {
                setTimestamp(new Date());
                setStep(5);
                setTimeout(() => printRecord({ lang, fullName, guardianName, isMinor, photo, sigData, photographer, project, location, timestamp: new Date() }), 300);
              }} style={{
                flex: 2, padding: "15px 0", background: "#3b82f6", color: "#fff",
                border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Confirm & Open Record →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Done ── */}
        {step === 5 && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%", background: "#f0fdf4",
              border: "2px solid #86efac", margin: "0 auto 20px",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
            }}>✓</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#0f172a", marginBottom: 8 }}>
              Consent recorded
            </div>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              The record has opened in a new tab.<br />
              Use <strong>Print → Save as PDF</strong> to save it,<br />then attach to an email to send.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 320, margin: "0 auto" }}>
              <button onClick={() => printRecord({ lang, fullName, guardianName, isMinor, photo, sigData, photographer, project, location, timestamp })}
                style={{ padding: "13px 0", background: "#f8fafc", border: "1.5px solid #e2e8f0",
                  borderRadius: 12, fontSize: 14, cursor: "pointer", fontFamily: "inherit", color: "#334155" }}>
                🖨 Reopen record
              </button>
              {btnPrimary("New consent →", reset)}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "#cbd5e1" }}>
          No data stored online · All records stay on your device
        </div>
      </div>
    </div>
  );
}
