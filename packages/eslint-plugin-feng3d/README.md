# eslint-plugin-feng3d

Feng3D 仓库的自研 ESLint 规则集合，把根 [AGENTS.md](../../AGENTS.md) 里的两条核心纪律
交给机器执行：**§8 响应式对象使用规范**与 **§15 R2 零模块级副作用 / R5 effect 必须注解**。

## 规则

| 规则 | 作用 |
|---|---|
| `feng3d/reactive-naming` | `const x = reactive(...)` 的变量名必须带 `r_` 前缀（可自动修复） |
| `feng3d/no-reactive-export` | 禁止导出响应式对象 |
| `feng3d/no-reactive-argument` | 禁止把响应式对象作为函数参数传递 |
| `feng3d/no-module-side-effect` | 模块顶层禁止创建缓存容器（`Map` / `WeakMap` / `Set` / `WeakSet` / `ChainMap`） |
| `feng3d/effect-annotation` | `effect(...)` 调用必须带 `@边界 effect` / `@过渡 effect` 标注注释 |

规则在源码里为 `error`、在测试文件里为 `off`；启用点在根 `eslint.config.js`。

## 使用

本仓已配置好，无需额外操作。在其它项目里引用：

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

## 构建

规则以 TypeScript 源码（`src/`）开发，入口为 `dist/index.js`：

```bash
npm run build --workspace eslint-plugin-feng3d
```

改动规则后需要重新构建，否则 `eslint` 读到的还是旧的 `dist`。

## 许可

MIT
