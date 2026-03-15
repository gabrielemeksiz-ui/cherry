# Testing Strategy

## Philosophy
Cherry is a personal-use MVP. The goal is manual browser testing after each feature, not full automated test coverage. Use automated tests only for critical logic (XML parsing, track matching).

## Frameworks
- **Unit Tests:** Vitest (if code is exported from Lovable to VSCode)
- **E2E Tests:** Manual browser testing (Lovable preview or local dev)
- **XML Parsing:** Unit test the parser with a sample Apple Music XML file

## Manual Verification Checklist (run after each feature)

### OAuth
- [ ] Click "Connecter Spotify" → Spotify window opens → accept → green checkmark appears
- [ ] Click "Connecter Deezer" → Deezer window opens → accept → green checkmark appears
- [ ] Refresh page → connection status is preserved

### Deezer Transfer
- [ ] All Deezer playlists appear in the list
- [ ] Progress bar appears immediately after clicking "Transférer"
- [ ] Spotify playlist is created with the same name
- [ ] Transfer summary shows correct counts
- [ ] Test with a 500+ track playlist

### Apple Music XML
- [ ] Export a real .xml from Apple Music on Mac
- [ ] Upload via drag & drop — playlists appear
- [ ] Upload via button — playlists appear
- [ ] Invalid file → clear error message in French
- [ ] Transfer works the same as Deezer

### History
- [ ] After a transfer, go to History page → transfer appears
- [ ] Close browser, reopen → history is still there
- [ ] Each entry shows: name, date, source, counts

### Cross-browser & Mobile
- [ ] Test on Chrome ✅
- [ ] Test on Safari ✅
- [ ] Test on Firefox ✅
- [ ] Test on iPhone viewport ✅
- [ ] Test on Android viewport ✅

## Pre-Commit Checks
Before committing any code change:
```bash
npm run lint      # No linting errors
npm run build     # Build succeeds
npm test          # All tests pass (if applicable)
```

## Verification Loop
After every feature implementation:
1. Open the app in the browser
2. Test the happy path manually
3. Test one error case (e.g., invalid file, no connection)
4. Fix any issues before moving to the next feature
5. Update `MEMORY.md` with what was completed

## Key Test Scenarios
| Scenario | Expected Result |
|----------|----------------|
| Transfer 500+ song playlist | Completes in < 5 min, all tracks processed |
| Track not on Spotify | Shown in "not found" list, doesn't break transfer |
| OAuth token expires during transfer | Supabase auto-refreshes, transfer continues |
| Invalid XML file | Clear French error message, no crash |
| Network error during transfer | Progress stops, clear error message, retry option |
