export async function handleApiRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Route API requests
  switch (path) {
    case '/api/compute-ingredients':
      if (request.method === 'POST') {
        return handleComputeIngredients(request, env);
      }
      break;
    
    case '/api/save-meal-plan':
      if (request.method === 'POST') {
        return handleSaveMealPlan(request, env);
      }
      break;
    
    case '/api/get-meal-plan':
      if (request.method === 'GET') {
        return handleGetMealPlan(request, env);
      }
      break;
    
    case '/api/compute-nutrition':
      if (request.method === 'POST') {
        return handleComputeNutrition(request, env);
      }
      break;
    
    case '/api/set-ai-provider':
      if (request.method === 'POST') {
        return handleSetAiProvider(request, env);
      }
      break;
    
    case '/api/get-ai-provider':
      if (request.method === 'GET') {
        return handleGetAiProvider(request, env);
      }
      break;
    
    case '/api/health':
      if (request.method === 'GET') {
        return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      break;
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleComputeIngredients(request: Request, env: Env): Promise<Response> {
  try {
    const { sessionId, meals, weekStart, weekEnd } = await request.json();

    if (!sessionId || !meals) {
      return new Response(JSON.stringify({ error: 'Session ID and meals data are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate cache key from meals data (content-based, ignoring dates)
    const normalizedMeals = Object.values(meals)
      .flatMap(day => [day.breakfast, day.lunch, day.dinner])
      .filter(meal => meal.trim())
      .sort()
      .join('|');
    
    const mealsHash = await crypto.subtle.digest('MD5', new TextEncoder().encode(normalizedMeals))
      .then(hash => Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''));
    
    const cacheKey = `meal-planner:${sessionId}:ingredients:${mealsHash}`;
    

    // STEP 1: Try to get exact match from KV cache first
    let cachedIngredients = null;
    try {
      cachedIngredients = await env.MEAL_PLANNER_KV.get(cacheKey);
      if (cachedIngredients) {
        return new Response(JSON.stringify({
          ingredients: cachedIngredients,
          cached: true,
          source: 'exact_cache',
          message: "Served from cache - identical meals detected"
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

    // STEP 2: Try semantic search in Vectorize for similar meals
    try {
      const similarMeal = await findSimilarMeal(env, sessionId, normalizedMeals);
      if (similarMeal) {
        
        // STEP 3: Adapt the similar meal's ingredients to our exact meal
        const adaptedIngredients = await adaptIngredients(
          env, 
          similarMeal.mealText, 
          normalizedMeals, 
          similarMeal.ingredients
        );
        
        // STEP 4: Store the adapted result in both KV and Vectorize for future use
        await env.MEAL_PLANNER_KV.put(cacheKey, adaptedIngredients, { expirationTtl: 3600 });
        await storeMealInVectorize(env, sessionId, normalizedMeals, adaptedIngredients);
        
        return new Response(JSON.stringify({
          ingredients: adaptedIngredients,
          cached: false,
          source: 'semantic_adaptation',
          similarity: similarMeal.similarity,
          adaptedFrom: similarMeal.mealText,
          message: `Adapted from similar meal (${(similarMeal.similarity * 100).toFixed(1)}% match)`
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
        });
      }
    } catch (vectorError) {
      console.log('Vectorize search failed:', vectorError.message);
      // Continue to full AI generation
    }

    // Format meals data for Claude
    let mealsText = '';
    Object.entries(meals).forEach(([date, dayMeals]: [string, any]) => {
      const dateObj = new Date(date);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      mealsText += `\n${dayName} (${date}):\n`;
      if (dayMeals.breakfast) mealsText += `  Breakfast: ${dayMeals.breakfast}\n`;
      if (dayMeals.lunch) mealsText += `  Lunch: ${dayMeals.lunch}\n`;
      if (dayMeals.dinner) mealsText += `  Dinner: ${dayMeals.dinner}\n`;
    });

    const prompt = `You are an expert cooking assistant with knowledge of specific recipes. For each meal listed below, use a well-known recipe you know and create an exact, detailed shopping list.

REQUIREMENTS:
1. For each meal, reference a specific recipe you know (e.g., "classic chicken curry", "traditional pasta carbonara")
2. List ALL ingredients with exact quantities (e.g., "2 lbs boneless chicken thighs", not "chicken")
3. Be specific about ingredient types (e.g., "yellow onions", "Roma tomatoes", "jasmine rice")
4. Include every ingredient needed - no vague terms like "other vegetables as necessary"
5. Use bullet points for each ingredient
6. Group by categories: Proteins, Vegetables, Dairy, Grains/Starches, Spices/Seasonings, Pantry Items
7. Include cooking essentials if needed in significant quantities (olive oil, salt, etc.)

Meal Plan:${mealsText}

Provide an exact shopping list with specific quantities for each ingredient. No generalizations or "as needed" items.`;

    // Get AI provider preference and call appropriate API
    const aiProvider = await getAiProvider(env);
    const systemPrompt = 'You are an expert chef with extensive recipe knowledge. Create precise, detailed shopping lists with exact quantities and specific ingredient types. Never use vague terms or generalizations.';
    
    let ingredients: string;
    if (aiProvider === 'claude') {
      ingredients = await callClaude(env, prompt, systemPrompt, 1000);
    } else {
      ingredients = await callWorkerAI(env, prompt, systemPrompt, 1000);
    }

    // STEP 5: Cache the result in both KV and Vectorize for future semantic lookups
    if (ingredients) {
      try {
        await env.MEAL_PLANNER_KV.put(cacheKey, ingredients, { expirationTtl: 3600 }); // 1 hour
        console.log('📝 About to store in Vectorize - normalizedMeals:', normalizedMeals);
        await storeMealInVectorize(env, sessionId, normalizedMeals, ingredients);
        console.log('Stored fresh AI result in both KV and Vectorize');
      } catch (cacheError) {
        console.log('Cache write failed:', cacheError.message);
      }
    }

    // Save meal plan and ingredients to D1 database
    try {
      await env.MEAL_PLANNER_DB
        .prepare(`
          INSERT OR REPLACE INTO meal_plans (session_id, week_start, week_end, meals, ingredients, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM meal_plans WHERE session_id = ? AND week_start = ? AND week_end = ?), datetime('now')), datetime('now'))
        `)
        .bind(sessionId, weekStart, weekEnd, JSON.stringify(meals), ingredients, sessionId, weekStart, weekEnd)
        .run();
    } catch (dbError) {
      console.log('D1 save failed:', dbError.message);
    }

    return new Response(JSON.stringify({
      ingredients: ingredients,
      cached: false,
      source: 'ai_generation',
      message: "Generated fresh ingredients list"
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error) {
    console.error('Error computing ingredients:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to compute ingredients',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
}

async function handleSaveMealPlan(request: Request, env: Env): Promise<Response> {
  try {
    const { sessionId, weekStart, weekEnd, meals, ingredients } = await request.json();

    if (!sessionId || !weekStart || !weekEnd || !meals) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    // Check if meal plan already exists for this session and week
    const existingPlan = await env.MEAL_PLANNER_DB
      .prepare('SELECT id FROM meal_plans WHERE session_id = ? AND week_start = ? AND week_end = ?')
      .bind(sessionId, weekStart, weekEnd)
      .first();

    if (existingPlan) {
      // Update existing plan
      await env.MEAL_PLANNER_DB
        .prepare(`
          UPDATE meal_plans 
          SET meals = ?, ingredients = ?, updated_at = datetime('now')
          WHERE session_id = ? AND week_start = ? AND week_end = ?
        `)
        .bind(JSON.stringify(meals), ingredients || '', sessionId, weekStart, weekEnd)
        .run();
    } else {
      // Insert new plan
      await env.MEAL_PLANNER_DB
        .prepare(`
          INSERT INTO meal_plans (session_id, week_start, week_end, meals, ingredients, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `)
        .bind(sessionId, weekStart, weekEnd, JSON.stringify(meals), ingredients || '')
        .run();
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: existingPlan ? 'Meal plan updated' : 'Meal plan saved',
      weekStart,
      weekEnd
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error) {
    console.error('Error saving meal plan:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to save meal plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
}

async function handleGetMealPlan(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const weekStart = url.searchParams.get('weekStart');
    const weekEnd = url.searchParams.get('weekEnd');

    if (!sessionId || !weekStart || !weekEnd) {
      return new Response(JSON.stringify({ error: 'Missing sessionId, weekStart or weekEnd parameters' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    const mealPlan = await env.MEAL_PLANNER_DB
      .prepare('SELECT * FROM meal_plans WHERE session_id = ? AND week_start = ? AND week_end = ?')
      .bind(sessionId, weekStart, weekEnd)
      .first();

    if (!mealPlan) {
      return new Response(JSON.stringify({ error: 'Meal plan not found' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      mealPlan: {
        weekStart: mealPlan.week_start,
        weekEnd: mealPlan.week_end,
        meals: JSON.parse(mealPlan.meals),
        ingredients: mealPlan.ingredients,
        createdAt: mealPlan.created_at,
        updatedAt: mealPlan.updated_at
      }
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error) {
    console.error('Error getting meal plan:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get meal plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
}

async function handleComputeNutrition(request: Request, env: Env): Promise<Response> {
  try {
    const { sessionId, ingredients, meals } = await request.json();

    if (!sessionId || !ingredients || !meals) {
      return new Response(JSON.stringify({ error: 'Missing sessionId, ingredients or meals data' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    // Call AI to compute nutrition
    const prompt = `Based on the following ingredients and meal plan, calculate the total nutritional information for all the meals provided.

Please provide total macros and key nutrition information for all the meals listed:
1. Total calories for all meals
2. Total protein in grams
3. Total carbs in grams  
4. Total fat in grams
5. Total fiber in grams
6. Total sugar in grams
7. Total sodium in milligrams
8. Total calcium in milligrams
9. Total iron in milligrams
10. Total vitamin C in milligrams
11. Total vitamin A in micrograms
12. Total vitamin D in micrograms

Format your response as a JSON object with this structure:
{
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "totalFiber": number,
  "totalSugar": number,
  "totalSodium": number,
  "totalCalcium": number,
  "totalIron": number,
  "totalVitaminC": number,
  "totalVitaminA": number,
  "totalVitaminD": number
}

Ingredients: ${ingredients}

Meal Plan: ${JSON.stringify(meals, null, 2)}

IMPORTANT: Return ONLY the JSON object with no markdown formatting, no code blocks, no explanations, and no additional text. Start directly with { and end with }.`;

    // Get AI provider preference and call appropriate API
    const aiProvider = await getAiProvider(env);
    const systemPrompt = 'You are a nutrition expert that analyzes meal plans and provides detailed nutritional information in JSON format.';
    
    let nutritionText: string;
    if (aiProvider === 'claude') {
      nutritionText = await callClaude(env, prompt, systemPrompt, 2000);
    } else {
      nutritionText = await callWorkerAI(env, prompt, systemPrompt, 2000);
    }

    // Handle the AI response - it might be a string (Claude) or object (Workers AI)
    let nutritionData;
    try {
      console.log('Raw AI response:', nutritionText);
      console.log('AI response type:', typeof nutritionText);
      
      // Check if response is already an object (Workers AI) or a string (Claude)
      if (typeof nutritionText === 'object' && nutritionText !== null) {
        console.log('Response is already an object (Workers AI)');
        nutritionData = nutritionText;
      } else if (typeof nutritionText === 'string') {
        console.log('Response is a string (Claude), parsing JSON');
        // Clean the response - remove markdown code blocks if present
        let cleanedText = nutritionText.trim();
        
        // Remove markdown code blocks (```json ... ``` or ``` ... ```)
        if (cleanedText.startsWith('```')) {
          const firstNewline = cleanedText.indexOf('\n');
          const lastCodeBlock = cleanedText.lastIndexOf('```');
          if (firstNewline !== -1 && lastCodeBlock > firstNewline) {
            cleanedText = cleanedText.substring(firstNewline + 1, lastCodeBlock).trim();
          }
        }
        
        console.log('Cleaned AI response:', cleanedText);
        nutritionData = JSON.parse(cleanedText);
      } else {
        throw new Error('Unexpected response type: ' + typeof nutritionText);
      }
      
      console.log('Parsed nutrition data:', nutritionData);
      
      // Handle Workers AI response format - extract data from nested response object
      if (nutritionData.response && typeof nutritionData.response === 'object') {
        console.log('Detected Workers AI format, extracting nested response data');
        nutritionData = nutritionData.response;
        console.log('Extracted nutrition data:', nutritionData);
      }
      
      // Validate that we have the required nutrition fields and set defaults
      const requiredFields = [
        'totalCalories', 'totalProtein', 'totalCarbs', 'totalFat',
        'totalFiber', 'totalSugar', 'totalSodium', 'totalCalcium',
        'totalIron', 'totalVitaminC', 'totalVitaminA', 'totalVitaminD'
      ];
      
      requiredFields.forEach(field => {
        if (nutritionData[field] === undefined || nutritionData[field] === null) {
          console.warn(`Missing nutrition field: ${field}, setting to 0`);
          nutritionData[field] = 0;
        }
      });
      
    } catch (parseError) {
      console.error('Failed to parse nutrition data:', parseError);
      console.error('Original response:', nutritionText);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse nutrition data from AI response',
        details: nutritionText,
        parseError: parseError.message
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    return new Response(JSON.stringify(nutritionData), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error) {
    console.error('Error computing nutrition:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to compute nutrition',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
}

async function handleSetAiProvider(request: Request, env: Env): Promise<Response> {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !['workers-ai', 'claude'].includes(provider)) {
      return new Response(JSON.stringify({ error: 'Invalid AI provider. Must be "workers-ai" or "claude"' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      });
    }

    // If Claude is selected, validate and store the API key
    if (provider === 'claude') {
      if (!apiKey || !apiKey.startsWith('sk-ant-')) {
        return new Response(JSON.stringify({ error: 'Valid Claude API key is required' }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
        });
      }
      
      // Store the Claude API key securely in KV
      await env.MEAL_PLANNER_KV.put('claude-api-key', apiKey);
    }

    // Store provider preference in KV with explicit flag
    await env.MEAL_PLANNER_KV.put('ai-provider', provider);
    await env.MEAL_PLANNER_KV.put('ai-provider-set', 'true');

    return new Response(JSON.stringify({ 
      success: true, 
      provider: provider,
      message: `AI provider set to ${provider}`
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error) {
    console.error('Error setting AI provider:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to set AI provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
}

async function handleGetAiProvider(request: Request, env: Env): Promise<Response> {
  try {
    const provider = await getAiProvider(env);
    const explicitlySet = await env.MEAL_PLANNER_KV.get('ai-provider-set') === 'true';
    
    return new Response(JSON.stringify({ 
      success: true, 
      provider: provider,
      explicitlySet: explicitlySet
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error) {
    console.error('Error getting AI provider:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get AI provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
}

async function getAiProvider(env: Env): Promise<string> {
  try {
    const provider = await env.MEAL_PLANNER_KV.get('ai-provider');
    return provider || 'workers-ai'; // Default to Workers AI
  } catch (error) {
    console.log('Failed to get AI provider, defaulting to workers-ai');
    return 'workers-ai';
  }
}

// Vectorize helper functions for semantic meal lookup
async function generateMealEmbedding(env: Env, mealText: string): Promise<number[]> {
  try {
    // Use Workers AI text embedding model
    const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: mealText
    });
    return response.data[0];
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    throw error;
  }
}

async function storeMealInVectorize(env: Env, sessionId: string, mealText: string, ingredients: string): Promise<void> {
  try {
    const embedding = await generateMealEmbedding(env, mealText);
    const vectorId = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${sessionId}:${mealText}`))
      .then(hash => Array.from(new Uint8Array(hash.slice(0, 16))).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    await env.MEAL_VECTORIZE.upsert([{
      id: vectorId,
      values: embedding,
      metadata: {
        sessionId: sessionId,
        mealText: mealText,
        ingredients: ingredients,
        timestamp: Date.now()
      }
    }]);
  } catch (error) {
    // Don't throw - vectorize storage is optional
  }
}

async function findSimilarMeal(env: Env, sessionId: string, mealText: string, threshold: number = 0.9): Promise<{mealText: string, ingredients: string, similarity: number} | null> {
  try {
    const embedding = await generateMealEmbedding(env, mealText);
    
    const results = await env.MEAL_VECTORIZE.query(embedding, {
      topK: 5,
      returnMetadata: 'all'
    });
    
    if (results.matches && results.matches.length > 0) {
      const bestMatch = results.matches[0];
      
      if (bestMatch.score >= threshold && bestMatch.metadata) {
        return {
          mealText: bestMatch.metadata.mealText as string,
          ingredients: bestMatch.metadata.ingredients as string,
          similarity: bestMatch.score
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to search Vectorize:', error);
    return null;
  }
}

async function adaptIngredients(env: Env, originalMeal: string, targetMeal: string, originalIngredients: string): Promise<string> {
  try {
    const systemPrompt = 'You are an expert chef that adapts precise ingredient lists between similar meals. Always provide exact quantities and specific ingredient types.';
    const prompt = `Adapt this ingredient list from "${originalMeal}" to "${targetMeal}".

Original ingredients:
${originalIngredients}

REQUIREMENTS:
1. Keep the same format with exact quantities and specific ingredient types
2. Make precise substitutions for the differences between meals (e.g., if changing rice to naan, substitute "2 cups jasmine rice" with "4 pieces naan bread")
3. Maintain the same level of detail and specificity
4. Use bullet points for each ingredient
5. Include all necessary ingredients with exact quantities
6. No vague terms like "as needed" or "other vegetables"

Return only the adapted ingredient list with exact quantities, no explanations.`;

    const aiProvider = await getAiProvider(env);
    let adaptedIngredients: string;
    
    if (aiProvider === 'claude') {
      adaptedIngredients = await callClaude(env, prompt, systemPrompt, 800);
    } else {
      adaptedIngredients = await callWorkerAI(env, prompt, systemPrompt, 800);
    }
    
    console.log('Adapted ingredients:', { originalMeal, targetMeal, similarity: 'AI adapted' });
    return adaptedIngredients;
  } catch (error) {
    console.error('Failed to adapt ingredients:', error);
    throw error;
  }
}

async function callWorkerAI(env: Env, prompt: string, systemPrompt: string, maxTokens: number = 1000): Promise<string> {
  const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: maxTokens,
    temperature: 0
  }, {
    gateway: {
      id: 'meal-planner-gateway'
    }
  });
  return response.response;
}

async function callClaude(env: Env, prompt: string, systemPrompt: string, maxTokens: number = 1000): Promise<string> {
  // First try to get API key from KV storage (user-provided)
  let apiKey = await env.MEAL_PLANNER_KV.get('claude-api-key');
  
  // Fallback to environment variable if no user-provided key
  if (!apiKey) {
    apiKey = env.CLAUDE_API_KEY;
  }
  
  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      messages: [
        { 
          role: 'user', 
          content: `${systemPrompt}\n\n${prompt}`
        }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

export interface Env {
  MEAL_PLANNER_KV: KVNamespace;
  MEAL_PLANNER_DB: D1Database;
  AI: Ai;
  MEAL_VECTORIZE: VectorizeIndex;
  CLAUDE_API_KEY?: string;
}
