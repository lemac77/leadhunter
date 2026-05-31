# Lead Hunter — Studio Brillo

## Struttura
```
lead-hunter/
├── frontend/   → React + Vite → GitHub Pages
└── backend/    → Express → Railway
```

## Deploy backend (Railway)

1. Crea account su railway.app
2. New Project → Deploy from GitHub → seleziona repo, cartella `backend/`
3. Aggiungi le variabili d'ambiente:
   - APIFY_TOKEN
   - ANTHROPIC_API_KEY
   - GOOGLE_SHEET_ID
   - GOOGLE_SERVICE_ACCOUNT_JSON  (json su una riga sola)
   - FRONTEND_URL  (es. https://tuousername.github.io)
4. Railway ti dà un URL tipo https://lead-hunter-xxx.railway.app

## Google Sheets setup

1. Crea un Google Sheet con due fogli: `Leads` e `Runs`
2. Riga 1 di Leads: Nome | Città | Score | Email | Sito | Stato email | Corpo email | Feedback | Zona | Settore
3. Riga 1 di Runs: ID | Data | Zona | Settore | Lead | Email
4. Crea un Service Account su Google Cloud Console
5. Condividi il foglio con l'email del service account (editor)
6. Scarica il JSON del service account e incollalo in GOOGLE_SERVICE_ACCOUNT_JSON

## Deploy frontend (GitHub Pages)

1. Nel file `frontend/.env` metti: VITE_API_URL=https://tuo-backend.railway.app
2. `cd frontend && npm run build`
3. Push la cartella `dist/` su branch `gh-pages`
   oppure usa GitHub Actions (vedi sotto)

## GitHub Actions auto-deploy frontend

Crea `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd frontend && npm install && npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```
