# ToxEcology Product Scanner

A mobile-friendly barcode scanner that looks up products against your Airtable database and external sources (Open Food Facts, Open Beauty Facts).

## Features

- 📷 Camera barcode scanning (on supported browsers)
- ⌨️ Manual barcode entry
- 🔍 Searches YOUR Airtable `products_exposures` table first
- 🌐 Falls back to Open Food Facts / Open Beauty Facts
- 🧪 Matches ingredients against your `ingredient_hazards` table
- ➕ Users can submit new products (writes directly to Airtable)
- 📊 Shows hazard scores and domain breakdowns

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│  Scanner App    │ ──────► │ Netlify Function │ ──────► │  Your Airtable      │
│  (index.html)   │         │ (secure API key) │         │  HAQ Ontology Base  │
└─────────────────┘         └──────────────────┘         └─────────────────────┘
```

**Netlify Functions:**
- `lookup-product.js` — Searches products_exposures by barcode
- `lookup-ingredients.js` — Matches ingredients against ingredient_hazards
- `add-product.js` — Writes new products (like your scraper does)

## Setup Instructions

### 1. Create GitHub Repository

1. Go to [github.com](https://github.com) → New repository
2. Name it `toxecology-scanner`
3. Make it **Public**
4. Don't add README (we have one)

### 2. Upload Files

Upload these files to your repo:
```
toxecology-scanner/
├── index.html
├── netlify.toml
├── README.md
└── netlify/
    └── functions/
        ├── lookup-product.js
        ├── lookup-ingredients.js
        └── add-product.js
```

### 3. Deploy to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub
4. Select your `toxecology-scanner` repository
5. Leave build settings as-is (Netlify auto-detects)
6. Click **Deploy**

### 4. Add Environment Variables (CRITICAL!)

In Netlify:
1. Go to **Site settings** → **Environment variables**
2. Add these variables:

| Key | Value |
|-----|-------|
| `AIRTABLE_API_KEY` | Your Personal Access Token (same as your scraper uses) |
| `AIRTABLE_BASE_ID` | Your HAQ Ontology base ID (starts with `app...`) |

3. Click **Save**
4. Go to **Deploys** → **Trigger deploy** → **Deploy site**

### 5. Test It!

Your scanner will be live at: `https://your-site-name.netlify.app`

Test with these barcodes:
- `3017624010701` — Nutella
- `5000159407236` — Coca-Cola
- `3600523735099` — Garnier

## How It Works

### Lookup Flow

1. **Check Airtable first** — Searches `products_exposures.upc_barcode`
2. **If not found → Open Food Facts** — Free food database
3. **If not found → Open Beauty Facts** — Free personal care database
4. **If found externally** — Matches ingredients against your `ingredient_hazards`
5. **If nothing found** — Shows "Add Product" form

### Add Product Flow

When a user submits a new product:

1. Validates required fields (name, brand, category)
2. Checks for duplicates (by barcode AND by name+brand)
3. Generates product_id (e.g., `CP-SCAN-12345`)
4. Matches ingredients against `ingredient_hazards`
5. Links to `ingredient_domain_map` records
6. Links to `knob_product_hazard` (for formula calculations)
7. Creates record in `products_exposures`

**Result:** New products appear in your Airtable with the same structure as your scraper creates!

## Table Field Mappings

### products_exposures (matches your scraper)

| Field | Source |
|-------|--------|
| `product_id` | Generated: `FD-SCAN-XXXXX` or `CP-SCAN-XXXXX` |
| `product_name` | User input |
| `brand` | User input |
| `category` | User selection |
| `sub_category` | User selection |
| `upc_barcode` | Scanned barcode |
| `ingredient_list_raw` | User input |
| `Ingredients_link` | Matched against ingredient_hazards |
| `ingredient_domain_map` | Linked from matched ingredients |
| `knob_product_hazard` | Linked to product_hazard_v0 |
| `source` | "ToxEcology Scanner" |
| `date_added` | Today's date |

## Customization

### Change the domain

In Netlify: **Site settings** → **Domain management** → **Add custom domain**

### Modify styling

Edit `index.html` — all CSS is inline using your ToxEcology design tokens.

### Add more external sources

Edit `index.html` — add functions like `lookupUpcItemDb()` following the pattern.

## Troubleshooting

**"Server configuration error"**
→ Environment variables not set in Netlify

**Products not saving**
→ Check your AIRTABLE_API_KEY has write access to the base

**Ingredients not matching**
→ Ingredient names must match what's in your ingredient_hazards table

**Camera not working**
→ HTTPS required, and browser must support BarcodeDetector API

## Related Files

- `toxecology_scraper.py` — Your product scraper (same field mappings)
- `ToxEcology_ERD_v5_Summary.md` — Database schema documentation
