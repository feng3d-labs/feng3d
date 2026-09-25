import * as fs from 'fs';
import * as path from 'path';

const pkgpath = path.resolve('package.json');

let pkg = fs.readFileSync(pkgpath, 'utf8');
pkg = pkg
    .replace(`"types": "./lib/index.d.ts"`, `"types": "./src/index.ts"`)
    //
    .replace(`"module": "./dist/index.js"`, `"module": "./src/index.ts"`)
    .replace(`"main": "./dist/index.umd.cjs"`, `"main": "./src/index.ts"`)
    //
    .replace(`"import": "./dist/index.js"`, `"import": "./src/index.ts"`)
    .replace(`"require": "./dist/index.umd.cjs"`, `"require": "./src/index.ts"`)
    ;

fs.writeFileSync(pkgpath, pkg, 'utf8');
