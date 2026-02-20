import { defineConfig } from 'vite'

// Pages Functions モード: 静的ファイルのみコピー
export default defineConfig({
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // ビルドをスキップ（publicフォルダのコピーのみ）
    rollupOptions: {
      input: []
    }
  }
})
