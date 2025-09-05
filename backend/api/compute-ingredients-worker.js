// Cloudflare Worker version with KV caching
export default {
  async fetch(request, env, ctx) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const { meals, weekStart, weekEnd } = await request.json();

      if (!meals) {
        return new Response(JSON.stringify({ error: 'Meals data is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Generate cache key from meals data
      const mealsHash = await crypto.subtle.digest('MD5', new TextEncoder().encode(JSON.stringify(meals)))
        .then(hash => Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(''));
      
      const cacheKey = `meal-planner:ingredients:${weekStart}:${weekEnd}:${mealsHash}`;

      // Try to get from KV cache first
      let cachedIngredients = null;
      if (env.MEAL_PLANNER_KV) {
        try {
          cachedIngredients = await env.MEAL_PLANNER_KV.get(cacheKey);
          if (cachedIngredients) {
            return new Response(JSON.stringify({
              ingredients: cachedIngredients,
              cached: true,
              cacheKey: cacheKey
            }), {
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
            });
          }
        } catch (cacheError) {
          console.log('Cache check failed:', cacheError.message);
        }
      }

      // Format meals data for Claude
      let mealsText = '';
      Object.entries(meals).forEach(([date, dayMeals]) => {
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        mealsText += `\n${dayName} (${date}):\n`;
        if (dayMeals.breakfast) mealsText += `  Breakfast: ${dayMeals.breakfast}\n`;
        if (dayMeals.lunch) mealsText += `  Lunch: ${dayMeals.lunch}\n`;
        if (dayMeals.dinner) mealsText += `  Dinner: ${dayMeals.dinner}\n`;
      });

      const prompt = `You are a helpful cooking assistant. Based on the following weekly meal plan, create a comprehensive shopping list of ingredients needed. \n\nPlease:\n1. List all ingredients needed for the week\n2. Group similar ingredients together (e.g., combine multiple tomatoes into one line)\n3. Include quantities where appropriate\n4. Organize by categories (Proteins, Vegetables, Dairy, Pantry items, etc.)\n5. Only include ingredients that would need to be purchased (don't include common household items like salt, pepper, oil unless specifically needed in large quantities)\n\nWeek: ${weekStart || ''} to ${weekEnd || ''}\nWeekly Meal Plan:${mealsText}\n\nPlease provide a clean, organized shopping list that someone could take to the grocery store.`;

      // Call Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const ingredients = data.content?.[0]?.text || '';

      // Cache the result in KV with 1-hour TTL
      if (env.MEAL_PLANNER_KV && ingredients) {
        try {
          await env.MEAL_PLANNER_KV.put(cacheKey, ingredients, { expirationTtl: 3600 }); // 1 hour
        } catch (cacheError) {
          console.log('Failed to cache ingredients:', cacheError.message);
        }
      }

      return new Response(JSON.stringify({
        ingredients,
        cached: false,
        cacheKey: cacheKey
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });

    } catch (error) {
      console.error('Error in compute-ingredients worker:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to compute ingredients', 
        details: error.message 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }
  },
}; 