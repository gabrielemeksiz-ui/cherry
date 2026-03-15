# CLAUDE.md — Claude Code Configuration for Cherry 🍒

## Project Context
**App:** Cherry — Playlist transfer app (Deezer/Apple Music → Spotify)
**Stack:** React · Supabase (Auth + PostgreSQL + Edge Functions) · xml2js · Lovable/Vercel
**Stage:** MVP Development
**User Level:** Vibe-coder (Lovable primary, VSCode + Claude secondary)
**Language:** French (UI copy), English (code)

## Directives
1. **Master Plan:** Always read `AGENTS.md` first. It contains the current phase and tasks.
2. **Documentation:** Refer to `agent_docs/` for tech stack details, code patterns, and testing guides.
3. **Plan-First:** Propose a brief plan and wait for approval before coding.
4. **Incremental Build:** Build one small feature at a time. Test in the browser after each.
5. **Pre-Commit:** If hooks exist, run them before commits; fix failures.
6. **Concise:** Be brief. Ask ONE clarifying question if something is unclear.
7. **French UI copy:** All user-facing text (buttons, messages, errors) must be in French.

## Commands
```bash
npm run dev       # Start local dev server
npm run build     # Build for production
npm test          # Run tests
npm run lint      # Check code style
```

## When Using Lovable
- Describe features in plain French to Lovable
- If Lovable output is wrong, paste the code here and describe what to fix
- For complex OAuth logic or XML parsing, implement in VSCode with Claude

## What NOT To Do
- Do NOT rewrite Lovable-generated code from scratch — refactor incrementally
- Do NOT add features outside the current phase
- Do NOT store OAuth tokens in plaintext or logs
- Do NOT skip manual browser testing before marking a task done
- Do NOT bypass Supabase Auth — never implement custom token storage
