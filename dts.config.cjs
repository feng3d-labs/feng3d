const pkg = require('./package.json');

const libraries = {
    inlinedLibraries: Object.keys(pkg.dependencies),
};

const output = {
    inlineDeclareGlobals: true,
    exportReferencedTypes: false,
    umdModuleName: 'feng3d',
};

const config = {
    compilationOptions: {
        preferredConfigPath: './tsconfig.json',
    },
    entries: [
        {
            filePath: './lib/index.d.ts',
            outFile: './dist/feng3d.d.ts',
            libraries,
            output,
        },
    ],

};

module.exports = config;
