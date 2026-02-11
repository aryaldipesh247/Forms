
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Fix: Manually define __dirname and __filename for ESM environments where they are not globally available
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    // Fix: Using '.' instead of process.cwd() to avoid TypeScript errors when process types are missing or incorrect
    const env = loadEnv(mode, '.', '');
    const apiKey = env.GEMINI_API_KEY || env.API_KEY || '';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          // Fix: Now uses the defined __dirname to correctly resolve paths in ESM
          '@': path.resolve(__dirname, './'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        chunkSizeWarningLimit: 2000, 
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-ai': ['@google/genai'],
              'vendor-charts': ['recharts'],
              'vendor-motion': ['framer-motion'],
              'vendor-firebase': ['firebase/compat/app', 'firebase/compat/database']
            }
          }
        }
      }
    };
});