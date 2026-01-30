import { defineConfig } from '@vben/vite-config';

import ElementPlus from 'unplugin-element-plus/vite';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      // sockjs-client
      define: {
        global: 'window',
      },
      plugins: [
        ElementPlus({
          format: 'esm',
        }),
      ],
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            target: 'http://localhost:8888',
            ws: true,
          }
          // '/file': {
          //   changeOrigin: true,
          //   target: 'http://localhost:8888',
          //   ws: true,
          // },
        },
      },
    },
  };
});
