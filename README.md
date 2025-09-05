# 🍽️ Weekly Meal Planner

A comprehensive meal planning application built as a single Cloudflare Worker that combines:
- **Frontend UI**: Beautiful, responsive meal planning interface
- **Backend API**: Meal processing and Cloudflare Workers AI integration
- **KV Storage**: Intelligent caching for ingredients
- **Single Deployment**: Everything deployed as one worker

## 🚀 Features

- **Weekly Meal Planning**: Plan breakfast, lunch, and dinner for each day
- **AI-Powered Ingredients**: Uses Cloudflare Workers AI to generate shopping lists
- **Smart Caching**: KV-based caching with 1-hour TTL for performance
- **Responsive Design**: Works perfectly on desktop and mobile
- **Week Navigation**: Easy navigation between weeks
- **Copy to Clipboard**: One-click copying of shopping lists

## 🏗️ Architecture

The application is structured as a single Cloudflare Worker with clear separation of concerns:

```
src/
├── worker.ts          # Main worker entry point
├── api/
│   └── meal-planner.ts # API handlers and business logic
└── ui/
    └── app.ts         # Frontend UI and styling
```

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- Cloudflare account with Workers AI enabled

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   - Ensure Workers AI is enabled in your Cloudflare account
   - No additional API keys needed - Workers AI is included with Cloudflare Workers

3. **Local development**:
   ```bash
   npm run dev
   ```

4. **Build and deploy**:
   ```bash
   npm run deploy
   ```

## 🌐 Deployment

### 1. Enable Workers AI

In your Cloudflare dashboard:
- Ensure Workers AI is enabled for your account
- No additional configuration needed - the AI binding is automatically available

### 2. Deploy

```bash
npm run deploy
```

The worker will be available at:
```
https://meal-planner.your-subdomain.workers.dev
```

## 🔧 Configuration

### wrangler.toml

The `wrangler.toml` file is configured for:
- Worker name: `meal-planner`
- KV namespace binding: `MEAL_PLANNER_KV`
- D1 database binding: `MEAL_PLANNER_DB`
- AI binding: `AI` (for Workers AI)
- AI Gateway binding: `AI_GATEWAY` (for monitoring and caching)
- Main entry point: `src/worker.ts`

### KV Namespace

Make sure your KV namespace is created and the ID is correctly set in `wrangler.toml`.

### D1 Database

1. **Create D1 Database**:
   ```bash
   wrangler d1 create meal-planner-db
   ```

2. **Update wrangler.toml**: Replace `your-d1-database-id-here` with the actual database ID from step 1.

3. **Apply Schema**:
   ```bash
   wrangler d1 execute meal-planner-db --file=./schema.sql
   ```

### AI Gateway

1. **Create AI Gateway**:
   - Go to Cloudflare Dashboard → AI → AI Gateway
   - Create a new gateway with ID: `meal-planner-gateway`
   - Configure rate limits and caching as needed

2. **Gateway Features**:
   - **Request Monitoring**: Track AI usage and performance
   - **Caching**: Automatic caching of AI responses (1-2 hours)
   - **Rate Limiting**: Control API usage and costs
   - **Analytics**: Detailed insights into AI request patterns

## 📱 Usage

1. **Navigate to your deployed worker URL**
2. **Plan meals**: Click on any meal slot and type your meal
3. **Save meal plan**: Click "💾 Save Meal Plan" to store in D1 database
4. **Navigate weeks**: Use the Previous/Next week buttons (saved plans auto-load)
5. **Generate shopping list**: Click "🧾 Compute Ingredients"
6. **Copy ingredients**: Use the copy button to get your shopping list

## 🎯 API Endpoints

- `GET /` - Serves the meal planner UI
- `POST /api/compute-ingredients` - Generates shopping list from meals
- `POST /api/save-meal-plan` - Saves meal plan to D1 database
- `GET /api/get-meal-plan` - Retrieves saved meal plan from D1 database
- `GET /api/health` - Health check endpoint

## 🔒 Security

- CORS enabled for cross-origin requests
- Workers AI runs securely within Cloudflare's infrastructure
- Input validation on all API endpoints

## 🚀 Performance

- **KV Caching**: 1-hour TTL for repeated meal plans
- **AI Gateway Caching**: 1-2 hour TTL for AI responses
- **Single Worker**: No network latency between frontend and backend
- **Optimized Bundle**: Minimal JavaScript for fast loading
- **CDN Distribution**: Global edge deployment via Cloudflare
- **AI Request Monitoring**: Real-time performance tracking

## 🐛 Troubleshooting

### Common Issues

1. **KV namespace not found**: Check your KV namespace ID in `wrangler.toml`
2. **Claude API errors**: Verify your API key is set correctly
3. **Build errors**: Ensure TypeScript is installed and configured

### Local Development

Use `npm run dev` to test locally with Wrangler's development server.

## 📄 License

This project is open source and available under the MIT License.