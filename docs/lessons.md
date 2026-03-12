# Lessons Learned

Persistent project knowledge. Things any agent (or human) needs to know.
Updated whenever a mistake is made, a gotcha is discovered, or a pattern proves
effective. Review this file at the start of each task.

## Monorepo & Dependencies

- **`workspace:*` is required for all inter-package dependencies** -- using hardcoded version references (e.g. `"^0.20250411.3"`) instead of `workspace:*` causes CI `publish-dev` to fail with 401 from GitHub Packages because pnpm tries to resolve internal packages from the registry instead of locally.
- **`prepublishOnly` script converts `workspace:*` to version refs for publishing** -- every package has an inline Node.js script in `prepublishOnly` that replaces `workspace:*` entries with `^CURRENT_VERSION`. This runs automatically during `npm publish`. Do not manually replace workspace refs before publishing.

## CI / GitHub Actions

- **`set -e` in GitHub Actions kills retry loops** -- bash steps in Actions run with `set -e` by default. If `npm publish` fails inside a retry `while` loop, `set -e` terminates the entire step before the retry logic runs. Use the pattern `command && EXIT=0 || EXIT=$?` to capture the exit code without triggering `set -e`.
- **publish-dev version scheme is `MAJOR.DATE.PATCH-prN`** -- e.g. `0.20250411.3-pr42`. The workflow queries the GitHub Packages registry for existing versions to find the next patch number. If a version conflict occurs during publish, the retry loop increments the patch number.
- **publish-production version scheme is `MAJOR.DATE.PATCH`** -- same as dev but without the `-prN` suffix. Publishes to npm (not GitHub Packages).
- **`commit-version-bumps` job runs after publish-production** -- it queries npm for the latest published version of each package and updates the repo's `package.json` files to match, then commits with `[skip ci]`.

## Testing

- **Most packages use Vitest; `app-bridge-react-native` uses Jest** -- the react-native package uses `jest-expo` because Vitest does not have first-class React Native support. All other packages use Vitest.
- **Turbo `test` task depends on `build`** -- tests will not run until all upstream packages are built. If tests fail with import errors, run `pnpm build` first.
