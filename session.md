# KECHENLAB Project Session

## Current State

- Static bilingual product website in `H:\KECHENLAB.com`.
- Chinese page: `index.html`.
- English page: `en.html`.
- Shared styles: `styles.css`.
- Shared frontend behavior: `script.js`.
- Inquiry endpoint: `api/inquiry.php`.

## Main Page Updates

- Chinese hero title changed to `KECHENLAB 科辰实验设备产品专家`.
- Chinese `<title>` and meta description also updated from product portal wording to product expert wording.
- Product Focus section now has an automatic horizontal marquee under the intro text.
- Marquee uses product cutout images from `assets/product-cutouts/`.
- Marquee moves from left to right, pauses on hover, and has reduced-motion fallback.

## Product Image Work

- Source images are under `assets/科辰资料/产品图片/`.
- Generated transparent/cutout assets are under `assets/product-cutouts/`:
  - `product-312.png`
  - `product-313.png`
  - `product-314.png`
  - `product-315.png`
  - `product-316.png`
  - `product-317.png`
  - `product-319.png`
  - `product-320.png`
  - `product-321.png`
  - `product-322.png`
- Scripts added:
  - `scripts/clean_reflections.py`: cleans photographer reflections in selected product images.
  - `scripts/make_product_cutouts.py`: creates cutout PNGs for the marquee.
- Original backups for cleaned images are saved as `.original.png` in the source image folder.

## Inquiry Form

- Forms in `index.html` and `en.html` submit to `api/inquiry.php`.
- Frontend validation lives in `script.js`.
- `Failed to fetch` handling was improved:
  - Local `file://` preview now explains that PHP hosting is required.
  - Network/API failure now explains that `api/inquiry.php` must run in a PHP-enabled environment.
- Customer records are saved server-side to:
  - `data/inquiries.jsonl`
- Each record includes:
  - `created_at`
  - `name`
  - `phone`
  - `email`
  - `product`
  - `message`
  - `source`
  - `ip`
  - `user_agent`

## WeChat / WeCom Notification

- `api/inquiry.php` supports Enterprise WeChat group robot Webhook notification.
- The endpoint first saves the inquiry, then attempts notification.
- Webhook can be configured by either:
  - environment variable `WECHAT_WEBHOOK_URL`
  - file `data/wechat_webhook.txt`
- The webhook must match:
  - `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...`
- A robot profile URL like `https://work.weixin.qq.com/wework_admin/common/openBotProfile/...` is not valid for sending.
- `data/wechat_webhook.txt` was created locally and opened for the user to enter the real webhook.
- Webhook test succeeded via Node HTTPS:
  - HTTP status `200`
  - response `{"errcode":0,"errmsg":"ok"}`

## Local / Deployment Notes

- Directly opening `index.html` with `file://` cannot submit inquiries because PHP will not run.
- Deployment needs a PHP-enabled hosting environment.
- To verify deployed PHP endpoint, open:
  - `https://your-domain/api/inquiry.php`
- Expected response for GET is `Method not allowed.`, which confirms PHP is executing.
- Full form test should confirm:
  - record appended to `data/inquiries.jsonl`
  - Enterprise WeChat robot receives the notification.

## Verification Already Run

- `node --check script.js` passed after frontend changes.
- HTML image path checks passed after marquee image replacement.
- Webhook format check passed.
- Direct Webhook notification test returned success.

## Known Gaps

- Local machine does not have `php` command available, so `php -l api/inquiry.php` could not be run locally.
- Run PHP syntax check on the server if possible:

```bash
php -l api/inquiry.php
```

