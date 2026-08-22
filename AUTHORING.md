# Running atthismoment.show

This file is for whoever keeps the site up to date. You do not need to know
how the site is built to do that. If you are a developer looking for the
technical setup, see README.md.

## Editing the site

Everything you edit lives in the `content` folder. Nothing else.

```
content/
  site.yml                    site title, footer contacts, what the home page leads with
  pages/
    about.md                  the About page
    call-for-art.md           the Call for Art page
  shows/
    2026/
      show.yml                dates, juror, venue for the 2026 show
      artworks.csv            one row per artwork
      images/                 the promo graphic and the artwork photos
    EXAMPLE-artworks.csv      a filled-in sample to copy the format from (don't edit)
```

The pages that list things build themselves from those files. The navigation
menu, the galleries index, and the alphabetical artist list are all generated.

## Creating a show

Every show gets five pages of its own, with a bar across the top to move
between them:

| Page | Where it comes from |
| --- | --- |
| About the show | the statement, dates, and venue in `show.yml` |
| Gallery | every row of `artworks.csv` |
| Artists | grouped from `artworks.csv`, one entry per artist with their work |
| Juror | the `juror` block in `show.yml` |
| Awards | every row of `artworks.csv` that has something in the `award` column |

Only the first two always appear. Artists shows up once the spreadsheet has
rows in it, Juror once the show has a juror name, and Awards once at least one
row has an award. A show part-way through being set up does not advertise
pages that are still empty.

## Addresses

You need these when you write a link, either in the `featured` block of
`site.yml` or in the middle of a Markdown page. Substitute the year.

```
/                                the home page
/about/
/call-for-art/
/galleries/                      every show
/galleries/2026/                 about the 2026 show
/galleries/2026/gallery/         the artwork
/galleries/2026/artists/         artists in the 2026 show
/galleries/2026/juror/
/galleries/2026/awards/
/artists/                        everyone, every show, alphabetical
```

Individual artists live at `/galleries/2026/artist/ada-example/`, but you will
rarely need to write one out. The site links to them for you from the gallery
captions, the artist list, and the panel beside each enlarged image.

Two levels of navigation get you around. The bar at the top of every page
takes you to a show; the second bar, which appears once you are inside one,
moves between that show's five pages.

## Changing what the home page leads with

The home page shows one promo graphic, a short paragraph, and two or three
links. All four come from the `featured` block in `content/site.yml`:

```yaml
featured:
  show: 2026
  eyebrow: Opening August 8
  headline: The 2026 exhibition opens this month
  brief: >
    Recent work by painters from across New England, selected by juror
    Deborah Krieger...
  links:
    - text: Visit the online gallery
      href: /galleries/2026/gallery/
      note: Opens August 22
```

`show` decides which promo graphic appears. It has to match a folder name
under `content/shows/`.

When the 2028 call opens, change `show: 2026` to `show: 2028` and rewrite the
eyebrow, headline, brief, and links. That is the entire seasonal changeover.
Nothing else on the site has to move.

Keep the links list to two or three. They are the things you most want a
visitor to do right now, not a second navigation bar.

## Starting a new show

Copy the whole `content/shows/2026` folder to `content/shows/2028`, then:

1. Open `show.yml` and change the year, the dates, the juror, and the
   statement.
2. Delete the old artwork photos from `images/` and put the new promo
   graphic in. Name it `promo.webp`, or name it whatever you like and change
   the `promo:` line to match.
3. Empty `artworks.csv` down to its first line, the one with the column
   names. Fill it in when the accepted work is known.

Open a pull request on GitHub, and after a few minutes the Cloudflare bot will comment with a preview link. In this preview, the 2028 show will already have its own set of pages, its
own entry in the Online Galleries menu, and a card on the galleries index. It
will be labelled "Upcoming" until its opening date passes, then "On view",
then "Past".

Dates go in as `YYYY-MM-DD`. Leave a line out if it does not apply.

## The juror

The `juror` block in the show's `show.yml`:

```yaml
juror:
  name: Deborah Krieger
  title: Outreach and Research Manager, Louis Stern Fine Arts
  url: https://www.i-on-the-arts.com/p/about.html
  bio: >
    Several paragraphs about the juror. Leave a blank line between
    paragraphs.
  image: krieger.jpg
```

Only `name` is needed. With just a name you still get a juror page, it is
simply short. Adding `bio` fills it out, and `image` puts a portrait beside
it, naming a file in the same `images/` folder as everything else.

## Awards

There is no separate list to keep. Put the award name in the `award` column
of `artworks.csv` on the row that won it, and the Awards page builds itself,
grouped by award name in the order the awards first appear in the spreadsheet.
Put the top prize nearer the top of the file and it will lead the page.

Write the name exactly the same way on every row it applies to. "Juror's
Award" and "Jurors Award" become two separate groups.

## Adding the artwork

`artworks.csv` is a spreadsheet. Open it in Excel, Numbers, or Google Sheets,
or export it straight out of the submission system. One row per artwork. An
artist with three accepted pieces gets three rows.

| Column | Needed | Notes |
| --- | --- | --- |
| `artist` | yes | Exactly as it should be printed |
| `title` | yes | |
| `image` | yes | The filename in this show's `images/` folder |
| `artist_location` | | "Somerville, MA" |
| `artist_website` | | Full address, MUST start with https:// |
| `artist_bio` | | Only needs filling in on one row per artist |
| `year` | | Year the work was made |
| `medium` | | "Oil and cold wax on panel" |
| `width_in` | | Width in inches, as a number |
| `height_in` | | Height in inches, as a number |
| `dimensions` | | Only if you want something other than "24 × 18 in" |
| `award` | | "Juror's Award". Leave blank for most rows |
| `description` | | A longer note about the work. See below |

**`width_in` and `height_in`** decide how large each work appears in the
gallery. Pieces are shown at their real size relative to one another, so a 
9 x 12 panel looks small next to a 60 x 48 canvas. Leave these columns
blank if you want all artworks scaled to the same height, and fill in
the dimensions column (as text) instead.

**`artist_bio`** only needs to be on one row. If an artist has three pieces,
put the bio on any one of the three and leave the other two blank. A
spreadsheet that repeats it on every row works too.

**`description`** is for the longer note about a piece, how it was made, what
it is about. It can run to several paragraphs. Leave a blank line between
paragraphs inside the cell, using whatever your spreadsheet uses for a line
break within a cell rather than a new row (Alt+Enter on Windows,
Ctrl+Option+Enter on a Mac). Works that have a description get an "About this
work" link in the gallery, and the text opens in a panel beside the enlarged
image, along with a link through to the artist. Works without one are fine.
Their panel is still there behind the Info button, it just holds the label and
the artist link rather than opening on its own.

`EXAMPLE-artworks.csv` in the shows folder is a filled-in sample. It is not
published, it is only there to copy the format from.

## Artwork photographs

Put them in the show's `images/` folder and name them in the `image` column.

Do not resize or compress them first. The site does that during the build,
and it makes several sizes of each one so phones do not download a photograph
meant for a desktop screen. Send artists a request for the largest file they
have. A 4000 pixel wide JPEG is ideal and an 8MB file is not a problem.

Filenames should have no spaces. `ada-example-low-tide.jpg` is easier to
live with than `Ada Example - Low Tide (final).jpg`.

## Opening and closing the call for art

`content/pages/call-for-art.md` has a `status` line near the top:

```yaml
status: closed
```

Set it to `open` while submissions are being accepted. The page shows the
apply and guidelines buttons. Set it to `closed` between shows and the page
shows the notice from `closed_notice` instead, keeping everything else as
reference for next time.

To open the 2028 call: set `status: open`, change `show: 2026` to
`show: 2028`, update `guidelines_url`, `entry_url`, and `entry_fee`, and make
sure the dates in `content/shows/2028/show.yml` are right. The timeline at the
bottom of the page and the deadline in the sidebar both read from there.

The `at_a_glance` list further down adds rows to the sidebar. Status,
deadline, entry fee, juror, and venue are already filled in from `show.yml`,
so use it for anything else worth putting in front of an entrant.

## Editing About

`content/pages/about.md`. The text is ordinary Markdown. `**bold**`,
`## a heading`, `[link text](https://address)`.

The `facts` list in the frontmatter fills the panel beside the text. The list
of past editions underneath it is built from the shows folder and needs no
maintenance.

## When something goes wrong

The build stops and tells you what to fix. A misspelled filename gives you:

```
content/shows/2028/show.yml refers to the image "promo.jpg", but that file
is not in content/shows/2028/images/

These images are in that folder:
  promo.webp

Check the spelling, including the .jpg / .png ending.
```

A bad spreadsheet row names the line as your spreadsheet numbers it:

```
content/shows/2028/artworks.csv line 2 has no "title".
Every row needs at least an artist, a title, and an image filename.
```

Underneath these you will see a stack trace, a wall of file paths and line
numbers from inside the site's machinery. Ignore it. The useful message is
always the first thing.

The two most common problems:

- **A colon inside a YAML value.** `headline: At This Moment: 2028` breaks.
  Wrap it in quotes: `headline: "At This Moment: 2028"`.
- **A comma inside a CSV value.** Fine if the cell is wrapped in double
  quotes, which spreadsheet programs do automatically on export. If you edit
  the file in a plain text editor, do it yourself.

## Publishing

The site rebuilds itself. Commit a change to the `main` branch, on
github.com or from your own machine, and Cloudflare rebuilds and publishes
within a minute or two. 