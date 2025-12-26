# Contributing & Development Workflow

This document outlines the development workflow for The Dressing Room extension.

---

## 🌿 Branch Strategy

### Branch Types

```
main
  └─ Production-ready code
  └─ Always deployable to Chrome Web Store
  └─ Protected (no direct commits)

feature/*
  └─ New features in development
  └─ Example: feature/multi-currency-v2.1
  └─ Merge to main via PR when complete

hotfix/*
  └─ Urgent bug fixes
  └─ Example: hotfix/h&m-price-detection
  └─ Can be deployed immediately

release/*
  └─ Release preparation (optional)
  └─ Example: release/v2.1
  └─ For final testing before merging to main
```

---

## 🚀 Development Workflow

### 1. Starting a New Feature

```bash
# Make sure main is up to date
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Work on feature, commit frequently
git add .
git commit -m "Add XYZ functionality"

# Push to GitHub
git push -u origin feature/your-feature-name
```

### 2. During Development

**Commit Often:**
```bash
# Good commit messages
git commit -m "Add currency detection for IDR and PHP"
git commit -m "Fix price parsing for Indonesian format"
git commit -m "Update tests for multi-currency support"

# Push regularly (backup + collaboration)
git push
```

**Keep Feature Branch Updated:**
```bash
# If main branch gets updates while you're working
git checkout main
git pull origin main
git checkout feature/your-feature-name
git merge main  # Or: git rebase main (if comfortable with rebase)
```

### 3. Ready to Merge

**Before Creating PR:**
```bash
# Run tests (if you have them)
npm test

# Test manually in browser
# - Load extension in Chrome
# - Test all affected features
# - Test with different currencies/sites

# Make sure everything is committed
git status
git add .
git commit -m "Final tweaks for v2.1"
git push
```

**Create Pull Request on GitHub:**
1. Go to https://github.com/hanskasim/dressing-room
2. Click "Pull Requests" → "New Pull Request"
3. Base: `main` ← Compare: `feature/your-feature-name`
4. Fill in PR template (see below)
5. Review changes yourself first
6. Click "Create Pull Request"

**PR Template:**
```markdown
## Summary
Brief description of what this PR does

## Changes
- Added multi-currency support (15+ currencies)
- Updated price detection logic
- Added currency-grouped totals

## Testing
- [x] Tested with Indonesian Uniqlo (Rp)
- [x] Tested with Japanese Uniqlo (¥)
- [x] Tested with US stores ($)
- [x] Tested mixed currency totals
- [x] No regressions in existing features

## Screenshots
[Optional: Add before/after screenshots]

## Checklist
- [x] Code follows existing style
- [x] No console errors
- [x] Updated documentation if needed
- [x] Ready to merge
```

### 4. Merging to Main

```bash
# After PR is approved (or self-review if solo)
# Option A: Merge via GitHub UI (recommended)
# - Click "Merge Pull Request" on GitHub
# - Choose "Squash and merge" for clean history

# Option B: Merge via command line
git checkout main
git merge feature/your-feature-name --no-ff  # --no-ff preserves feature branch history
git push origin main
```

### 5. Tagging Releases

**After merge to main:**
```bash
# Update version in manifest.json first!
# Then create tag
git checkout main
git pull origin main
git tag -a v2.1 -m "Release v2.1: Multi-currency support"
git push origin v2.1

# View all tags
git tag -l
```

**Semantic Versioning:**
- `v2.0.1` - Patch (bug fixes)
- `v2.1.0` - Minor (new features, backward compatible)
- `v3.0.0` - Major (breaking changes)

---

## 🏷️ Version Management

### manifest.json Version Format

Chrome Web Store uses: `"version": "MAJOR.MINOR.PATCH.BUILD"`

**Our strategy:**
- `2.0` - Current production
- `2.1` - Next minor release (new features)
- `2.0.1` - Hotfix release (bug fixes only)
- `3.0` - Major release (with API/currency conversion)

**Update manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "The Dressing Room",
  "version": "2.1",  // ← Update this!
  "description": "Save fashion items from any store and track prices!"
}
```

---

## 🔄 Reverting Changes (If Needed)

### Scenario 1: Revert Last Commit (Not Pushed)
```bash
git reset --soft HEAD~1  # Keeps changes, undoes commit
# OR
git reset --hard HEAD~1  # Discards changes completely
```

### Scenario 2: Revert After Push
```bash
# Create revert commit (safe, preserves history)
git revert HEAD
git push

# Or revert specific commit
git log  # Find commit hash
git revert abc123
git push
```

### Scenario 3: Go Back to Previous Version
```bash
# Check available tags/versions
git tag -l

# Checkout specific version
git checkout v2.0  # Detached HEAD state (read-only)

# Create branch from old version
git checkout -b hotfix/revert-to-v2.0 v2.0
```

### Scenario 4: Nuclear Option (DANGER!)
```bash
# Reset main to previous tag (ONLY if not deployed!)
git checkout main
git reset --hard v2.0
git push --force  # ⚠️ DANGEROUS - only use if you know what you're doing!
```

**Recommendation:** Use `git revert` instead of `git reset --hard` for safety.

---

## 📦 Release Checklist

Before deploying to Chrome Web Store:

### Code Quality
- [ ] All features working as expected
- [ ] No console errors or warnings
- [ ] Code is clean and commented
- [ ] Removed debug logging

### Testing
- [ ] Tested on multiple websites (3-5 different brands)
- [ ] Tested edge cases (no price, multiple prices, sale prices)
- [ ] Tested with different currencies (if applicable)
- [ ] Tested existing features (no regressions)
- [ ] Tested data migration (if schema changed)

### Documentation
- [ ] Updated README.md if needed
- [ ] Updated IMPLEMENTATION_PLAN if applicable
- [ ] Created/updated CHANGELOG.md
- [ ] Privacy policy updated (if data handling changed)

### Version Control
- [ ] Updated manifest.json version
- [ ] All changes committed and pushed
- [ ] Created git tag for release
- [ ] Merged feature branch to main

### Chrome Web Store
- [ ] Created new zip file
- [ ] Uploaded to Chrome Web Store
- [ ] Updated store listing (if needed)
- [ ] Screenshots updated (if UI changed)
- [ ] Submitted for review

### Post-Release
- [ ] Monitor for errors/issues
- [ ] Respond to user reviews
- [ ] Plan next version based on feedback

---

## 🐛 Hotfix Process (Urgent Bugs)

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# 2. Fix the bug
# ... make changes ...
git commit -m "Fix critical bug in price detection"

# 3. Test thoroughly
# ... test in browser ...

# 4. Bump version (patch number)
# manifest.json: "2.0" → "2.0.1"

# 5. Merge to main
git checkout main
git merge hotfix/critical-bug-fix
git push origin main

# 6. Tag and release
git tag v2.0.1 -m "Hotfix: Fix price detection bug"
git push origin v2.0.1

# 7. Deploy to Chrome Web Store immediately
```

---

## 📊 Commit Message Guidelines

### Format
```
<type>: <short summary>

<optional detailed description>

<optional footer>
```

### Types
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks

### Examples
```bash
# Good
git commit -m "feat: Add multi-currency support for Asian markets"
git commit -m "fix: H&M price detection with obfuscated classes"
git commit -m "docs: Update implementation plan for v2.1"

# Bad
git commit -m "updates"
git commit -m "fixed stuff"
git commit -m "WIP"
```

---

## 🔍 Code Review Checklist (Self-Review)

Before merging your PR, check:

### Functionality
- [ ] Feature works as described
- [ ] Edge cases handled
- [ ] Error handling in place
- [ ] No breaking changes (or documented if intentional)

### Code Quality
- [ ] Functions are small and focused
- [ ] Variables/functions have clear names
- [ ] No duplicate code
- [ ] No commented-out code
- [ ] Console.logs removed (or kept for debugging with clear comments)

### Performance
- [ ] No unnecessary loops or operations
- [ ] Efficient DOM queries
- [ ] No memory leaks

### Security
- [ ] No XSS vulnerabilities
- [ ] No injection risks
- [ ] User input sanitized

### Compatibility
- [ ] Works on Chrome (primary)
- [ ] Manifest v3 compliant
- [ ] No deprecated APIs

---

## 📝 Changelog Format

Keep a `CHANGELOG.md` in the root:

```markdown
# Changelog

## [2.1.0] - 2025-01-26

### Added
- Multi-currency support (15+ currencies)
- Currency-grouped totals display
- Smart number parsing for international formats

### Fixed
- H&M price detection with obfuscated class names
- Price limits now currency-aware

### Changed
- Price detection now searches all span/div elements

## [2.0.0] - 2025-01-15

### Added
- Initial production release
- Price tracking and history
- Brand filters
- Sale detection

...
```

---

## 🆘 Getting Help

**Stuck?**
1. Check existing documentation (README, IMPLEMENTATION_PLAN)
2. Search GitHub issues
3. Create new issue with details
4. Ask in PR comments

**Found a bug?**
1. Check if already reported
2. Create issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser/OS details

---

## 🎯 Best Practices

### DO:
✅ Commit frequently with clear messages
✅ Test before pushing
✅ Keep feature branches short-lived (< 1 week)
✅ Update documentation as you code
✅ Ask for help when stuck

### DON'T:
❌ Commit directly to main
❌ Push broken code
❌ Leave features incomplete for long periods
❌ Skip testing
❌ Ignore merge conflicts

---

## 🔐 GitHub Settings Recommendations

### Protect Main Branch:
1. Go to: Settings → Branches → Branch protection rules
2. Branch name pattern: `main`
3. Enable:
   - [x] Require pull request reviews before merging
   - [x] Require status checks to pass (if you add CI/CD)
   - [x] Require branches to be up to date
   - [ ] Include administrators (optional, allows you to override)

### Enable Issues:
1. Settings → Features → Issues: ✅ Enabled
2. Create issue templates for bugs and features

### Tags/Releases:
1. After tagging, create GitHub Release
2. Go to: Releases → Draft a new release
3. Choose tag, add release notes
4. Attach .zip file for Chrome Web Store

---

This workflow ensures:
- ✅ Clean git history
- ✅ Easy version rollback
- ✅ Safe experimentation in feature branches
- ✅ Production main branch
- ✅ Clear documentation trail
