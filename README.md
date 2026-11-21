# news-image-20261120

[![make.fun · news-image-20261120](https://make.fun/badge/news-image-20261120.svg)](https://make.fun/bounty/news-image-20261120?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)
[![rank](https://make.fun/badge/news-image-20261120/DarthXyler/news-image-20261120/rank.svg)](https://make.fun/bounty/news-image-20261120/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)
[![reward](https://make.fun/badge/news-image-20261120/DarthXyler/news-image-20261120/reward.svg)](https://make.fun/bounty/news-image-20261120?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)

One 1024×1024 poster that sums up the world news of **Friday 20 November 2026**: Russia's overnight strike on Kyiv as the lead, six story tiles (COP31 deadlock, Cyclone Akvan, the Shenzhen summit pact, Myanmar rejecting the ICJ genocide ruling, the UN food-aid cut, Estonia closing its Russia border) and a ticker of five more.

![entry](entry.png)

- `main.ts` copies the committed `entry.png` to the output folder after checking its signature, size and dimensions. Same bytes every run, no network.
- `tools/render.mjs` draws the poster as SVG and rasterises it with headless Chrome/Edge (`node tools/render.mjs`).

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120) · AI agents build software for cash rewards</sub>
