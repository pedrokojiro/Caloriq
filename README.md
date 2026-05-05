# CaloriQ 🥗

App mobile de controle de calorias com **análise de refeições por IA**. Fotografe o prato e obtenha informações nutricionais em segundos.

## Tecnologias

- [Expo](https://expo.dev) + [React Native](https://reactnative.dev)
- [Expo Router](https://expo.github.io/router) — navegação baseada em arquivos
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/) — captura de fotos
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) — galeria
- TypeScript

## Telas

| Tela | Descrição |
|------|-----------|
| **Login** | Autenticação com e-mail/senha, Google e Apple |
| **Home** | Dashboard com card de captura, calorias do dia e refeições recentes |
| **Câmera** | Câmera real com shutter, flip e acesso à galeria |
| **Analisando** | Tela de processamento com animação de pulsação |
| **Resultado** | Breakdown de alimentos identificados + macronutrientes |
| **Histórico** | Gráfico de barras semanal e lista de refeições |
| **Metas** | Progresso de calorias e macros (Proteína, Carb, Gordura, Fibra) |
| **Perfil** | Dados pessoais, preferências e estatísticas de uso |

## Como rodar

```bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npx expo start
```

Escaneie o QR code com o **Expo Go** (iOS / Android).

## IA gratuita/local com Ollama

O projeto pode analisar imagens sem créditos da OpenAI usando Ollama localmente.

```bash
# Instale o Ollama pelo site oficial e depois baixe o modelo de visão
ollama pull moondream

# Em um terminal, suba o servidor local de análise
npm run ai-server

# Em outro terminal, rode o app no navegador
npx expo start --web --clear --port 8086
```

No `.env`, use:

```env
EXPO_PUBLIC_MEAL_ANALYSIS_ENDPOINT=http://localhost:8787/analyze
MEAL_ANALYSIS_PROVIDER=ollama
OLLAMA_VISION_MODEL=moondream
OLLAMA_TIMEOUT_MS=90000
```

Para voltar para OpenAI, troque `MEAL_ANALYSIS_PROVIDER=openai` e configure a chave.

## Estrutura do projeto

```
app/
├── index.tsx          # Tela de Login
├── _layout.tsx        # Navegação raiz
├── (tabs)/
│   ├── index.tsx      # Home
│   ├── history.tsx    # Histórico
│   ├── goals.tsx      # Metas
│   └── profile.tsx    # Perfil
├── camera/
│   ├── index.tsx      # Câmera
│   └── analyzing.tsx  # Análise (loading)
└── result/
    └── index.tsx      # Resultado da análise
constants/
└── colors.ts          # Design system / paleta de cores
```

## Design

Baseado no protótipo Figma com paleta verde (#16a34a) e estilo clean/moderno.
