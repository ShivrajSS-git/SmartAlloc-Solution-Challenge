# SmartAlloc: Intelligent Humanitarian Resource Coordination

**SmartAlloc** is a dynamic resource allocation platform designed to solve the critical "last-mile" coordination gap during humanitarian crises. Built for the Google Solution Challenge, it leverages **Gemini 1.5 AI** to semantically match community needs with volunteer skills in real-time.

## 🌍 The Problem
During disasters, information is often scattered and chaotic. Coordination centers struggle to:
- Aggregate scattered reports from multiple cities.
- Identify "hotspots" of high urgency.
- Manually match the right volunteers to specific complex needs.

## ✨ The Solution
SmartAlloc provides a parameter-driven allocation engine that:
1. **Aggregates Data**: Visualizes needs as dynamic hotspots on an interactive map.
2. **Intelligent Matching**: Uses **Google Gemini 1.5** to rank volunteers based on semantic skill relevance, geospatial proximity, and real-time availability.
3. **Scalable Coordination**: Supports multi-city operations (Delhi, Mumbai, Bangalore) from a single unified dashboard.

## 🚀 Key Features
- **Live Heatmap**: Interactive Leaflet-based map showing critical need zones.
- **Smart Matches**: AI-powered scoring engine that explains *why* a volunteer is the best fit.
- **Impact Analytics**: Recharts-driven dashboard for high-level data aggregation.
- **Dual-Sided Intake**: Dedicated portals for citizens to report needs and volunteers to register their force.

## 🛠️ Technology Stack
- **AI Engine**: Google Gemini 1.5 Flash (via Google AI SDK)
- **Frontend**: React.js, Vite, Framer Motion
- **Mapping**: Leaflet.js
- **Charts**: Recharts
- **Backend**: Node.js, Express
- **Database**: SQLite (Local persistent storage)
- **Icons**: Lucide React

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- A Google AI Studio API Key (for Gemini)

### Steps
1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/SmartAlloc.git
   cd SmartAlloc
   ```

2. **Setup the Server**
   ```bash
   cd server
   npm install
   # Create a .env file and add:
   # GEMINI_API_KEY=your_api_key_here
   node index.js
   ```

3. **Setup the Client**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

## 🧠 How the AI Works
The matching engine doesn't just look for keywords. When a "Flood Medical Need" is reported, the **Gemini 1.5** model analyzes the report text and compares it against the skill profiles of all active volunteers. It considers synonyms, relevant experience, and spatial distance to provide a % match score and a reasoning breakdown for the coordinator.

## 🗺️ Future Roadmap
- **Vision AI**: Analyzing disaster photos via Gemini Pro Vision to auto-detect urgency.
- **Offline Support**: PWA capabilities for responders in low-connectivity zones.
- **Predictive Modeling**: Using historical data to forecast high-risk areas before disasters hit.

---
*Developed for the Google Solution Challenge 2025.*
