#  AI Safe Route Predictor

A smart map-based web app that predicts the safest walking route using crime data, street lighting, and time-of-day analysis.

## 🌍 Features
- 📍 Enter start & destination
- 🟢 Shows safest route
- ⚪ Shows alternative routes
- 🔴 Danger markers along route
- 🌙 Night-time risk adjustment
- 💡 Street light awareness
- 📊 Safety score with crime + lighting factors
- 📱 Mobile-friendly UI
- 📍 Use My Location button
- ⏳ Loading animation while fetching routes

## 🧠 Tech Stack
- React + Vite
- Leaflet Maps
- OpenRouteService API
- Supabase Database
- Tailwind CSS

## 📂 Database Tables
### crime_points
- latitude
- longitude
- crime_type
- severity

### street_lights
- latitude
- longitude
- intensity
- working

## 🚀 How to Run
```bash
git clone <repo>
npm install
npm run dev
