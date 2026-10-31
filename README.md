# Pure Medical Rove 6 landing page

A static, accessible landing page for a prescription portable oxygen concentrator. The primary action is a Rove 6 contact request. After the server confirms it was saved, the connected page displays a private offer with secure HubSpot checkout and a phone option. No payment details or prescription are collected by this page.

## Preview

GitHub Pages publishes a fully connected client-review build with `noindex`. The form requires name, phone, email and an unchecked, explicit permission box covering calls, texts and emails about the inquiry or order. It saves contact requests to the authorized private Google Sheet, then displays the real server-supplied offer and a working reusable HubSpot checkout link. It uses the same customer-facing flow as the production build, without test copy or placeholder pricing. Keep paid traffic pointed at the client's production host.

The receiver URL is configured in the repository Actions variable `ROVE6_REQUEST_ENDPOINT`. This public submission endpoint is not a credential; the spreadsheet ID, contact records, offer amount, and payment link stay on the private receiver. GitHub hosts only static page assets.

```sh
npm test
ROVE6_REQUEST_ENDPOINT='https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec' npm run build
```

The project has no runtime dependencies. Serve `dist/` with any static web server. The GitHub Actions workflow builds and publishes `dist/` to Pages.

The product section and footer link to the self-hosted `assets/inogen-rove-6-specifications.pdf`. It is a one-page Pure Medical summary of published manufacturer specifications, with no pricing. Visitors can view or download the PDF without navigating to the manufacturer website.

## Florida lifestyle variation

- `?market=florida&variant=standard` forces the national design for Florida control review.
- `?market=florida&variant=florida` forces the coastal Florida lifestyle design for review.
- `?market=florida` splits Florida campaign visitors 50/50 and remembers the assigned version in their browser. Campaign names containing `florida` also select this audience. Explicit review overrides do not overwrite the stored assignment.
- Other traffic uses the national design. No IP-location service is used. Both variants keep the same product facts, required fields, explicit contact permission, offer and checkout process.
- Each saved request records its page variant and market in Team notes. The request-saved browser event includes these two non-personal labels; no analytics service is installed.

## Connect requests to the private Google Sheet

The connected Google Drive account owns the callback sheet. It is private. Its ID is deliberately absent from public frontend files. This repository includes a generic Apps Script receiver but no Google credentials.

1. Open the callback spreadsheet and select **Extensions → Apps Script**.
2. Paste `backend/Code.template.gs` into `Code.gs`.
3. Run `configureReceiver` once. Google will ask the owner to authorize spreadsheet access.
4. Choose **Deploy → New deployment → Web app**. Execute as the owner; access must allow **Anyone** so visitors do not have to sign in to Google. Keep the spreadsheet itself private.
5. In **Project Settings → Script Properties**, set `ROVE6_OFFER_JSON` to a JSON object with `amountMinor` (integer cents), `currency` (`USD`), `title`, and `checkoutUrl` (an HTTPS `payments-na1.hubspot.com/payments/…` URL). Use the reusable link copied from HubSpot Payment Links, never a `/payments/purchase/` checkout session. Keep the current approved amount and payment link in this private setting. They must never be committed to this repository. The server returns this object only with a saved-request acknowledgement, including an idempotent retry. If the setting is missing or invalid, the request is still saved and the page offers a call instead of checkout.
6. Copy the resulting `/exec` deployment URL. A `/dev` test URL will not work for anonymous visitors.
7. On the production host, build with the endpoint:

```sh
ROVE6_REQUEST_ENDPOINT='https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec' node scripts/build.mjs --production
```

8. Test a clearly marked sample request from the production origin. Verify the row is saved in **Requests**, the browser receives a readable acknowledgement, retrying the same request does not duplicate it, and a deliberately failed submission does not show success. Delete only the sample row after reviewing it. If your Workspace administrator disallows anonymous Apps Script web apps, use a server endpoint on your production host instead.

The receiver validates on the server, checks callback consent, rejects its honeypot and premature submissions, uses a write lock, deduplicates request IDs, and escapes spreadsheet formula prefixes. Add a managed CAPTCHA or stronger abuse protection before high-volume public advertising if needed. Do not store prescriptions, diagnoses, payment information, or insurance identifiers here.

## Production and search

The intended canonical page is the client's existing `https://puremedco.com/products/rove6/`. Publish the production build there, or update the canonical, Open Graph URL, structured data, sitemap, and internal links together if the URL changes. The production build requires an endpoint and switches the robots meta tag to `index, follow`.

- Use the client's production hosting for the live commercial landing page. GitHub Pages is the design preview.
- Verify Search Console ownership, inspect the canonical URL, submit the production sitemap, and link the page from the main site. Root `robots.txt`, WordPress indexing controls, and Search Console's generative AI inclusion setting need the site's owner to check them.
- The root production robots policy must allow Googlebot. Review the Google-Extended preference for Gemini Apps separately: it controls training as well as grounding eligibility. Do not overwrite the client's root robots policy blindly.
- Important information is server-rendered HTML. FAQs are readable without JavaScript. Product/Organization/WebPage JSON-LD describes only visible facts and has no price, Offer, ratings, or fabricated testimonials. This does not guarantee a product rich result or an AI citation.
- The price gate keeps offer amounts and checkout links out of public HTML, JavaScript, metadata, and GET responses. It is a contact gate, not identity verification: anyone who submits valid contact details and contact consent can receive the offer. Checkout URLs and prices can also be shared by recipients.
- No analytics are loaded. A `rove6:request-saved` browser event fires only after a confirmed save, with no contact details. Add client-owned analytics only after agreeing on consent and measurement requirements; do not send health or contact data to ad tags.
- The third-party design team should obtain client approval for imagery, consent/privacy wording, phone routing, current product terms, and the production domain before live traffic. An image or contact notice is not a medical recommendation.

## Florida imagery and colors

The Florida design uses Atlantic blue `#124C5A`, sea-glass teal `#147980`, warm sand `#FFF5E4`, seafoam `#E5F2EB`, soft coral `#F09A78`, and sunshine gold `#EDBD5C`. Its golf-cart hero, beach-walk scene, and offshore-fishing scene are AI-generated illustrative lifestyle photographs. They are not customer testimonials or depictions of the product in use. The Rove 6 product photo remains the original client product asset. Optimized WebP files are in `assets/florida-*.webp`; the national design retains its existing image and colors.

## Sources and existing brand assets

Reused from publicly available client materials for this authorized design preview:

- Logos: `https://puremedical-rove6.pplx.app/assets/pure-medical-logo-blue.png` and `pure-medical-logo-white.png`.
- Mobility photo: `https://puremedco.com/wp-content/uploads/2026/02/Pure-Medical-Img-1.png`. This is an illustrative mobility scene, not a customer testimonial or identification of the device in the bag.
- Actual product photo: `https://puremedco.com/wp-content/uploads/2026/02/Inogen-Rove-6-Item-1.png`.
- Product specifications: `https://provider.inogen.com/en/products/rove-6-system`.
- Google search guidance: `https://developers.google.com/search/docs/fundamentals/ai-optimization-guide`.
- Gemini grounding control: `https://developers.google.com/search/blog/2026/10/ai-training-control`.
- Apps Script deployment: `https://developers.google.com/apps-script/guides/web`.

Product images and trademarks remain the property of their respective owners.
