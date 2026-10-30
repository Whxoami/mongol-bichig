# Монгол бичиг ⇄ Кирилл

Static page in `public/`, server functions in `netlify/functions/`.

## Settings (Netlify → Site configuration → Environment variables)

| Name | What |
|---|---|
| `ADMIN_PASSWORD` | Password for `/admin.html` (at least 8 characters). Required. |
| `PAY_ACCOUNT_NO` | Bank account number shown to customers. Required to open payments. |
| `PAY_ACCOUNT_NAME` | Name on the account. Required to open payments. |
| `PAY_BANK` | Optional. Defaults to `Голомт банк`. |
| `IP_SALT` | Optional. Any random text. |

## Business settings

`netlify/functions/lib/config.mjs` holds prices, plan lengths, word limits and the free-use wait.

## How access works

1. Visitor gets one free conversion (up to 200 words), then waits 35 minutes.
2. To pay, they pick a plan and get a code (`MB-XXXXXX`) to put in the bank transfer note.
3. The owner checks the bank app, opens `/admin.html` and approves the code.
4. The visitor's page unlocks (up to 3000 words per conversion, no waiting). One code works on 2 devices.
