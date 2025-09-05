# Vectorize Setup Instructions

To enable the semantic meal lookup feature, you need to create a Vectorize index:

## 1. Create the Vectorize Index

```bash
wrangler vectorize create meal-ingredients-index --dimensions=768 --metric=cosine
```

## 2. Update wrangler.toml (already done)

The `wrangler.toml` file has been updated with the Vectorize binding:

```toml
[[vectorize]]
binding = "MEAL_VECTORIZE" 
index_name = "meal-ingredients-index"
```

## 3. Deploy the Application

```bash
npm run deploy
```

## 4. How the Semantic Lookup Works

### User Flow Example:
1. **User types**: "chicken tikka masala with naan"
2. **KV Check**: Look for exact key → Not found
3. **Vectorize Check**: Find similar "chicken curry with rice" (0.87 similarity) → Found!
4. **AI Adaptation**: Use AI to swap "rice" → "naan", keep chicken/sauce ingredients  
5. **Store**: Save adapted result in both KV and Vectorize for next time

### Three-Tier Caching Strategy:
- **⚡ Exact Cache**: Instant retrieval from KV for identical meals
- **🧠 Semantic Match**: Find similar meals and adapt ingredients using AI
- **🔥 Fresh Generation**: Full AI analysis for completely new meal combinations

### Performance Benefits:
- **Exact matches**: ~10ms (KV lookup)
- **Semantic matches**: ~500ms (embedding + adaptation)  
- **Fresh generation**: ~2-3s (full AI analysis)

## 5. Monitoring

Check the Cloudflare dashboard to monitor:
- Vectorize query volume
- Cache hit rates
- Semantic similarity scores
