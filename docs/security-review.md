# Security review: auth, RLS, storage, client secrets

Reviewed against main @ eae3b6f plus this branch. Dev stack only. Re-run the attacks with `npm run test:security`.

## Summary
| # | Check | Result |
|---|---|---|
| 1 | RLS enabled on every public table, owner-only policies | PASS |
| 2 | anon key (no user JWT) cannot read or write any table or view | PASS |
| 3 | Cross-user read/update/delete/insert/reassign via REST | PASS |
| 4 | Cross-user FK smuggling (outfit_items, wear_log) | PASS (composite FKs) |
| 5 | Storage: private bucket, per-user folder policies, mime allow-list | PASS |
| 6 | No service-role key or secrets in repo, history or web bundle | PASS |
| 7 | Session storage on native | FIXED (was FAIL) |
| 8 | Password policy aligned (client 8, server 8) | FIXED in config, needs stack restart |
| 9 | Email confirmation | FIXED in config, needs stack restart |
| 10 | Redirect allow-list | FIXED in config, needs stack restart |
| 11 | Input validation on writes | FIXED (migration applied) |
| 12 | Signed URL expiry (7 days) | FAIL (medium), follow-up Q2 |
| 13 | Auth rate limits | PASS with notes |
| 14 | `.env` git-ignored | FIXED (only `.env*.local` was) |

## Findings by severity
### High: none open
### Medium
- **M1 Session tokens in unencrypted AsyncStorage (native).** Fixed: `src/lib/secureStorage.ts` stores the session in Keychain/Keystore through `expo-secure-store`. Values are split into 1800-char chunks, with the chunk count written last so a torn write reads as signed out. Existing AsyncStorage sessions migrate on first read. Web still uses localStorage, which is unavoidable. Not verified on a device or simulator, only typecheck and lint, so test sign-in persistence across an app restart on iOS and Android.
- **M2 Signed photo URLs last 7 days** (`SIGNED_URL_TTL` in `src/data/syncRemote.ts`). A leaked URL gives access for a week. Lowering the TTL needs refresh-on-expiry in the image layer, so it is a follow-up (Q2).
- **M3 Server password minimum was 6 and confirmations were off.** Fixed in `supabase/config.toml` (min 8, `enable_confirmations = true`, `secure_password_change = true`). **The running dev stack still uses the old settings.** The attack test prints WARN for the 7-char password until the stack restarts. After the restart, dev sign-ups need a mail inbox (Inbucket on port 54324) or the admin API (`email_confirm: true`). The app already handles the "check your email" state.
### Low
- **L1 Free-form columns were unbounded** (tags, note, display_name, settings, silhouette, photo paths). Fixed in migration `20261112090000_input_validation.sql`. It adds length and size checks, hue and position ranges, and requires `photo_path` and `original_path` to live under `{user_id}/` with no `..`. It was applied to the dev DB after a count of violating rows returned 0 for all tables. `isolation.sql` and `test:sync` (with PHOTO=1) still pass.
- **L2 Redirect allow-list lacked `fitchecked://reset-password` and local web origins.** Fixed in config. Production needs the real web origin added in the hosted dashboard or config.
- **L3 `.env` was not git-ignored.** Fixed in `.gitignore`.
- **L4 Rate limits:** `email_sent = 2` per hour is tight for dev once confirmations are on, but it is a sensible production default. `sign_in_sign_ups = 30` per 5 minutes per IP is acceptable. Refresh token rotation is on. Review again against the hosted project.
### Informational
- Password complexity (`password_requirements`) is left empty so the client rule (8+ chars) matches the server.
- Signup is open, as intended. Duplicate emails are not disclosed to the client.
- Pre-existing: profiles has no client INSERT or DELETE policy. The test confirms both are blocked.

## Evidence (commands run)
```
npm run test:security     # every check PASS; one WARN for the 7-char password pending a stack restart
psql "$DATABASE_URL" -f supabase/tests/isolation.sql   # 31 ok, run after the migration
PHOTO=1 npm run test:sync                              # ALL PASSED after the migration
npx expo export --platform web --output-dir /tmp/webexport   # with EXPO_PUBLIC_* set to the dev URL and anon key
grep -rlF "$SUPABASE_SERVICE_ROLE_KEY" /tmp/webexport  # 0 files; "service_role" string: 0 files; anon key: 1 file (expected, it is public)
git log --all -p | grep -cF "$SUPABASE_SERVICE_ROLE_KEY"   # 0
git log --all -p | grep -cE "eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}"   # 0 (no JWTs in history)
git grep SERVICE_ROLE -- src app.json eas.json         # 0 (only scripts/ read it from env)
npm run typecheck && npm run lint
```
`test:security` covers:
- anon read and insert on all tables and views;
- A reading, patching, deleting and inserting as B, and moving a row to B;
- cross-user FK links;
- profile insert, delete and patch;
- a forged JWT;
- the auth admin API called with a user JWT;
- storage download, sign, upload and delete across users, the public URL, and the mime allow-list;
- the input-validation constraints.

It creates `sec-*@security.test` users and removes them afterwards.

## Not tested
- SecureStore on a real device (see M1).
- Hosted-project settings, since only the local stack was reachable.
- The new config values (they require a stack restart).
- Email template and OTP brute-force limits.
- DoS and storage quota abuse.

## Proposed follow-up quests
- **Q1 Verify secure session storage on device:** sign in, kill the app, relaunch, and check the session persists on iOS and Android. Check that a >2KB session works.
- **Q2 Shorten signed URL TTL to about 1h:** refresh URLs on expiry or on app foreground, and cache images locally.
- **Q3 Production auth config:** set the real site_url and redirect URLs, SMTP, CAPTCHA (hCaptcha or Turnstile) on signup and reset, and re-check rate limits. Requires the commander's accounts.
- **Q4 Account deletion:** an App Store requirement. Needs an edge function or RPC that deletes the auth user and their storage objects.
