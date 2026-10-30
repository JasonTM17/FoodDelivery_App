# Production web showcase

These 16 JPEGs and two GIFs were captured on **30 October 2026** from the four live Next.js applications. They are distinct from older local/Flutter media in `docs/screenshots/` and `docs/media/`.

| Role | Production origin | Captured views |
| --- | --- | --- |
| Customer | https://foodflow-customer.vercel.app | Discovery, menu, cart, checkout, success, tracking and390px order details |
| Restaurant | https://foodflow-restaurant-ochre.vercel.app | Overview, menu and order queue |
| Admin | https://foodflow-admin-two.vercel.app | Overview and order management |
| Driver | https://foodflow-driver.vercel.app | Dashboard, trip history, earnings and390px dashboard |

The browser screenshot API generated JPEGs. Desktop captures used existing viewports with observed widths1280/1440; do not infer identical source dimensions. The two mobile images were recaptured using a390×844 screenshot clip after per-tab emulation and DOM verification of innerWidth390 and scrollWidth390; overrides were reset afterward. The later Customer mobile capture shows the synthetic order automatically cancelled because the restaurant did not accept it in time. Earlier desktop/GIF captures retain the state observed when captured.

`customer-ordering.gif` contains six real frames; `operations-tour.gif` contains eight. Both are captioned keyframe walkthroughs with edited pacing, not continuous recordings or latency benchmarks. Encode from the retained JPEGs with Pillow:

```sh
python infra/scripts/build-showcase-media.py
```

The helper reads only local media. It does not browse, authenticate or create orders. [manifest.json](production-web/manifest.json) records file dimensions, frame counts, bytes and SHA-256 hashes.

Screenshots use synthetic accounts, addresses, orders, ratings, prices and earnings. They do not substantiate real brand offerings, transactions, endorsements or delivery. No password, access token, private key or actual identity document is included. The newer order is explicitly marked synthetic in its note; it is retained as a persistence fixture. Driver availability was observed, not toggled for the capture. Current-state verification is documented in the [four-web production report](../production-web-check.md).

Media timestamps do not imply that every app shares one source revision. The dated report identifies API/web revisions and the later Admin/Restaurant bootstrap repair separately. Regenerate a screenshot after changing its represented feature; retain honest capture provenance.
