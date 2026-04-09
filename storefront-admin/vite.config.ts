import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: {
		// Pre-bundle per-icon Lucide entrypoints so route code-splitting does not race
		// with dep optimization (avoids intermittent NetworkError on dynamic import in dev).
		include: ['@lucide/svelte/icons/map-pin']
	},
	ssr: {
		// This tells Vite: "Don't let Node handle these, compile them first"
		noExternal: ['sveltekit-superforms']
	},
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:8000',
				changeOrigin: true,
				rewrite: (p) => p.replace(/^\/api/, '')
			}
		},
		watch: {
			ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.DS_Store']
		},
		warmup: {
			clientFiles: ['./src/routes/**/*.svelte']
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
