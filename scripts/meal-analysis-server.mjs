import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';

const PORT = Number(process.env.MEAL_ANALYSIS_PORT ?? 8787);
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OLLAMA_GENERATE_URL = 'http://localhost:11434/api/generate';
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
const DEFAULT_OLLAMA_MODEL = 'moondream';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 90000);

loadEnvFile();

const server = createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/analyze') {
    sendJson(res, 404, { error: 'Endpoint not found' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    if (!body.imageUrl || typeof body.imageUrl !== 'string') {
      sendJson(res, 400, { error: 'imageUrl is required' });
      return;
    }

    const provider = (process.env.MEAL_ANALYSIS_PROVIDER || 'ollama').toLowerCase();
    const result = provider === 'openai'
      ? await analyzeWithOpenAI(body.imageUrl)
      : await analyzeWithOllama(body.imageUrl);

    sendJson(res, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    sendJson(res, 500, { error: message });
  }
});

server.listen(PORT, () => {
  const provider = process.env.MEAL_ANALYSIS_PROVIDER || 'ollama';
  console.log(`Meal analysis server running at http://localhost:${PORT}/analyze`);
  console.log(`Provider: ${provider}`);
});

async function analyzeWithOllama(imageUrl) {
  const imageBase64 = getBase64FromDataUrl(imageUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  const response = await fetch(OLLAMA_GENERATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      model: process.env.OLLAMA_VISION_MODEL || DEFAULT_OLLAMA_MODEL,
      prompt: buildPrompt(),
      images: [imageBase64],
      stream: false,
      format: 'json',
      keep_alive: '1m',
      options: {
        temperature: 0.1,
        num_predict: 180,
      },
    }),
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama retornou HTTP ${response.status}: ${body.slice(0, 180)}`);
  }

  const data = await response.json();
  return { output_text: sanitizeModelJson(data.response) };
}

async function analyzeWithOpenAI(imageUrl) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey || apiKey === 'coloque_sua_chave_openai_aqui') {
    throw new Error('OPENAI_API_KEY is missing in .env');
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.EXPO_PUBLIC_OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: buildPrompt() },
            { type: 'input_image', image_url: imageUrl, detail: 'low' },
          ],
        },
      ],
      temperature: 0.1,
      max_output_tokens: 850,
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`OpenAI retornou HTTP ${response.status}: ${responseText.slice(0, 180)}`);
  }

  return JSON.parse(responseText);
}

function buildPrompt() {
  return [
    'Analise apenas a comida claramente visível. Seja conservador, não invente ingredientes ocultos.',
    'Retorne só um objeto JSON, começando com { e terminando com }. Não escreva explicações.',
    'Máximo 4 alimentos principais. Confiança máxima 85.',
    '{"title":"arroz com feijão","type":"Almoço","confidence":55,"uncertainty":"porção estimada visualmente","foods":[{"name":"Arroz branco","emoji":"🍚","portion":"porção média visível","calories":180,"confidence":60}],"macros":{"protein":20,"carbs":55,"fat":14,"fiber":6}}',
    'Use português do Brasil.',
  ].join('\n');
}

function sanitizeModelJson(text) {
  if (typeof text !== 'string') return '{}';
  const trimmed = text.trim();
  const fenced = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const extracted = extractFirstJsonObject(fenced);
  if (!extracted) return fenced;

  try {
    return JSON.stringify(JSON.parse(extracted));
  } catch {
    return JSON.stringify(buildConservativeFallbackFromText(extracted));
  }
}

function buildConservativeFallbackFromText(text) {
  const lower = text.toLowerCase();
  const foods = [];

  if (lower.includes('arroz')) {
    foods.push({ name: 'Arroz branco', emoji: '🍚', portion: 'porção visível estimada', calories: 180, confidence: 60 });
  }

  if (lower.includes('feijão') || lower.includes('feijao')) {
    foods.push({ name: 'Feijão', emoji: '🫘', portion: 'porção visível estimada', calories: 120, confidence: 58 });
  }

  if (lower.includes('carne') || lower.includes('frango') || lower.includes('proteína') || lower.includes('proteina')) {
    foods.push({ name: 'Proteína visível', emoji: '🍽️', portion: 'porção estimada', calories: 180, confidence: 45 });
  }

  const normalizedFoods = foods.length > 0
    ? foods
    : [{ name: 'Alimentos visíveis', emoji: '🍽️', portion: 'porção estimada pela imagem', calories: 300, confidence: 35 }];
  const calories = normalizedFoods.reduce((total, food) => total + food.calories, 0);

  return {
    title: normalizedFoods.length > 1 ? 'refeição estimada' : normalizedFoods[0].name,
    type: 'Almoço',
    confidence: Math.max(35, Math.min(60, Math.round(average(normalizedFoods.map(food => food.confidence))))),
    uncertainty: 'modelo local retornou JSON incompleto; resultado reconstruído de forma conservadora',
    foods: normalizedFoods,
    macros: {
      protein: Math.round(calories * 0.075),
      carbs: Math.round(calories * 0.11),
      fat: Math.round(calories * 0.035),
      fiber: Math.max(3, Math.round(calories * 0.012)),
    },
  };
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function extractFirstJsonObject(text) {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;

    if (depth === 0) {
      return text.slice(start, index + 1);
    }
  }

  return null;
}

function getBase64FromDataUrl(imageUrl) {
  const commaIndex = imageUrl.indexOf(',');
  if (!imageUrl.startsWith('data:') || commaIndex === -1) {
    throw new Error('Ollama precisa receber uma imagem em data URL/base64.');
  }

  return imageUrl.slice(commaIndex + 1);
}

function loadEnvFile() {
  if (!existsSync('.env')) return;

  const env = readFileSync('.env', 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 25_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}
