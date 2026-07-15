# Vercel CI/CD Setup Documentation

## Overview
This document outlines the CI/CD configuration for the RAS8 Shopify app deployed on Vercel.

## Current Configuration

### Project Details
- **Project Name**: ras8
- **Project ID**: prj_hg8wHWCS2dXpLfxT2cImJ9k7UdY1
- **Team/Org ID**: team_WU3jXeVAggHI8RqFopbE23M7
- **Production URL**: https://ras8.vercel.app
- **GitHub Repository**: https://github.com/mhmalvi/ras8.git

### Git Integration Status
✅ **GitHub repository is connected to Vercel**
- Automatic deployments are configured
- Git connection verified on: 2025-12-26

### Deployment Configuration

#### Production Branch
- **Branch**: `main`
- **Behavior**: Pushes to `main` trigger automatic production deployments
- **URL**: https://ras8.vercel.app

#### Preview Deployments
- **Branches**: All branches except `main`
- **Behavior**: Pushes to any branch create preview deployments
- **URL Pattern**: https://ras8-[deployment-id]-info-quadquetechs-projects.vercel.app

### Build Configuration (vercel.json)

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### Environment Variables
The following environment variables are configured in Vercel:

#### Production Environment
- `SHOPIFY_CLIENT_SECRET`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`
- `VITE_APP_URL`
- `VITE_SHOPIFY_CLIENT_ID`
- `VITE_DEV_MODE`
- `NODE_ENV`
- `JWT_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Preview Environment
- `VITE_DEV_MODE`
- `VITE_APP_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`

## CI/CD Workflow

### Automatic Deployment Process

1. **Code Push**
   - Developer pushes code to GitHub repository
   - Vercel webhook detects the push

2. **Build Trigger**
   - Vercel automatically starts a new deployment
   - Build environment: Node.js 22.x
   - Build location: Washington, D.C., USA (East) - iad1

3. **Build Steps**
   ```bash
   npm install              # Install dependencies
   npm run build            # Build the project (vite build)
   ```

4. **Deployment**
   - Built files from `dist/` directory are deployed
   - Production deployments are aliased to https://ras8.vercel.app
   - Preview deployments get unique URLs

### Manual Deployment

To manually trigger a deployment:

```bash
# Deploy to production
npx vercel --prod --yes

# Deploy to preview
npx vercel
```

## Verification Steps

### Check Deployment Status
```bash
# List recent deployments
npx vercel list

# Inspect specific deployment
npx vercel inspect <deployment-url>

# View deployment logs
npx vercel logs <deployment-url>
```

### Verify Git Integration
```bash
# Check if Git is connected
npx vercel git connect

# Expected output: "is already connected to your project"
```

### Test Automatic Deployment
1. Make a code change
2. Commit and push to a branch:
   ```bash
   git add .
   git commit -m "test: Verify CI/CD"
   git push origin <branch-name>
   ```
3. Check Vercel dashboard for new deployment
4. Preview deployment should appear within seconds

## Dashboard Access

### Vercel Dashboard URLs
- **Project Overview**: https://vercel.com/info-quadquetechs-projects/ras8
- **Deployments**: https://vercel.com/info-quadquetechs-projects/ras8/deployments
- **Settings**: https://vercel.com/info-quadquetechs-projects/ras8/settings

### Key Dashboard Features
- **Deployments Tab**: View all deployments (production & preview)
- **Settings > Git**: Configure repository and branch settings
- **Settings > Environment Variables**: Manage environment variables
- **Analytics**: Monitor performance and usage
- **Logs**: Debug deployment and runtime issues

## Branch Strategy

### Current Branch Configuration
- **main**: Production deployments
- **fix/auth-database-fallback-improvements**: Current working branch (preview deployments)
- Other branches: Automatic preview deployments

### Recommended Workflow
1. Create feature branch from `main`
2. Push commits to feature branch (creates preview deployments)
3. Test preview deployment
4. Merge to `main` via Pull Request
5. Production deployment triggers automatically

## Build Warnings & Notes

### TypeScript Warnings
The following TypeScript warnings appear during build but don't fail deployment:
```
api/merchants/[merchantId]/analytics.ts: Relative import paths need explicit file extensions
api/merchants/[merchantId]/dashboard.ts: Relative import paths need explicit file extensions
api/merchants/[merchantId]/returns.ts: Relative import paths need explicit file extensions
```

**Recommendation**: Update these imports to use `.js` extensions for better ECMAScript module compatibility.

### Bundle Size Warning
Main bundle (`index-DJiE_TEB-*.js`) is 2.2MB (461KB gzipped)

**Recommendations**:
- Implement code splitting using dynamic `import()`
- Use `build.rollupOptions.output.manualChunks` to improve chunking
- Consider lazy loading routes and heavy components

## Security Vulnerabilities

Current npm audit shows:
- **9 vulnerabilities**: 3 moderate, 6 high

**Action Required**:
```bash
npm audit fix
npm audit  # To view details
```

## Monitoring & Debugging

### Real-time Logs
```bash
# View production logs
npx vercel logs ras8.vercel.app --follow

# View specific deployment logs
npx vercel logs <deployment-url> --follow
```

### Deployment Inspection
```bash
# Get detailed deployment info
npx vercel inspect <deployment-url> --json

# View build logs
npx vercel inspect <deployment-url> --logs
```

## Troubleshooting

### Deployment Not Triggering
1. Check GitHub webhook in repository settings
2. Verify Vercel GitHub app has repository access
3. Check Vercel project settings > Git

### Build Failures
1. Check build logs in Vercel dashboard
2. Verify environment variables are set correctly
3. Test build locally: `npm run build`
4. Check for TypeScript or linting errors

### Preview Deployment Issues
1. Ensure branch is pushed to GitHub
2. Check Vercel dashboard for deployment status
3. Verify preview deployments are enabled in settings

## Package Scripts for CI/CD

Available npm scripts related to deployment:

```json
{
  "mcp:vercel": "npx vercel --prod",
  "deploy:all": "npm run build && npx vercel --prod",
  "workflow:security": "npm run lint && npm run test:run && npm run build",
  "workflow:full": "node scripts/deployment-workflow.js full",
  "workflow:status": "node scripts/deployment-workflow.js status"
}
```

## Next Steps

1. ✅ Vercel CLI authenticated
2. ✅ GitHub repository connected
3. ✅ Automatic deployments configured
4. ✅ Production deployment verified
5. ⚠️ Address TypeScript import warnings
6. ⚠️ Fix npm security vulnerabilities
7. 🔄 Consider implementing bundle size optimizations

## Support & Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel CLI Reference**: https://vercel.com/docs/cli
- **Git Integration Guide**: https://vercel.com/docs/deployments/git
- **Environment Variables**: https://vercel.com/docs/environment-variables

---

**Last Updated**: 2025-12-26
**Verified By**: Claude Code CI/CD Setup
