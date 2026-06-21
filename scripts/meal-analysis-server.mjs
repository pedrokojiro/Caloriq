import { createServer } from 'node:http';
import { appendFileSync, readFileSync, existsSync } from 'node:fs';

loadEnvFile();

const PORT = Number(process.env.MEAL_ANALYSIS_PORT ?? 8787);
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OLLAMA_GENERATE_URL = 'http://localhost:11434/api/generate';
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_OLLAMA_MODEL = 'llama3.2-vision';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 45000);
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS ?? 25000);
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS ?? 30000);
const AI_RETRY_COUNT = Number(process.env.MEAL_ANALYSIS_RETRIES ?? 2);
const AI_RETRY_BASE_DELAY_MS = Number(process.env.MEAL_ANALYSIS_RETRY_BASE_DELAY_MS ?? 500);
const ALLOWED_ORIGIN = process.env.MEAL_ANALYSIS_ALLOWED_ORIGIN?.trim();
const SHARED_KEY = process.env.MEAL_ANALYSIS_SHARED_KEY?.trim();

const server = createServer(async (req, res) => {
  if (!setCorsHeaders(req, res)) {
    sendJson(res, 403, { error: 'Origin not allowed' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/analyze') {
    sendJson(res, 404, { error: 'Endpoint not found' });
    return;
  }

  if (!SHARED_KEY || req.headers['x-app-key'] !== SHARED_KEY) {
    sendJson(res, 401, { error: 'Unauthorized' });
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
      : provider === 'gemini'
        ? await analyzeWithGemini(body.imageUrl)
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
  appendLog(`SERVER_START provider=${provider}`);
});

async function analyzeWithOllama(imageUrl) {
  const startedAt = Date.now();
  const imageBase64 = getBase64FromDataUrl(imageUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  const model = process.env.OLLAMA_VISION_MODEL || DEFAULT_OLLAMA_MODEL;

  try {
    const response = await fetchWithRetry(OLLAMA_GENERATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt: buildVisionDescriptionPrompt(),
        images: [imageBase64],
        stream: true,
        keep_alive: '10m',
        options: {
          temperature: 0,
          num_predict: 120,
        },
      }),
    }, { retries: AI_RETRY_COUNT, baseDelayMs: AI_RETRY_BASE_DELAY_MS });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Ollama retornou HTTP ${response.status}: ${body.slice(0, 180)}`);
    }

    const description = await readOllamaStream(response);
    if (!description.trim()) {
      throw new Error('Ollama retornou uma resposta vazia.');
    }

    if (isLikelyTruncatedText(description)) {
      throw new Error('Ollama retornou uma descriÃ§Ã£o truncada.');
    }

    if (isLikelyPromptEcho(description)) {
      throw new Error('Ollama retornou uma lista enviesada pelo prompt.');
    }

    console.log(`Ollama description: ${description.trim().slice(0, 240)}`);
    appendLog(`OK ${model} ${Date.now() - startedAt}ms ${description.trim().slice(0, 240)}`);
    return { output_text: JSON.stringify(buildMealPayloadFromDescription(description)) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erro desconhecido';
    console.warn(`Ollama fallback: ${message}`);
    appendLog(`FALLBACK ${model} ${Date.now() - startedAt}ms ${message}`);
    return { output_text: JSON.stringify(buildTimedOutLocalPayload(message)) };
  } finally {
    clearTimeout(timeout);
  }
}

async function readOllamaStream(response) {
  if (!response.body) {
    const data = await response.json();
    return typeof data.response === 'string' ? data.response : '';
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let output = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const chunk = JSON.parse(line);
        if (typeof chunk.response === 'string') output += chunk.response;
        if (chunk.done) return output;
      } catch {
        // Ignore partial stream chunks.
      }
    }
  }

  if (buffer.trim()) {
    try {
      const chunk = JSON.parse(buffer);
      if (typeof chunk.response === 'string') output += chunk.response;
    } catch {
      // Ignore trailing partial stream data.
    }
  }

  return output;
}

async function analyzeWithOpenAI(imageUrl) {
  const startedAt = Date.now();
  const apiKey = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey || apiKey === 'coloque_sua_chave_openai_aqui') {
    throw new Error('OPENAI_API_KEY is missing in .env');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  const model = process.env.EXPO_PUBLIC_OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

  try {
    const response = await fetchWithRetry(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: buildPrompt() },
              { type: 'input_image', image_url: imageUrl, detail: 'low' },
            ],
          },
        ],
        text: { format: { type: 'json_object' } },
        temperature: 0.1,
        max_output_tokens: 850,
      }),
    }, { retries: AI_RETRY_COUNT, baseDelayMs: AI_RETRY_BASE_DELAY_MS });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`OpenAI retornou HTTP ${response.status}: ${responseText.slice(0, 180)}`);
    }

    const data = JSON.parse(responseText);
    const outputText = extractOpenAIOutputText(data);
    return outputText
      ? { ...data, output_text: sanitizeModelJson(outputText) }
      : data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erro desconhecido';
    console.warn(`OpenAI fallback: ${message}`);
    appendLog(`OPENAI_FALLBACK ${model} ${Date.now() - startedAt}ms ${message}`);
    return { output_text: JSON.stringify(buildTimedOutLocalPayload(message)) };
  } finally {
    clearTimeout(timeout);
  }
}

async function analyzeWithGemini(imageUrl) {
  const startedAt = Date.now();
  const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'coloque_sua_chave_gemini_aqui') {
    throw new Error('GEMINI_API_KEY is missing in .env');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  const model = process.env.GEMINI_MODEL || process.env.EXPO_PUBLIC_GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: buildPrompt() },
              {
                inline_data: {
                  mime_type: getMimeTypeFromDataUrl(imageUrl),
                  data: getBase64FromDataUrl(imageUrl),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 850,
          responseMimeType: 'application/json',
        },
      }),
    }, { retries: AI_RETRY_COUNT, baseDelayMs: AI_RETRY_BASE_DELAY_MS });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`Gemini retornou HTTP ${response.status}: ${responseText.slice(0, 180)}`);
    }

    const data = JSON.parse(responseText);
    const outputText = extractGeminiOutputText(data);
    if (!outputText.trim()) throw new Error('Gemini retornou uma resposta vazia.');

    appendLog(`GEMINI_OK ${model} ${Date.now() - startedAt}ms ${outputText.trim().slice(0, 240)}`);
    const sanitized = sanitizeModelJson(outputText);
    console.log('[SERVER] sanitized output_text (first 300):', sanitized.slice(0, 300));
    return { output_text: sanitized };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erro desconhecido';
    console.warn(`Gemini fallback: ${message}`);
    appendLog(`GEMINI_FALLBACK ${model} ${Date.now() - startedAt}ms ${message}`);
    return { output_text: JSON.stringify(buildTimedOutLocalPayload(message)) };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(url, options, { retries = 2, baseDelayMs = 500 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(url, options);
    if (!isRetryableStatus(response.status) || attempt === retries) return response;

    await response.arrayBuffer().catch(() => undefined);
    await delay(getRetryDelayMs(response, attempt, baseDelayMs), options?.signal);
  }

  throw new Error('Retry loop ended unexpectedly');
}

function isRetryableStatus(status) {
  return status === 429 || status >= 500;
}

function getRetryDelayMs(response, attempt, baseDelayMs) {
  const retryAfter = response.headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

    const retryDate = Date.parse(retryAfter);
    if (Number.isFinite(retryDate)) return Math.max(0, retryDate - Date.now());
  }

  return baseDelayMs * (2 ** attempt);
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(createAbortError());
    }, { once: true });
  });
}

function createAbortError() {
  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

function extractOpenAIOutputText(data) {
  if (typeof data?.output_text === 'string') return data.output_text;

  const chunks = [];
  for (const item of data?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === 'string') chunks.push(content.text);
    }
  }

  return chunks.join('\n');
}

function extractGeminiOutputText(data) {
  const chunks = [];
  for (const candidate of data?.candidates ?? []) {
    for (const part of candidate?.content?.parts ?? []) {
      if (typeof part?.text === 'string') chunks.push(part.text);
    }
  }

  return chunks.join('\n');
}

function buildPrompt() {
  return [
    'Analise apenas a comida claramente visível. Seja conservador, não invente ingredientes ocultos.',
    'Retorne só um objeto JSON, começando com { e terminando com }. Não escreva explicações.',
    'Máximo 4 alimentos principais. Confiança máxima 85.',
    'O campo "type" deve ser EXATAMENTE um destes valores: "Café", "Almoço", "Jantar" ou "Lanche". Não use "Café da manhã", use apenas "Café".',
    '{"title":"arroz com feijão","type":"Almoço","confidence":55,"uncertainty":"porção estimada visualmente","foods":[{"name":"Arroz branco","emoji":"🍚","portion":"porção média visível","calories":180,"confidence":60}],"macros":{"protein":20,"carbs":55,"fat":14,"fiber":6}}',
    'Use português do Brasil.',
  ].join('\n');
}

function buildVisionDescriptionPrompt() {
  return [
    'Look at the image and list only the visible food and drink items.',
    'Answer with a short comma-separated list. Do not explain. Do not estimate calories.',
    'Use common item names such as bread, toast, egg, cheese, beans, rice, coffee, salad.',
  ].join('\n');
}

function isLikelyTruncatedText(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return false;

  const lastToken = trimmed.split(/\s+/).pop() || '';
  return /[A-Za-zÀ-ÿ]{3,}$/.test(lastToken) && !/[,.]$/.test(trimmed);
}

function isLikelyPromptEcho(text) {
  const normalized = normalizeText(text);
  return (
    hasAny(normalized, ['common item names', 'do not explain', 'comma-separated']) ||
    hasAny(normalized, ['nao ha alimentos', 'nao haver', 'nao haber', 'no food', 'no visible food'])
  );
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

  const cleaned = extracted.replace(/,\s*([\]}])/g, '$1');
  try {
    return JSON.stringify(JSON.parse(cleaned));
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

function appendLog(message) {
  try {
    appendFileSync(
      'meal-analysis-server.log',
      `${new Date().toISOString()} ${message}\n`,
      'utf8'
    );
  } catch {
    // Logging must never block the local analysis flow.
  }
}

function detectFoods(text) {
  const foods = [];
  const hasRiceAndBeans = hasAny(text, ['arroz', 'rice']) && hasAny(text, ['feijao', 'feijoada', 'beans', 'bean']);

  if (hasAny(text, ['arroz', 'rice'])) {
    foods.push(createDetectedFood('Arroz branco', '\uD83C\uDF5A', 'por\u00E7\u00E3o vis\u00EDvel estimada', 180, 64, 0.026, 0.28, 0.003, 0.004));
  }

  if (hasAny(text, ['feijao', 'feijoada', 'beans', 'bean'])) {
    foods.push(createDetectedFood('Feij\u00E3o', '\uD83E\uDED8', 'por\u00E7\u00E3o vis\u00EDvel estimada', 120, 62, 0.055, 0.16, 0.006, 0.055));
  }

  if (hasAny(text, ['frango', 'chicken', 'peito de frango', 'pedaco de frango'])) {
    foods.push(createDetectedFood('Frango', '\uD83C\uDF57', 'por\u00E7\u00E3o m\u00E9dia vis\u00EDvel', 210, 58, 0.19, 0.01, 0.07, 0.002));
  }

  if (!hasRiceAndBeans && hasAny(text, ['bife', 'carne bovina', 'carne moida', 'carne moida', 'carne', 'beef', 'steak'])) {
    foods.push(createDetectedFood('Carne', '\uD83E\uDD69', 'por\u00E7\u00E3o m\u00E9dia vis\u00EDvel', 240, 55, 0.17, 0.01, 0.12, 0.001));
  }

  if (hasAny(text, ['ovo', 'ovos', 'eggs', 'egg', 'omelete', 'omelet'])) {
    foods.push(createDetectedFood('Ovo', '\uD83E\uDD5A', 'unidade ou por\u00E7\u00E3o vis\u00EDvel', 90, 58, 0.13, 0.01, 0.1, 0.001));
  }

  if (hasAny(text, ['pao', 'paes', 'bread', 'toast', 'torrada', 'torradas', 'sourdough'])) {
    foods.push(createDetectedFood('P\u00E3o ou torrada', '\uD83C\uDF5E', 'por\u00E7\u00E3o vis\u00EDvel', 160, 56, 0.045, 0.32, 0.025, 0.018));
  }

  if (hasAny(text, ['macarrao', 'massa', 'pasta', 'noodle', 'noodles', 'spaghetti', 'espaguete'])) {
    foods.push(createDetectedFood('Massa', '\uD83C\uDF5D', 'por\u00E7\u00E3o vis\u00EDvel estimada', 230, 56, 0.04, 0.3, 0.02, 0.008));
  }

  if (hasAny(text, ['batata', 'potato', 'pure', 'fries', 'frita'])) {
    foods.push(createDetectedFood('Batata', '\uD83E\uDD54', 'por\u00E7\u00E3o vis\u00EDvel estimada', 160, 54, 0.025, 0.22, 0.035, 0.018));
  }

  if (hasAny(text, ['pimenta', 'pepper', 'pimentao'])) {
    foods.push(createDetectedFood('Pimenta', '\uD83C\uDF36\uFE0F', 'pequena quantidade vis\u00EDvel', 10, 45, 0.01, 0.02, 0.001, 0.01));
  }

  if (hasAny(text, ['cebola', 'onion'])) {
    foods.push(createDetectedFood('Cebola', '\uD83E\uDDC5', 'pequena quantidade vis\u00EDvel', 15, 45, 0.01, 0.035, 0.001, 0.008));
  }

  if (hasAny(text, ['cenoura', 'carrot', 'legume', 'vegetable', 'vegetables', 'brocolis', 'broccoli', 'abobrinha', 'zucchini'])) {
    foods.push(createDetectedFood('Legumes', '\uD83E\uDD55', 'pequena por\u00E7\u00E3o vis\u00EDvel', 45, 50, 0.02, 0.08, 0.003, 0.035));
  }

  if (hasAny(text, ['salada', 'alface', 'lettuce', 'salad', 'folhas', 'greens', 'rucula', 'espinafre'])) {
    foods.push(createDetectedFood('Salada', '\uD83E\uDD57', 'por\u00E7\u00E3o vis\u00EDvel', 35, 52, 0.018, 0.04, 0.002, 0.025));
  }

  if (hasAny(text, ['queijo', 'cheese', 'parmesao', 'mussarela', 'mozzarella'])) {
    foods.push(createDetectedFood('Queijo', '\uD83E\uDDC0', 'pequena quantidade vis\u00EDvel', 90, 48, 0.07, 0.01, 0.08, 0.001));
  }

  if (hasAny(text, ['cafe', 'coffee', 'latte', 'cappuccino', 'capuccino'])) {
    foods.push(createDetectedFood('Caf\u00E9', '\u2615', 'x\u00EDcara vis\u00EDvel', 20, 45, 0.01, 0.02, 0.005, 0.001));
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
  if (hasAny(names, ['pao', 'torrada', 'ovo', 'cafe', 'queijo'])) return 'Caf\u00E9';
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
    // Strip markdown list markers (*, -, •) at line start
    .replace(/^[\s*\-•]+/gm, '')
    // Remove remaining asterisks used for bold/italic
    .replace(/\*/g, '')
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
    throw new Error('A imagem precisa estar em formato data URL/base64.');
  }

  return imageUrl.slice(commaIndex + 1);
}

function getMimeTypeFromDataUrl(imageUrl) {
  const match = String(imageUrl || '').match(/^data:([^;,]+)[;,]/);
  return match?.[1] || 'image/jpeg';
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

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;

  if (ALLOWED_ORIGIN) {
    if (origin && origin !== ALLOWED_ORIGIN) return false;
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-App-Key');
  return true;
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
