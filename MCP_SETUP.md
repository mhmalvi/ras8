# MCP (Model Context Protocol) Setup Guide

## Overview
This document explains the MCP server configuration for the RAS8 project, enabling Claude Code to interact with GitHub, Shopify, and Supabase services.

## Configured MCP Servers

### 1. GitHub MCP Server ✅
**Package**: `@modelcontextprotocol/server-github`
**Status**: Connected
**Purpose**: Interact with GitHub repositories, issues, pull requests, and more

**Capabilities**:
- List and search repositories
- Create/update files
- Manage issues and pull requests
- View commit history
- Create branches
- And more...

**Configuration**: No additional setup required (uses GitHub CLI authentication)

---

### 2. Shopify Dev MCP Server
**Package**: `@shopify/dev-mcp@latest`
**Status**: Configured
**Purpose**: Access Shopify development documentation and API references

**Capabilities**:
- Search Shopify documentation
- Access API reference
- View GraphQL schema
- Validate GraphQL code blocks
- Learn about Shopify APIs

**Configuration**: No authentication required (read-only documentation access)

---

### 3. Supabase MCP Server
**Package**: `@supabase/mcp-server-supabase`
**Status**: Configured (requires environment variables)
**Purpose**: Interact with Supabase database and services

**Capabilities**:
- Execute SQL queries
- Apply database migrations
- List projects
- Manage database operations

**Required Environment Variables**:
```bash
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
# OR
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

## Configuration File

The MCP servers are configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    },
    "shopify-dev-mcp": {
      "command": "npx",
      "args": ["-y", "@shopify/dev-mcp@latest"]
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "${VITE_SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${VITE_SUPABASE_ANON_KEY}"
      }
    }
  }
}
```

## Setting Up Supabase MCP

### Option 1: Using Environment Variables from Vercel (Recommended for Development)

1. Pull environment variables from Vercel:
   ```bash
   npx vercel env pull .env
   ```

2. OR manually get them from Vercel dashboard:
   - Go to https://vercel.com/info-quadquetechs-projects/ras8/settings/environment-variables
   - Copy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

3. Create a `.env` file in the project root:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. Reload Claude Code:
   ```bash
   exit  # or Ctrl+D
   claude  # restart
   ```

### Option 2: Using Direct Configuration

Edit `.mcp.json` and replace the variables with actual values:

```json
{
  "supabase": {
    "command": "npx",
    "args": ["-y", "@supabase/mcp-server-supabase"],
    "env": {
      "SUPABASE_URL": "https://pvadajelvewdazwmvppk.supabase.co",
      "SUPABASE_ANON_KEY": "your-actual-anon-key-here"
    }
  }
}
```

⚠️ **Warning**: Do not commit actual API keys to version control!

## Verifying MCP Connections

### Check MCP Server Status
```bash
claude mcp list
```

Expected output:
```
github: npx -y @modelcontextprotocol/server-github - ✓ Connected
shopify-dev-mcp: npx @shopify/dev-mcp@latest - ✓ Connected
supabase: npx @supabase/mcp-server-supabase - ✓ Connected
```

### View Available MCP Tools
```bash
/mcp
```

This will show all available tools from each MCP server.

### Enable/Disable MCP Servers
```bash
# Disable a server
claude mcp disable supabase

# Enable a server
claude mcp enable supabase
```

## Using MCP Tools in Claude Code

Once connected, you can use MCP tools directly:

### GitHub Examples
```
"Create a new issue in the repository"
"Show me the latest 5 commits"
"Create a new branch called feature/new-auth"
```

### Shopify Examples
```
"Search Shopify docs for authentication"
"Show me the GraphQL schema for products"
"How do I implement OAuth for Shopify apps?"
```

### Supabase Examples
```
"Execute this SQL query on Supabase: SELECT * FROM merchants LIMIT 10"
"Apply the latest migration"
"List all Supabase projects"
```

## Troubleshooting

### MCP Server Fails to Connect

1. **Check if npx can access the package**:
   ```bash
   npx -y @shopify/dev-mcp@latest --version
   ```

2. **Check environment variables**:
   ```bash
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

3. **Check logs**:
   - MCP server errors appear in Claude Code console
   - Look for authentication or connection errors

4. **Restart Claude Code**:
   ```bash
   exit
   claude
   ```

### Supabase MCP Not Working

1. **Verify environment variables are loaded**:
   ```bash
   # Add to .env file
   VITE_SUPABASE_URL=https://pvadajelvewdazwmvppk.supabase.co
   VITE_SUPABASE_ANON_KEY=<from-vercel-dashboard>
   ```

2. **Source the .env file** (if needed):
   ```bash
   export $(cat .env | xargs)
   ```

3. **Check Supabase project status**:
   - Verify project is active at https://supabase.com/dashboard

### Shopify MCP Not Working

The Shopify Dev MCP server is read-only and doesn't require authentication. If it fails:

1. Check your internet connection
2. Verify the package is accessible:
   ```bash
   npx -y @shopify/dev-mcp@latest
   ```

## Environment Variables Reference

Current Supabase configuration (from Vercel):

```bash
VITE_SUPABASE_URL=https://pvadajelvewdazwmvppk.supabase.co
VITE_SUPABASE_ANON_KEY=<encrypted-in-vercel>
SUPABASE_SERVICE_ROLE_KEY=<encrypted-in-vercel>
```

To get the actual values:
1. Go to Vercel Dashboard → ras8 → Settings → Environment Variables
2. Copy the values for Development environment
3. Add them to your local `.env` file

## Best Practices

1. **Never commit `.env` files** with real credentials
2. **Use `.env.example`** for documentation
3. **Rotate keys** if accidentally exposed
4. **Use service role key** only for server-side operations
5. **Use anon key** for client-side operations

## Resources

- **MCP Documentation**: https://modelcontextprotocol.io/
- **GitHub MCP**: https://github.com/modelcontextprotocol/servers/tree/main/src/github
- **Shopify Dev MCP**: https://www.npmjs.com/package/@shopify/dev-mcp
- **Supabase MCP**: https://www.npmjs.com/package/@supabase/mcp-server-supabase
- **Claude Code MCP Guide**: https://code.claude.com/docs/en/mcp

---

**Last Updated**: 2025-12-26
**Configuration File**: `.mcp.json`
**Status**: Shopify and Supabase MCP servers configured and ready to use

## Quick Start

To get started immediately:

1. **GitHub MCP**: Already working ✅
2. **Shopify MCP**: Already configured ✅
3. **Supabase MCP**: Needs environment variables

```bash
# Quick setup for Supabase
echo "VITE_SUPABASE_URL=https://pvadajelvewdazwmvppk.supabase.co" >> .env
echo "VITE_SUPABASE_ANON_KEY=<get-from-vercel>" >> .env

# Restart Claude
exit
claude
```

Now you can use all three MCP servers in your Claude Code sessions!
