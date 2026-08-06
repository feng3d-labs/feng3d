import * as fs from 'fs';
import * as path from 'path';

const pkgpath = path.resolve('package.json');

let pkg = fs.readFileSync(pkgpath, 'utf8');

pkg = pkg
    .replaceAll(`"types": "./lib/index.d.ts"`, `"types": "./src/index.ts"`)
    //
    .replaceAll(`"module": "./dist/index.js"`, `"module": "./src/index.ts"`)
    .replaceAll(`"main": "./dist/index.umd.cjs"`, `"main": "./src/index.ts"`)
    //
    .replaceAll(`"import": "./dist/index.js"`, `"import": "./src/index.ts"`)
    .replaceAll(`"require": "./dist/index.umd.cjs"`, `"require": "./src/index.ts"`)
;

fs.writeFileSync(pkgpath, pkg, 'utf8');

