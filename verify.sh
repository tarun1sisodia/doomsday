#!/usr/bin/env bash
# Run from the repo root. Do not edit BANNED. Exit code 1 if any FAIL.
cd "$(dirname "$0")" || exit 1
fail=0
ok(){ echo "PASS  $1"; }
bad(){ echo "FAIL  $1"; fail=1; }
warn(){ echo "WARN  $1"; }
SRC=(index.html style.css script.js _headers)
for f in "${SRC[@]}"; do [ -f "$f" ] || { bad "missing file: $f"; }; done

# 1. Every PayPal reference is the same single URL
refs=$(grep -ohE "paypal\.com[^\"' <>)\\\\]*" "${SRC[@]}" 2>/dev/null | sort -u)
refs=$(grep -ohE "paypal\.com/ncp/payment/[A-Za-z0-9]+" "${SRC[@]}" 2>/dev/null | sort -u); if [ "$refs" = "paypal.com/ncp/payment/AVK97HXPV5E8Y" ]; then ok "one identical PayPal URL"; else bad "PayPal references differ or missing: $refs"; fi

# 2. Banned phrases (case-insensitive, whole repo except assets, .git, this file)
BANNED=("10 seconds" "18 December" "Dec 18" "Dec. 18" "donate what you can" "any amount" "Muse AI" "FZJSP4V9Z99LE")
for p in "${BANNED[@]}"; do
  if grep -rIiqF --exclude-dir=assets --exclude-dir=.git --exclude=verify.sh -- "$p" .; then bad "banned phrase found: $p"; else ok "no '$p'"; fi
done
if grep -rIqF --exclude-dir=assets --exclude-dir=.git --exclude=verify.sh -- '$2' .; then bad 'found $2'; else ok 'no $2'; fi

# 2b. The only allowed 'raised' text is the exact goal line, at most twice (HTML and the JS constant)
r_all=$(grep -rIh --exclude-dir=assets --exclude-dir=.git --exclude=verify.sh 'raised\|RAISED_LINE' . | sed 's/RAISED_LINE//g' | grep -oi 'raised' | wc -l)
r_ok=$(grep -rIoF --exclude-dir=assets --exclude-dir=.git --exclude=verify.sh 'Raised so far: $0 — be the first' . | wc -l)
s_all=$(grep -rIoi --exclude-dir=assets --exclude-dir=.git --exclude=verify.sh 'so far' . | wc -l)
[ "$r_all" -eq "$r_ok" ] && [ "$s_all" -eq "$r_ok" ] && [ "$r_ok" -le 2 ] && ok "goal line is the only 'raised' text" || bad "'raised' or 'so far' outside the goal line (raised=$r_all so_far=$s_all exact=$r_ok)"

# 3. Exactly one h1
n=$(grep -oi '<h1[ >]' index.html | wc -l)
[ "$n" -eq 1 ] && ok "one h1" || bad "h1 count is $n"

# 4. External hosts: only PayPal, Instagram credits, the SVG namespace, and your own domain
allowed="^https?://(www\.paypal\.com|www\.instagram\.com|www\.w3\.org|\{\{DOMAIN\}\}|DOMAIN${1:+|$1})"
hosts=$(grep -ohE "https?://[^/\"' <>)]+" "${SRC[@]}" 2>/dev/null | sort -u)
extra=$(echo "$hosts" | grep -vE "$allowed" | grep -v '^$')
[ -z "$extra" ] && ok "no unexpected external hosts" || bad "unexpected hosts: $extra"

# 5. Files that must not be used
for u in bg-alt thumb- assets/mix.jpg assets/iron1 hero-v1 ticket-v1 qr-paypal-old; do
  if grep -qF "$u" "${SRC[@]}" 2>/dev/null; then bad "unused asset referenced: $u"; else ok "not referenced: $u"; fi
done

# 6. Unfilled values
if grep -rIqF --exclude-dir=assets --exclude-dir=.git --exclude=verify.sh '{{FILL}}' .; then bad "unfilled {{FILL}} value"; else ok "no {{FILL}} left"; fi
grep -rIqF --exclude-dir=assets --exclude-dir=.git --exclude=verify.sh '{{DOMAIN}}' . && warn "{{DOMAIN}} placeholder still present (fill after first deploy)"

# 7. Every img has width and height
badimg=$(grep -oE '<img[^>]*>' index.html | grep -vE 'width=.*height=|height=.*width=' | wc -l)
[ "$badimg" -eq 0 ] && ok "all img tags have width and height" || bad "$badimg img tags lack width/height"

# 8. Size caps (KB) for images in use; JS under 60 KB
for f in assets/*.jpg assets/*.webp assets/*.png; do
  [ -f "$f" ] || continue
  b=$(basename "$f")
  case "$b" in thumb-*|bg-alt-poster.jpg|*-v1.*|qr-paypal-old.png) continue;; hero*) cap=250;; ticket*) cap=150;; qr-*) cap=30;; *) cap=200;; esac
  kb=$(( ($(stat -c%s "$f") + 1023) / 1024 ))
  [ "$kb" -le "$cap" ] && ok "$b ${kb} KB (cap $cap)" || bad "$b ${kb} KB over cap $cap"
done
js=$(stat -c%s script.js 2>/dev/null || echo 0)
[ "$js" -le 61440 ] && ok "script.js ${js} bytes" || bad "script.js ${js} bytes over 60 KB"

# 9. Heads-up checks
grep -n 'text-transform' style.css 2>/dev/null && warn "text-transform used: confirm it does not change copy deck casing"
grep -q 'SHOW_INTRO *= *false' script.js 2>/dev/null && grep -n 'marvel-intro' index.html style.css script.js 2>/dev/null | grep -v 'SHOW_INTRO' && warn "marvel-intro referenced while SHOW_INTRO is false"

echo; [ "$fail" -eq 0 ] && echo "ALL CHECKS PASSED" || echo "SOME CHECKS FAILED"
exit "$fail"
