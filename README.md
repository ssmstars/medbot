# 🏥 MedChart Vitals Visualizer

> **HACKARENA Submission**
> 🏆 **Team:** Missing Links

**Live Link:** https://medbot-iota.vercel.app/

**GitHub Repo:** https://github.com/ssmstars/medbot.git

MedChart Vitals Visualizer is a state-of-the-art, web-based clinical dashboard designed to parse, visualize, and analyze patient demographic and vital sign data. Built with an acute focus on UI/UX, clinical realism, and actionable insights, the platform leverages interactive visualizations and AI to assist healthcare professionals in monitoring patient health efficiently.

## 👥 Team: Missing Links

| Name | Role |
| --- | --- |
| Kushala B Gowda | Team Lead |
| Suhas D | Core Developer |
| Mohitha R | UI/UX Designer |
| Deepak R | Backend Developer |

## ✨ Key Features & "Wow" Factors
- 📊 **Dynamic Data Visualization:** Upload CSV files to instantly generate robust, interactive patient vitals charts using Chart.js.
- 🚨 **Emergency Mode:** Clinically realistic critical alert system featuring screen-takeover visual indicators and Web Audio API synthesized ICU alarms.
- 🌓 **Cinematic Theming:** Buttery-smooth Dark/Light mode toggling with `localStorage` persistence and custom transition easing (`cubic-bezier`).
- 🚀 **Automated Guided Tour:** An interactive demo mode that seamlessly guides users through the app's capabilities.
- 🖱️ **Modern UI/UX:** Drag-and-drop file upload zones, responsive KPI cards, utilizing the modern 'Inter' font for ultimate readability.
- 🤖 **Med-Bot AI Assistant:** Integrated Groq/LLaMA-powered chatbot to analyze vitals, answer clinical queries, and provide predictive insights.

## 🧠 Explainability
- **AI logic entry point:** Chat requests are handled in `POST /chat` on the backend, with a simulated response when `GROQ_API_KEY` is missing. See [server.js](server.js#L51-L129).
- **UI trigger:** Each critical alert includes an “AI Explain” action that opens the chat and pre-fills an explanation request. See [public/app.js](public/app.js#L215-L248).

## 🩸 Clinical Thresholds
| Vital Sign | Normal Range | Critical Trigger |
|---|---|---|
| Heart Rate (BPM) | 60–100 | < 50 or > 120 |
| Systolic BP (mmHg) | 90–120 | < 80 or > 160 |
| Temperature (°C) | 36.1–37.2 | < 35.0 or > 38.5 |

## 🛠️ Tech Stack
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+), Chart.js
* **Backend:** Node.js, Express.js, Multer (file handling), `csv-parse`
* **AI Integration:** Groq API

## 🚀 Quick Start (Local Setup)

### 1. Install dependencies
```bash
npm install
```

### 2. (Optional) Enable Med-Bot AI
Create a `.env` file in the project root:
```env
GROQ_API_KEY=your_groq_api_key_here
```
*(The app runs fully functional without this — charts, alerts, and CSV parsing all work without a key. The key only enables the AI chatbot.)*

### 3. Start the server
```bash
npm start
```

### 4. Open in browser
Navigate to http://localhost:3000

## 📁 Project Structure
```text
├── server.js          # Express backend — CSV parsing, Groq chat
├── public/
│   ├── index.html     # Dashboard UI (Drag & Drop, Theme toggle)
│   ├── app.js         # Chart logic, alert logic, chatbot, demo mode
│   └── styles.css     # CSS Custom Properties for smooth Light/Dark themes
├── sample_vitals.csv  # Demo CSV with critical readings
├── .env.example       # API key template
└── README.md
```

## 🧾 CSV Format
Upload a CSV with these exact headers:
```
timestamp,heart_rate,systolic_bp,temperature
2026-03-06 08:00,78,115,36.8
2026-03-06 08:15,82,118,36.9
```

## ⚠️ Hackathon Submission Reminder
> **Important:** Ensure the GitHub repository is set to **Public** before submission to avoid disqualification.
