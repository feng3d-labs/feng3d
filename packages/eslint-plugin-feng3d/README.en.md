# eslint-plugin-feng3d

ESLint rules maintained by the Feng3D repository. They turn two core disciplines from the root
[AGENTS.md](../../AGENTS.md) into machine checks: **§8 reactive object conventions**, and
**§15 R2 (no module-level side effects) / R5 (effect calls must be annotated)**.

## Rules

| Rule | Purpose |
|---|---|
| `feng3d/reactive-naming` | `const x = reactive(...)` must use the `r_` prefix (auto-fixable) |
| `feng3d/no-reactive-export` | Disallow exporting reactive objects |
| `feng3d/no-reactive-argument` | Disallow passing reactive objects as function arguments |
| `feng3d/no-module-side-effect` | Disallow creating cache containers (`Map` / `WeakMap` / `Set` / `WeakSet` / `ChainMap`) at module scope |
| `feng3d/effect-annotation` | `effect(...)` calls must carry a `@边界 effect` / `@过渡 effect` annotation |

Rules are `error` in source files and `off` in test files; they are enabled in the root
`eslint.config.js`.

## Usage

Nothing to do inside this repository. To use it elsewhere:

```js
import feng3d from 'eslint-plugin-feng3d';

export default [
    {
        plugins: { feng3d },
        rules: {
            'feng3d/reactive-naming': 'error',
            'feng3d/no-reactive-export': 'error',
            'feng3d/no-reactive-argument': 'error',
            'feng3d/no-module-side-effect': 'error',
            'feng3d/effect-annotation': 'error',
        },
    },
];
```

## Build

Rules are written in TypeScript (`src/`), the entry point is `dist/index.js`:

```bash
npm run build --workspace eslint-plugin-feng3d
```

Rebuild after changing rules, otherwise `eslint` keeps reading the stale `dist`.

## License

MIT
