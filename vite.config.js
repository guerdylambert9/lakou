import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Two builds from one codebase:
//   npm run build           -> normal web app in dist/ (React bundled)
//   npm run build:artifact  -> one self-contained HTML file in dist-artifact/,
//                              with React loaded from a CDN instead of bundled.
const REACT_CDN = [
  'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js',
  'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js',
]

function cdnReact() {
  return {
    name: 'lakou-cdn-react',
    transformIndexHtml() {
      return REACT_CDN.map((src) => ({ tag: 'script', attrs: { src }, injectTo: 'head' }))
    },
  }
}

export default defineConfig(({ mode }) => {
  const artifact = mode === 'artifact'
  return {
    // Classic JSX (React.createElement) works with both the bundled and the CDN build.
    plugins: [react({ jsxRuntime: 'classic' }), artifact && cdnReact(), artifact && viteSingleFile()].filter(Boolean),
    build: artifact
      ? {
          outDir: 'dist-artifact',
          rollupOptions: {
            external: ['react', 'react-dom', 'react-dom/client'],
            output: {
              format: 'iife',
              globals: { react: 'React', 'react-dom': 'ReactDOM', 'react-dom/client': 'ReactDOM' },
            },
          },
        }
      : { outDir: 'dist' },
    test: { environment: 'node' },
  }
})
