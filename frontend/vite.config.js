import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

/** Stamp the service worker with the current build timestamp so returning
 *  users get fresh assets after every deploy. */
function swVersionPlugin() {
  return {
    name: 'sw-version',
    closeBundle() {
      const swPath = path.resolve('dist', 'sw.js')
      if (!fs.existsSync(swPath)) return
      const version = Date.now().toString(36)
      let code = fs.readFileSync(swPath, 'utf-8')
      code = `self.__SW_CACHE_VERSION = '${version}';\n` + code
      fs.writeFileSync(swPath, code)
    },
  }
}

export default defineConfig({
  plugins: [react(), swVersionPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
