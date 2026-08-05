// Génère les images du site landing via l'API Replicate (modèle flux-1.1-pro).
// Usage : node --env-file=.env scripts/generate-images.mjs

import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) {
  console.error("REPLICATE_API_TOKEN manquant (attendu dans .env à la racine).");
  process.exit(1);
}

const STYLE =
  "Photojournalistic corporate photography, natural window light, shallow depth of field, " +
  "realistic French small-business office setting, authentic candid mood, professional but approachable, " +
  "cool blue and neutral color grading, no legible text, no readable text on screens or documents, no logos, no watermark.";

const IMAGES = [
  {
    out: "apps/landing/images/banner-hero.jpg",
    prompt:
      "A small business owner in their forties reviewing a report on a laptop at a tidy desk near a window, " +
      "focused and thoughtful expression, bright modern office. " + STYLE,
  },
  {
    out: "apps/landing/images/section-concerne.jpg",
    prompt:
      "A diverse small team of four colleagues gathered around a laptop in a bright open-plan office, " +
      "discussing a chatbot interface on screen, collaborative and engaged. " + STYLE,
  },
  {
    out: "apps/landing/images/section-etapes.jpg",
    prompt:
      "Close-up of two professionals reviewing printed documents together and signing papers at a wooden desk, " +
      "French SME office, hands and papers in focus. " + STYLE,
  },
  {
    out: "apps/landing/images/articles/ai-act-entreprise-concernee.jpg",
    prompt:
      "A small business owner sitting at a desk, looking thoughtfully at a laptop screen showing a simple checklist interface, " +
      "modest office. " + STYLE,
  },
  {
    out: "apps/landing/images/articles/calendrier-ai-act-dates.jpg",
    prompt:
      "Close-up of a hand circling a date on a wall calendar pinned above an office desk, deadline planning, " +
      "soft natural light. " + STYLE,
  },
  {
    out: "apps/landing/images/articles/fournisseur-ou-deployeur-ia.jpg",
    prompt:
      "Two professionals in a small meeting room pointing at a whiteboard with abstract diagram shapes and arrows, " +
      "no legible text, discussing roles and responsibilities. " + STYLE,
  },
  {
    out: "apps/landing/images/articles/mentions-ia-site-web.jpg",
    prompt:
      "A web designer reviewing a website mockup on a laptop and a tablet side by side at a desk, " +
      "focused on layout details, modern office. " + STYLE,
  },
  {
    out: "apps/landing/images/articles/signaler-contenus-ia-reseaux-sociaux.jpg",
    prompt:
      "A social media manager scheduling posts, looking at a smartphone in one hand and a laptop open in front of them, " +
      "modern casual office desk. " + STYLE,
  },
  {
    out: "apps/landing/images/articles/registre-usages-ia-modele.jpg",
    prompt:
      "A compliance officer organizing a ring binder of documents next to an open laptop showing a simple spreadsheet, " +
      "organized desk, structured mood. " + STYLE,
  },
  {
    out: "apps/landing/images/articles/sanctions-ai-act-pme.jpg",
    prompt:
      "A small business owner reviewing a financial report with simple bar charts, a calculator on the desk, " +
      "serious concentrated expression, not alarmist. " + STYLE,
  },
  {
    out: "apps/landing/images/articles/article-4-formation-ia-salaries.jpg",
    prompt:
      "A small group of employees attending an in-office training session, one person presenting to colleagues " +
      "seated around a table with a laptop, engaged audience. " + STYLE,
  },
];

async function createPrediction(prompt) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
          Prefer: "wait=60",
        },
        body: JSON.stringify({
          input: {
            prompt,
            aspect_ratio: "16:9",
            output_format: "jpg",
            output_quality: 85,
            safety_tolerance: 2,
          },
        }),
      }
    );

    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      const wait = (body.retry_after ?? 10) * 1000 + 1000;
      console.log(`  … throttled, retry dans ${Math.round(wait / 1000)}s`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} — ${await res.text()}`);
    }

    return res.json();
  }
  throw new Error("Trop de tentatives après rate limiting.");
}

async function generateOne({ out, prompt }) {
  if (existsSync(path.resolve(out))) {
    console.log(`  … déjà présent, skip`);
    return;
  }
  let prediction = await createPrediction(prompt);

  // Si la génération synchrone (Prefer: wait) n'a pas suffi, on poll.
  while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(prediction.urls.get, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    prediction = await poll.json();
  }

  if (prediction.status !== "succeeded") {
    throw new Error(`${out}: génération échouée — ${JSON.stringify(prediction.error || prediction)}`);
  }

  const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  const imgRes = await fetch(imageUrl);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  await writeFile(path.resolve(out), buf);
  console.log(`✓ ${out} (${(buf.length / 1024).toFixed(0)} Ko)`);
}

for (const img of IMAGES) {
  process.stdout.write(`Génération de ${img.out}…\n`);
  await generateOne(img);
  await new Promise((r) => setTimeout(r, 11000)); // reste sous 6 req/min
}

console.log("Terminé.");
