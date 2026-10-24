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
```

The card is generated in a dark and a light variant, `<picture>` switches them according to the viewer's GitHub theme.

## Designs

Every design shows stars, commits (all time), current and longest streak, repositories, pull requests, contributed to and top languages, each in its own way. All use the [Tokyo Night](https://github.com/folke/tokyonight.nvim) palette and an embedded JetBrains Mono Nerd Font subset, so they look the same for every visitor.

- `niri` (default): waybar with weekdays as workspaces, tiled windows with a contribution heatmap, stats with icons and a language donut
- `btop`: system monitor boxes with a dotted weekly activity graph, stat meters, languages as a process table and a weekday graph
- `fetch`: fastfetch output with the Arch logo, languages as the color blocks
- `pacman`: `pacman -Qi` package info, languages installed with ILoveCandy progress bars

Run `npm run dev` and open `preview/index.html` to compare them.

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `token` | `github.token` | Token used to read stats |
| `username` | repo owner | Login to generate cards for |
| `design` | `niri` | `niri`, `btop`, `fetch` or `pacman` |
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
npm run dev                      # all designs for the gh-authenticated user, open preview/index.html
npm run dev -- torvalds          # any other user
npm run dev -- --design btop     # single design
npm run dev -- --cached          # reuse preview/stats.json, no API calls
python3 scripts/build-fonts.py   # regenerate src/fonts.ts (needs fonttools + brotli)
npm run build            # bundle into dist/, commit it together with sources
```

Uses `gh auth token` by default, or set `RPK_TOKEN`.
