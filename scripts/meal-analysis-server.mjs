import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';

const PORT = Number(process.env.MEAL_ANALYSIS_PORT ?? 8787);
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OLLAMA_GENERATE_URL = 'http://localhost:11434/api/generate';
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
const DEFAULT_OLLAMA_MODEL = 'llama3.2-vision';

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
  const response = await fetch(OLLAMA_GENERATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OLLAMA_VISION_MODEL || DEFAULT_OLLAMA_MODEL,
      prompt: buildPrompt(),
      images: [imageBase64],
      stream: false,
      format: 'json',
      keep_alive: '1m',
      options: {
        temperature: 0.1,
        num_predict: 260,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama retornou HTTP ${response.status}: ${body.slice(0, 180)}`);
  }

  const data = await response.json();
  return { output_text: data.response };
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
    'Retorne somente JSON válido. Máximo 4 alimentos principais. Confiança máxima 85.',
    '{"title":"descrição curta e cautelosa","type":"Café|Almoço|Jantar|Lanche","confidence":55,"uncertainty":"o que limita a estimativa","foods":[{"name":"Arroz branco","emoji":"🍚","portion":"porção média visível","calories":180,"confidence":60}],"macros":{"protein":20,"carbs":55,"fat":14,"fiber":6}}',
    'Use português do Brasil.',
  ].join('\n');
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
