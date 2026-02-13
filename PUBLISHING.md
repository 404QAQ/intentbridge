# Publishing Guide

This guide explains how to publish IntentBridge to npm.

## Prerequisites

1. Node.js >= 18.0.0
2. npm account with publish permissions
3. Verified email on npm

## Pre-Publish Checklist

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with new version
- [ ] Run tests: `npm test`
- [ ] Build project: `npm run build`
- [ ] Verify build: `npm run dev -- --version`
- [ ] Test installation locally: `npm link`

## Publishing Steps

### 1. Login to npm

```bash
npm login
# Enter username, password, email
```

### 2. Verify you're logged in

```bash
npm whoami
# Should show your username
```

### 3. Dry Run (Optional)

Test what will be published:

```bash
npm publish --dry-run
```

This shows:
- Files that will be included
- Package size
- Any warnings

### 4. Publish

For stable release:
```bash
npm publish
```

For beta/alpha release:
```bash
npm publish --tag beta
# or
npm publish --tag next
```

### 5. Verify Publication

```bash
npm view intentbridge
```

Check that:
- Version is correct
- README displays properly
- All files are included

### 6. Create Git Tag

```bash
git tag -a v2.3.0 -m "Release v2.3.0"
git push origin v2.3.0
```

### 7. Create GitHub Release

1. Go to https://github.com/404QAQ/intentbridge/releases/new
2. Select tag: v2.3.0
3. Title: IntentBridge v2.3.0
4. Copy release notes from CHANGELOG.md
5. Publish release

## Version Management

### Semantic Versioning

- **MAJOR** (X.0.0) - Breaking changes
- **MINOR** (0.X.0) - New features, backward compatible
- **PATCH** (0.0.X) - Bug fixes

### Bump Version

```bash
# Patch release (bug fixes)
npm version patch

# Minor release (new features)
npm version minor

# Major release (breaking changes)
npm version major
```

## Post-Publish

### 1. Update Documentation

- Update README.md if needed
- Update CHANGELOG.md
- Update docs/

### 2. Announce Release

- Twitter: @intentbridge
- GitHub Discussions
- Discord community
- Blog post (for major releases)

### 3. Monitor

- Check npm download stats
- Monitor GitHub issues
- Watch for bug reports

## Troubleshooting

### Error: You do not have permission to publish

- Verify you're logged in: `npm whoami`
- Check if package name is taken: `npm search intentbridge`
- Contact package owner for access

### Error: Version already published

- Bump version in package.json
- Use `npm version patch/minor/major`

### Error: Package too large

- Check `.npmignore` settings
- Remove unnecessary files
- Consider splitting into multiple packages

## Rollback

If critical bug found:

```bash
npm unpublish intentbridge@2.3.0
```

Note: Can only unpublish within 72 hours

## Automation (Future)

Consider using:
- GitHub Actions for CI/CD
- semantic-release for automated versioning
- automated changelog generation
