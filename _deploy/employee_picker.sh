#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# اختيار الموظف في السلف والإدخالات اليدوية: كل الموظفين بيظهروا (مش أول 25 بس)
# أمر واحد يُلصق في تيرمنال السيرفر:
#   curl -fsSL https://raw.githubusercontent.com/johnsamire-coder/MotionHR_Web/main/_deploy/employee_picker.sh | sudo bash
#
# بيعمل:
#   1) ينزل 3 ملفات ويب من GitHub (main)
#   2) نسخة احتياطية من الملفات دي ومن بنّاء الويب
#   3) يبني الويب ويعيد تشغيل خدمة الويب
#   4) لو أي خطوة فشلت: بيرجع كل حاجة زي ما كانت لوحده
# ملاحظة: الويب بس. مفيش أي تغيير في الباك إند ولا في قاعدة البيانات.
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

BRANCH="${BRANCH:-main}"
WEB="${WEB:-/var/www/motionhr_web}"
WEB_SERVICE="${WEB_SERVICE:-motionhr-web}"
TS="$(date +%Y%m%d_%H%M%S)"
BK="/var/backups/motionhr_emppicker_${TS}"
TMP="$(mktemp -d)"

WEB_FILES=(
  src/app/api/employees/list/route.ts
  src/app/hr/manual-entries/page.tsx
  src/components/hr/manual-entry-dialog.tsx
)

GH_TOKEN_FILE="${GH_TOKEN_FILE:-/root/.motionhr_github_token}"
GH_TOKEN=""
[ -r "$GH_TOKEN_FILE" ] && GH_TOKEN="$(tr -d '[:space:]' < "$GH_TOKEN_FILE")"
gh_tarball() {  # $1 = repo ، $2 = branch ، $3 = ملف الخرج
  if [ -n "$GH_TOKEN" ]; then
    curl -fsSL -H "Authorization: Bearer $GH_TOKEN" "https://api.github.com/repos/johnsamire-coder/$1/tarball/$2" -o "$3"
  else
    curl -fsSL "https://codeload.github.com/johnsamire-coder/$1/tar.gz/refs/heads/$2" -o "$3"
  fi
}

say()  { echo -e "\n\033[1;34m▶ $*\033[0m"; }
ok()   { echo -e "\033[1;32m✔ $*\033[0m"; }
fail() { echo -e "\n\033[1;31m✘ $*\033[0m"; }

ROLLED_BACK=0
rollback() {
  [ "$ROLLED_BACK" = 1 ] && return
  ROLLED_BACK=1
  fail "حصلت مشكلة — برجّع كل حاجة زي ما كانت..."
  bash "$BK/rollback.sh" || true
  fail "تم الرجوع للنسخة القديمة. البرنامج شغال زي ما كان. ابعت الرسالة اللي فوق للمطور."
}
trap 'fail "حصلت مشكلة قبل أي تغيير — السيرفر ماتغيرش خالص"' ERR

[ "$(id -u)" = 0 ] || { fail "لازم يتشغل بـ sudo"; exit 1; }
[ -d "$WEB/src" ] || { fail "مش لاقي الويب في $WEB"; exit 1; }
WEB_OWNER="$(stat -c %U "$WEB/package.json")"
NPM="${NPM_BIN:-$(command -v npm || true)}"
if [ -z "$NPM" ]; then
  WEB_HOME="$(getent passwd "$WEB_OWNER" | cut -d: -f6)"
  NPM="$(ls -1 "$WEB_HOME"/.nvm/versions/node/*/bin/npm 2>/dev/null | tail -1 || true)"
fi
[ -n "$NPM" ] || { fail "مش لاقي npm على السيرفر"; exit 1; }
NODE_DIR="$(dirname "$(readlink -f "$NPM")")"

# ── 1) تنزيل الملفات من GitHub ──
say "1/3 بنزّل الملفات من GitHub ($BRANCH)"
gh_tarball motionhr_web "$BRANCH" "$TMP/web.tgz"
mkdir -p "$TMP/web"
tar -xzf "$TMP/web.tgz" -C "$TMP/web" --strip-components=1
for f in "${WEB_FILES[@]}"; do [ -f "$TMP/web/$f" ] || { fail "مش لاقي $f في نسخة GitHub"; exit 1; }; done
grep -q 'page_size", "2000"' "$TMP/web/src/app/api/employees/list/route.ts" || { fail "نسخة GitHub مش فيها التعديل"; exit 1; }
ok "الملفات نزلت"

# ── 2) نسخة احتياطية ──
say "2/3 نسخة احتياطية في $BK"
mkdir -p "$BK"
( cd "$WEB" && for f in "${WEB_FILES[@]}"; do [ -e "$f" ] && echo "$f"; done > "$BK/web_existing.txt"; true )
( cd "$WEB" && tar -czf "$BK/web_files.tar.gz" -T "$BK/web_existing.txt" )
( cd "$WEB" && tar -czf "$BK/web_next_build.tar.gz" .next )
cat > "$BK/rollback.sh" <<ROLLBACK
#!/usr/bin/env bash
set -u
echo "▶ برجّع ملفات الويب وبنّاؤه القديم..."
cd "$WEB" && tar -xzf "$BK/web_files.tar.gz"
rm -rf "$WEB/.next" && tar -xzf "$BK/web_next_build.tar.gz" && chown -R $WEB_OWNER: "$WEB/.next"
systemctl restart $WEB_SERVICE
echo "✔ رجعنا للنسخة القديمة"
ROLLBACK
chmod +x "$BK/rollback.sh"
ln -sfn "$BK" /var/backups/motionhr_emppicker_latest
ok "النسخة الاحتياطية جاهزة"
trap 'rollback' ERR

# ── 3) الويب ──
say "3/3 ببني الويب (ممكن ياخد كام دقيقة)"
for f in "${WEB_FILES[@]}"; do install -D -o "$WEB_OWNER" -g "$(stat -c %G "$WEB/package.json")" -m 644 "$TMP/web/$f" "$WEB/$f"; done
( cd "$WEB" && sudo -H -u "$WEB_OWNER" env PATH="$(dirname "$NPM"):$NODE_DIR:/usr/local/bin:/usr/bin:/bin" "$NPM" run build >"$BK/web_build.log" 2>&1 ) || { tail -30 "$BK/web_build.log"; false; }
ok "الويب اتبنى"

say "بعيد تشغيل الويب"
systemctl restart "$WEB_SERVICE"
sleep 5
systemctl is-active --quiet "$WEB_SERVICE" || { journalctl -u "$WEB_SERVICE" -n 30 --no-pager; false; }
ok "الويب شغال"

trap - ERR
rm -rf "$TMP"
echo
echo "════════════════════════════════════════════"
ok "تم الرفع بنجاح ✅ — كل الموظفين بيظهروا في اختيار الموظف (السلف والإدخالات اليدوية وباقي الشاشات)"
echo "النسخة الاحتياطية: $BK"
echo "لو عايز ترجع للنسخة القديمة في أي وقت، الصق الأمر ده:"
echo "   sudo bash /var/backups/motionhr_emppicker_latest/rollback.sh"
echo "════════════════════════════════════════════"
