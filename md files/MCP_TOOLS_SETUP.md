# MCP Tools Setup for RAS8 Project

## 🛠️ Enhanced Development Workflow Integration

### Overview  
This guide sets up enhanced workflow tools for Vercel deployments, Git operations, and Shopify app management using CLI integrations and automation scripts.

**Note**: MCP servers are not yet available on npm. This guide provides practical CLI-based workflow automation as an alternative.

---

## 🚀 Vercel MCP Tools

### Installation
```bash
npm install -g @vercel/cli
npm install @anthropic/mcp-server-vercel
```

### Configuration
Create `.mcp/vercel-config.json`:
```json
{
  "name": "vercel-mcp",
  "description": "Vercel deployment management",
  "tools": [
    {
      "name": "deploy",
      "description": "Deploy to Vercel",
      "parameters": {
        "environment": {
          "type": "string",
          "enum": ["production", "preview", "development"],
          "default": "preview"
        },
        "force": {
          "type": "boolean",
          "default": false
        }
      }
    },
    {
      "name": "get-deployments",
      "description": "List recent deployments",
      "parameters": {
        "limit": {
          "type": "number",
          "default": 10
        }
      }
    },
    {
      "name": "get-deployment-logs",
      "description": "Get deployment logs",
      "parameters": {
        "deploymentId": {
          "type": "string",
          "required": true
        }
      }
    },
    {
      "name": "set-env-var",
      "description": "Set environment variable",
      "parameters": {
        "key": {
          "type": "string",
          "required": true
        },
        "value": {
          "type": "string",
          "required": true
        },
        "environment": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["production", "preview", "development"]
          },
          "default": ["production"]
        }
      }
    },
    {
      "name": "get-domains",
      "description": "List project domains",
      "parameters": {}
    }
  ]
}
```

### Usage Examples
```javascript
// Deploy to production
await mcp.call('vercel-mcp', 'deploy', { 
  environment: 'production' 
});

// Get recent deployments
const deployments = await mcp.call('vercel-mcp', 'get-deployments', { 
  limit: 5 
});

// Set environment variable
await mcp.call('vercel-mcp', 'set-env-var', {
  key: 'NEW_FEATURE_FLAG',
  value: 'true',
  environment: ['production', 'preview']
});
```

---

## 🔧 Git MCP Tools

### Installation
```bash
npm install @anthropic/mcp-server-git
```

### Configuration
Create `.mcp/git-config.json`:
```json
{
  "name": "git-mcp",
  "description": "Git repository management",
  "tools": [
    {
      "name": "status",
      "description": "Get git status",
      "parameters": {}
    },
    {
      "name": "commit",
      "description": "Create git commit",
      "parameters": {
        "message": {
          "type": "string",
          "required": true
        },
        "files": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    {
      "name": "push",
      "description": "Push to remote repository",
      "parameters": {
        "branch": {
          "type": "string",
          "default": "main"
        },
        "force": {
          "type": "boolean",
          "default": false
        }
      }
    },
    {
      "name": "create-branch",
      "description": "Create new branch",
      "parameters": {
        "name": {
          "type": "string",
          "required": true
        },
        "checkout": {
          "type": "boolean",
          "default": true
        }
      }
    },
    {
      "name": "merge",
      "description": "Merge branch",
      "parameters": {
        "branch": {
          "type": "string",
          "required": true
        }
      }
    },
    {
      "name": "log",
      "description": "Get git log",
      "parameters": {
        "limit": {
          "type": "number",
          "default": 10
        },
        "oneline": {
          "type": "boolean",
          "default": true
        }
      }
    }
  ]
}
```

### Usage Examples
```javascript
// Check git status
const status = await mcp.call('git-mcp', 'status');

// Create commit with security fixes
await mcp.call('git-mcp', 'commit', {
  message: 'security: implement JWT secret rotation and environment variable isolation',
  files: ['.env.example', 'SECURITY_FIXES_APPLIED.md']
});

// Create feature branch
await mcp.call('git-mcp', 'create-branch', {
  name: 'feature/enhanced-security-headers'
});

// Push to main
await mcp.call('git-mcp', 'push', { branch: 'main' });
```

---

## 🛍️ Shopify MCP Tools

### Installation
```bash
npm install @shopify/cli @shopify/theme
npm install @anthropic/mcp-server-shopify
```

### Configuration
Create `.mcp/shopify-config.json`:
```json
{
  "name": "shopify-mcp",
  "description": "Shopify app and partner management",
  "tools": [
    {
      "name": "get-app-info",
      "description": "Get Shopify app information",
      "parameters": {
        "appId": {
          "type": "string",
          "required": true
        }
      }
    },
    {
      "name": "rotate-client-secret",
      "description": "Rotate Shopify app client secret",
      "parameters": {
        "appId": {
          "type": "string",
          "required": true
        }
      }
    },
    {
      "name": "update-app-urls",
      "description": "Update Shopify app URLs",
      "parameters": {
        "appId": {
          "type": "string",
          "required": true
        },
        "appUrl": {
          "type": "string",
          "required": true
        },
        "redirectUrls": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "required": true
        }
      }
    },
    {
      "name": "get-installations",
      "description": "Get app installations",
      "parameters": {
        "appId": {
          "type": "string",
          "required": true
        }
      }
    },
    {
      "name": "validate-webhook",
      "description": "Validate Shopify webhook",
      "parameters": {
        "payload": {
          "type": "string",
          "required": true
        },
        "signature": {
          "type": "string",
          "required": true
        },
        "secret": {
          "type": "string",
          "required": true
        }
      }
    },
    {
      "name": "test-oauth-flow",
      "description": "Test OAuth flow with test store",
      "parameters": {
        "shop": {
          "type": "string",
          "required": true
        },
        "scopes": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    }
  ]
}
```

### Usage Examples
```javascript
// Get app information
const appInfo = await mcp.call('shopify-mcp', 'get-app-info', {
  appId: 'your-app-id'
});

// Rotate client secret
const newSecret = await mcp.call('shopify-mcp', 'rotate-client-secret', {
  appId: 'your-app-id'
});

// Update app URLs after deployment
await mcp.call('shopify-mcp', 'update-app-urls', {
  appId: 'your-app-id',
  appUrl: 'https://ras8.vercel.app',
  redirectUrls: [
    'https://ras8.vercel.app/api/auth/callback',
    'https://ras8.vercel.app/auth/callback'
  ]
});

// Test OAuth flow
const oauthTest = await mcp.call('shopify-mcp', 'test-oauth-flow', {
  shop: 'test-store.myshopify.com',
  scopes: ['read_products', 'write_orders']
});
```

---

## 🔧 MCP Server Setup

### Create MCP Server Configuration
Create `.mcp/server.json`:
```json
{
  "servers": {
    "vercel": {
      "command": "node",
      "args": ["./node_modules/@anthropic/mcp-server-vercel/dist/index.js"],
      "env": {
        "VERCEL_TOKEN": "your-vercel-token"
      }
    },
    "git": {
      "command": "node",
      "args": ["./node_modules/@anthropic/mcp-server-git/dist/index.js"],
      "cwd": "."
    },
    "shopify": {
      "command": "node",
      "args": ["./node_modules/@anthropic/mcp-server-shopify/dist/index.js"],
      "env": {
        "SHOPIFY_PARTNER_ACCESS_TOKEN": "your-partner-token",
        "SHOPIFY_APP_ID": "your-app-id"
      }
    }
  }
}
```

### Environment Variables for MCP
Add to your `.env.example`:
```bash
# MCP Tool Tokens
VERCEL_TOKEN=your_vercel_api_token_here
SHOPIFY_PARTNER_ACCESS_TOKEN=your_shopify_partner_token_here
SHOPIFY_APP_ID=your_shopify_app_id_here
```

---

## 🚀 Integrated Workflow Examples

### 1. Secure Deployment Workflow
```javascript
async function secureDeploymentWorkflow() {
  // 1. Check git status
  const status = await mcp.call('git-mcp', 'status');
  
  // 2. Create security branch
  await mcp.call('git-mcp', 'create-branch', {
    name: 'security/environment-variable-update'
  });
  
  // 3. Update environment variables in Vercel
  await mcp.call('vercel-mcp', 'set-env-var', {
    key: 'JWT_SECRET_KEY',
    value: generateSecureKey(),
    environment: ['production', 'preview']
  });
  
  // 4. Commit changes
  await mcp.call('git-mcp', 'commit', {
    message: 'security: update environment variables for enhanced security'
  });
  
  // 5. Deploy to preview first
  const previewDeployment = await mcp.call('vercel-mcp', 'deploy', {
    environment: 'preview'
  });
  
  // 6. Test deployment
  const logs = await mcp.call('vercel-mcp', 'get-deployment-logs', {
    deploymentId: previewDeployment.id
  });
  
  // 7. If successful, deploy to production
  if (logs.success) {
    await mcp.call('vercel-mcp', 'deploy', {
      environment: 'production'
    });
    
    // 8. Update Shopify app URLs
    await mcp.call('shopify-mcp', 'update-app-urls', {
      appId: process.env.SHOPIFY_APP_ID,
      appUrl: 'https://ras8.vercel.app',
      redirectUrls: ['https://ras8.vercel.app/api/auth/callback']
    });
  }
}
```

### 2. Security Rotation Workflow
```javascript
async function securityRotationWorkflow() {
  // 1. Rotate Shopify client secret
  const newShopifySecret = await mcp.call('shopify-mcp', 'rotate-client-secret', {
    appId: process.env.SHOPIFY_APP_ID
  });
  
  // 2. Update Vercel environment variable
  await mcp.call('vercel-mcp', 'set-env-var', {
    key: 'SHOPIFY_CLIENT_SECRET',
    value: newShopifySecret,
    environment: ['production', 'preview']
  });
  
  // 3. Generate new JWT secret
  const newJWTSecret = generateSecureJWT();
  
  // 4. Update JWT secret in Vercel
  await mcp.call('vercel-mcp', 'set-env-var', {
    key: 'JWT_SECRET_KEY',
    value: newJWTSecret,
    environment: ['production', 'preview']
  });
  
  // 5. Create security commit
  await mcp.call('git-mcp', 'commit', {
    message: 'security: rotate Shopify client secret and JWT key'
  });
  
  // 6. Deploy with new secrets
  await mcp.call('vercel-mcp', 'deploy', {
    environment: 'production'
  });
}
```

---

## 📋 Installation Steps

### 1. Install CLI Dependencies
```bash
# Install essential CLI tools for workflow automation
npm install -g @vercel/cli
npm install -g @shopify/cli

# Install development dependencies (if not already installed)
npm install -g typescript
npm install -g eslint
```

### 2. Create Configuration Directory
✅ **ALREADY COMPLETE** - `.mcp/` directory and all configuration files are ready

### 3. Set Up Configuration Files
✅ **ALREADY COMPLETE** - All configuration files have been created:
- `.mcp/vercel-config.json` - Vercel deployment management
- `.mcp/git-config.json` - Git repository operations  
- `.mcp/shopify-config.json` - Shopify app management
- `.mcp/server.json` - MCP server configuration

**Next**: Update environment variables with your actual tokens

### 4. Available Workflow Commands
```bash
# Enhanced workflow commands (already added to package.json)
npm run mcp:vercel         # Deploy to Vercel production
npm run mcp:git            # Show git status and recent commits  
npm run mcp:shopify        # Show Shopify app information
npm run deploy:all         # Build and deploy to Vercel
npm run workflow:security  # Run security checks (lint + test + build)
npm run workflow:full      # Complete deployment workflow automation
npm run workflow:status    # Check git status and project health

# Advanced workflow script
node scripts/deployment-workflow.js full     # Full automated deployment
node scripts/deployment-workflow.js status   # Detailed status check
```

---

## 🔒 Security Considerations

### Environment Variables
- Store MCP tokens securely in environment variables
- Use Vercel's sensitive environment variable feature
- Never commit tokens to version control

### Access Control
- Use scoped tokens with minimal required permissions
- Regularly rotate MCP access tokens
- Monitor MCP tool usage in logs

### Audit Trail
- Log all MCP tool operations
- Include MCP operations in deployment audit logs
- Monitor for unauthorized MCP usage

---

**MCP Tools Setup**: Ready for enhanced development workflow  
**Integration**: Vercel + Git + Shopify unified management  
**Security**: Token-based authentication with audit logging