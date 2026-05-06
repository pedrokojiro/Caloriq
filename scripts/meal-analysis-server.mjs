import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';

loadEnvFile();

const PORT = Number(process.env.MEAL_ANALYSIS_PORT ?? 8787);
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OLLAMA_GENERATE_URL = 'http://localhost:11434/api/generate';
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
const DEFAULT_OLLAMA_MODEL = 'llama3.2-vision';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 600000);

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

  try {
    const response = await fetch(OLLAMA_GENERATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OLLAMA_VISION_MODEL || DEFAULT_OLLAMA_MODEL,
        prompt: buildVisionDescriptionPrompt(),
        images: [imageBase64],
        stream: false,
        keep_alive: '5m',
        options: {
          temperature: 0,
          num_predict: 80,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Ollama retornou HTTP ${response.status}: ${body.slice(0, 180)}`);
    }

    const data = await response.json();
    const description = typeof data.response === 'string' ? data.response : '';
    console.log(`Ollama description: ${description.trim().slice(0, 240)}`);
    return { output_text: JSON.stringify(buildMealPayloadFromDescription(description)) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erro desconhecido';
    console.warn(`Ollama fallback: ${message}`);
    return { output_text: JSON.stringify(buildTimedOutLocalPayload(message)) };
  } finally {
    clearTimeout(timeout);
  }
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

function buildVisionDescriptionPrompt() {
  return [
    'Descreva somente os alimentos visiveis na imagem.',
    'Use uma lista curta em portugues do Brasil, separada por virgulas.',
    'Nao estime calorias. Nao use JSON. Nao explique.',
    'Se aparecer arroz, feijao, carne, frango, ovo, salada, legumes ou massa, escreva esses nomes claramente.',
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

function buildMealPayloadFromDescription(description) {
  const normalized = normalizeText(description);
  const foods = detectFoods(normalized);
  const normalizedFoods = foods.length > 0
    ? foods
    : [{
      name: 'Alimentos vis\u00EDveis',
      emoji: '\uD83C\uDF7D\uFE0F',
      portion: 'por\u00E7\u00E3o estimada pela imagem',
      calories: 300,
      confidence: 35,
      proteinRatio: 0.075,
      carbsRatio: 0.11,
      fatRatio: 0.035,
      fiberRatio: 0.012,
    }];
  const calories = normalizedFoods.reduce((total, food) => total + food.calories, 0);
  const confidence = Math.max(35, Math.min(72, Math.round(average(normalizedFoods.map(food => food.confidence)))));

  return {
    title: buildMealTitle(normalizedFoods, confidence),
    type: inferMealType(normalizedFoods),
    confidence,
    uncertainty: buildUncertainty(description, foods.length),
    foods: normalizedFoods.map(({ proteinRatio, carbsRatio, fatRatio, fiberRatio, ...food }) => food),
    macros: estimateMacrosFromFoods(normalizedFoods),
  };
}

function buildTimedOutLocalPayload(reason) {
  return {
    title: 'Refei\u00E7\u00E3o vis\u00EDvel (estimativa local)',
    type: 'Almo\u00E7o',
    confidence: 30,
    uncertainty: `o modelo local demorou ou falhou; estimativa conservadora usada (${reason.slice(0, 80)})`,
    foods: [
      {
        name: 'Alimentos vis\u00EDveis',
        emoji: '\uD83C\uDF7D\uFE0F',
        portion: 'por\u00E7\u00E3o estimada pela imagem',
        calories: 300,
        confidence: 30,
      },
    ],
    macros: {
      protein: 23,
      carbs: 33,
      fat: 11,
      fiber: 4,
    },
  };
}

function detectFoods(text) {
  const foods = [];

  if (hasAny(text, ['arroz', 'rice'])) {
    foods.push(createDetectedFood('Arroz branco', '\uD83C\uDF5A', 'por\u00E7\u00E3o vis\u00EDvel estimada', 180, 64, 0.026, 0.28, 0.003, 0.004));
  }

  if (hasAny(text, ['feijao', 'feijoada', 'beans', 'bean'])) {
    foods.push(createDetectedFood('Feij\u00E3o', '\uD83E\uDED8', 'por\u00E7\u00E3o vis\u00EDvel estimada', 120, 62, 0.055, 0.16, 0.006, 0.055));
  }

  if (hasAny(text, ['frango', 'chicken', 'peito de frango'])) {
    foods.push(createDetectedFood('Frango', '\uD83C\uDF57', 'por\u00E7\u00E3o m\u00E9dia vis\u00EDvel', 210, 58, 0.19, 0.01, 0.07, 0.002));
  }

  if (hasAny(text, ['carne', 'bife', 'beef', 'steak', 'meat'])) {
    foods.push(createDetectedFood('Carne', '\uD83E\uDD69', 'por\u00E7\u00E3o m\u00E9dia vis\u00EDvel', 240, 55, 0.17, 0.01, 0.12, 0.001));
  }

  if (hasAny(text, ['ovo', 'eggs', 'egg', 'omelete', 'omelet'])) {
    foods.push(createDetectedFood('Ovo', '\uD83E\uDD5A', 'unidade ou por\u00E7\u00E3o vis\u00EDvel', 90, 58, 0.13, 0.01, 0.1, 0.001));
  }

  if (hasAny(text, ['macarrao', 'massa', 'pasta', 'noodle', 'noodles', 'spaghetti'])) {
    foods.push(createDetectedFood('Massa', '\uD83C\uDF5D', 'por\u00E7\u00E3o vis\u00EDvel estimada', 230, 56, 0.04, 0.3, 0.02, 0.008));
  }

  if (hasAny(text, ['batata', 'potato', 'pure', 'fries', 'frita'])) {
    foods.push(createDetectedFood('Batata', '\uD83E\uDD54', 'por\u00E7\u00E3o vis\u00EDvel estimada', 160, 54, 0.025, 0.22, 0.035, 0.018));
  }

  if (hasAny(text, ['cenoura', 'carrot', 'legume', 'vegetable', 'vegetables', 'brocolis', 'broccoli'])) {
    foods.push(createDetectedFood('Legumes', '\uD83E\uDD55', 'pequena por\u00E7\u00E3o vis\u00EDvel', 45, 50, 0.02, 0.08, 0.003, 0.035));
  }

  if (hasAny(text, ['salada', 'alface', 'lettuce', 'salad', 'folhas', 'greens'])) {
    foods.push(createDetectedFood('Salada', '\uD83E\uDD57', 'por\u00E7\u00E3o vis\u00EDvel', 35, 52, 0.018, 0.04, 0.002, 0.025));
  }

  if (hasAny(text, ['queijo', 'cheese', 'parmesao', 'mussarela', 'mozzarella'])) {
    foods.push(createDetectedFood('Queijo', '\uD83E\uDDC0', 'pequena quantidade vis\u00EDvel', 90, 48, 0.07, 0.01, 0.08, 0.001));
  }

  return dedupeFoods(foods).slice(0, 5);
}

function createDetectedFood(name, emoji, portion, calories, confidence, proteinRatio, carbsRatio, fatRatio, fiberRatio) {
  return { name, emoji, portion, calories, confidence, proteinRatio, carbsRatio, fatRatio, fiberRatio };
}

function dedupeFoods(foods) {
  const seen = new Set();
  return foods.filter(food => {
    const key = normalizeText(food.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildMealTitle(foods, confidence) {
  if (foods.length === 0) return 'Refei\u00E7\u00E3o vis\u00EDvel';
  const names = foods.map(food => food.name.toLowerCase());
  const base = names.length === 1
    ? foods[0].name
    : names.length === 2
      ? `${names[0]} com ${names[1]}`
      : `${names[0]}, ${names[1]} e outros itens`;

  return confidence < 50 ? `${capitalize(base)} (estimativa local)` : capitalize(base);
}

function inferMealType(foods) {
  const names = normalizeText(foods.map(food => food.name).join(' '));
  if (hasAny(names, ['arroz', 'feijao', 'frango', 'carne', 'massa'])) return 'Almo\u00E7o';
  return 'Lanche';
}

function buildUncertainty(description, detectedCount) {
  if (detectedCount > 0) {
    const clean = description.trim().replace(/\s+/g, ' ');
    return clean
      ? `estimativa local baseada na descri\u00E7\u00E3o: ${clean.slice(0, 120)}`
      : 'estimativa local conservadora';
  }

  return 'o modelo local n\u00E3o identificou alimentos espec\u00EDficos com seguran\u00E7a';
}

function estimateMacrosFromFoods(foods) {
  const totals = foods.reduce((acc, food) => ({
    protein: acc.protein + food.calories * food.proteinRatio,
    carbs: acc.carbs + food.calories * food.carbsRatio,
    fat: acc.fat + food.calories * food.fatRatio,
    fiber: acc.fiber + food.calories * food.fiberRatio,
  }), { protein: 0, carbs: 0, fat: 0, fiber: 0 });

  return {
    protein: Math.max(1, Math.round(totals.protein)),
    carbs: Math.max(1, Math.round(totals.carbs)),
    fat: Math.max(1, Math.round(totals.fat)),
    fiber: Math.max(1, Math.round(totals.fiber)),
  };
}

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function hasAny(text, terms) {
  return terms.some(term => text.includes(term));
}

function capitalize(text) {
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : text;
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
