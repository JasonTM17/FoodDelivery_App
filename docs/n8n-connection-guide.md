# N8N Connection Guide

## Status: N8N Running ✅

N8N is running at http://localhost:5678 (verified: `{"status":"ok"}`)

## One-Time Setup (Required)

1. Open http://localhost:5678 in browser
2. Fill in owner account:
   - Email: admin@foodflow.vn
   - Password: FoodFlow@N8N2024
3. Click "Next" and complete setup

## Import Workflows

1. Go to Settings → Import from File
2. Import each JSON from `infra/n8n/workflows/`:
   - `ai-support-chat.json`
   - `driver-delay-detector.json`
   - `driver-stopped-detector.json`
   - `daily-report.json`
   - `promotion-suggester.json`

## Configure Backend Connection

In each workflow's HTTP Request nodes, update webhook URLs:
- Backend API: `http://backend:3001/api` (Docker network)
- Or: `http://host.docker.internal:3001/api` (from N8N container)

## Configure Gemini AI

1. Get API key from https://aistudio.google.com/apikey
2. In N8N → Credentials → Add Gemini API credential
3. Use in AI Chat workflow's LLM node

## Activate Workflows

Toggle each workflow from Inactive → Active (top-right switch)

## Verification
```bash
# Test AI chat webhook
curl -X POST http://localhost:5678/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","userId":"test","sessionId":"test-1"}'
```
