import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/lls-panel/',  // ← 加入這一行，名稱需與 GitHub 倉庫名稱相同
})