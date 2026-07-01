import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // 개발 중 /api 요청을 로컬 수정요청 DB 서버(3001)로 프록시
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
