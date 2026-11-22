# tesseract

The **Tesseract** investor site explains how the prototype tests AI skills in an isolated Linux environment and reports observed behavior and gaps in evidence.

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
