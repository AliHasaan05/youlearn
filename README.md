# You Learn

A multi-page dashboard for browsing and tracking YouTube playlist courses. Pure
HTML, CSS, and vanilla JavaScript — no build step, no dependencies.

## Pages

| File | Category |
| --- | --- |
| `index.html` | All Courses |
| `development.html` | Programming & Software Development |
| `ai.html` | Artificial Intelligence & Data Science |
| `csa.html` | Computer Systems & Architecture |
| `dbms.html` | Database & Data Management |
| `nc.html` | Networking & Cybersecurity |
| `wamt.html` | Web & Mobile Technologies |
| `et.html` | Emerging Technologies |
| `mt.html` | Mathematics & Theory |
| `contact.html` | Contact form |

Shared assets: `style.css` (theme + layout) and `script.js` (behaviour).

## How it works

`script.js` progressively enhances the simple source markup. On load it:

1. Removes the raw nav links and course `<div>`s.
2. Builds the navbar (brand, search, theme toggle), a category sidebar with the
   active page highlighted, a stats row with a CSS donut chart, the course grid,
   and a sticky footer.
3. Turns each course block into a card with a thumbnail (or initials fallback),
   channel/meta info, a video count, and a progress bar.

### Dynamic playlist button

Each card's primary button reflects saved state:

- **▶ Start Playlist** — not started yet.
- **▶ Continue Learning** — started (clicking the button opens the playlist and
  flips to this state).
- **✓ Review Playlist** — completed.

### Manual progress controls

Each card also has small tools:

- **+1 video** — increments watched count (auto-completes at 100%).
- **Mark complete / Mark incomplete** — toggles completion.
- **Reset** — clears the course's progress.

Progress is stored in `localStorage` under `youlearn.progress.v1`, keyed by a
slug of the course title, so state is shared across the category pages and the
"All Courses" page. Theme preference is stored under `youlearn.theme`.

## Running

It's a static site. Open `index.html` directly, or serve the folder:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Customising

- **Real thumbnails:** set the `src` on each course `<img>` (e.g. a YouTube
  thumbnail URL). Cards pick it up automatically; otherwise a colored initials
  tile is shown.
- **Playlist links:** replace `YOUR_PLAYLIST_ID` in each card's `<a href>`.
- **Categories / nav:** edit the `NAV_ITEMS` array near the top of `script.js`.
