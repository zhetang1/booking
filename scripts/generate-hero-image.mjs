// Generates a few variations of the hero illustration via the Vercel AI Gateway
// and saves them to public/hero-swimmers-1.png, -2.png, … so you can pick one.
//
// Auth (resolved by the AI SDK gateway automatically):
//   1. AI_GATEWAY_API_KEY env var, or
//   2. VERCEL_OIDC_TOKEN (run: vercel link && vercel env pull .env.vercel)
//
// Run:  npm run gen:hero                 (3 variations, default model)
//       COUNT=5 npm run gen:hero         (5 variations)
//       MODEL=google/gemini-3.1-flash-image-preview npm run gen:hero
import { experimental_generateImage as generateImage, gateway } from "ai";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const MODEL = process.env.MODEL || "google/imagen-4.0-generate-001";
const COUNT = Math.max(1, Math.min(8, Number(process.env.COUNT) || 3));

const PROMPT = `A cheerful, high-quality flat vector illustration of two happy children
swimming in a sparkling backyard swimming pool. Both kids have their arms raised joyfully,
splashing water droplets around them. One child wears a pink swimsuit and swim goggles, the
other a teal swimsuit. Bright, friendly, modern sticker style with smooth gradients, clean
shapes, soft shadows, and playful water ripples and bubbles. Deep blue pool water with sunny
highlights and a warm summer feel. Centered composition, simple light background. No text.`;

async function generateOne(index) {
  const { image } = await generateImage({
    model: MODEL,
    prompt: PROMPT,
    aspectRatio: "1:1",
    // A distinct seed per variation keeps the set diverse and reproducible.
    seed: 1000 + index,
    providerOptions: { gateway: { tags: ["feature:hero-art"] } },
  });
  const outPath = path.join(process.cwd(), "public", `hero-swimmers-${index}.png`);
  await writeFile(outPath, image.uint8Array);
  console.log(`  ✅ variation ${index} → ${outPath} (${(image.uint8Array.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  console.log(`Generating ${COUNT} hero image variation(s) with model: ${MODEL}\n`);
  await mkdir(path.join(process.cwd(), "public"), { recursive: true });

  let succeeded = 0;
  for (let i = 1; i <= COUNT; i++) {
    try {
      await generateOne(i);
      succeeded++;
    } catch (err) {
      console.error(`  ❌ variation ${i} failed:`, err?.message || err);
      // If the model slug is wrong, list options once and stop — retrying won't help.
      if (/model|not found|invalid/i.test(String(err?.message))) {
        try {
          const { models } = await gateway.getAvailableModels();
          const imageModels = models
            .filter((m) => /image|imagen/i.test(m.id))
            .map((m) => m.id);
          console.error("\nAvailable image-capable models:\n  " + imageModels.join("\n  "));
        } catch {
          /* ignore */
        }
        break;
      }
    }
  }

  if (succeeded > 0) {
    console.log(
      `\nDone — generated ${succeeded}/${COUNT}. Review public/hero-swimmers-*.png and tell me which number you want; I'll wire it into the hero.`
    );
  } else {
    process.exit(1);
  }
}

main();
