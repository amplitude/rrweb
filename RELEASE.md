# Release Infrastructure

This repo's `Release` workflow (`.github/workflows/release.yml`) runs `semantic-release` on every push to `master` and `alpha`. semantic-release needs to push a `chore(release): X.Y.Z` commit (CHANGELOG + bumped `package.json` files) and a `vX.Y.Z` tag back to the branch — but `master` is protected by a [repository ruleset](https://github.com/amplitude/rrweb/rules) that requires changes to come through a PR.

The default `GITHUB_TOKEN` provided to Actions authenticates as the `github-actions` integration, which is **not** covered by the ruleset's bypass actors. Direct pushes fail with `GH013: Changes must be made through a pull request`.

The fix: a write-enabled **deploy key** is added as a `DeployKey` bypass actor on the ruleset. The Release workflow checks out the repo using the deploy key's SSH credentials (via `secrets.DEPLOY_KEY`), so pushes from the workflow are recognized as coming from the deploy key and bypass the rule.

## What's in place

| Resource                         | Where                                           | Purpose                                                      |
| -------------------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| `semantic-release deploy key`    | Repo settings → Deploy keys                     | Write-enabled. Public half.                                  |
| `DEPLOY_KEY` Actions secret      | Repo settings → Secrets and variables → Actions | Private half. Read by `actions/checkout` via `ssh-key:`.     |
| `DeployKey` bypass actor         | Master ruleset → Bypass list                    | Lets pushes signed with the key skip the "PR required" rule. |
| `amplitude-sdk-bot` git identity | `release.yml` env vars on the Release step      | Author of the release commit.                                |

## Rotation

Rotate the deploy key periodically or any time the private key may have been exposed.

```sh
# 1. Generate a new ed25519 keypair (no passphrase; required for CI).
KEYDIR=$(mktemp -d)
ssh-keygen -t ed25519 -C "rrweb-semantic-release@amplitude" -f "$KEYDIR/key" -N "" -q

# 2. Add the new public key as a deploy key (write enabled). Capture the new key id.
NEW_KEY_ID=$(gh api repos/amplitude/rrweb/keys -X POST \
  -f title='semantic-release deploy key' \
  -f key="$(cat $KEYDIR/key.pub)" \
  -F read_only=false --jq '.id')
echo "New deploy key id: $NEW_KEY_ID"

# 3. Replace the DEPLOY_KEY Actions secret with the new private key.
gh secret set DEPLOY_KEY --repo amplitude/rrweb < "$KEYDIR/key"

# 4. Securely delete the local private key. GitHub now holds both halves.
shred -u "$KEYDIR/key" 2>/dev/null || rm -P "$KEYDIR/key"
rm "$KEYDIR/key.pub" && rmdir "$KEYDIR"

# 5. Delete the OLD deploy key from the repo (find its id in repo settings or via gh api repos/amplitude/rrweb/keys).
gh api repos/amplitude/rrweb/keys/<OLD_KEY_ID> -X DELETE
```

The ruleset bypass actor is keyed on `DeployKey` (not a specific key id), so it automatically covers the new key — no ruleset update needed.

## Initial bootstrap (from scratch)

If this repo ever loses its release credentials (e.g., new fork), the full setup is:

1. Run rotation steps 1–4 above to create the deploy key + secret.
2. Add the deploy key as a `DeployKey` bypass actor on the master ruleset:
   ```sh
   gh api repos/amplitude/rrweb/rulesets/<RULESET_ID> -X PUT --input ruleset.json
   ```
   where `ruleset.json` contains the existing ruleset spec with one additional entry in `bypass_actors`:
   ```json
   { "actor_id": null, "actor_type": "DeployKey", "bypass_mode": "always" }
   ```
3. Confirm `.github/workflows/release.yml` references `secrets.DEPLOY_KEY` in the checkout step's `ssh-key:` and sets the `GIT_AUTHOR_*` / `GIT_COMMITTER_*` env vars on the Release step.

## Troubleshooting

### Release step fails with `GH013: Changes must be made through a pull request`

The deploy key isn't bypassing the ruleset. Check, in order:

1. `DEPLOY_KEY` secret exists on the repo (`gh secret list --repo amplitude/rrweb`).
2. The checkout step in `release.yml` has `ssh-key: ${{ secrets.DEPLOY_KEY }}`.
3. The master ruleset has a `DeployKey` bypass actor (`gh api repos/amplitude/rrweb/rulesets/<id>` → `bypass_actors`).
4. The deploy key has write access (`read_only: false` in `gh api repos/amplitude/rrweb/keys`).

### semantic-release says "no previous release, the next release version is 1.0.0"

semantic-release couldn't find a `v*` git tag and is starting versioning from scratch. Verify with `git tag -l 'v*'` — if the expected tag is missing, create it pointing at the commit of the last published release and push:

```sh
git tag -a v<X.Y.Z> <COMMIT_SHA> -m "v<X.Y.Z>"
git push origin v<X.Y.Z>
```

Re-run the Release workflow afterward.

### Release commit pushed but no GitHub Release / npm publish

Check the Release workflow logs for failures in the `@semantic-release/github` or `@semantic-release/exec` (publishCmd) plugin steps. The push and tag may have succeeded before a downstream plugin failed — the version commit / tag on `master` is the source of truth for what was attempted.
