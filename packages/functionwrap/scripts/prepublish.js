import * as fs from 'fs';
import * as path from 'path';

const pkgpath = path.resolve('package.json');

let pkg = fs.readFileSync(pkgpath, 'utf8');
pkg = pkg
    .replace(`"types": "./src/index.ts"`, `"types": "./lib/index.d.ts"`)
    //
    .replace(`"module": "./src/index.ts"`, `"module": "./dist/index.js"`)
    .replace(`"main": "./src/index.ts"`, `"main": "./dist/index.umd.cjs"`)
    //
    .replace(`"import": "./src/index.ts"`, `"import": "./dist/index.js"`)
    .replace(`"require": "./src/index.ts"`, `"require": "./dist/index.umd.cjs"`)
    ;

fs.writeFileSync(pkgpath, pkg, 'utf8');
