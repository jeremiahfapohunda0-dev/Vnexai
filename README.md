# Vnex AI Max

A responsive React + Vite AI chat workspace with a premium dark/light interface, persistent local conversation history, conversation search, pin/rename/delete/export controls, file previews, image understanding for supported image uploads, text-file context, and a small server-side AI gateway. The project uses a standalone frontend and server-side AI gateway.

## Requirements

- Node.js 22 LTS (or a current Node release supported by Vite)
- A NEXUS 1 PRO API key (or an OpenAI/Anthropic key if you choose those providers)

## Run on Windows / PowerShell

1. Extract this ZIP.
2. Open the extracted project folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Create your private environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

5. Open `.env` in VS Code. Add your provider key there (never paste it into React code or a browser field).

   NEXUS 1 PRO example (recommended for this version):

   ```dotenv
   AI_PROVIDER=nexus
   NEXUS_API_KEY=put_your_real_nexus_key_here
   NEXUS_MODEL=NEXUS 1 PRO
   ```

   NEXUS requests are sent by the local server to `https://nexus-labs.myng.net/chat` using the `X-API-Key` header and a JSON body containing `message`. Keep the key in `.env`; never place it in React/browser code or share it in chat.

   OpenAI alternative:

   ```dotenv
   AI_PROVIDER=openai
   OPENAI_API_KEY=put_your_real_key_here
   OPENAI_MODEL=gpt-4o-mini
   ```

   Anthropic alternative:

   ```dotenv
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=put_your_real_key_here
   ANTHROPIC_MODEL=claude-sonnet-4-5
   ```

6. Install packages and start both the frontend and backend:

   ```powershell
   npm install
   npm run dev
   ```

7. Open the local URL printed by Vite. Keep the terminal open while using Vnex AI. Press **Ctrl+C** in the terminal to stop both services.

The API server binds to `127.0.0.1:8787`; Vite proxies `/api` requests to it. API keys remain server-side and are not included in frontend bundles. `.env` is ignored by Git.

## Optional model list

To make more than one model selectable in the header, set `AI_MODELS` to a comma-separated allowlist of model IDs supported by your selected provider. The server only accepts models from this list. `OPENAI_MODEL` or `ANTHROPIC_MODEL` remains the default.

## Working features

- New chats, persistent browser history, chat search, pin/unpin, rename, delete confirmation, Markdown export
- Dark and light themes, responsive sidebar, starter prompts, keyboard send (Enter), multiline input (Shift+Enter)
- Copy response, feedback buttons, regenerate response, stop/cancel a request
- Server-side OpenAI-compatible and Anthropic provider calls, conversation context, clear missing-key/API error messages
- Image uploads sent to compatible vision models; TXT/MD/JSON/CSV content included as context; file size/type checks
- Settings connection check without asking for secrets in the browser

## Current limitations (not falsely represented as implemented)

- Replies return when the provider request completes; token-by-token streaming is not implemented yet.
- PDF text extraction is not implemented; the UI warns when a PDF is attached. Use TXT, Markdown, JSON, or CSV for document text.
- Image generation/editing, audio transcription, text-to-speech, video analysis, accounts/sync, a persistent database, plugins, and scheduled task execution need additional integrations/services and are not enabled in this build.
- Local conversation history is stored in this browser's local storage, not a cloud database. Do not use this local-only setup for multi-user production deployment without authentication, rate limiting, server-side storage, and additional security review.

## Build

```powershell
npm run build
```
