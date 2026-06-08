import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  server: {
    port: 3000,
    host: true, // expose dev server on LAN for mobile real-device testing
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy vendors so initial bundle stays under 250KB gzip
          'react-vendor': ['react', 'react-dom', 'react-router-dom', 'react-router'],
          'radix-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-slot',
            '@radix-ui/react-progress',
          ],
          'motion-vendor': ['motion'],
          'utils-vendor': [
            'zustand',
            'next-themes',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
            'sonner',
            'cmdk',
            '@number-flow/react',
          ],
          'icons-vendor': ['lucide-react'],
        },
      },
    },
  },
});
