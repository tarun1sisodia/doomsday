# Doomsday $1

Tarun Sisodia from India is asking the internet for exactly $1 to watch DOOMSDAY (in theatres 17 December 2026). The ticket here costs less than $1.

Send $1: https://www.paypal.com/ncp/payment/AVK97HXPV5E8Y

The `assets/` folder holds every image and video for the campaign site. The site itself is built from the campaign prompt (master prompt + phased 2-hour plan).

## Site build (branch `main2`)
Built from the master prompt v3 (`Doomsday__1_campaign___master_prompt_v3__final.md`): `index.html`, `style.css`, `script.js`, `_headers`, `verify.sh`. Run `./verify.sh` from the repo root — all checks pass except the expected `{{DOMAIN}}` warning until the first deploy sets the domain. Nothing here is deployed yet; `main` stays assets-only until this branch is reviewed and merged.
