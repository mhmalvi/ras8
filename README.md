# RAS8

> AI-powered returns analytics and automation platform — transform return data into actionable insights with intelligent recommendations, predictive analytics, and real-time monitoring.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?logo=openai&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2-FF6384?logo=chart.js&logoColor=white)

---

## Features

- **AI-Powered Insights** — GPT-driven analysis of return patterns, risk scoring, and trend prediction
- **Advanced Analytics Dashboard** — Real-time metrics, KPIs, and interactive charts via Recharts
- **Predictive Analytics** — Forecast return trends and identify at-risk products before issues escalate
- **Exchange Recommendation Engine** — AI suggests optimal product exchanges to retain revenue
- **Customer Communication AI** — Generate personalized customer messages for return scenarios
- **Automation Rules** — Configurable rule engine for auto-processing returns based on conditions
- **Return Risk Analysis** — Score returns by fraud likelihood and operational impact
- **Customer Portal** — Self-service return initiation and tracking for end customers
- **Product Analytics** — Track return rates, reasons, and patterns at the product level
- **Real-Time Notifications** — WebSocket-powered live updates on return events
- **Webhook Management** — Shopify webhook integration for order and return sync
- **n8n Integration** — Connect to n8n workflows for extended automation capabilities
- **Role-Based Access** — Secure authentication with profile management and security settings
- **Bulk Processing** — AI-powered bulk actions for high-volume return operations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, Radix UI, shadcn/ui |
| Charts | Recharts |
| Backend | Supabase (Auth, Database, Edge Functions, Realtime) |
| AI | OpenAI GPT API via Supabase Edge Functions |
| Automation | n8n workflow integration |
| State | TanStack React Query |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun
- Supabase project with Edge Functions deployed

### Installation

```bash
# Clone the repository
git clone https://github.com/mhmalvi/ras8.git
cd ras8

# Install dependencies
npm install

# Start development server
npm run dev
```

### Supabase Edge Functions

Deploy the AI-powered edge functions:

```bash
supabase functions deploy analyze-return-risk
supabase functions deploy generate-exchange-recommendation
supabase functions deploy generate-advanced-recommendation
supabase functions deploy generate-analytics-insights
supabase functions deploy generate-customer-message
supabase functions deploy predict-return-trends
supabase functions deploy shopify-webhook
```

## Project Structure

```
├── src/
│   ├── components/       # 40+ UI components (AI insights, analytics, returns)
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom hooks (AI, analytics, real-time data, sync)
│   ├── middleware/        # Auth and request middleware
│   ├── pages/            # Route pages (Dashboard, Analytics, AI Insights, etc.)
│   ├── services/         # AI service layer (OpenAI, n8n integration)
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Shared utility functions
├── supabase/
│   └── functions/        # 7 Edge Functions (AI analysis, webhooks, predictions)
└── public/               # Static assets
```

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Main dashboard with real-time return metrics |
| `/analytics` | Advanced analytics with interactive charts |
| `/ai-insights` | AI-generated insights and recommendations |
| `/returns` | Return management with bulk actions |
| `/customers` | Customer profiles and return history |
| `/products` | Product-level return analytics |
| `/automations` | Automation rule configuration |
| `/performance` | System performance monitoring |
| `/notifications` | Notification center |

## License

This project is proprietary software. All rights reserved.
