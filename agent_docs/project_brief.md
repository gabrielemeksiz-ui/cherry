# Project Brief (Persistent)

## Product Vision
**Cherry** — Transfer playlists from Deezer or Apple Music to Spotify, completely free, without the 200-song limit. Built for Léa: she clicks a few buttons, her 500-song playlist appears in Spotify. Done.

## Target Audience
Léa — student, 18-25, low tech level. She wants it to just work. No jargon, no friction, no cost.

## Coding Conventions
- **Framework:** React components (PascalCase: `PlaylistCard.tsx`)
- **Files:** camelCase for utilities (`parseXml.ts`), kebab-case for routes/pages
- **Styling:** Use the Cherry design tokens (see `agent_docs/tech_stack.md`) — pink everywhere, rounded corners, friendly copy
- **Language in UI:** French (this app is for Léa, who prefers French)
- **Messages:** Human tone, never technical jargon. Error = "On n'a pas trouvé cette chanson sur Spotify 😕" not "404 track not found"

## Key Principles
1. **One action per screen** — don't overwhelm Léa
2. **Feedback always** — loading spinner, progress bar, success confirmation — she always knows what's happening
3. **Simplest solution first** — if Lovable handles it natively, don't build custom code
4. **Free stack only** — no paid services, ever, for the MVP

## Quality Gates
- Manual browser test after each feature (Chrome + Safari minimum)
- Test on mobile viewport before marking any UI task done
- Test the Deezer transfer with a 500+ song playlist before launch
- Léa should be able to complete a full transfer without asking for help

## Key Commands
```bash
npm run dev       # Start local development server
npm run build     # Build for production
npm run lint      # Check code style
npm test          # Run tests
```

## Update Cadence
Update `MEMORY.md` after every milestone. Update this brief if conventions change or new decisions are made that should persist across sessions.
