#!/usr/bin/env bash
#
# Local end-to-end test for the upstream sync workflow.
# Mirrors .github/workflows/upstream-sync.yml but runs entirely locally
# using the Claude CLI instead of claude-code-action.
#
# Usage:
#   bash tools/test-upstream-sync.sh          # test with 5 oldest commits
#   bash tools/test-upstream-sync.sh 1        # test with 1 oldest commit
#   bash tools/test-upstream-sync.sh --all    # test with all commits
#
# Prerequisites:
#   - Claude CLI installed (claude)
#   - gh CLI authenticated
#   - jq installed
#   - upstream remote configured (script will add it if missing)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

MAX_COMMITS=5
if [ "${1:-}" = "--all" ]; then
  MAX_COMMITS=0
elif [ -n "${1:-}" ] && [[ "${1:-}" =~ ^[0-9]+$ ]]; then
  MAX_COMMITS="$1"
fi

ORIGINAL_BRANCH=$(git branch --show-current || git rev-parse --short HEAD)
TEST_BRANCH="upstream-sync/test-$(date +%s)"
OUTPUT_DIR="$REPO_ROOT/tools/upstream-sync-output"
mkdir -p "$OUTPUT_DIR"
LOG_FILE="$OUTPUT_DIR/test-run.log"
SUMMARY_FILE="$OUTPUT_DIR/sync-summary.json"
PROMPT_FILE="$OUTPUT_DIR/prompt.txt"
PR_TITLE_FILE="$OUTPUT_DIR/pr-title.txt"
PR_BODY_FILE="$OUTPUT_DIR/pr-body.md"

# Log all output to file AND terminal
exec > >(tee -a "$LOG_FILE") 2>&1
echo "Test started at $(date)"

cleanup() {
  echo ""
  echo "=== Cleanup ==="
  git cherry-pick --abort 2>/dev/null || true
  git checkout "$ORIGINAL_BRANCH" 2>/dev/null || true
  git branch -D "$TEST_BRANCH" 2>/dev/null || true
  rm -f "$PROMPT_FILE"
  echo "Restored branch: $ORIGINAL_BRANCH"
  echo "Test branch $TEST_BRANCH deleted."
  echo "Output files preserved in: $OUTPUT_DIR"
}
trap cleanup EXIT

header() {
  echo ""
  echo "========================================"
  echo "  $1"
  echo "========================================"
}

# ── Step 1: Prerequisites ────────────────────────────────────────────

header "Step 1: Check prerequisites"

for cmd in claude gh jq git; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: $cmd is not installed or not in PATH."
    exit 1
  fi
done
echo "  All tools available."

# ── Step 2: Fetch upstream ───────────────────────────────────────────

header "Step 2: Fetch upstream master"

if ! git remote get-url upstream &>/dev/null; then
  echo "  Adding upstream remote..."
  git remote add upstream https://github.com/rrweb-io/rrweb.git
fi
git fetch upstream master --no-tags
echo "  Done."

# ── Step 3: Determine last sync point ────────────────────────────────

header "Step 3: Determine last sync point"

FALLBACK="3e9e42fdfd6349087d7a0345af1b39dd56528502"
LAST_SYNC=""

for STATE in open closed; do
  TITLE=$(gh pr list \
    --label upstream-sync \
    --state "$STATE" \
    --limit 1 \
    --sort updated \
    --json title \
    --jq '.[0].title // empty' 2>/dev/null || true)

  echo "  Checked $STATE PRs — title: '${TITLE:-<none>}'"

  if [ -n "$TITLE" ]; then
    LAST_SYNC=$(echo "$TITLE" | sed -n 's/.*\[last: \([0-9a-f]\{1,\}\)\].*/\1/p')
    if [ -n "$LAST_SYNC" ]; then
      echo "  Found last sync hash from $STATE PR: $LAST_SYNC"
      break
    fi
  fi
done

if [ -z "$LAST_SYNC" ]; then
  LAST_SYNC="$FALLBACK"
  echo "  No previous sync PR found; using fallback: $LAST_SYNC"
fi

# ── Step 4: Collect upstream commits ─────────────────────────────────

header "Step 4: Collect upstream commits"

ALL_COMMITS=$(git log "${LAST_SYNC}..upstream/master" \
  --format='%H%x1f%h%x1f%s%x1f%an%x1f%ci' | jq -Rs '
  split("\n")
  | map(select(length > 0))
  | map(split("\u001f"))
  | map({
      hash: .[0],
      short: .[1],
      subject: .[2],
      author: .[3],
      date: .[4]
    })
')

TOTAL_COUNT=$(echo "$ALL_COMMITS" | jq 'length')
LAST_UPSTREAM_HASH=$(echo "$ALL_COMMITS" | jq -r '.[0].hash // empty')

echo "  Found $TOTAL_COUNT total commits since $LAST_SYNC"
echo "  Newest upstream commit: $LAST_UPSTREAM_HASH"

if [ "$TOTAL_COUNT" -eq 0 ]; then
  echo "  No new upstream commits. Nothing to test."
  exit 0
fi

if [ "$MAX_COMMITS" -gt 0 ] && [ "$TOTAL_COUNT" -gt "$MAX_COMMITS" ]; then
  # Take the N oldest commits (they appear last in git log's newest-first output)
  COMMITS=$(echo "$ALL_COMMITS" | jq ".[- $MAX_COMMITS:]")
  SUBSET_COUNT=$(echo "$COMMITS" | jq 'length')
  # The "last upstream hash" for the subset is the newest in the subset (first element)
  LAST_UPSTREAM_HASH=$(echo "$COMMITS" | jq -r '.[0].hash // empty')
  echo "  Scoped to $SUBSET_COUNT oldest commits for testing (use --all for full run)."
else
  COMMITS="$ALL_COMMITS"
  SUBSET_COUNT="$TOTAL_COUNT"
fi

echo ""
echo "  Commits to process:"
echo "$COMMITS" | jq -r '.[] | "    \(.short) — \(.subject)"'

# ── Step 5: Create test branch ───────────────────────────────────────

header "Step 5: Create test branch"

git checkout -b "$TEST_BRANCH" origin/master
git config user.name "test-upstream-sync"
git config user.email "test@localhost"
echo "  Branch: $TEST_BRANCH"

# ── Step 6: Invoke Claude CLI ────────────────────────────────────────

header "Step 6: Invoke Claude CLI for cherry-pick + triage"

rm -f "$SUMMARY_FILE"

cat > "$PROMPT_FILE" <<PROMPT_EOF
You are helping maintain \`amplitude/rrweb\`, a fork of \`rrweb-io/rrweb\`.
Amplitude extends rrweb with custom functionality for Session Replay (background
capture, privacy masking, performance optimizations).

Your task is to triage the following upstream commits, cherry-pick the relevant
ones onto the current branch, and resolve any conflicts.

## Upstream commits to evaluate
\`\`\`json
$COMMITS
\`\`\`

## Instructions

For each commit, decide if it is RELEVANT or SKIP:

**Relevant** — cherry-pick it:
- Bug fixes in rrweb-snapshot, rrweb, or record packages
- Performance improvements
- Privacy or masking changes
- Browser compatibility fixes

**Skip** — do not cherry-pick:
- CI/CD, tooling, or release process changes
- Docs or example-only changes
- Features Amplitude has already implemented differently
- Changes to packages Amplitude doesn't use

Also assign a risk level to each relevant commit:
- \`low\` — isolated fix, minimal blast radius
- \`medium\` — touches shared logic, needs testing
- \`high\` — core serialization, replay, or snapshot changes

## Cherry-pick process

For each RELEVANT commit (oldest first):
1. Run: \`git cherry-pick <hash>\`
2. If it succeeds, move on.
3. If it fails with conflicts:
   a. Use the Read tool to read each conflicting file (they will have conflict markers).
   b. Use the Edit tool to resolve the conflicts, preserving Amplitude's custom logic
      while incorporating the upstream fix.
   c. Run: \`git add <file>\` for each resolved file.
   d. Run: \`git cherry-pick --continue --no-edit\`
   e. If the conflict is too complex to resolve safely, run:
      \`git cherry-pick --abort\`
      and mark the commit as \`manual-required\`.

## Output

After processing all commits, write a JSON summary to \`$SUMMARY_FILE\`:
\`\`\`json
{
  "cherry_picked": [
    {
      "hash": "abc1234",
      "subject": "fix: textarea serialization",
      "risk": "low",
      "summary": "One-line description of what the fix does",
      "conflict_resolved": false,
      "conflict_resolution_note": null
    }
  ],
  "skipped": [
    {
      "hash": "def5678",
      "subject": "chore: update CI config",
      "reason": "CI-only change, not relevant to Amplitude fork"
    }
  ],
  "manual_required": [
    {
      "hash": "ghi9012",
      "subject": "refactor: reorganize snapshot exports",
      "reason": "Structural reorganization conflicts with Amplitude's export overrides"
    }
  ]
}
\`\`\`

For any commit where you resolved a conflict, set \`conflict_resolved: true\` and
populate \`conflict_resolution_note\` with a brief explanation of what you decided
and why.

If a conflict was resolved but you are uncertain about the decision, prefix the
note with \`[UNCERTAIN] \`.
PROMPT_EOF

echo "  Prompt written to $PROMPT_FILE ($(wc -l < "$PROMPT_FILE") lines)"
echo "  Running Claude CLI... (this may take a minute)"
echo ""

claude -p "$(cat "$PROMPT_FILE")" \
  --allowedTools Bash,Read,Edit

# ── Step 7: Validate summary ────────────────────────────────────────

header "Step 7: Validate sync summary"

if [ ! -f "$SUMMARY_FILE" ]; then
  echo "  ERROR: Claude did not produce $SUMMARY_FILE"
  echo "  The Claude step may have failed. Check output above."
  exit 1
fi

echo "  Summary file exists."
echo ""
cat "$SUMMARY_FILE"
echo ""

PICKED=$(jq '.cherry_picked | length' "$SUMMARY_FILE")
SKIPPED=$(jq '.skipped | length' "$SUMMARY_FILE")
MANUAL=$(jq '.manual_required | length' "$SUMMARY_FILE")
HIGH_RISK=$(jq '[.cherry_picked[] | select(.risk == "high")] | length' "$SUMMARY_FILE")

echo "  Cherry-picked: $PICKED"
echo "  Skipped:       $SKIPPED"
echo "  Manual:        $MANUAL"
echo "  High-risk:     $HIGH_RISK"

# Validate schema
for field in cherry_picked skipped manual_required; do
  if ! echo "$(cat "$SUMMARY_FILE")" | jq -e ".$field" >/dev/null 2>&1; then
    echo "  ERROR: Missing required field: $field"
    exit 1
  fi
done
echo "  Schema valid."

# ── Step 8: Build PR title and body ─────────────────────────────────

header "Step 8: Build PR title and body"

DATE=$(date +%Y-%m-%d)
TITLE="chore: upstream rrweb sync $DATE ($PICKED commit(s)) [last: $LAST_UPSTREAM_HASH]"

echo "$TITLE" > "$PR_TITLE_FILE"
echo "  PR title written to: $PR_TITLE_FILE"

# Verify round-trip
PARSED_HASH=$(echo "$TITLE" | sed -n 's/.*\[last: \([0-9a-f]\{1,\}\)\].*/\1/p')
if [ "$PARSED_HASH" = "$LAST_UPSTREAM_HASH" ]; then
  echo "  Round-trip parse: PASS"
else
  echo "  Round-trip parse: FAIL ($PARSED_HASH != $LAST_UPSTREAM_HASH)"
fi

SUMMARY_JSON=$(cat "$SUMMARY_FILE")

ROWS=$(echo "$SUMMARY_JSON" | jq -r '
  .cherry_picked[] |
  "| `\(.hash[0:7])` | \(.subject) | `\(.risk)` | \(if .conflict_resolved then "⚠️ " else "" end)\(.summary) |"
')

SKIPPED_ROWS=$(echo "$SUMMARY_JSON" | jq -r '
  .skipped[] |
  "| `\(.hash[0:7])` | \(.subject) | \(.reason) |"
')

MANUAL_ROWS=$(echo "$SUMMARY_JSON" | jq -r '
  .manual_required[] |
  "| `\(.hash[0:7])` | \(.subject) | \(.reason) |"
')

CONFLICT_NOTES=$(echo "$SUMMARY_JSON" | jq -r '
  .cherry_picked[] | select(.conflict_resolved == true) |
  "- **`\(.hash[0:7])`** \(.subject)\n  \(.conflict_resolution_note)"
')

{
  echo "## Upstream rrweb sync — $DATE"
  echo ""
  echo "Automatically cherry-picked **$PICKED** upstream commit(s) from [rrweb-io/rrweb](https://github.com/rrweb-io/rrweb)."
  echo ""
  echo "**Sync range:** \`$LAST_SYNC\` → \`$LAST_UPSTREAM_HASH\`"
  echo ""
  echo "### Cherry-picked commits"
  echo ""
  echo "| Commit | Subject | Risk | Notes |"
  echo "|--------|---------|------|-------|"
  echo "$ROWS"
  echo ""

  if [ -n "$CONFLICT_NOTES" ]; then
    echo "### ⚠️ Auto-resolved conflicts"
    echo ""
    echo "The following commits had conflicts that were resolved automatically."
    echo "Give these extra scrutiny before merging."
    echo ""
    echo -e "$CONFLICT_NOTES"
    echo ""
  fi

  MANUAL_COUNT=$(echo "$SUMMARY_JSON" | jq '.manual_required | length')
  if [ "$MANUAL_COUNT" -gt 0 ]; then
    echo "### Manual cherry-pick required"
    echo ""
    echo "| Commit | Subject | Reason |"
    echo "|--------|---------|--------|"
    echo "$MANUAL_ROWS"
    echo ""
  fi

  SKIPPED_COUNT=$(echo "$SUMMARY_JSON" | jq '.skipped | length')
  if [ "$SKIPPED_COUNT" -gt 0 ]; then
    echo "<details>"
    echo "<summary>Skipped commits ($SKIPPED_COUNT)</summary>"
    echo ""
    echo "| Commit | Subject | Reason |"
    echo "|--------|---------|--------|"
    echo "$SKIPPED_ROWS"
    echo ""
    echo "</details>"
  fi

  echo ""
  echo "---"
  echo "_Generated by [Upstream Sync Monitor](/.github/workflows/upstream-sync.yml)_"
} > "$PR_BODY_FILE"

echo "  PR body written to:  $PR_BODY_FILE"

# ── Step 9: Git log of cherry-picked commits on the branch ──────────

header "Step 9: Verify git history"

echo "  Commits on test branch (beyond origin/master):"
git log origin/master..HEAD --oneline | while read -r line; do
  echo "    $line"
done

# ── Done ─────────────────────────────────────────────────────────────

header "Test complete"

echo "  Results:"
echo "    Commits evaluated:  $SUBSET_COUNT"
echo "    Cherry-picked:      $PICKED"
echo "    Skipped:            $SKIPPED"
echo "    Manual required:    $MANUAL"
echo "    High-risk:          $HIGH_RISK"
echo "    Last upstream hash: $LAST_UPSTREAM_HASH"
echo "    Round-trip parse:   $([ "$PARSED_HASH" = "$LAST_UPSTREAM_HASH" ] && echo PASS || echo FAIL)"
echo ""
echo "  Output files:"
echo "    $SUMMARY_FILE"
echo "    $PR_TITLE_FILE"
echo "    $PR_BODY_FILE"
echo ""
echo "  Cleanup will run automatically..."
