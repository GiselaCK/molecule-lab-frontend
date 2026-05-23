# Molecule Lab Frontend

Frontend React do Molecule Lab, uma experiência interativa de divulgação científica para construção de moléculas e visualização qualitativa de estabilidade térmica.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)

---

## Visão Geral

A aplicação permite que visitantes construam moléculas em um canvas 2D, escolham moléculas prontas e acompanhem uma simulação qualitativa enviada pelo backend via Server-Sent Events (SSE).

Projetada para totens de eventos, tablets e dispositivos móveis, a experiência busca despertar curiosidade científica em público geral e estudantes de ensino médio.

Este repositório é a interface web do projeto `molecule-lab-backend`.

## Funcionalidades

- Construtor molecular 2D com átomos de `C`, `H`, `O`, `N`, `S`, `P`, `F`, `Cl` e `Br`.
- Ligações simples, duplas e triplas com regras de valência.
- Preenchimento automático de hidrogênios implícitos.
- Canvas com pan, zoom, centralização e ajuste ao conteúdo.
- Galeria de moléculas prontas para carregar e editar.
- Criação de simulação no backend por `POST /api/simulations`.
- Acompanhamento de progresso e resultado por SSE.
- Painel administrativo com intensidade visual, preset do backend e resultado forçado.
- Testes para presets e configuração básica da aplicação.

## Requisitos

- Node.js 18+
- npm
- Backend `molecule-lab-backend` rodando localmente para simulações reais

Também é possível usar Bun, pois o repositório contém arquivos de lock do Bun.

## Configuração

Instale as dependências:

```bash
npm install
```

Crie o arquivo de ambiente local a partir do exemplo:

```bash
cp .env.example .env.local
```

Conteúdo esperado:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Execução

Com o backend rodando em `http://localhost:8000`, inicie o frontend:

```bash
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:8080
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o Vite em modo desenvolvimento. |
| `npm run build` | Gera build de produção em `dist/`. |
| `npm run build:dev` | Gera build usando modo `development`. |
| `npm run preview` | Serve localmente o build de produção. |
| `npm run lint` | Executa ESLint. |
| `npm test` | Executa a suíte Vitest uma vez. |
| `npm run test:watch` | Executa Vitest em modo watch. |

## Integração com o Backend

O fluxo principal da aplicação é:

1. O usuário constrói ou escolhe uma molécula.
2. O frontend serializa a molécula como grafo.
3. O frontend envia `POST /api/simulations` para o backend.
4. O backend retorna `simulation_id`, dados estáticos da molécula e `events_url`.
5. O frontend abre um `EventSource` para `events_url`.
6. A tela de simulação usa eventos `progress`, `cache_hit`, `result` e `error`.

Formato do grafo enviado:

```json
{
  "preset": "fast",
  "graph": {
    "atoms": [
      { "id": "c1", "symbol": "C", "x": 300, "y": 220 }
    ],
    "bonds": []
  }
}
```

Presets aceitos pelo backend:

- `fast`
- `balanced`
- `debug`

## Testes e Qualidade

```bash
npm test
npm run build
```

Antes de submissões maiores, rode também:

```bash
npx tsc --noEmit
npm run lint
```

## Estrutura

```text
.
├── public/                    # Assets estáticos
├── src/
│   ├── components/            # Componentes visuais e UI
│   │   ├── builder/           # Canvas, paleta, toolbar e presets
│   │   └── ui/                # Componentes shadcn/ui
│   ├── context/               # Estado global da experiência
│   ├── data/                  # Moléculas prontas e metadados
│   ├── hooks/                 # Hooks da aplicação
│   ├── lib/                   # API client e motor molecular local
│   ├── pages/                 # Roteador principal
│   ├── screens/               # Telas da experiência
│   └── test/                  # Configuração e testes
├── package.json
├── vite.config.ts
└── vitest.config.ts
```

## Escopo Científico

O frontend apresenta uma visualização didática da simulação calculada pelo backend. A experiência privilegia clareza visual, interação e comparação qualitativa, não previsão experimental de alta fidelidade.

## Licença

Projeto de uso educacional e institucional da ILUM Escola de Ciência.
