import svelte from 'rollup-plugin-svelte';
import postcss from 'rollup-plugin-postcss';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';
import path from 'path';

const production = !process.env.ROLLUP_WATCH;
const cesiumBuildPath = 'node_modules/cesium/Build/Cesium'

export default {
	input: 'src/svelte.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/build/bundle.js'
	},
	plugins: [
		svelte({
			// enable run-time checks when not in production
			dev: !production,
			// we'll extract any component CSS out into
			// a separate file - better for performance
			css: css => {
				css.write('public/build/bundle.css');
			}
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),

		postcss({
			extensions: [ '.css' ]
		}),
		copy({
			targets: [
				{ src: path.join(cesiumBuildPath, 'Assets'), dest: 'public/build/' },
				{ src: path.join(cesiumBuildPath, 'ThirdParty'), dest: 'public/build/' },
				{ src: path.join(cesiumBuildPath, 'Widgets'), dest: 'public/build/' },
				{ src: path.join(cesiumBuildPath, 'Workers'), dest: 'public/build/' },
			],
		}),
		commonjs(),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('public'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};

function serve() {
	let started = false;

	return {
		writeBundle() {
			if (!started) {
				started = true;

				require('child_process').spawn('npm', ['run', 'svelte-start', '--', '--dev'], {
					stdio: ['ignore', 'inherit', 'inherit'],
					shell: true
				});
			}
		}
	};
}