import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { FoodItem, Meal, MealType } from './types';

const foodSets: Array<{
  title: string;
  type: MealType;
  foods: FoodItem[];
  confidence: number;
}> = [
  {
    title: 'Salada Caesar com frango',
    type: 'Almoço',
    confidence: 68,
    foods: [
      { id: 'lettuce', emoji: '🥬', name: 'Alface romana', portion: 'porção visível', calories: 18 },
      { id: 'chicken', emoji: '🍗', name: 'Frango grelhado', portion: 'porção média estimada', calories: 248 },
      { id: 'cheese', emoji: '🧀', name: 'Parmesão ralado', portion: 'pequena quantidade', calories: 83 },
      { id: 'sauce', emoji: '🥣', name: 'Molho cremoso', portion: 'quantidade estimada', calories: 133 },
    ],
  },
  {
    title: 'Bowl de arroz com frango',
    type: 'Jantar',
    confidence: 66,
    foods: [
      { id: 'rice', emoji: '🍚', name: 'Arroz', portion: 'porção média estimada', calories: 160 },
      { id: 'beans', emoji: '🫘', name: 'Feijão', portion: 'pequena porção estimada', calories: 76 },
      { id: 'chicken', emoji: '🍗', name: 'Frango', portion: 'porção média estimada', calories: 231 },
      { id: 'greens', emoji: '🥦', name: 'Vegetais', portion: 'porção visível', calories: 28 },
    ],
  },
  {
    title: 'Panqueca com frutas',
    type: 'Café',
    confidence: 64,
    foods: [
      { id: 'pancake', emoji: '🥞', name: 'Panqueca', portion: 'unidades visíveis', calories: 220 },
      { id: 'banana', emoji: '🍌', name: 'Banana', portion: 'quantidade visível', calories: 92 },
      { id: 'honey', emoji: '🍯', name: 'Cobertura doce', portion: 'pequena quantidade', calories: 64 },
      { id: 'yogurt', emoji: '🥛', name: 'Iogurte ou creme', portion: 'quantidade estimada', calories: 61 },
    ],
  },
];

type OpenAIMealPayload = {
  title?: string;
  type?: MealType;
  confidence?: number;
  uncertainty?: string;
  foods?: Array<{
    name?: string;
    emoji?: string;
    portion?: string;
    calories?: number;
    confidence?: number;
  }>;
  macros?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
};

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-4.1-mini';
const PLACEHOLDER_KEY = 'coloque_sua_chave_openai_aqui';

export function createAnalyzedMeal(imageUri?: string): Meal {
  const seed = imageUri ? imageUri.length % foodSets.length : 0;
  const selected = foodSets[seed];
  const calories = selected.foods.reduce((total, food) => total + food.calories, 0);

  return {
    id: `${Date.now()}`,
    title: selected.title,
    type: selected.type,
    imageUri,
    createdAt: new Date().toISOString(),
    calories,
    confidence: selected.confidence,
    foods: selected.foods,
    macros: estimateMacros(calories),
    analysisSource: 'demo',
  };
}

export async function analyzeMealImage(imageUri?: string): Promise<Meal> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim();
  const analysisEndpoint = process.env.EXPO_PUBLIC_MEAL_ANALYSIS_ENDPOINT?.trim();
  const hasApiKey = Boolean(apiKey && apiKey !== PLACEHOLDER_KEY);
  const hasEndpoint = Boolean(analysisEndpoint);

  if ((!hasApiKey && !hasEndpoint) || !imageUri) {
    return createAnalyzedMeal(imageUri);
  }

  try {
    const imageUrl = await toDataUrl(imageUri);
    const data = hasEndpoint
      ? await requestBackendAnalysis(analysisEndpoint as string, imageUrl)
      : await requestOpenAIAnalysis(apiKey as string, imageUrl);
    const text = extractOutputText(data);
    const payload = parseJsonPayload(text);
    return normalizeMealPayload(payload, imageUri);
  } catch (error) {
    if (isJsonParsingError(error)) {
      const meal = createAnalyzedMeal(imageUri);
      return {
        ...meal,
        title: `${meal.title} (estimativa local)`,
        confidence: Math.min(meal.confidence, 45),
        analysisSource: 'demo',
        analysisError: 'O modelo local retornou uma resposta incompleta; usamos uma estimativa conservadora.',
      };
    }

    return createAnalysisErrorMeal(imageUri, getFriendlyError(error));
  }
}

function createAnalysisErrorMeal(imageUri: string | undefined, message: string): Meal {
  return {
    id: `${Date.now()}`,
    title: 'Análise não concluída',
    type: 'Lanche',
    imageUri,
    createdAt: new Date().toISOString(),
    calories: 0,
    confidence: 0,
    foods: [],
    macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 },
    analysisSource: 'error',
    analysisError: message,
  };
}

async function requestBackendAnalysis(endpoint: string, imageUrl: string) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Endpoint retornou HTTP ${response.status}: ${body.slice(0, 220)}`);
  }

  return response.json();
}

async function requestOpenAIAnalysis(apiKey: string, imageUrl: string) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.EXPO_PUBLIC_OPENAI_MODEL ?? DEFAULT_MODEL,
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
                'As calorias devem ser intervalos mentais conservadores convertidos para um número médio aproximado.',
                'Responda somente com JSON válido, sem markdown.',
                'Formato exato:',
                '{"title":"descrição curta e cautelosa","type":"Café|Almoço|Jantar|Lanche","confidence":55,"uncertainty":"o que limita a estimativa","foods":[{"name":"Arroz branco","emoji":"🍚","portion":"porção média visível","calories":180,"confidence":60}],"macros":{"protein":20,"carbs":55,"fat":14,"fiber":6}}',
                'Use português do Brasil.',
              ].join('\n'),
            },
            {
              type: 'input_image',
              image_url: imageUrl,
              detail: 'low',
            },
          ],
        },
      ],
      temperature: 0.1,
      max_output_tokens: 850,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI retornou HTTP ${response.status}: ${body.slice(0, 180)}`);
  }

  return response.json();
}

async function toDataUrl(imageUri: string): Promise<string> {
  if (imageUri.startsWith('data:')) return imageUri;
  if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) return imageUri;
  if (imageUri.startsWith('blob:')) return blobUriToDataUrl(imageUri);

  const compressed = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 768 } }],
    {
      compress: 0.55,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  if (compressed.base64) {
    return `data:image/jpeg;base64,${compressed.base64}`;
  }

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:${getMimeType(imageUri)};base64,${base64}`;
}

async function blobUriToDataUrl(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return compressBlobToDataUrl(blob);
}

function compressBlobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new globalThis.Image();
    const objectUrl = URL.createObjectURL(blob);

    image.onload = () => {
      const maxWidth = 768;
      const scale = Math.min(1, maxWidth / image.width);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Não foi possível preparar a imagem no navegador.'));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.55));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível ler a imagem no navegador.'));
    };

    image.src = objectUrl;
  });
}

function getMimeType(uri: string) {
  const clean = uri.split('?')[0].toLowerCase();
  if (clean.endsWith('.png')) return 'image/png';
  if (clean.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function extractOutputText(data: any): string {
  if (typeof data?.output_text === 'string') return data.output_text;

  const chunks: string[] = [];
  for (const item of data?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === 'string') chunks.push(content.text);
    }
  }

  return chunks.join('\n');
}

function parseJsonPayload(text: string): OpenAIMealPayload {
  const trimmed = text.trim();
  const withoutFence = trimmed.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  const extracted = extractFirstJsonObject(withoutFence) ?? withoutFence;
  return JSON.parse(extracted) as OpenAIMealPayload;
}

function extractFirstJsonObject(text: string) {
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

function normalizeMealPayload(payload: OpenAIMealPayload, imageUri?: string): Meal {
  const fallback = createAnalyzedMeal(imageUri);
  const foods = Array.isArray(payload.foods) && payload.foods.length > 0
    ? payload.foods.slice(0, 5).map((food, index) => ({
      id: `${Date.now()}-${index}`,
      emoji: food.emoji?.trim() || '🍽️',
      name: food.name?.trim() || `Item ${index + 1}`,
      portion: food.portion?.trim() || 'porção estimada visualmente',
      calories: clampNumber(food.calories, 0, 1200, fallback.foods[index]?.calories ?? 80),
    }))
    : fallback.foods;

  const calories = foods.reduce((total, food) => total + food.calories, 0);
  const confidence = clampNumber(payload.confidence, 0, 85, fallback.confidence);
  const macros = payload.macros
    ? {
      protein: clampNumber(payload.macros.protein, 0, 220, fallback.macros.protein),
      carbs: clampNumber(payload.macros.carbs, 0, 350, fallback.macros.carbs),
      fat: clampNumber(payload.macros.fat, 0, 180, fallback.macros.fat),
      fiber: clampNumber(payload.macros.fiber, 0, 80, fallback.macros.fiber),
    }
    : estimateMacros(calories);

  return {
    id: `${Date.now()}`,
    title: buildCautiousTitle(payload.title, payload.uncertainty, confidence, fallback.title),
    type: isMealType(payload.type) ? payload.type : fallback.type,
    imageUri,
    createdAt: new Date().toISOString(),
    calories,
    confidence,
    foods,
    macros,
    analysisSource: 'openai',
  };
}

function estimateMacros(calories: number) {
  return {
    protein: Math.round(calories * 0.075),
    carbs: Math.round(calories * 0.11),
    fat: Math.round(calories * 0.035),
    fiber: Math.max(3, Math.round(calories * 0.012)),
  };
}

function buildCautiousTitle(title: string | undefined, uncertainty: string | undefined, confidence: number, fallback: string) {
  const base = title?.trim() || fallback;
  if (confidence >= 65 || !uncertainty?.trim()) return base;
  return `${base} (estimativa incerta)`;
}

function getFriendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro desconhecido na análise.';
  if (message.includes('401')) return 'Chave da OpenAI inválida ou ausente. Confira o arquivo .env e reinicie o Expo.';
  if (message.includes('429')) return 'Limite ou saldo da API atingido. Verifique billing/usage na OpenAI.';
  if (message.includes('HTTP 400')) return 'A API rejeitou a imagem ou o formato da requisição.';
  if (message.includes('Ollama')) return 'Ollama não respondeu. Instale o Ollama, baixe o modelo de visão e reinicie o servidor local.';
  if (message.includes('Failed to fetch')) return 'Não foi possível conectar à OpenAI pelo navegador.';
  return message;
}

function isJsonParsingError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error instanceof SyntaxError || error.message.includes('JSON');
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(Math.max(number, min), max);
}

function isMealType(value: unknown): value is MealType {
  return value === 'Café' || value === 'Almoço' || value === 'Jantar' || value === 'Lanche';
}
