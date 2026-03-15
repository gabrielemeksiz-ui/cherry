# Product Requirements — Cherry 🍒

## One-Line Goal
Léa can transfer all her playlists from Deezer (or Apple Music) to Spotify — free, unlimited, in a few clicks.

## Primary User Story
> "En tant que Léa, je veux transférer toutes mes playlists Deezer vers Spotify, sans limite de taille et sans payer, pour retrouver toute ma musique sans tout refaire à la main."

## Must-Have Features (P0 — MVP blockers)

### 1. Connect Accounts (OAuth)
- Connect Spotify account via OAuth (official Spotify login window)
- Connect Deezer account via OAuth (official Deezer login window)
- Cherry NEVER stores passwords
- Show connection status clearly (connected ✅ / disconnected)

**Success criteria:**
- [ ] Spotify OAuth works
- [ ] Deezer OAuth works
- [ ] No passwords stored by Cherry
- [ ] Connection status visible on homepage

### 2. Transfer Playlists — Deezer → Spotify (no size limit)
- Show all Deezer playlists for connected user
- Select a playlist and transfer it to Spotify
- Works for playlists of any size (1 to 1000+ tracks)
- Unfound tracks are clearly flagged in the summary
- Animated progress bar during transfer
- Created Spotify playlist keeps the same name

**Success criteria:**
- [ ] All Deezer playlists listed
- [ ] Transfer works for 1–1000+ tracks
- [ ] Unfound tracks shown clearly
- [ ] Progress bar visible
- [ ] Spotify playlist has the same name

### 3. Apple Music Import via XML file
- Show step-by-step instructions for exporting XML from Apple Music (Mac)
- Upload via drag & drop or file button
- Parse XML to list playlists + tracks
- Transfer to Spotify same way as Deezer

**Success criteria:**
- [ ] Clear instructions displayed
- [ ] File upload works (drag & drop + button)
- [ ] Playlists from XML listed and selectable
- [ ] Transfer to Spotify works

### 4. Transfer History
- Save each completed transfer: name, date, source, track counts
- History page showing all past transfers
- Persists between sessions (Supabase)

**Success criteria:**
- [ ] Each transfer saved with: name, date, source, transferred count, failed count
- [ ] History visible on dedicated page
- [ ] Persists after browser close

## NOT in MVP
| Feature | Reason |
|---------|--------|
| Auto-sync between platforms | High complexity, not needed |
| Spotify → Deezer transfer | Léa's need is one-way only |
| User accounts / login | Unnecessary for personal use |

## Success Metrics
| Metric | Target |
|--------|--------|
| End-to-end successful transfer | 100% of tested playlists |
| Track match rate (title + artist) | > 85% |
| Transfer time for 500 tracks | < 5 minutes |
| Blocking errors at launch | 0 |
| Léa completes transfer without help | ✅ |

## UI/UX Requirements
- **Vibe:** Rose 🌸 — doux, fun, moderne
- **Colors:** Primary `#E91E8C`, light `#FCE4F1`, mid `#F8BBD9`
- **Font:** Inter or Poppins
- **Corners:** `border-radius: 16px` everywhere
- **Language:** French
- **Responsive:** Mobile + desktop
- **Performance:** Page load < 3 seconds

## Pages
| Page | Purpose |
|------|---------|
| Homepage | Cherry logo + connect Deezer/Spotify buttons + connection status |
| My Playlists | List of Deezer playlists + Apple Music tab |
| Transfer in Progress | Animated progress bar + encouraging message |
| Confirmation | Transfer summary (X transferred, Y not found) |
| History | List of all past transfers |

## Timeline
- **Total:** ~3–5 days
- Day 1: Setup (accounts, API keys, Lovable project)
- Day 2: OAuth (Spotify + Deezer)
- Day 3: Deezer → Spotify transfer
- Day 4: Apple Music XML + History
- Day 5: Polish, mobile testing, deploy
