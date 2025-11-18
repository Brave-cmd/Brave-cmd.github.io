/** WARNING: DON'T EDIT THIS FILE */
/** WARNING: DON'T EDIT THIS FILE */
/** WARNING: DON'T EDIT THIS FILE */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

function getPlugins() {
  const plugins = [react(), tsconfigPaths()];
  return plugins;
}

export default defineConfig({
    base: '/', // 仅添加这一行（用户主页仓库必须配置为根路径）
  plugins: getPlugins(),
  server: {
    port: 3000, // Vite项目端口（默认3000，若修改需同步此处）
    allowedHosts: ['xk116414214m.vicp.fun'], // 允许花生壳域名访问
    proxy: {
      '/api/xfyun': {
        target: 'https://spark-api-open.xf-yun.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/xfyun/, ''),
      },
    },
  },
});