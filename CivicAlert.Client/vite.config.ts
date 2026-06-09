import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}']
            },
            manifest: {
                name: 'Civic Alert Karachi',
                short_name: 'CivicAlert',
                theme_color: '#ffffff'
            }
        })
    ],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5035',  // your .NET API port
                changeOrigin: true,
                secure: false  // allows self-signed cert in dev
            },
            '/hubs': {
                target: 'http://localhost:5035',  // SignalR hub
                changeOrigin: true,
                secure: false,
                ws: true  // websocket support for SignalR
            },
            '/uploads': {
                target: 'http://localhost:5035',
                changeOrigin: true,
                secure: false
            }
        }
    }
})