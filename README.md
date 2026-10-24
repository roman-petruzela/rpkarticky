# rpkarticky

GitHub Action that generates stats and top languages cards as SVG and commits them into your profile repo. No server, no rate limits of shared instances.

## Usage

Add `.github/workflows/stats.yml` to your `<username>/<username>` repo:

```yaml
name: stats

on:
  schedule:
    - cron: "0 3 * * *"
  workflow_dispatch:

permissions:
  contents: write   # commit the SVGs
  actions: write    # keepalive

jobs:
  stats:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: roman-petruzela/rpkarticky@v1
```

Run it once manually (Actions → stats → Run workflow), then put the cards into your `README.md`:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="stats-dark.svg">
  <img src="stats-light.svg" alt="GitHub stats">
</picture>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="langs-dark.svg">
  <img src="langs-light.svg" alt="Most used languages">
</picture>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="activity-dark.svg">
  <img src="activity-light.svg" alt="Activity">
</picture>
```

Every card is generated in a dark and a light variant, `<picture>` switches them according to the viewer's GitHub theme.

## Cards

- `stats`: stars, commits in the last year, PRs, issues, repositories, repositories contributed to
- `langs`: top 6 languages across your own non-fork repos, by code size
- `activity`: current and longest streak, contributions in the last year, contributions per weekday

## Themes

- `tokyonight` (default): [Tokyo Night](https://github.com/folke/tokyonight.nvim) night and day palettes
- `terminal`: terminal window with a prompt, monospace font, Arch blue accent

### Private repos

The default token only sees public repos. To include private ones, create a classic PAT with the `repo` scope, save it as the `STATS_TOKEN` secret and pass it:

```yaml
      - uses: roman-petruzela/rpkarticky@v1
        with:
          token: ${{ secrets.STATS_TOKEN }}
```

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `token` | `github.token` | Token used to read stats |
| `username` | repo owner | Login to generate cards for |
| `theme` | `tokyonight` | `tokyonight` or `terminal` |
| `output-dir` | `.` | Where SVGs are written |
| `commit` | `true` | Commit and push SVGs when they change |
| `commit-message` | `chore: update stats cards` | Message of the update commit |
| `keepalive` | `true` | Re-enable the workflow on every run |
| `keepalive-token` | `github.token` | Token used for keepalive |

### Keepalive

GitHub disables scheduled workflows in public repos after 60 days without activity. Since a commit is only made when the stats change, a quiet profile would lose its schedule. With `keepalive` on, every run re-enables its own workflow through the API, which keeps the schedule alive without any commits. Needs `actions: write`.

## Development

```sh
npm install
npm run dev                             # all themes for the gh-authenticated user, open preview/index.html
npm run dev -- torvalds                 # any other user
npm run dev -- --theme terminal         # single theme
npm run build            # bundle into dist/, commit it together with sources
```

Uses `gh auth token` by default, or set `RPK_TOKEN`.
