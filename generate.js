export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageBase64, imageMime, theme, subjectType, mode, userPrompts } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "Foto tidak ditemukan" });

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "Server belum dikonfigurasi" });

  const THEMES = {
    night_flash:      "night-time urban environment, direct on-camera iPhone flash, harsh frontal light, bokeh background lights, flash hotspots",
    night_street:     "night-time urban street, mixed ambient streetlights, NO flash, gritty city background, low-light grain",
    night_car:        "inside a car at night, dark interior, direct iPhone flash, distant streetlights through window, enclosed intimate space",
    daylight_outdoor: "bright natural daylight outdoors, soft even illumination, no flash, natural shadows",
    snow_mountain:    "bright snowy mountain daylight, snow-reflected cool light, crisp cold atmosphere, ski resort environment",
    indoor_flash:     "indoor environment, direct iPhone flash, mix of flash and ambient artificial light",
    golden_hour:      "golden hour outdoors, warm directional sunlight, long soft shadows, rich warm tones",
    cafe:             "cozy indoor cafe, warm ambient and natural window light, no flash, soft shadows",
  };

  const BASE_STYLE = `
You write prompts for Google Flow / Gemini image generation in a very specific hyper-realistic candid iPhone photography style.

THE EXACT PROMPT STRUCTURE YOU MUST FOLLOW (always in this order):
1. Subject declaration line: "Subject: [description]"
2. Opening line: "Create a hyper-realistic [scenario] captured using an unedited iPhone rear camera..."
3. CAMERA & CAPTURE SYSTEM section
4. FRAMING & COMPOSITION section  
5. LIGHTING section (named based on context: "Lighting (flash behavior):" or "Lighting (night street behavior):" etc.)
6. EXPOSURE & CAMERA BEHAVIOR section
7. FACIAL EXPRESSION & BEHAVIOR section
8. CLOTHING & ACCESSORIES section
9. [CONTEXTUAL section — e.g. MOTORCYCLE DETAILS, CAT INTERACTION, BACKGROUND OBJECT, etc.]
10. BACKGROUND ENVIRONMENT section
11. OVERALL REALISM CONSTRAINT section — always ends with: "No cinematic lighting, no editorial posing, no beauty retouching language."
12. IDENTITY LOCK section — always: "Do not change the Subject's facial features. The Subject must look 1000% identical to the reference image."

SIGNATURE TECHNICAL LANGUAGE TO ALWAYS USE:
- "≈24–26mm full-frame equivalent"
- "mild computational sharpening"  
- "deep depth-of-field"
- "phone-style exposure"
- "captured mid-reaction rather than held as a pose" (for expression sections)
- "low-level noise in darker areas" (for night shots)
- "handheld" camera description
- All sections written as narrative paragraphs, NEVER bullet points

TONE: Clinical, technical, like a photography brief. Precise. Grounded in realism.`;

  try {
    const themeDesc = THEMES[theme] || THEMES["night_flash"];
    let patternData = null;

    // If My Style mode — first learn the user's pattern
    if (mode === "mystyle" && userPrompts?.trim().length > 100) {
      const patternRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Analyze these Google Flow image generation prompts and extract the writer's unique style patterns.
Output ONLY valid JSON, no markdown:
{
  "opening_formula": "their exact opening sentence template",
  "section_headers": ["exact section header names they use"],
  "camera_phrases": ["technical phrases they repeat"],
  "lighting_approach": "how they describe lighting",
  "expression_style": "how they describe facial expressions",  
  "clothing_detail_level": "how detailed their clothing descriptions are",
  "realism_closing": "their exact overall realism constraint closing line",
  "unique_vocabulary": ["words/phrases unique to their style"],
  "paragraph_length": "short/medium/long per section"
}

USER'S PROMPTS:
---
${userPrompts.substring(0, 3000)}
---` }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 700 }
          })
        }
      );
      const pData = await patternRes.json();
      const pRaw = pData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      try {
        patternData = JSON.parse(pRaw.replace(/```json|```/g, "").trim());
      } catch { patternData = null; }
    }

    const mystyleAddition = patternData ? `
ADDITIONALLY — this user has a custom style. Learn and apply these patterns on top of the base style:
- Their opening formula: ${patternData.opening_formula}
- Their section headers: ${patternData.section_headers?.join(", ")}
- Their camera phrases: ${patternData.camera_phrases?.join(", ")}
- Their lighting approach: ${patternData.lighting_approach}
- Their expression style: ${patternData.expression_style}
- Their unique vocabulary: ${patternData.unique_vocabulary?.join(", ")}
- Their paragraph length preference: ${patternData.paragraph_length}

ALSO study these example prompts they wrote and mimic the style closely:
---
${userPrompts?.substring(0, 2000)}
---` : "";

    const subjectLine = subjectType === "couple"
      ? "Subject 1: Person in the image\nSubject 2: Second person (partner)"
      : subjectType === "male"
      ? "Subject: Person in the image (male)"
      : "Subject: Person in the image";

    const finalPrompt = `${BASE_STYLE}
${mystyleAddition}

Now analyze the uploaded photo carefully and generate a complete Google Flow prompt.

SETTING/THEME: ${themeDesc}
SUBJECT TYPE: ${subjectType}

Describe what you ACTUALLY SEE in the photo — real clothing, real hair, real expression, real background — adapted to the theme setting above.

Output ONLY valid JSON, no markdown, no explanation:
{
  "title": "2-4 word theme title matching user's style (e.g. 'Night Flash Portrait', 'Car Selfie', 'Snow Mountain Selfie')",
  "subject_line": "${subjectLine}",
  "prompt_body": "The complete prompt body — everything AFTER the subject line. Use ALL CAPS for section headers followed by colon and newline. Write each section as a narrative paragraph. End with OVERALL REALISM CONSTRAINT and IDENTITY LOCK sections.",
  "sections_count": 12,
  "style_match": "${mode === "mystyle" ? "X/10 — one sentence on how well you matched their style" : "base style applied"}"
}`;

    const gemRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { inline_data: { mime_type: imageMime, data: imageBase64 } },
            { text: finalPrompt }
          ]}],
          generationConfig: { temperature: 0.65, maxOutputTokens: 2500 }
        })
      }
    );

    const gemData = await gemRes.json();
    if (!gemRes.ok) throw new Error(gemData?.error?.message || "Gemini API error");

    const raw = gemData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return res.status(200).json({ success: true, result, pattern: patternData });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } }
};
