
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import cspHeaderPlugin from "./vite-csp-plugin.js";
import websocketPlugin from "./vite-websocket-plugin.js";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 8082,
    strictPort: true,
  },
  plugins: [
    react(),
    cspHeaderPlugin(),
    websocketPlugin(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Performance optimizations
  build: {
    // Reduce preload warnings by limiting module preloading
    modulePreload: {
      polyfill: false,
      resolveDependencies: (filename, deps) => {
        // Only preload critical dependencies
        return deps.filter(dep => 
          dep.includes('react') || 
          dep.includes('main') ||
          dep.includes('index')
        );
      }
    },
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Core chunks only
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
        // Force new chunk names with timestamp
        chunkFileNames: 'assets/js/[name]-[hash]-20250905.js',
        entryFileNames: 'assets/js/[name]-[hash]-20250905.js',
        assetFileNames: 'assets/[ext]/[name]-[hash]-20250905.[ext]'
      }
    },
    // Optimize bundle size
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: mode === 'development',
    // Increase chunk size limit to reduce splitting
    chunkSizeWarningLimit: 2000,
    // Enable CSS code splitting
    cssCodeSplit: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'recharts',
      'lucide-react',
      'date-fns'
    ],
    exclude: ['lovable-tagger']
  },
  // Add cache headers configuration
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  }
}));
