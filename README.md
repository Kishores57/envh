# 🌿 EcoRoute AI

**Navigate Smarter. Breathe Better.**

> An AI-powered environmental navigation platform that predicts environmental conditions along possible routes and recommends a route or departure time that minimizes estimated pollution exposure while balancing travel time.

[![Environment Hack](https://img.shields.io/badge/Environment%20Hack-2026-22c55e?style=for-the-badge)](/)
[![AWS](https://img.shields.io/badge/Built%20on-AWS-FF9900?style=for-the-badge&logo=amazon-aws)](/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](/)

---

## 🎯 Problem

Normal navigation optimizes for **time and distance**. It doesn't tell you what environmental exposure you face on the way.

- **Air pollution** (PM2.5, PM10, AQI) peaks during traffic rush hours
- **Heat exposure** compounds with pollution to increase health risk
- **Some routes are greener** — literally — with more shade and parks

EcoRoute AI fills this gap.

---

## 💡 Solution

EcoRoute AI adds an **environmental intelligence layer** to navigation:

1. **Generates multiple possible routes**
2. **Divides each route into segments**
3. **Estimates PM2.5, heat, and shade for every segment** using real/demo environmental data
4. **Calculates a composite exposure score**
5. **Recommends the lowest-exposure route** aligned with your priority
6. **Explains why** with specific, verifiable data
7. **Identifies high-exposure hotspots** on the map
8. **Analyzes departure times** — if leaving 35 minutes later reduces exposure by 33%, it tells you

### Key differentiator: Only Practical Route Mode

If there is only one realistic route, EcoRoute doesn't just say "don't travel." Instead it:
- Identifies the highest-exposure segments
- Explains the pollution sources
- Suggests better departure times
- Provides practical exposure-reduction tips

---

## 🗺️ Demo

Visit `/demo` for the **3-minute competition demo sequence**:

| Step | Feature | Time |
|------|---------|------|
| 1 | Problem statement | 0:00 |
| 2 | Route comparison (Home → RV College) | 0:40 |
| 3 | Only-route scenario + hotspots | 1:25 |
| 4 | AI PM2.5 prediction (SageMaker) | 1:50 |
| 5 | AWS architecture walkthrough | 2:15 |
| 6 | Impact statement | 2:40 |

**The demo works completely offline** — no external APIs needed.

---

## 🏗️ AWS Architecture

```
Frontend (React/Vite)
       ↓
Amazon CloudFront (CDN)
       ↓
Amazon API Gateway (/analyze-route, /exposure, /hotspots, /departure-times)
       ↓
AWS Lambda (Python 3.12)
  ├── routeAnalysis      → Routes + environmental scoring
  ├── exposureAnalysis   → Per-segment exposure calculation
  ├── hotspotAnalysis    → High-exposure segment detection
  └── departureAnalysis  → Time-based optimization
       ↓
   ┌────────────────────────────────────────┐
   │  Amazon DynamoDB                        │
   │  • EcoRoute-UserPreferences             │
   │  • EcoRoute-SavedRoutes                 │
   │  • EcoRoute-AnalysisHistory             │
   └────────────────────────────────────────┘
   ┌────────────────────────────────────────┐
   │  Amazon S3                              │
   │  s3://ecoroute-ai-data/                 │
   │    raw/        ← CPCB/OpenAQ feeds      │
   │    processed/  ← Cleaned data           │
   │    models/     ← SageMaker artifacts    │
   │    demo/       ← Competition datasets   │
   └────────────────────────────────────────┘
   ┌────────────────────────────────────────┐
   │  Amazon SageMaker                       │
   │  XGBoost regression model               │
   │  Input: hour, day, temp, pm25_lag       │
   │  Output: predicted PM2.5 µg/m³          │
   └────────────────────────────────────────┘
       ↓
Amazon CloudWatch (logs, metrics, alarms, dashboard)
```

---

## 📊 Environmental Scoring

Scores are **deterministic and explainable** — no LLM guessing.

```
Air Exposure Score    = normalize(PM2.5 / 150) × 100
Heat Exposure Score   = normalize((temp - 22) / 20) × 100
Shade Benefit         = shadeScore × 0.1

Segment Score = Air × 0.55 + Heat × 0.35 − ShadeBonus

Route Score (composite):
  = time_weight × TimeScore
  + air_weight  × AirScore
  + heat_weight × HeatScore
  + shade_weight × (100 − ShadeScore)
```

### Priority Weights

| Priority | Time | Air | Heat | Shade |
|----------|-----:|----:|-----:|------:|
| Fastest  | 60%  | 20% | 15%  | 5%    |
| Cleanest | 15%  | 60% | 15%  | 10%   |
| Coolest  | 15%  | 20% | 50%  | 15%   |
| Balanced | 30%  | 30% | 25%  | 15%   |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- (Optional) AWS CLI + SAM CLI for deployment

### Frontend

```bash
cd frontend   # or project root
npm install
npm run dev
```

App runs at `http://localhost:5173`

### Demo Mode

Navigate to `http://localhost:5173/demo` — works without any API keys.

### With Real AWS Backend

1. Copy `.env.example` to `.env`
2. Fill in your `VITE_API_GW_URL` after deploying the SAM stack
3. The frontend automatically uses real APIs when `VITE_API_GW_URL` is set

---

## ☁️ AWS Deployment

### Deploy with SAM CLI

```bash
cd infrastructure

# Build
sam build --template template.yaml

# Deploy (first time)
sam deploy --guided \
  --stack-name ecoroute-ai \
  --region ap-south-1 \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

# Subsequent deployments
sam deploy
```

After deployment, SAM outputs:
- `ApiGatewayUrl` → set as `VITE_API_GW_URL` in your `.env`
- `S3BucketName` → set as `VITE_S3_BUCKET`

### Train SageMaker Model

```bash
cd ml/pm25_forecast

# Local training test
python train.py --model-dir ./output

# Upload to S3 for SageMaker
aws s3 cp ./output/ s3://ecoroute-ai-data/models/pm25-forecast-v1/ --recursive

# Create SageMaker training job (see ml/pm25_forecast/training_job.json)
aws sagemaker create-training-job --cli-input-json file://training_job.json
```

---

## 📁 Project Structure

```
ecoroute-ai/
├── src/                        # React frontend (TypeScript)
│   ├── components/             # Reusable UI components
│   │   ├── shared/             # ExposureBadge, ScoreRing, etc.
│   │   ├── Map/                # EcoMap (Leaflet)
│   │   ├── RouteForm/          # Input panel
│   │   ├── RouteRecommendation/# Results panel
│   │   └── SegmentDetail/      # Segment popup
│   ├── pages/                  # Route pages
│   │   ├── Dashboard.tsx       # Main 3-panel view
│   │   ├── RoutesPage.tsx      # Comparison + charts
│   │   ├── InsightsPage.tsx    # Analytics + departure time
│   │   ├── HistoryPage.tsx     # Saved routes
│   │   └── DemoPage.tsx        # Competition demo
│   ├── lib/
│   │   ├── scoring.ts          # Deterministic scoring engine
│   │   └── aws.ts              # AWS service layer (with fallback)
│   ├── data/
│   │   └── demoData.ts         # Offline demo data engine
│   └── types/                  # TypeScript type definitions
│
├── lambda/                     # AWS Lambda functions (Python 3.12)
│   ├── routeAnalysis/          # Main route analysis
│   └── exposureAnalysis/       # Per-segment exposure
│
├── ml/                         # Machine learning
│   └── pm25_forecast/          # SageMaker training script
│
├── infrastructure/             # IaC
│   └── template.yaml           # AWS SAM template
│
├── .env.example                # Environment variable template
└── README.md
```

---

## 🔒 Security

- **No hardcoded credentials** — all config via environment variables
- **IAM least privilege** — Lambda role has only required DynamoDB/S3/SageMaker permissions
- **Input validation** in Lambda handlers
- **CORS configured** on API Gateway
- **S3 bucket** — public access blocked, server-side encryption enabled

---

## 📌 Important Disclaimers

EcoRoute AI uses language such as:
- "Lower estimated exposure"
- "Higher environmental exposure"
- "Environmental risk"
- "Recommended based on available environmental data"

**EcoRoute AI does not provide medical safety guarantees.** The application is designed for environmental awareness and navigation assistance only. Actual environmental conditions may differ from estimates.

---

## 🏆 Competition: Environment Hack 2026

**Track:** Air

**Primary factor:** Air pollution exposure (PM2.5, PM10, AQI)

**AWS Services Used:**
- ✅ Amazon S3 (data storage, model artifacts)
- ✅ AWS Lambda (backend intelligence)
- ✅ Amazon API Gateway (REST API)
- ✅ Amazon DynamoDB (user preferences, saved routes)
- ✅ Amazon SageMaker (PM2.5 forecast model)
- ✅ Amazon CloudWatch (logging, metrics, alarms, dashboard)

---

## 📄 License

MIT — See LICENSE file.

---

*Built for Environment Hack 2026 · Air Track · EcoRoute AI Team*
