# CaloriQ 🥗

Aplicativo mobile para acompanhamento de calorias com foco em **análise de refeições por imagem**.
O objetivo é tornar o registro alimentar mais rápido: você tira uma foto do prato, recebe uma estimativa nutricional e acompanha sua evolução ao longo da semana.

> **Status:** protótipo funcional de interface em React Native + Expo.

## ✨ Funcionalidades

- Captura de refeição pela câmera do celular.
- Seleção de imagem da galeria.
- Tela de análise com feedback visual de processamento.
- Resultado com estimativa de calorias e macronutrientes.
- Histórico semanal com visualização de consumo.
- Acompanhamento de metas diárias (calorias e macros).
- Perfil com preferências e estatísticas de uso.

## 🧱 Stack tecnológica

- **[Expo](https://expo.dev)**
- **[React Native](https://reactnative.dev)**
- **[Expo Router](https://expo.github.io/router)** (roteamento por arquivos)
- **[Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)**
- **[Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)**
- **TypeScript**

## 📱 Fluxo de telas

| Tela | Objetivo |
|------|----------|
| **Login** | Entrada no app com opções de autenticação (UI). |
| **Home** | Visão geral do dia, atalhos de captura e refeições recentes. |
| **Câmera** | Captura de foto, troca entre câmera frontal/traseira e galeria. |
| **Analisando** | Estado de carregamento enquanto a refeição é processada. |
| **Resultado** | Resumo dos itens detectados + calorias e macros. |
| **Histórico** | Gráfico semanal e lista de registros alimentares. |
| **Metas** | Progresso de consumo por objetivo diário. |
| **Perfil** | Dados da conta, preferências e indicadores pessoais. |

## 🚀 Como executar localmente

### Pré-requisitos

- **Node.js 18+** (recomendado LTS)
- **npm**
- App **Expo Go** instalado no dispositivo (opcional)

### Instalação

```bash
npm install
```

### Ambiente de desenvolvimento

```bash
npm run start
```

Com o Metro bundler aberto, você pode:

- pressionar `a` para abrir no Android;
- pressionar `i` para abrir no iOS (macOS);
- escanear o QR Code com o Expo Go.

Também há atalhos diretos:

```bash
npm run android
npm run ios
```

## 📂 Estrutura de pastas

```txt
app/
├── index.tsx              # Login
├── _layout.tsx            # Layout raiz / navegação
├── (tabs)/
│   ├── _layout.tsx        # Configuração das abas
│   ├── index.tsx          # Home
│   ├── camera-tab.tsx     # Atalho para fluxo de captura
│   ├── history.tsx        # Histórico
│   ├── goals.tsx          # Metas
│   └── profile.tsx        # Perfil
├── camera/
│   ├── index.tsx          # Câmera
│   └── analyzing.tsx      # Tela de processamento
└── result/
    └── index.tsx          # Resultado da análise

constants/
└── colors.ts              # Paleta e tokens de cor
```

## 🛠️ Scripts disponíveis

- `npm run start` — inicia o projeto com Expo.
- `npm run android` — abre o app em ambiente Android.
- `npm run ios` — abre o app em ambiente iOS.

## 🔮 Próximos passos sugeridos

- Integrar backend para autenticação real.
- Conectar pipeline de IA para inferência nutricional.
- Persistir histórico em banco de dados.
- Adicionar testes (unitários e de interface).

## 🤝 Contribuição

1. Faça um fork do projeto.
2. Crie uma branch para sua feature (`git checkout -b feat/minha-feature`).
3. Commit suas alterações (`git commit -m "feat: ..."`).
4. Abra um Pull Request.

## 📄 Licença

Defina uma licença (ex.: MIT) antes da publicação pública do repositório.
