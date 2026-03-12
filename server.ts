import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
  process.env.GEMINI_API_KEY_6,
  process.env.GEMINI_API_KEY_7,
  process.env.GEMINI_API_KEY_8,
  process.env.GEMINI_API_KEY_9,
].filter(Boolean) as string[];

const keyUsage: Record<string, number> = {};
const MODEL_KEYS = {
  "fazon-realistic": [0, 1, 2],
  "fazon-photography": [3, 4],
  "nano-banana-pro": [5, 6],
  "extra": [7, 8]
};

function getNextKey(modelType: keyof typeof MODEL_KEYS): string {
  const preferredIndices = MODEL_KEYS[modelType] || [0];
  let bestKey = "";
  let minUsage = Infinity;

  // Try preferred keys first
  for (const idx of preferredIndices) {
    const key = GEMINI_KEYS[idx];
    if (key) {
      const usage = keyUsage[key] || 0;
      if (usage < minUsage) {
        minUsage = usage;
        bestKey = key;
      }
    }
  }

  // If no preferred key found (e.g. only 1 key total), use any available key
  if (!bestKey && GEMINI_KEYS.length > 0) {
    for (const key of GEMINI_KEYS) {
      const usage = keyUsage[key] || 0;
      if (usage < minUsage) {
        minUsage = usage;
        bestKey = key;
      }
    }
  }

  if (bestKey) {
    keyUsage[bestKey] = (keyUsage[bestKey] || 0) + 1;
    // Reset usage if it hits 100 as per user request (shuffle/reset)
    if (keyUsage[bestKey] >= 100) {
      keyUsage[bestKey] = 0;
    }
  }
  return bestKey;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", keys: GEMINI_KEYS.length });
  });

  app.post("/api/generate", async (req, res) => {
    const { prompt, model, aspectRatio, imageInput } = req.body;
    try {
      if (GEMINI_KEYS.length === 0) {
        throw new Error("No Gemini API keys configured. Please add them to environment variables.");
      }

      let modelType: keyof typeof MODEL_KEYS = "nano-banana-pro";
      let systemInstruction = "";
      const targetModel = "gemini-3.1-flash-image-preview";

      if (model === "fazon-realistic") {
        modelType = "fazon-realistic";
        systemInstruction = "You are Fazon Realistic Pro. Generate extremely realistic, high-fidelity images. Focus on skin textures, natural lighting, and photographic precision.";
      } else if (model === "fazon-photography") {
        modelType = "fazon-photography";
        systemInstruction = "You are Fazon Photography. Optimize for aesthetic beauty, artistic composition, and pleasing visual harmony.";
      } else {
        systemInstruction = "You are Nano Banana Pro. A versatile and powerful general-purpose image generator.";
      }

      const apiKey = getNextKey(modelType);
      const ai = new GoogleGenAI({ apiKey });

      const contents: any = { parts: [{ text: prompt }] };
      if (imageInput && (model === "fazon-realistic" || model === "nano-banana-pro")) {
        contents.parts.push({
          inlineData: {
            data: imageInput.split(',')[1],
            mimeType: "image/png"
          }
        });
      }

      const response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config: {
          imageConfig: { aspectRatio: aspectRatio || "1:1", imageSize: "1K" },
          systemInstruction
        }
      });

      let imageUrl = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) throw new Error("No image generated");
      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    const envUser = process.env.ADMIN_USER || "admin";
    const envPass = process.env.ADMIN_PASS || "flex4genz_secure_pass";
    
    if (username === envUser && password === envPass) {
      res.json({ success: true, token: "admin-token" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // Database endpoints (Mocked if no DB URL, but structure is ready for Neon)
  app.get("/api/generations", (req, res) => {
    // In a real app, fetch from Neon/PG
    res.json([]);
  });

  app.post("/api/save", (req, res) => {
    const { generation } = req.body;
    // Save to Neon/PG here
    res.json({ success: true });
  });

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
