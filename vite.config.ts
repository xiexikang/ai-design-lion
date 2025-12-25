import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import { resolve } from 'path';
// https://vite.dev/config/
export default defineConfig({
  envPrefix: ['VITE', 'REACT_APP'],
  build: {
    sourcemap: 'hidden',
  },
   resolve: {
      // 别名
      alias: {
        '@root': resolve(__dirname, ''),
        '@': resolve(__dirname, 'src')
      },
      extensions: ['mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths()
  ],
})
