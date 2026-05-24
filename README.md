# NOHEX GitHub Pages + VPS API Setup

This setup is for:

- `GitHub Pages` = frontend/static site
- `VPS` = backend API, database, uploads, Telegram worker

The frontend can be hosted on GitHub.
The backend still runs on the VPS.

## Upload To GitHub

Upload these frontend/static parts:

- `index.html`
- route folders:
  - `about-us/`
  - `aml-policy/`
  - `bug-bounty/`
  - `card/`
  - `channel-verification/`
  - `cookies-policy/`
  - `corporate-identity/`
  - `earn/`
  - `fees/`
  - `forgot-password/`
  - `institutional-services/`
  - `law/`
  - `markets/`
  - `privacy-policy/`
  - `profile/`
  - `regulatory/`
  - `risk/`
  - `signin/`
  - `signup/`
  - `swap/`
  - `token-listing/`
  - `tools/`
  - `tournament/`
  - `treatment/`
  - `user-agreement/`
- `assets/`
- `clean/`
- `fonts/`
- `localized/`
- `source/`
- `README.md`

## Do Not Upload To GitHub

Keep these only on the VPS or local backup:

- `backend/`
- `.env`
- `telegram_bot_worker.py`
- `serve.py`
- database files:
  - `backend/data/app.db`
  - `backend/data/app.db-shm`
  - `backend/data/app.db-wal`
- uploaded/runtime files:
  - `backend/data/profile_photos/`
  - `backend/data/support_uploads/`
  - `backend/data/verification_uploads/`
  - `backend/data/verification_uploads_level2/`
- temp/runtime files:
  - `__pycache__/`
  - `.tmp_trading.html`
  - `.tmp_home.html`
  - `.tmp_card_tr.html`
  - empty local junk files like `Margin` or `py`

## Important Frontend Note

This repo now includes:

- `clean/assets/`

That folder exists so GitHub Pages can serve the same `/clean/assets/...` paths without `serve.py`.

## API Base

By default, the frontend resolves the API like this:

- local `127.0.0.1` or `localhost`:
  - same/local origin behavior
- live site on `nohex.exchange`:
  - `https://api.nohex.exchange`

If you want to force a specific API URL, edit:

- [assets/js/runtime-config.js](C:/Users/White/Desktop/saturn/assets/js/runtime-config.js)

Example:

```js
window.__API_BASE__ = "https://api.nohex.exchange";
```

If you change that file, also copy the same value into:

- `clean/assets/js/runtime-config.js`

or just recopy `assets/` into `clean/assets/`.

## DNS

Point your domain to:

- the GitHub Pages frontend for the main site domain
- the VPS IP for the API subdomain

Example:

- `nohex.exchange` -> GitHub Pages
- `www.nohex.exchange` -> GitHub Pages
- `api.nohex.exchange` -> VPS IP

Do not create a DNS record for `/api`.
Only the `api` subdomain needs to point to the VPS.

## VPS Files Needed

The VPS still needs:

- `backend/api_server.py`
- `telegram_bot_worker.py`
- `.env`
- `backend/data/`

## VPS Processes To Run

Run these on the VPS:

```bash
python3 backend/api_server.py
python3 telegram_bot_worker.py
```

You do not need `serve.py` in the GitHub Pages setup.

## Caddyfile For API Only

Use Caddy on the VPS for the API subdomain:

```caddy
api.nohex.exchange {
    encode gzip
    reverse_proxy 127.0.0.1:9000
}
```

That means:

- `https://api.nohex.exchange/api/*` -> `backend/api_server.py`

## Backend Env Notes

Typical live backend values:

```env
APP_HOST=127.0.0.1
APP_PORT=9000
COOKIE_SECURE=1
```

`APP_HOST=127.0.0.1` is fine when Caddy is reverse-proxying locally on the VPS.

## Telegram Worker

Run on the VPS:

```bash
python3 telegram_bot_worker.py
```

It still needs:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_CHAT_ID`

## Local Testing

For local testing:

```bash
py -3 backend/api_server.py
py -3 telegram_bot_worker.py
```

If you want to preview the frontend locally without GitHub Pages:

```bash
py -3 serve.py
```

Then open:

- `http://127.0.0.1:8000/`
