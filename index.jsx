import { useState, useRef } from "react";

const THEMES = [
  { id: "night_flash",      emoji: "⚡", label: "Night Flash",      desc: "iPhone flash malam" },
  { id: "night_street",     emoji: "🌃", label: "Night Street",     desc: "Ambient malam, no flash" },
  { id: "night_car",        emoji: "🚗", label: "Night In Car",     desc: "Dalam mobil malam hari" },
  { id: "indoor_flash",     emoji: "🏠", label: "Indoor Flash",     desc: "Indoor iPhone flash" },
  { id: "daylight_outdoor", emoji: "☀️", label: "Daylight",         desc: "Outdoor siang hari" },
  { id: "snow_mountain",    emoji: "🏔️", label: "Snow Mountain",    desc: "Pegunungan bersalju" },
  { id: "golden_hour",      emoji: "🌅", label: "Golden Hour",      desc: "Sore keemasan" },
  { id: "cafe",             emoji: "☕", label: "Cafe",             desc: "Indoor cafe cozy" },
];

const SUBJECT_TYPES = [
  { id: "auto",   label: "🔍 Auto detect" },
  { id: "female", label: "👩 Female" },
  { id: "male",   label: "👨 Male" },
  { id: "couple", label: "👫 Couple" },
];

const MODES = [
  { id: "base",    label: "✦ Flow Style",   desc: "Pakai template bawaan" },
  { id: "mystyle", label: "🧠 My Style",    desc: "AI pelajarin prompt kamu" },
];

const PLACEHOLDER = `Paste contoh prompt Google Flow kamu di sini (minimal 3)...

Makin banyak contoh = makin akurat AI ngikutin gaya lu.`;

export default function App() {
  const [tab, setTab] = useState("base");
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [theme, setTheme] = useState("night_flash");
  const [subjectType, setSubjectType] = useState("auto");
  const [userPrompts, setUserPrompts] = useState("");
  const [result, setResult] = useState(null);
  const [pattern, setPattern] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showPattern, setShowPattern] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setResult(null); setError(""); setPattern(null);
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => { setImage(e.target.result); setImageBase64(e.target.result.split(",")[1]); };
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    if (!imageBase64) { setError("Upload foto dulu ya!"); return; }
    if (tab === "mystyle" && userPrompts.trim().length < 100) {
      setError("Paste contoh prompt kamu dulu! Minimal 3 prompt biar AI bisa belajar."); return;
    }
    setLoading(true); setResult(null); setError(""); setPattern(null);

    if (tab === "mystyle") {
      setLoadingStep("Mempelajari gaya prompt kamu...");
      setTimeout(() => setLoadingStep("Menganalisis foto..."), 2200);
      setTimeout(() => setLoadingStep("Menulis prompt dalam gaya kamu..."), 4500);
    } else {
      setLoadingStep("Menganalisis foto...");
      setTimeout(() => setLoadingStep("Menulis prompt Google Flow..."), 2000);
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, imageMime, theme, subjectType, mode: tab, userPrompts })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");
      setResult(data.result);
      if (data.pattern) setPattern(data.pattern);
    } catch (e) {
      setError("Error: " + e.message);
    }
    setLoading(false);
  };

  const fullPrompt = result ? `Subject: ${result.subject_line}\n\n${result.prompt_body}` : "";

  const copy = () => {
    navigator.clipboard.writeText(fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const canGenerate = imageBase64 && !loading;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060e1c",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#c8e0f8",
      paddingBottom: 80,
    }}>

      {/* Ambient */}
      <div style={{ position:"fixed", top:-80, right:-60, width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(0,100,255,0.07) 0%, transparent 65%)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:-60, left:-40, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(0,180,255,0.05) 0%, transparent 65%)", pointerEvents:"none", zIndex:0 }} />

      <style>{`
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes loadbar { 0%{left:-40%} 100%{left:100%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn { 0%{opacity:0;transform:scale(0.96)} 100%{opacity:1;transform:scale(1)} }
        .genBtn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,120,255,0.45) !important; }
        .genBtn:active:not(:disabled) { transform: translateY(0px); }
        .themeBtn:hover { border-color: rgba(0,140,255,0.5) !important; background: rgba(0,80,180,0.2) !important; }
        .copyBtn:hover { background: rgba(0,120,220,0.3) !important; }
        input:focus, textarea:focus { outline: none; border-color: rgba(0,140,255,0.55) !important; box-shadow: 0 0 0 3px rgba(0,100,255,0.1) !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(0,100,200,0.3); border-radius:4px; }
      `}</style>

      {/* Header */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:"rgba(6,14,28,0.92)", backdropFilter:"blur(24px)", borderBottom:"1px solid rgba(0,80,180,0.18)" }}>
        <div style={{ maxWidth:620, margin:"0 auto", padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#0055dd,#00aaff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:900, color:"#fff", boxShadow:"0 0 18px rgba(0,130,255,0.35)", letterSpacing:-0.5 }}>✦</div>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:"#e4f2ff", letterSpacing:-0.3 }}>FlowPrompt</div>
              <div style={{ fontSize:10, color:"#2a6090", letterSpacing:0.5 }}>Google Flow · AI Generator</div>
            </div>
          </div>
          <div style={{ fontSize:11, color:"#1e5a88", background:"rgba(0,60,140,0.25)", border:"1px solid rgba(0,80,160,0.2)", padding:"5px 12px", borderRadius:20 }}>
            🔒 API key aman di server
          </div>
        </div>
      </div>

      <div style={{ maxWidth:620, margin:"0 auto", padding:"24px 18px 0", position:"relative", zIndex:1 }}>

        {/* Hero */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <h1 style={{ fontSize:26, fontWeight:900, margin:"0 0 8px", letterSpacing:-0.8, background:"linear-gradient(90deg,#4aa8ff,#00d4ff,#4aa8ff)", backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"shimmer 3.5s linear infinite" }}>
            Upload Foto → Dapat Prompt ✦
          </h1>
          <p style={{ color:"#2a5a80", fontSize:13, margin:0, lineHeight:1.6 }}>
            Output format Google Flow / Gemini · paragraf naratif siap pakai
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => { setTab(m.id); setResult(null); setError(""); setPattern(null); }} style={{
              padding:"13px 16px", borderRadius:14, border:"1px solid",
              borderColor: tab===m.id ? "rgba(0,130,255,0.6)" : "rgba(0,70,150,0.2)",
              background: tab===m.id ? "rgba(0,90,220,0.2)" : "rgba(0,20,60,0.3)",
              color: tab===m.id ? "#60c0ff" : "#2a5a80",
              cursor:"pointer", textAlign:"left", transition:"all 0.2s",
              boxShadow: tab===m.id ? "0 0 20px rgba(0,110,255,0.15), inset 0 0 20px rgba(0,80,200,0.08)" : "none",
            }}>
              <div style={{ fontWeight:800, fontSize:13, marginBottom:2 }}>{m.label}</div>
              <div style={{ fontSize:11, opacity:0.65 }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Upload */}
        <div style={{ background:"rgba(0,25,65,0.55)", border:"1px solid rgba(0,80,180,0.18)", borderRadius:18, padding:18, marginBottom:12, backdropFilter:"blur(12px)" }}>
          <div style={{ fontSize:11, color:"#1e6090", letterSpacing:1.5, fontWeight:700, marginBottom:12 }}>UPLOAD FOTO</div>
          <div
            onClick={() => fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            style={{ border:`2px dashed ${dragOver?"#00aaff":image?"rgba(0,130,255,0.35)":"rgba(0,70,150,0.25)"}`, borderRadius:13, overflow:"hidden", cursor:"pointer", background:dragOver?"rgba(0,80,180,0.1)":"rgba(0,10,40,0.4)", transition:"all 0.2s", minHeight:image?0:140, display:"flex", alignItems:"center", justifyContent:"center" }}
          >
            {image ? (
              <div style={{ position:"relative", width:"100%" }}>
                <img src={image} alt="preview" style={{ width:"100%", maxHeight:280, objectFit:"cover", display:"block" }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,8,25,0.75) 0%, transparent 45%)", display:"flex", alignItems:"flex-end", padding:"10px 14px" }}>
                  <span style={{ fontSize:11, color:"#5aa8d8", fontWeight:600 }}>📎 klik untuk ganti foto</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign:"center", padding:"32px 20px" }}>
                <div style={{ fontSize:36, marginBottom:10, filter:"saturate(0.6) brightness(0.7)" }}>🌊</div>
                <div style={{ fontWeight:700, color:"#1e5070", fontSize:13, marginBottom:4 }}>Drag & drop atau klik untuk pilih</div>
                <div style={{ fontSize:11, color:"#143550" }}>JPG · PNG · WEBP</div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
        </div>

        {/* Theme */}
        <div style={{ background:"rgba(0,25,65,0.55)", border:"1px solid rgba(0,80,180,0.18)", borderRadius:18, padding:18, marginBottom:12, backdropFilter:"blur(12px)" }}>
          <div style={{ fontSize:11, color:"#1e6090", letterSpacing:1.5, fontWeight:700, marginBottom:12 }}>SETTING / TEMA</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {THEMES.map(t => (
              <button key={t.id} className="themeBtn" onClick={() => setTheme(t.id)} style={{
                padding:"10px 12px", borderRadius:11, border:"1px solid",
                borderColor: theme===t.id ? "rgba(0,130,255,0.55)" : "rgba(0,70,150,0.2)",
                background: theme===t.id ? "rgba(0,90,220,0.2)" : "rgba(0,10,40,0.35)",
                color: theme===t.id ? "#70c8ff" : "#2a5070",
                cursor:"pointer", textAlign:"left", transition:"all 0.15s",
                display:"flex", alignItems:"center", gap:10,
                boxShadow: theme===t.id ? "0 0 14px rgba(0,110,255,0.12)" : "none",
              }}>
                <span style={{ fontSize:18 }}>{t.emoji}</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:12 }}>{t.label}</div>
                  <div style={{ fontSize:10, opacity:0.6 }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Subject Type */}
        <div style={{ background:"rgba(0,25,65,0.55)", border:"1px solid rgba(0,80,180,0.18)", borderRadius:18, padding:18, marginBottom:12, backdropFilter:"blur(12px)" }}>
          <div style={{ fontSize:11, color:"#1e6090", letterSpacing:1.5, fontWeight:700, marginBottom:12 }}>TIPE SUBJEK</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {SUBJECT_TYPES.map(s => (
              <button key={s.id} onClick={() => setSubjectType(s.id)} style={{
                padding:"8px 16px", borderRadius:20, border:"1px solid",
                borderColor: subjectType===s.id ? "rgba(0,130,255,0.55)" : "rgba(0,70,150,0.2)",
                background: subjectType===s.id ? "rgba(0,90,220,0.2)" : "rgba(0,10,40,0.35)",
                color: subjectType===s.id ? "#70c8ff" : "#2a5070",
                cursor:"pointer", fontSize:13, fontWeight:subjectType===s.id?700:500, transition:"all 0.15s",
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* My Style: example prompts */}
        {tab === "mystyle" && (
          <div style={{ background:"rgba(0,25,65,0.55)", border:"1px solid rgba(0,100,220,0.25)", borderRadius:18, padding:18, marginBottom:12, backdropFilter:"blur(12px)", animation:"fadeUp 0.3s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:11, color:"#1e6090", letterSpacing:1.5, fontWeight:700, marginBottom:2 }}>CONTOH PROMPT KAMU</div>
                <div style={{ fontSize:11, color:"#143a58" }}>Paste minimal 3 prompt · AI pelajarin polanya</div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, padding:"3px 12px", borderRadius:20, border:"1px solid", borderColor: userPrompts.trim().length>100?"rgba(0,200,100,0.3)":"rgba(200,140,0,0.3)", background: userPrompts.trim().length>100?"rgba(0,200,100,0.08)":"rgba(200,140,0,0.08)", color: userPrompts.trim().length>100?"#4ade80":"#fbbf24" }}>
                {userPrompts.trim().length>100 ? "✓ Siap" : "Perlu lebih"}
              </div>
            </div>
            <textarea
              placeholder={PLACEHOLDER}
              value={userPrompts}
              onChange={e => setUserPrompts(e.target.value)}
              rows={7}
              style={{ width:"100%", padding:"14px", boxSizing:"border-box", background:"rgba(0,8,30,0.6)", border:"1px solid rgba(0,60,140,0.3)", borderRadius:12, color:"#90c8e8", fontSize:12.5, lineHeight:1.85, resize:"vertical", fontFamily:"inherit", transition:"all 0.2s" }}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background:"rgba(180,40,40,0.12)", border:"1px solid rgba(200,60,60,0.25)", borderRadius:12, padding:"12px 16px", fontSize:13, color:"#ff8080", marginBottom:14, display:"flex", gap:8, alignItems:"flex-start" }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {/* Generate Button */}
        <button
          className="genBtn"
          onClick={generate}
          disabled={!canGenerate}
          style={{
            width:"100%", padding:"17px", borderRadius:14, border:"none",
            cursor:canGenerate?"pointer":"not-allowed",
            fontSize:15, fontWeight:800, letterSpacing:0.2,
            background: canGenerate
              ? "linear-gradient(90deg, #0050e0, #0094ff, #00c4ff)"
              : "rgba(0,25,65,0.5)",
            color: canGenerate ? "#fff" : "#1a4060",
            transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            boxShadow: canGenerate ? "0 4px 20px rgba(0,110,255,0.3)" : "none",
            position:"relative", overflow:"hidden",
          }}
        >
          {loading
            ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                <span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                {loadingStep}
              </span>
            : tab === "mystyle" ? "🧠 Pelajari & Generate Prompt" : "✦ Generate Flow Prompt"
          }
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {/* Loading bar */}
        {loading && (
          <div style={{ marginTop:10, height:2, background:"rgba(0,50,130,0.25)", borderRadius:4, overflow:"hidden", position:"relative" }}>
            <div style={{ position:"absolute", top:0, height:"100%", width:"40%", background:"linear-gradient(90deg, transparent, #0088ff, #00ccff, transparent)", borderRadius:4, animation:"loadbar 1.4s ease-in-out infinite" }} />
          </div>
        )}

        {/* Pattern card */}
        {pattern && (
          <div style={{ marginTop:16, background:"rgba(0,30,80,0.4)", border:"1px solid rgba(0,100,200,0.2)", borderRadius:14, overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
            <button onClick={() => setShowPattern(!showPattern)} style={{ width:"100%", padding:"13px 16px", background:"none", border:"none", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", color:"#4090c8" }}>
              <span style={{ fontWeight:700, fontSize:12 }}>🧠 Pola yang Dipelajari AI</span>
              <span style={{ fontSize:12 }}>{showPattern ? "▲ Tutup" : "▼ Lihat detail"}</span>
            </button>
            {showPattern && (
              <div style={{ padding:"4px 16px 16px", borderTop:"1px solid rgba(0,80,160,0.15)", animation:"fadeUp 0.2s ease" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                  {[
                    ["Opening Formula", pattern.opening_formula],
                    ["Lighting Approach", pattern.lighting_approach],
                    ["Expression Style", pattern.expression_style],
                    ["Paragraph Length", pattern.paragraph_length],
                  ].map(([k,v]) => v && (
                    <div key={k} style={{ background:"rgba(0,20,60,0.5)", borderRadius:9, padding:"10px 12px" }}>
                      <div style={{ fontSize:9, color:"#1e5070", fontWeight:700, letterSpacing:1, marginBottom:4 }}>{k.toUpperCase()}</div>
                      <div style={{ fontSize:11.5, color:"#6aaac8", lineHeight:1.6 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {pattern.unique_vocabulary?.length > 0 && (
                  <div>
                    <div style={{ fontSize:9, color:"#1e5070", fontWeight:700, letterSpacing:1, marginBottom:6 }}>VOCABULARY KHAS</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {pattern.unique_vocabulary.map((v,i) => (
                        <span key={i} style={{ fontSize:11, color:"#4a90b8", background:"rgba(0,50,130,0.35)", border:"1px solid rgba(0,80,160,0.2)", padding:"3px 10px", borderRadius:20 }}>{v}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ marginTop:16, animation:"popIn 0.35s cubic-bezier(0.34,1.2,0.64,1)" }}>

            {/* Style match */}
            {result.style_match && result.style_match !== "base style applied" && (
              <div style={{ background:"rgba(0,130,80,0.1)", border:"1px solid rgba(0,180,100,0.2)", borderRadius:12, padding:"10px 16px", marginBottom:12, display:"flex", gap:10, alignItems:"center" }}>
                <span style={{ fontSize:18 }}>🎯</span>
                <div style={{ fontSize:12, color:"#3ad898", fontWeight:600 }}>Style Match: {result.style_match}</div>
              </div>
            )}

            {/* Prompt card */}
            <div style={{ background:"rgba(0,25,65,0.7)", border:"1px solid rgba(0,120,255,0.25)", borderRadius:18, overflow:"hidden", backdropFilter:"blur(16px)", boxShadow:"0 8px 40px rgba(0,60,180,0.15)" }}>

              {/* Card header */}
              <div style={{ padding:"14px 18px", background:"rgba(0,50,130,0.25)", borderBottom:"1px solid rgba(0,90,200,0.18)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:14, color:"#70c0ff" }}>✦ {result.title || "Generated Prompt"}</div>
                  <div style={{ fontSize:10, color:"#1e5878", marginTop:2 }}>Google Flow · {result.sections_count || "12"} sections</div>
                </div>
                <button
                  className="copyBtn"
                  onClick={copy}
                  style={{ padding:"8px 18px", borderRadius:20, border:"1px solid", borderColor:copied?"rgba(0,200,120,0.4)":"rgba(0,110,220,0.35)", background:copied?"rgba(0,180,100,0.12)":"rgba(0,60,160,0.2)", color:copied?"#4ade80":"#60b8ff", cursor:"pointer", fontSize:12, fontWeight:700, transition:"all 0.2s", display:"flex", alignItems:"center", gap:6 }}>
                  {copied ? <>✓ <span>Tersalin!</span></> : <>📋 <span>Copy All</span></>}
                </button>
              </div>

              {/* Prompt content */}
              <div style={{ padding:"20px 20px", maxHeight:520, overflowY:"auto" }}>
                {/* Subject line */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:10, color:"#1e5070", fontWeight:700, letterSpacing:1.5, marginBottom:6 }}>SUBJECT</div>
                  <div style={{ fontSize:13, color:"#90c8e8", lineHeight:1.7, fontStyle:"italic" }}>{result.subject_line}</div>
                </div>

                {/* Prompt body — render section headers highlighted */}
                <div style={{ fontSize:13, color:"#8ab8d8", lineHeight:1.9, whiteSpace:"pre-wrap" }}>
                  {result.prompt_body?.split("\n").map((line, i) => {
                    const isSectionHeader = /^[A-Z][A-Z\s&()]+:/.test(line.trim());
                    if (isSectionHeader) return (
                      <div key={i} style={{ marginTop:14, marginBottom:4, fontSize:11, fontWeight:800, color:"#3a80b8", letterSpacing:1.2 }}>{line}</div>
                    );
                    if (!line.trim()) return <div key={i} style={{ height:4 }} />;
                    return <div key={i} style={{ color:"#90b8d0", lineHeight:1.85 }}>{line}</div>;
                  })}
                </div>
              </div>

              {/* Card footer */}
              <div style={{ padding:"12px 18px", borderTop:"1px solid rgba(0,70,160,0.15)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, color:"#1a4a6a" }}>Siap dipaste ke Google Flow / Gemini</span>
                <button onClick={copy} style={{ fontSize:12, color:copied?"#4ade80":"#4090b8", background:"none", border:"none", cursor:"pointer", fontWeight:700 }}>
                  {copied ? "✓ Copied!" : "Copy →"}
                </button>
              </div>
            </div>

            {/* Reset */}
            <button onClick={() => { setResult(null); setImage(null); setImageBase64(null); setPattern(null); setShowPattern(false); }} style={{ marginTop:12, width:"100%", padding:"12px", background:"rgba(0,20,55,0.4)", border:"1px solid rgba(0,60,140,0.2)", borderRadius:12, color:"#2a5a80", cursor:"pointer", fontSize:13, fontWeight:600, transition:"all 0.2s" }}>
              ↺ Reset & Foto Baru
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
