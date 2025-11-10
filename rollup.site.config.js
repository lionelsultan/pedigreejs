import path from 'path';
import postcss from 'rollup-plugin-postcss';

const version = process.env.npm_package_version;
const cssOutput = path.resolve('build', 'site.' + version + '.css');

export default {
	input: 'frontpage/site-style.js',
	plugins: [
		postcss({
			extract: cssOutput,
			minimize: true
		})
	],
	output: {
		file: 'build/site-style.js',
		format: 'esm'
	},
	treeshake: false
};
