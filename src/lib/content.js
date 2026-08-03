// Reads /content and hands the pages plain objects. Adding a show needs no
// changes here; see AUTHORING.md.
//
// import.meta.glob means Vite watches these files, so dev reloads on edit.

import { load as loadYaml, CORE_SCHEMA } from 'js-yaml';
import { parse as parseCsv } from 'csv-parse/sync';

const YAML_FILES = import.meta.glob('/content/**/*.yml', {
  query: '?raw',
  eager: true,
  import: 'default',
});

const CSV_FILES = import.meta.glob('/content/**/*.csv', {
  query: '?raw',
  eager: true,
  import: 'default',
});

const IMAGE_FILES = import.meta.glob('/content/**/images/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
});

// CORE_SCHEMA leaves 2026-08-08 as a string. Parsed as a Date it becomes UTC
// midnight and renders a day early anywhere west of Greenwich.
function readYaml(path) {
  const raw = YAML_FILES[path];
  if (raw === undefined) throw new AuthoringError(`Missing file: ${path.slice(1)}`);
  try {
    return loadYaml(raw, { schema: CORE_SCHEMA }) ?? {};
  } catch (err) {
    throw new AuthoringError(
      `${path.slice(1)} is not valid YAML.\n\n  ${err.message}\n\n` +
        `  Most YAML problems are a stray tab character, or a value containing\n` +
        `  a colon that needs to be wrapped in "quotes".`
    );
  }
}

export class AuthoringError extends Error {
  constructor(message) {
    super(`\n\n  ${message}\n`);
    this.name = 'Content problem';
  }
}

export function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatDate(iso, { withYear = true } = {}) {
  const parts = parseIso(iso);
  if (!parts) return null;
  const [y, m, d] = parts;
  return withYear ? `${MONTHS[m - 1]} ${d}, ${y}` : `${MONTHS[m - 1]} ${d}`;
}

export function formatDateRange(fromIso, toIso) {
  const from = parseIso(fromIso);
  const to = parseIso(toIso);
  if (!from) return null;
  if (!to) return formatDate(fromIso);
  const [fy, fm, fd] = from;
  const [ty, tm, td] = to;
  if (fy === ty && fm === tm) return `${MONTHS[fm - 1]} ${fd}–${td}, ${fy}`;
  if (fy === ty) return `${MONTHS[fm - 1]} ${fd} – ${MONTHS[tm - 1]} ${td}, ${fy}`;
  return `${formatDate(fromIso)} – ${formatDate(toIso)}`;
}

function parseIso(iso) {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isPast(iso) {
  const parts = parseIso(iso);
  if (!parts) return false;
  const now = new Date();
  const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
  for (let i = 0; i < 3; i++) {
    if (parts[i] !== today[i]) return parts[i] < today[i];
  }
  return false;
}

// Derived from show.yml dates, so it can't go stale the way a hand-set
// status field does.
function deriveStatus(dates = {}) {
  if (!dates.opens) return 'upcoming';
  if (!isPast(dates.opens)) return 'upcoming';
  if (dates.closes && isPast(dates.closes)) return 'past';
  return 'on-view';
}

function resolveImage(year, filename, context) {
  if (!filename) return null;
  const path = `/content/shows/${year}/images/${filename}`;
  const image = IMAGE_FILES[path];
  if (!image) {
    const available = Object.keys(IMAGE_FILES)
      .filter((p) => p.startsWith(`/content/shows/${year}/images/`))
      .map((p) => '    ' + p.split('/').pop())
      .sort();
    throw new AuthoringError(
      `${context} refers to the image "${filename}", but that file is not in\n` +
        `  content/shows/${year}/images/\n\n` +
        (available.length
          ? `  These images are in that folder:\n${available.join('\n')}\n\n` +
            `  Check the spelling, including the .jpg / .png ending.`
          : `  That folder has no images in it yet. Add the image file, then rebuild.`)
    );
  }
  return image;
}

export function getSite() {
  const site = readYaml('/content/site.yml');
  if (!site.featured?.show) {
    throw new AuthoringError(
      `content/site.yml needs a featured.show value naming the show to put on\n` +
        `  the home page, for example:\n\n    featured:\n      show: 2026`
    );
  }
  return site;
}

const REQUIRED_ARTWORK_COLUMNS = ['artist', 'title', 'image'];

function readArtworks(year) {
  const path = `/content/shows/${year}/artworks.csv`;
  const raw = CSV_FILES[path];
  if (raw === undefined) return [];

  let rows;
  try {
    rows = parseCsv(raw, {
      columns: (header) => header.map((h) => h.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch (err) {
    throw new AuthoringError(
      `content/shows/${year}/artworks.csv could not be read.\n\n  ${err.message}\n\n` +
        `  If you edited it by hand, a value containing a comma must be wrapped\n` +
        `  in "double quotes". Re-exporting from a spreadsheet fixes most issues.`
    );
  }

  return rows.map((row, index) => {
    // +2 because row 1 is the header and spreadsheets count from 1.
    const line = index + 2;
    const where = `content/shows/${year}/artworks.csv line ${line}`;

    for (const column of REQUIRED_ARTWORK_COLUMNS) {
      if (!row[column]) {
        throw new AuthoringError(
          `${where} has no "${column}".\n\n` +
            `  Every row needs at least an artist, a title, and an image filename.`
        );
      }
    }

    const width = Number(row.width_in) || null;
    const height = Number(row.height_in) || null;

    return {
      artist: row.artist,
      artistSlug: slugify(row.artist),
      showYear: year,
      title: row.title,
      year: row.year || null,
      medium: row.medium || null,
      award: row.award || null,
      // Long-form note; blank lines become paragraphs in the lightbox.
      description: row.description || null,
      width,
      height,
      dimensions: row.dimensions || (width && height ? `${width} × ${height} in` : null),
      image: resolveImage(year, row.image, where),
      // Kept for the lightbox caption and alt text.
      _bio: row.artist_bio || '',
      _location: row.artist_location || '',
      _website: row.artist_website || '',
    };
  });
}

// First non-empty bio/location/website wins, so the CSV can repeat them on
// every row for an artist or fill them in on just one.
function groupArtists(artworks, year) {
  const bySlug = new Map();
  for (const work of artworks) {
    let artist = bySlug.get(work.artistSlug);
    if (!artist) {
      artist = {
        name: work.artist,
        slug: work.artistSlug,
        bio: '',
        location: '',
        website: '',
        showYear: year,
        // Under /artist/ so an artist slugged "awards" or "juror" can't
        // collide with a section page.
        url: `/galleries/${year}/artist/${work.artistSlug}/`,
        artworks: [],
      };
      bySlug.set(work.artistSlug, artist);
    }
    artist.bio ||= work._bio;
    artist.location ||= work._location;
    artist.website ||= work._website;
    artist.artworks.push(work);
  }
  return [...bySlug.values()].sort(byName);
}

export function byName(a, b) {
  return sortKey(a.name).localeCompare(sortKey(b.name), 'en');
}

function sortKey(name) {
  const parts = String(name).trim().split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return `${last} ${parts.slice(0, -1).join(' ')}`.toLowerCase();
}

export function getShows() {
  const years = Object.keys(YAML_FILES)
    .map((path) => /^\/content\/shows\/([^/]+)\/show\.yml$/.exec(path)?.[1])
    .filter(Boolean)
    .sort()
    .reverse();

  return years.map((year) => {
    const show = readYaml(`/content/shows/${year}/show.yml`);
    const artworks = readArtworks(year);
    const dates = show.dates ?? {};

    return {
      ...show,
      year,
      slug: year,
      url: `/galleries/${year}/`,
      dates,
      status: deriveStatus(dates),
      runsOn: formatDateRange(dates.opens, dates.closes),
      promoImage: show.promo ? resolveImage(year, show.promo, `content/shows/${year}/show.yml`) : null,
      jurorImage: show.juror?.image
        ? resolveImage(year, show.juror.image, `content/shows/${year}/show.yml`)
        : null,
      artworks,
      artists: groupArtists(artworks, year),
      awards: groupAwards(artworks),
      // The online gallery is only meant to be public from this date.
      galleryOpen: !dates.online_gallery_opens || isPast(dates.online_gallery_opens),
    };
  });
}

// Award names come from the CSV rather than a fixed list, so a show can
// invent its own. Ordered by first appearance, which puts the top prize
// first as long as the spreadsheet is in a sensible order.
function groupAwards(artworks) {
  const byName = new Map();
  for (const work of artworks) {
    if (!work.award) continue;
    if (!byName.has(work.award)) byName.set(work.award, []);
    byName.get(work.award).push(work);
  }
  return [...byName.entries()].map(([name, works]) => ({ name, works }));
}

export function getShow(year) {
  const show = getShows().find((s) => s.year === String(year));
  if (!show) {
    throw new AuthoringError(
      `No show folder found for "${year}".\n\n` +
        `  content/site.yml points the home page at this show, but there is no\n` +
        `  content/shows/${year}/show.yml file.`
    );
  }
  return show;
}

// One entry per artist per show, which is why the index links into a
// particular year rather than to one artist page.
export function getAllArtists() {
  const all = getShows().flatMap((show) =>
    show.artists.map((artist) => ({ ...artist, showTitle: show.title, showYear: show.year }))
  );
  return all.sort((a, b) => byName(a, b) || b.showYear.localeCompare(a.showYear));
}

export function groupByLetter(artists) {
  const groups = new Map();
  for (const artist of artists) {
    const letter = sortKey(artist.name).charAt(0).toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : '#';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(artist);
  }
  return [...groups.entries()].map(([letter, entries]) => ({ letter, artists: entries }));
}

const PAGE_FILES = import.meta.glob('/content/pages/*.md', { eager: true });

export function getPage(name) {
  const page = PAGE_FILES[`/content/pages/${name}.md`];
  if (!page) {
    const available = Object.keys(PAGE_FILES).map((p) => '    ' + p.split('/').pop());
    throw new AuthoringError(
      `There is no content/pages/${name}.md file.\n\n` +
        `  These pages exist:\n${available.sort().join('\n')}`
    );
  }
  return { ...page.frontmatter, Content: page.Content };
}

export function hasPassed(iso) {
  return isPast(iso);
}
