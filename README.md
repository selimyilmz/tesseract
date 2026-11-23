# tesseract

The **Tesseract** investor site presents the trust workflow for AI agents and their components, alongside the controlled Linux execution prototype and its current validation scope.

- **Live Site:** https://selimyilmz.github.io/tesseract/
- **Walkthrough requests:** [Email the founder](mailto:selyilmaz26@ku.edu.tr?subject=Tesseract%20walkthrough).

## Local Preview

```bash
python -m http.server 8000 --bind 127.0.0.1 --directory site
```

## Verification

```bash
python scripts/check_contrast.py site/styles.css
node --check site/tesseract-plate.js
```
