
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
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
          '@': path.resolve(__dirname, './'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        chunkSizeWarningLimit: 2000, // Increase limit to 2MB to handle large AI and Chart libraries
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-ai': ['@google/genai'],
              'vendor-charts': ['recharts'],
              'vendor-motion': ['framer-motion']
            }
          }
        }
      }
    };
});
