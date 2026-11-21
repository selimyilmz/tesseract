# tesseract

Technical showcase and product dossier for **tesseract** — a Docker-independent Linux kernel containment cage and fail-closed behavioral evidence engine for autonomous AI agents and skills.

- **Live Site:** https://selimyilmz.github.io/tesseract/
- **Walkthrough Requests:** Open an issue in this repository to schedule a live technical walkthrough and inspect the containment cage, file sensor, and HTTPS sinkhole in action.

## Local Preview

```bash
python -m http.server 8000 --bind 127.0.0.1 --directory site
```

## Verification

```bash
python scripts/check_contrast.py site/styles.css
node --check site/tesseract-plate.js
```
