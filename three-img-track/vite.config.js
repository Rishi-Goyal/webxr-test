import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    basicSsl({
      name: 'test',                    // Certification name
      domains: ['*.custom.com'],        // Trusted domains
      certDir: '/Users/.../.devServer/cert'  // Certification directory
    })
  ],
  server: {
    https: true,                       // Enable HTTPS
  },
})
