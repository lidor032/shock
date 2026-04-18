import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    include: ['react-globe.gl', 'three'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  resolve: {
    alias: {
      // Force the classic WebGL build — three-globe doesn't support the WebGPU entry yet
      three: '/Users/lidor/Desktop/stam/node_modules/three/build/three.module.js',
    },
  },
})
