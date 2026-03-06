# Project Requirements

## Overview
MedChart Vitals Visualizer is a web app that uploads patient vitals CSV data, visualizes trends, detects critical readings, and provides AI-assisted explanations.

## Functional Requirements
- Upload CSV files with required headers: timestamp, heart_rate, systolic_bp, temperature.
- Parse and validate CSV rows; show errors for missing headers or invalid rows.
- Display KPI cards (min/avg/max/latest) for each vital.
- Render charts: combined overview, individual line charts, distribution, and scatter plot.
- Detect and log critical readings using defined thresholds.
- Show patient status badge and Early Warning Score (EWS).
- Provide clinical insights and a critical event timeline.
- Run a short-term forecast and live simulation playback.
- Provide AI chat responses (optional, via GROQ_API_KEY).
- Allow users to download a text medical report.

## Non-Functional Requirements
- Responsive UI for desktop and mobile.
- Works without an AI key (chat shows simulated response).
- Client-side theme toggle persisted in localStorage.
- Upload limit: 5 MB.

## Data Requirements
- CSV columns must match required headers exactly.
- Numeric values must be parseable as numbers.
- Timestamps must be present per row.

## Setup Requirements
- Node.js runtime installed.
- Install dependencies with `npm install`.
- Start server with `npm start`.
- Optional: configure GROQ_API_KEY in .env for AI chat.

## Assumptions
- Each row represents one measurement interval.
- Linear regression forecast uses prior readings only.

## Out of Scope
- Persistent storage of uploads or patient data.
- User authentication/authorization.
- Integration with EHR systems.
