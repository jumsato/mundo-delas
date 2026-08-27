# Mundo Delas

Mapa-múndi interativo para marcar países já visitados e montar um ranking de países que você quer visitar.

## Como funciona

- Clique em um país para ampliar o mapa naquela região.
- Continue clicando no mesmo país até o modal abrir.
- No modal, marque **Já visitei** ou **Ainda não — quero visitar**.
- Países da lista de desejos aparecem na barra lateral com um ranking; arraste para reordenar.
- Os dados ficam salvos apenas no navegador (localStorage) — não há backend nem login.

## Rodando localmente

```bash
npm install --legacy-peer-deps
npm run dev
```

## Build de produção

```bash
npm run build
```

## Deploy

O deploy para o GitHub Pages acontece automaticamente a cada push na branch `main`, via GitHub Actions (`.github/workflows/deploy.yml`). Nas configurações do repositório, em **Settings → Pages**, defina a fonte como **GitHub Actions**.
