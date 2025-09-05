# 🚀 Deployment Guide: Cloudflare Workers + KV Caching

This guide shows you how to deploy your meal planner API to Cloudflare Workers with KV caching for ingredient lists.

## 🏆 Why Cloudflare KV for Caching?

- **1-hour TTL**: Perfect for meal planning (meals don't change that frequently)
- **Global edge caching**: Fast response times worldwide
- **Cost-effective**: Pay per request, not per server
- **Simple implementation**: Just a few lines of code
- **Automatic expiration**: No need to manage cache cleanup

## 📋 Prerequisites

1. **Cloudflare account** (free tier available)
2. **Wrangler CLI** installed: `npm install -g wrangler`
3. **Claude API key** from Anthropic
4. **Node.js 18+** for local development

## 🚀 Quick Deployment Steps

### 1. **Login to Cloudflare**
```bash
wrangler login
```

### 2. **Create KV Namespace**
```bash
# Create production namespace
wrangler kv:namespace create "MEAL_PLANNER_KV"

# Create preview namespace (for testing)
wrangler kv:namespace create "MEAL_PLANNER_KV" --preview
```

### 3. **Update Configuration**
Edit `wrangler.toml` with your namespace IDs:
```toml
[[env.production.kv_namespaces]]
binding = "MEAL_PLANNER_KV"
id = "ea622411961943dda162ad60fbb64bb0"
preview_id = "your-preview-kv-id-here"

[env.production.vars]
CLAUDE_API_KEY = ""
```

### 4. **Deploy to Production**
```bash
wrangler deploy --env production
```

### 5. **Test the Deployment**
```bash
# Test production
curl -X POST https://your-worker.your-subdomain.workers.dev/api/compute-ingredients \
  -H "Content-Type: application/json" \
  -d '{"weekStart":"2025-02-17","weekEnd":"2025-02-23","meals":{"2025-02-17":{"breakfast":"eggs","lunch":"salad","dinner":"pasta"}}}'
```

## 🔧 Local Development with KV

### 1. **Install Wrangler Dependencies**
```bash
cd backend
npm install -D wrangler
```

### 2. **Start Local Development**
```bash
wrangler dev --local
```

### 3. **Test Local KV**
```bash
# In another terminal
curl -X POST http://localhost:8787/api/compute-ingredients \
  -H "Content-Type: application/json" \
  -d '{"weekStart":"2025-02-17","weekEnd":"2025-02-23","meals":{"2025-02-17":{"breakfast":"eggs","lunch":"salad","dinner":"pasta"}}}'
```

## 📊 Cache Performance Benefits

### **Before Caching (Every Request)**
- Claude API call: ~2-5 seconds
- Cost: Per API call
- Rate limits: Apply to every request

### **After Caching (1-hour TTL)**
- **First request**: Claude API call + KV storage
- **Subsequent requests**: KV retrieval (~50-100ms)
- **Cost savings**: 90%+ reduction in Claude API calls
- **Performance**: 20-50x faster for cached requests

## 🎯 Cache Strategy

### **Cache Key Structure**
```
meal-planner:ingredients:{weekStart}:{weekEnd}:{mealsHash}
```

**Example:**
```
meal-planner:ingredients:2025-02-17:2025-02-23:a1b2c3d4e5f6...
```

### **Cache Invalidation**
- **Automatic**: 1-hour TTL
- **Manual**: Can be cleared via KV dashboard
- **Smart**: Different meal plans get different cache keys

## 🔍 Monitoring & Analytics

### **Cloudflare Dashboard**
- **Workers**: Request count, errors, performance
- **KV**: Read/write operations, storage usage
- **Analytics**: Cache hit rates, response times

### **Custom Metrics**
```javascript
// Add to your worker for custom analytics
if (cachedIngredients) {
  // Cache hit
  console.log('Cache HIT:', cacheKey);
} else {
  // Cache miss
  console.log('Cache MISS:', cacheKey);
}
```

## 💰 Cost Optimization

### **Free Tier Limits**
- **Workers**: 100,000 requests/day
- **KV**: 100,000 read operations/day
- **KV**: 1,000 write operations/day

### **Paid Tier Pricing**
- **Workers**: $5/month + $0.50 per million requests
- **KV**: $0.50 per million read operations
- **KV**: $5 per million write operations

### **Cost Calculation Example**
```
Monthly usage: 10,000 meal plan requests
- 90% cache hits: 9,000 KV reads = $0.0045
- 10% cache misses: 1,000 Claude API calls = $0.50
- Total: ~$0.50/month (vs $5+ without caching)
```

## 🚨 Troubleshooting

### **Common Issues**

#### **KV Binding Error**
```
Error: KV namespace binding not found
```
**Solution**: Check `wrangler.toml` namespace IDs

#### **CORS Issues**
```
Error: CORS policy violation
```
**Solution**: Ensure CORS headers in worker response

#### **Environment Variables**
```
Error: CLAUDE_API_KEY not defined
```
**Solution**: Set in `wrangler.toml` or via dashboard

### **Debug Commands**
```bash
# Check worker logs
wrangler tail --env production

# Test KV operations
wrangler kv:key list --binding=MEAL_PLANNER_KV

# Validate configuration
wrangler deploy --dry-run
```

## 🔄 Updating the Frontend

### **Change API Endpoint**
Update `frontend/src/App.jsx`:
```javascript
// Change from local proxy to production
const response = await fetch('https://your-worker.your-subdomain.workers.dev/api/compute-ingredients', {
  // ... rest of the code
});
```

### **Environment Variables**
Create `.env.production`:
```env
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
```

## 📈 Performance Benchmarks

### **Response Times**
- **Uncached**: 2-5 seconds
- **Cached**: 50-100ms
- **Improvement**: 20-50x faster

### **Throughput**
- **Uncached**: Limited by Claude API rate limits
- **Cached**: Limited only by Cloudflare's global edge network

### **Reliability**
- **Uncached**: Depends on Claude API availability
- **Cached**: 99.9%+ uptime with Cloudflare's global infrastructure

## 🎉 Success Metrics

After deployment, you should see:
- ✅ **Faster responses** for repeated meal plans
- ✅ **Lower costs** from reduced Claude API calls
- ✅ **Better user experience** with instant results
- ✅ **Higher throughput** handling more concurrent users
- ✅ **Global performance** with edge caching

---

**Ready to deploy? Run `wrangler deploy --env production` and enjoy blazing-fast, cached ingredient lists! 🚀** 