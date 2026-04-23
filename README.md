# TwinMind - Real-time Audio Transcription & AI Meeting Assistant

TwinMind is a professional-grade dashboard designed for real-time meeting assistance. It captures live audio, generates high-fidelity transcripts using Groq Whisper, and provides instant AI-driven suggestions and detailed chat insights using Llama-3.

![Dashboard Overview](frontend/public/dashboard-preview.png)

## 🚀 Key Features

- **Live Transcription**: High-performance audio chunking (30s rotation) using `audio/webm;codecs=opus` for professional quality.
- **AI Suggestions**: Immediate insights, talking points, and fact-checks generated as you speak.
- **Interactive Chat**: A deep-context assistant that uses the meeting transcript to answer complex questions.
- **Session-Only Persistence**: Privacy-focused architecture with no database requirements; everything stays in your current session.
- **Premium UI/UX**: Compact, high-density dashboard built with React, Tailwind CSS, and Shadcn UI.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide Icons, Shadcn UI.
- **Backend**: Node.js, Express, Winston (Logging).
- **AI Infrastructure**: 
  - **Whisper (Groq)**: For ultra-fast transcription.
  - **Llama-3 (Groq)**: For suggestions and chat intelligence.

## 📦 Project Structure

```text
├── Backend/              # Node.js Express server
│   ├── routes/           # API endpoints for Whisper & Llama-3
│   ├── utils/            # Winston logger & helper functions
│   └── .env.example      # Backend environment template
├── frontend/             # React application
│   ├── src/              # Source code (Components, Hooks, Services)
│   ├── public/           # Static assets
│   └── .env.example      # Frontend environment template
└── README.md             # Project documentation
```

## ⚙️ Local Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd TwinMind
```

### 2. Backend Setup
```bash
cd Backend
npm install
cp .env.example .env
# Add your GROQ_API_KEY to .env
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
# Update VITE_API_BASE_URL if necessary
npm run dev
```

## 🌐 Deployment

### Frontend (Vercel)
The project includes a `vercel.json` for easy deployment to Vercel. Ensure you set the `VITE_API_BASE_URL` in your Vercel Environment Variables.

### Backend
Deploy to any Node.js host (Render, Railway, Heroku). Ensure you configure the `ALLOWED_ORIGIN` environment variable for CORS security.

## 📝 License
MIT
