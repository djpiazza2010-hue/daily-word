exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let topic;
  try {
    topic = JSON.parse(event.body || "{}").topic;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!topic) {
    return { statusCode: 400, body: JSON.stringify({ error: "No topic provided" }) };
  }

  const systemPrompt = `You are a thoughtful Bible scholar and pastoral guide.
When given a prayer need or topic, respond ONLY with a valid JSON object (no markdown, no backticks, no extra text) in this exact structure:

{
  "verse": "The full, exact text of one real Bible verse directly relevant to this need",
  "reference": "Book Chapter:Verse (e.g. Philippians 4:13)",
  "prayer": "A short, heartfelt prayer in 2-4 sentences drawing from the spirit of that verse",
  "affirmation": "A single uplifting affirmation sentence rooted in the verse's truth"
}

Rules:
- The verse must be a REAL, ACCURATE passage from the Christian Bible (KJV or NIV)
- Choose the verse most directly comforting or relevant to the specific need
- The prayer should feel personal, warm, and conversational with God
- The affirmation should be in second person ("You are...", "God has...")
- Return ONLY the JSON, nothing else`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: `Prayer need: ${topic}` }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return { statusCode: 500, body: JSON.stringify({ error: "Could not reach the scriptures. Please try again." }) };
    }

    const data = await response.json();
    const text = data.content.map((b) => b.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    JSON.parse(clean);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: clean,
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong. Please try again." }),
    };
  }
};
```

4. Scroll down and click the green **"Commit changes"** button → **"Commit changes"** again

---

After that your repo should have:
```
daily-word/
├── index.html
├── netlify.toml
└── netlify/
    └── functions/
        └── pray.js
