# InnoWeaver

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/H1yori233/innoweaver)

InnoWeaver is an AI-powered innovation platform that bridges the gap between HCI research and practical design. It employs LLMs and HCI database to synthesize academic papers into actionable design concepts, presented in an intuitive card-based gallery.

## Architecture

- Frontend: Next.js with TypeScript
- Backend: FastAPI (Python)
- Database: MongoDB
- Cache: Redis
- Search: Meilisearch

## How to Run

1. **Clone Repository:**
```bash
git clone https://github.com/H1yori233/innoweaver
cd innoweaver
```

2. **Run Backend:**
```bash
pip install -r requirements.txt
python fast_app.py
```

3. **Run Frontend:**
```bash
cd interface
npm install
npm run dev
```

The backend will be available at `http://localhost:5000` and the frontend at `http://localhost:3000`.