import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';

const PORT = Number(process.env.MEAL_ANALYSIS_PORT ?? 8787);
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-4.1-mini';

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
    const apiKey = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey || apiKey === 'coloque_sua_chave_openai_aqui') {
      sendJson(res, 401, { error: 'OPENAI_API_KEY is missing in .env' });
      return;
    }

    const body = await readJsonBody(req);
    if (!body.imageUrl || typeof body.imageUrl !== 'string') {
      sendJson(res, 400, { error: 'imageUrl is required' });
      return;
    }

    const openAIResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.EXPO_PUBLIC_OPENAI_MODEL || DEFAULT_MODEL,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: [
                  'Você é um estimador nutricional conservador para um app de diário alimentar.',
                  'Analise APENAS o que é claramente visível na imagem. Não invente ingredientes ocultos, marcas, molhos, óleos, bebidas ou acompanhamentos.',
                  'Se não conseguir identificar um item com boa segurança, use um nome genérico como "alimento não identificado" e reduza a confiança.',
                  'Nunca dê confiança acima de 85. Use 20-45 para imagem ruim, prato parcialmente visível ou item ambíguo. Use 45-70 para estimativa comum. Use 70-85 apenas quando alimentos e porções estiverem muito claros.',
                  'Limite a lista a no máximo 5 alimentos principais visíveis. Não quebre temperos ou ingredientes pequenos em itens próprios.',
                  'Responda somente com JSON válido, sem markdown.',
                  'Formato exato:',
                  '{"title":"descrição curta e cautelosa","type":"Café|Almoço|Jantar|Lanche","confidence":55,"uncertainty":"o que limita a estimativa","foods":[{"name":"Arroz branco","emoji":"🍚","portion":"porção média visível","calories":180,"confidence":60}],"macros":{"protein":20,"carbs":55,"fat":14,"fiber":6}}',
                  'Use português do Brasil.',
                ].join('\n'),
              },
              {
                type: 'input_image',
                image_url: body.imageUrl,
                detail: 'low',
              },
            ],
          },
        ],
        temperature: 0.1,
        max_output_tokens: 850,
      }),
    });

    const responseText = await openAIResponse.text();
    res.writeHead(openAIResponse.status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(responseText);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    sendJson(res, 500, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`Meal analysis server running at http://localhost:${PORT}/analyze`);
});

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
