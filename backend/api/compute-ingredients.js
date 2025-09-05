const { Anthropic } = require('@anthropic-ai/sdk');
const crypto = require('crypto');

module.exports = async function computeIngredientsHandler(req, res) {
  console.log(`\n=== COMPUTE INGREDIENTS HANDLER START ===`);
  console.log(`Method: ${req.method}`);
  console.log(`Body:`, req.body);
  console.log(`API Key exists: ${!!process.env.CLAUDE_API_KEY}`);
  console.log(`API Key starts with: ${process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.substring(0, 10) + '...' : 'NONE'}`);
  
  try {
    if (req.method && req.method !== 'POST') {
      console.log(`Method not allowed: ${req.method}`);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { meals, weekStart, weekEnd } = req.body || {};
    console.log(`Extracted data:`, { meals: !!meals, weekStart, weekEnd });

    if (!meals) {
      console.log(`No meals data provided`);
      return res.status(400).json({ error: 'Meals data is required' });
    }

    // Generate cache key from meals data
    const mealsHash = crypto.createHash('md5').update(JSON.stringify(meals)).digest('hex');
    const cacheKey = `meal-planner:ingredients:${weekStart}:${weekEnd}:${mealsHash}`;
    console.log(`Cache key: ${cacheKey}`);

    // Try to get from cache first (if KV is available)
    let cachedIngredients = null;
    if (process.env.CLOUDFLARE_KV) {
      try {
        console.log(`Checking KV cache for key: ${cacheKey}`);
        // This would be replaced with actual KV.get() in production
        // cachedIngredients = await KV.get(cacheKey);
        console.log(`KV cache check completed (not implemented in local dev)`);
      } catch (cacheError) {
        console.log(`Cache check failed:`, cacheError.message);
      }
    }

    if (cachedIngredients) {
      console.log(`Cache HIT! Returning cached ingredients`);
      return res.status(200).json({ 
        ingredients: cachedIngredients,
        cached: true,
        cacheKey: cacheKey
      });
    }

    console.log(`Cache MISS - calling Claude API`);

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

    console.log(`Formatted meals text length: ${mealsText.length}`);
    console.log(`Creating Anthropic client...`);

    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    console.log(`Anthropic client created successfully`);

    const prompt = `You are a helpful cooking assistant. Based on the following weekly meal plan, create a comprehensive shopping list of ingredients needed. \n\nPlease:\n1. List all ingredients needed for the week\n2. Group similar ingredients together (e.g., combine multiple tomatoes into one line)\n3. Include quantities where appropriate\n4. Organize by categories (Proteins, Vegetables, Dairy, Pantry items, etc.)\n5. Only include ingredients that would need to be purchased (don't include common household items like salt, pepper, oil unless specifically needed in large quantities)\n\nWeek: ${weekStart || ''} to ${weekEnd || ''}\nWeekly Meal Plan:${mealsText}\n\nPlease provide a clean, organized shopping list that someone could take to the grocery store.`;

    console.log(`Sending request to Claude...`);
    console.log(`Model: claude-3-7-sonnet-20250219`);
    console.log(`Prompt length: ${prompt.length}`);

    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    console.log(`Claude response received successfully`);
    console.log(`Response content type: ${typeof message.content}`);
    console.log(`Response content length: ${message.content ? message.content.length : 'undefined'}`);

    const ingredients = message.content && message.content[0] && message.content[0].text ? message.content[0].text : '';
    console.log(`Extracted ingredients length: ${ingredients.length}`);
    console.log(`Ingredients preview: ${ingredients.substring(0, 100)}...`);

    // Cache the result in KV (if available)
    if (process.env.CLOUDFLARE_KV && ingredients) {
      try {
        console.log(`Caching ingredients in KV with 1-hour TTL`);
        // This would be replaced with actual KV.put() in production
        // await KV.put(cacheKey, ingredients, { expirationTtl: 3600 }); // 1 hour = 3600 seconds
        console.log(`KV cache store completed (not implemented in local dev)`);
      } catch (cacheError) {
        console.log(`Failed to cache ingredients:`, cacheError.message);
      }
    }

    console.log(`Sending successful response`);
    return res.status(200).json({ 
      ingredients,
      cached: false,
      cacheKey: cacheKey
    });
  } catch (error) {
    console.error(`\n=== ERROR IN COMPUTE INGREDIENTS HANDLER ===`);
    console.error(`Error type: ${error.constructor.name}`);
    console.error(`Error message: ${error.message}`);
    console.error(`Error stack:`, error.stack);
    console.error(`Full error object:`, error);
    console.error(`=============================================\n`);
    
    return res.status(500).json({ error: 'Failed to compute ingredients', details: error.message });
  }
}; 