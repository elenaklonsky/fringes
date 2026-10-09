# Biological Abundance · Anthrogen (web edition)

The scroll-driven web version of the Onto zine. So far it contains the cover and Section I, *Instruments of Abundance*, and ends on the Section II opener.

## Put it online with GitHub Pages

1. **Create a repository.** Sign in at github.com, then choose **New repository**. Give it a name (for example `anthrogen`) and click **Create repository**.
2. **Upload the files.** On the new repository page, click **uploading an existing file**. Drag in *everything inside this folder* (`index.html` and the `css`, `js`, `fonts` and `assets` folders), then click **Commit changes**. `index.html` must sit at the top level, not inside another folder.
3. **Turn on Pages.** Go to **Settings → Pages**. Under **Build and deployment**, set *Source* to **Deploy from a branch**, then pick **main** and **/ (root)**, and click **Save**.
4. **Open the site.** After about a minute it appears at `https://<your-username>.github.io/anthrogen/`.

To update the site later, upload the changed files the same way. They replace the old ones.

## What's in the folder

| Path | What it is |
|---|---|
| `index.html` | All the text and the structure of the page |
| `css/style.css` | Layout, type and colours. The colours sit at the top, under `:root` |
| `js/main.js` | The scroll scenes (GSAP ScrollTrigger, loaded from cdnjs) |
| `fonts/` | FK Roman Standard, Regular and Oblique |
| `assets/` | The cover and the Section I images (WebP) |

## How it behaves

- **Every animation follows the scroll.** Nothing plays on its own, and scrolling back reverses it.
- **Reduced motion.** If a reader has "reduce motion" switched on, or JavaScript is off, the same content shows as a still page in reading order.
- **Navigation.** The section label in the top-left opens a short menu. The thin progress line along the top appears when you hover near the top edge.

## Before going public

- **Font licence.** Check that the FK Roman Standard licence allows self-hosting on GitHub Pages. A public repository also makes the font files downloadable.
- **Image rights.** Confirm the image clearances cover web use.
