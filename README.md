# Doomsday $1

A static fan campaign by Tarun Sisodia, India. The ask is exactly $1, one time. The release date is configured in `script.js` as an ISO timestamp for 2026-12-17 in India. The site has no build step or backend.

## Deployment

1. Connect this repository to Cloudflare Pages.
2. Select the branch to deploy, use no build command, and set the build output directory to the project root (`/`).
3. After deployment, update the canonical and Open Graph image URLs in `index.html` if the production URL changes.
4. Run `./verify.sh doom.coccoder999.workers.dev` (replace the argument with the deployed hostname).
5. When replacing an asset, use a new filename and update references so cached versions do not linger.

The verifier checks source files only, not dates rendered by JavaScript or printed inside media. Check the date in the browser too.

## Before launch

- Confirm that the goal line in `script.js` is accurate and edit it as soon as the first payment arrives.
- Confirm the release date and local ticket price with the cinema. The page does not claim a particular local price.
- In PayPal, set the item's maximum quantity to one, check that shipping is disabled, and configure the return URL after deployment. Confirm the actual fee and payout with a test payment.
- On a phone, test the hosted button and each plain payment link, scan both QR codes, and verify checkout shows the intended $1.00 USD item. Test copying, native sharing, reels, the intro, reduced motion, and landscape playback.
- Run Lighthouse mobile on the deployed site, including the PayPal SDK. Verify mobile LCP and transfer sizes on the intended connection; sandbox figures are not a phone test.
- The intro is enabled behind a tap. Set `SHOW_INTRO` to `false` in `script.js` to remove its player if desired.
- Check that you have permission to use the supplied images and clips. Credit alone does not establish permission.
