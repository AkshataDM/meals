import { handleApiRequest } from './api/meal-planner';
import { serveUI } from './ui/app';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle API routes
    if (path.startsWith('/api/')) {
      return handleApiRequest(request, env, ctx);
    }

    // Serve the UI for all other routes
    return serveUI(request);
  },
};

export interface Env {
  MEAL_PLANNER_KV: KVNamespace;
  MEAL_PLANNER_DB: D1Database;
  AI: Ai;
  MEAL_VECTORIZE: VectorizeIndex;
  CLAUDE_API_KEY?: string;
}
