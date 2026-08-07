# atthismoment.show

The website for At This Moment, a juried exhibition of painting and collage by
New England artists, run by the LexArt Painting Studio Group. Held every two
years. Each edition's gallery stays up permanently.

To update the site, read [AUTHORING.md](AUTHORING.md) instead.

## Running it

Needs Node 22.12 or newer. `nvm use` picks it up from `.nvmrc`.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # writes dist/
npm run preview  # serve the built dist/
```

## Layout

Astro, building to static HTML.

```
content/          everything an editor touches. See AUTHORING.md
src/
  lib/content.js  reads content/ and hands the pages plain objects
  layouts/        page shell, header, footer
  components/     Nav, ShowNav, Hang
  pages/          routes
  styles/         global.css, the whole design system
```

`src/lib/content.js` is the only place that knows the shape of `content/`. It
reads through `import.meta.glob`, so Vite watches those files and the dev
server reloads on edit even though they sit outside `src/`.

Content problems throw `AuthoringError`. Its messages are for whoever is
editing the YAML and CSV: which file, which line, what to do. Keep that
register if you add validation.

## Routes

Generated from the folders in `content/shows/`.

```
/galleries/2026/                 about the show
/galleries/2026/gallery/         the hang
/galleries/2026/artists/         artists in this show, with their work
/galleries/2026/juror/           juror profile
/galleries/2026/awards/          grouped by the award column in the CSV
/galleries/2026/artist/<slug>/   one artist
```

Artists sit under `/artist/` so an artist slugged `awards` or `juror` cannot
collide with a section page. `ShowNav.astro` drops sections with no content.

Artwork is resized at build time by `sharp`, which runs in Cloudflare's
builder as well as locally.

## Gotchas

**`.prose` must stay a child of `.wrap`, never both on one element.** `.wrap`
sets auto margins; `.prose` narrows to the text measure. Together, the auto
margins centre the narrow measure and knock it out of line with the heading.

**The lightbox panel must not resize during PhotoSwipe's opening animation.**
`updateSize()` mid-animation leaves the artwork sized for the full viewport and
half-buried under the panel. The `opened` flag in `Hang.astro` guards it.
`change` fires during the opening animation too.

**The gallery centreline depends on a fixed caption height.** Works are sized
from `width_in` and `height_in` and aligned with `align-items: center` on a
wrapping flex row. Variable caption heights break the alignment.

## Deploying

Cloudflare Workers, via Workers Builds.

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Non-production branch deploy command | `npx wrangler versions upload` (default) |
| Build variable | `NODE_VERSION` = `22` |

Set `NODE_VERSION` explicitly. Cloudflare's build image does not document
reading `.nvmrc`.

Tick **Builds for non-production branches** under Settings > Build > Branch
control. Each branch then gets a preview URL, posted to its pull request.

`wrangler.jsonc` names the Worker and points at `dist/`. It is on both
branches with the same name, so previews attach to the same Worker. No Worker
script and no Astro adapter: the site is prerendered.

Wrangler is not a dependency. It pulls in miniflare and undici, and with them
three advisories with no non-breaking fix. Cloudflare's builder supplies it.

Workers Builds uses one build configuration for every branch, so `main` carries
a `package.json` whose `build` script copies its two files into `dist/`.
