import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import vueDevtools from 'vite-plugin-vue-devtools';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import { editorBridgePlugin } from './bridge/vitePlugin.mjs';


// 复制 Iconify JSON 文件到构建输出目录的插件
function copyIconifyJsonFiles() {
    return {
        name: 'copy-iconify-json',
        async writeBundle() {
            // 使用 Node.js 内置模块
            const { resolve, dirname } = await import('node:path');
            const { existsSync, mkdirSync, copyFileSync } = await import('node:fs');
            const { fileURLToPath } = await import('node:url');
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = dirname(__filename);

            const iconSets = ['mdi', 'material-symbols'];
            const outDir = resolve(__dirname, 'public');
            const iconifyDir = resolve(outDir, 'iconify');

            // 创建 iconify 目录
            if (!existsSync(iconifyDir)) {
                mkdirSync(iconifyDir, { recursive: true });
            }

            // 复制图标集 JSON 文件
            for (const iconSet of iconSets) {
                const srcPath = resolve(__dirname, `node_modules/@iconify/json/json/${iconSet}.json`);
                const destPath = resolve(iconifyDir, `${iconSet}.json`);

                if (existsSync(srcPath)) {
                    try {
                        copyFileSync(srcPath, destPath);
                        console.log(`[Vite] 已复制图标集到构建目录: iconify/${iconSet}.json`);
                    } catch (error) {
                        console.warn(`[Vite] 复制图标集失败 ${iconSet}:`, error.message);
                    }
                }
            }
        }
    };
}


// 复制静态资源的插件
function copyStaticAssets()
{
    return {
        name: 'copy-static-assets',
        async writeBundle()
        {
            // 使用 Node.js 内置模块（vite.config.js 在 Node.js 环境运行）
            const { resolve, dirname } = await import('node:path');
            const { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } = await import('node:fs');
            const { fileURLToPath } = await import('node:url');
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = dirname(__filename);

            // 递归复制目录的函数
            const copyDir = (src, dest) =>
            {
                if (!existsSync(src)) return;
                if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

                const entries = readdirSync(src, { withFileTypes: true });
                for (const entry of entries)
                {
                    const srcPath = resolve(src, entry.name);
                    const destPath = resolve(dest, entry.name);

                    if (entry.isDirectory())
                    {
                        copyDir(srcPath, destPath);
                    }
                    else
                    {
                        copyFileSync(srcPath, destPath);
                    }
                }
            };

            const outDir = resolve(__dirname, 'public');
            const assetsToCopy = [
                { from: 'resource', to: 'resource' },
            ];

            for (const { from, to } of assetsToCopy)
            {
                const srcPath = resolve(__dirname, from);
                const destPath = resolve(outDir, to);

                if (existsSync(srcPath))
                {
                    try
                    {
                        const stat = statSync(srcPath);
                        if (stat.isDirectory())
                        {
                            copyDir(srcPath, destPath);
                        }
                        else
                        {
                            const destDir = dirname(destPath);
                            if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
                            copyFileSync(srcPath, destPath);
                        }
                        console.log(`已复制: ${from} -> ${to}`);
                    }
                    catch (error)
                    {
                        console.warn(`复制失败 ${from}:`, error.message);
                    }
                }
            }
        }
    };
}

export default defineConfig(({ mode }) =>
{
    const isProduction = mode === 'production';

    // 读取 package.json 获取版本号
    const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
    const now = new Date();

    return {
        // 基础路径 - 生产环境使用相对路径
        base: isProduction ? './' : '/',

        // 静态文件目录配置
        // 开发模式下禁用 public 目录，避免与构建输出冲突
        publicDir: isProduction ? 'public' : 'static',

        // 定义全局常量
        define: {
            __BUILD_TIME__: JSON.stringify(now.toISOString()),
            __BUILD_DATE__: JSON.stringify(now.toLocaleDateString('zh-CN')),
            __VERSION__: JSON.stringify(pkg.version),
        },

        // 开发服务器配置
        server: {
            port: 3000,
            open: false,
            cors: true,
            fs: {
                // 允许访问项目根目录外的文件。必须同时包含仓库根（'../..'）：editor 的依赖被
                // npm workspaces 提升到仓库根的 node_modules，只写 '..' 时它解析成 packages/，
                // 于是 element-plus 的样式被 403、整个页面白屏——实测只在 Vite **自动重启**后
                // 出现（重启前已加载的样式有缓存），排查时极易误判成自己的代码问题
                allow: ['..', '../..']
            },
            // 配置代理，使 @iconify/json 的 JSON 文件可以通过 HTTP 访问
            middlewareMode: false
        },

        // 构建配置 - 多页面应用
        build: {
            outDir: 'public',
            emptyOutDir: true,
            sourcemap: !isProduction,
            minify: isProduction ? 'esbuild' : false,
            rollupOptions: {
                // 多页面入口配置
            input: {
                index: fileURLToPath(new URL('./index.html', import.meta.url)),
                run: fileURLToPath(new URL('./run.html', import.meta.url))
            },
                output: {
                    // 保持目录结构
                    entryFileNames: 'assets/[name]-[hash].js',
                    chunkFileNames: 'assets/[name]-[hash].js',
                    assetFileNames: 'assets/[name]-[hash].[ext]',
                },
                // 外部化处理：不打包这些依赖
                //
                // `feng3d` **不再外部化**，改为内置进产物。原因：外部化就必须靠
                // importmap 指到 CDN，而实测这条路对本仓不可靠——
                //   · `esm.sh/feng3d@0.9.2` 只回 665B 的转发文件，再发 14 个子包请求
                //     （浏览器侧实测 500）；预构建的 0.8.0/0.9.0 bundle 里又没有
                //     `markMutation`（它来自 @feng3d/reactivity，靠 `export *` 透传）；
                //   · 本地 `packages/feng3d/package.json` 的 0.6.0 与源码不匹配。
                // 编辑器 tarball 本就含 64MB 资源（resource/ 与 projects/ 的 zip），
                // 内置几 MB JS 换来「打开即用、无外部网络依赖」是划算的。
                // 保留 `@feng3d-plugins/*` 外部化（旧版插件，依赖已构建的 feng3d）。
                external: (id) =>
                    id === '@feng3d-plugins/cannon'
                    || id === '@feng3d-plugins/cannon-plugin'
                    // 外部化 libs、node_modules、packages、dist 下的文件
                    || id.startsWith('./libs/')
                    || id.startsWith('../libs/')
                    || id.startsWith('./node_modules/')
                    || id.startsWith('../node_modules/')
                    || id.startsWith('./packages/')
                    || id.startsWith('../packages/')
                    || id.startsWith('./dist/')
                    || id.startsWith('../dist/')
                    || id === './run.js'
                    || id === '../run.js'
            }
        },

        // 插件配置
        plugins: [
            // 为 HTML 注入 importmap（必须排在其它插件前，见函数注释）
            injectImportMap(),
            vue(),
            vueDevtools({
                enabled: true,
            }),
            // configureCursorEditor(), // 配置 Cursor 编辑器
            // Element Plus 按需引入（组件与 API 按需，**样式不按需**）
            //
            // `importStyle: false`：本项目在 main.ts 里已经**整份**引入了
            // `element-plus/dist/index.css`，再让解析器按组件注入
            // `element-plus/es/components/<组件>/style/css` 是重复的。
            // 更要紧的是：那些注入出来的深路径**不在任何源码里**，依赖扫描器读原始源码看不到，
            // 于是 dev server 每次运行到某个面板才「发现新依赖」→ 打印
            // `optimized dependencies changed. reloading` → **强制整页重载**，
            // 编辑器被重建、gameScene 回到默认场景，**未保存的场景直接丢**。
            // 实测（冷启动，逐次发现 4 组）：关掉注入后不再出现该重载。
            AutoImport({
                resolvers: [ElementPlusResolver({ importStyle: false })],
            }),
            Components({
                resolvers: [ElementPlusResolver({ importStyle: false })],
            }),
            copyIconifyJsonFiles(), // 复制 Iconify JSON 文件到构建目录
            copyStaticAssets(),
            editorBridgePlugin() // P1 只读 AI 桥接（仅 dev server 生效）
        ],

        // 解析配置
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },

        // 优化配置
        optimizeDeps: {
            // 排除不需要预构建的依赖
            //
            // 所有 @feng3d/* 都是「源码发布」workspace 包：package.json 的 main 指向 src/*.ts，
            // 没有 dist 构建产物。这类包**必须排除出预构建**，否则 Vite 会把跨包导入预先打成
            // bundle，过程中丢失部分具名导出（实测 @feng3d/polyfill 的 __class__ 丢失），
            // 触发链接期错误：
            //   does not provide an export named '__class__'
            // 排除后由 dev server 直接转换源码，也与「改主仓源码即时生效」的形态一致。
            exclude: [
                'feng3d',
                '@feng3d/addons',
                '@feng3d/assets',
                '@feng3d/error-logger',
                '@feng3d/event',
                '@feng3d/filesystem',
                '@feng3d/math',
                '@feng3d/objectview',
                '@feng3d/particlesystem',
                '@feng3d/path',
                '@feng3d/polyfill',
                '@feng3d/reactivity',
                '@feng3d/serialization',
                '@feng3d/shortcut',
                '@feng3d/terrain',
                '@feng3d/watcher',
                '@feng3d/webgpu',
                // 旧版外部插件（依赖已构建的 feng3d），同样不预构建
                '@feng3d-plugins/cannon',
                '@feng3d-plugins/cannon-plugin'
            ],
            // 依赖扫描入口。
            //
            // 面板视图是**按需加载**的（插件清单里写成 `() => import('...')`，见 src/plugins/），
            // Vite 默认只从 `index.html` 做静态分析。加这两个 glob 让扫描器也覆盖视图与清单，
            // 减少运行期才发现依赖的机会。
            //
            // 但它**治不了**下面 `include` 里那几项：那些依赖根本不在源码里——
            // `unplugin-vue-components` 的 `ElementPlusResolver()` 在**转换时**注入
            // `element-plus/es/components/*/style/css`，而依赖扫描器读的是**原始源码**，看不到。
            entries: ['index.html', 'src/vue-app/**/*.vue', 'src/plugins/**/*.ts'],
            // 预先声明「运行期才会被发现」的依赖。
            //
            // 依据是 dev server 日志里那一行 `new dependencies optimized:`——实测（CI 与本地冷启动）
            // 每次都会发现这三项，紧接着打印 `optimized dependencies changed. reloading` 并
            // **强制整页重载**：编辑器被重建、gameScene 回到默认场景，**未保存的场景直接丢**。
            // #150 那条「相邻两次调用之间场景不变」的断言因此在 CI 上失败。
            //
            // 对照实验：在 master（未做插件化改造）上冷启动同样重载 → 这是**既有缺陷**，
            // 不是懒加载引入的。三项都是稳定的底层依赖（`element-plus/es` 是组件库入口，
            // 另两个是 feng3d 源码依赖的 npm 包），不随面板增减漂移，适合写在这里。
            //
            // 顺带删掉了原先的 `js-beautify`：editor 并未依赖它、也解析不到，
            // dev server 每次启动都打印 `Failed to resolve dependency: js-beautify`。
            include: [
                'element-plus/es',
                'earcut',
                'wgsl_reflect'
            ],
            // 保持类名不被修改
            esbuildOptions: {
                keepNames: true
            }
        }
    };
});

/**
 * 解析某依赖在 npm 上已安装的版本。
 *
 * 仅供 importmap 使用（当前只剩 `@feng3d-plugins/*` 需要外部化）。
 *
 * @param {string} depName 依赖名
 * @returns {string} 版本号；解析不到时返回空串
 */
function resolveCdnVersion(depName)
{
    // 按 node_modules 目录查找而不是 require.resolve：源码发布策略下包入口是
    // `./src/index.ts`，Node 不认识 .ts；部分包的 exports 也不导出 ./package.json
    const candidates = [];

    // 1) 仓库根（npm workspaces 提升位置）
    candidates.push(path.join(process.cwd(), 'node_modules', depName, 'package.json'));
    // 2) 从本包目录逐级向上
    let dir = __dirname;
    for (let i = 0; i < 5; i++)
    {
        candidates.push(path.join(dir, 'node_modules', depName, 'package.json'));
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }

    for (const manifestPath of candidates)
    {
        try
        {
            if (!existsSync(manifestPath)) continue;
            const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
            if (typeof manifest.version === 'string') return manifest.version;
        }
        catch
        {
            // 继续试下一个候选路径
        }
    }

    return '';
}

/**
 * 给 HTML 注入 importmap。
 *
 * 背景：vite 的 `build.rollupOptions.external` 把 `feng3d` 与两个插件标记为外部依赖
 * （`external` 的注释写着「通过 CDN 加载」），因此构建产物里保留**裸模块导入**
 * `import * as hf from "feng3d"`。浏览器解析裸说明符只能靠 importmap——
 * `run.html` 有、`index.html` 没有，于是编辑器主界面白屏
 * （`Failed to resolve module specifier "feng3d"`）。
 *
 * 这里统一为两个入口页注入，版本取自实际安装的依赖，避免再次写死过期版本。
 * 插件必须排在其它插件**之前**：@vitejs/plugin-vue 等也会实现 transformIndexHtml，
 * 而转换是串行的，排前面才能保证 importmap 落在注入的 module script 之前。
 *
 * @returns {object} vite 插件
 */
function injectImportMap()
{
    return {
        name: 'feng3d-inject-importmap',
        transformIndexHtml()
        {
            // 外部化的裸模块说明符（与 build.rollupOptions.external 保持一致）
            // 注意 `feng3d` 已改为内置进产物，不再需要 CDN 解析
            const externals = ['@feng3d-plugins/cannon', '@feng3d-plugins/cannon-plugin'];
            const imports = {};

            for (const depName of externals)
            {
                const version = resolveCdnVersion(depName);
                if (!version)
                {
                    console.warn(`[inject-importmap] 无法解析 ${depName} 的版本，跳过（importmap 将不含它）`);
                    continue;
                }
                imports[depName] = `https://esm.sh/${depName}@${version}`;
            }

            const importMap = { imports };

            return [
                {
                    tag: 'script',
                    attrs: { type: 'importmap' },
                    children: JSON.stringify(importMap, null, 4),
                    injectTo: 'head-prepend',
                },
            ];
        },
    };
}
