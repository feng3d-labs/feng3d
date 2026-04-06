import path from 'path';
import dts from 'rollup-plugin-dts';
import json from 'rollup-plugin-json';
import typescript from 'rollup-plugin-typescript';
import pkg from './package.json';

/**
 * Get a list of the non-private sorted packages with Lerna v3
 * @see https://github.com/lerna/lerna/issues/1848
 * @return {Promise<Package[]>} List of packages
 */
async function main()
{
    const results = [];

    const namespaces = {};
    namespaces[pkg.name] = pkg.namespace || 'feng3d';
    for (const key in pkg.dependencies)
    {
        namespaces[key] = 'feng3d';
    }

    // Check for bundle folder
    const external = Object.keys(pkg.dependencies || []);
    const basePath = path.relative(__dirname, '');
    const input = path.join(basePath, 'src/index.ts');

    const {
        standalone,
    } = pkg;
    const types = pkg.dts;

    results.push({
        input,
        external: standalone ? [] : external,
        output: [{
            file: path.join(basePath, types),
            name: namespaces[pkg.name],
            format: 'es',
            footer: `export as namespace ${namespaces[pkg.name]};`
        }],
        plugins: [
            json(),
            typescript({ tsconfig: './tsconfig.json' }),
            dts({ respectExternal: true }),
        ],
    });

    return results;
}

export default main();
