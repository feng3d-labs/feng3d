import { defineConfig } from 'vitest/config';

// 配置 Vitest 以适配项目
export default defineConfig({
    // 设置测试环境
    test: {
        globals: true,
        // 扫描范围：主仓 src/、各子包 test/ 与仓库根 test/。
        // **子包 src/ 下的测试文件不扫**：那里曾有一批"开发期副本"（如
        // `packages/reactivity/src/*.spec.ts`，与 `test/` 下重复且已双向分叉），
        // 已按 issue #101 把其中独有的用例合并进 `test/` 并删除副本——所以 `test/` 是唯一来源，
        // 若将来又在子包 src/ 下冒出测试文件，请先合并进 `test/` 而不是提交副本。
        include: [
            'packages/feng3d/src/**/*.spec.ts',
            'packages/*/test/**/*.spec.ts',
            'test/**/*.spec.ts',
        ],
        // 只排除构建产物与依赖，不再按子包排除：
        // packages/shortcut（依赖浏览器全局 self）与 packages/terrain（依赖 WebGPU 全局
        // GPUBufferUsage）所需的全局由 vitest.setup.ts 补齐，因此它们的单元测试
        // 也纳入全量，避免"CI 绿了但这两个包根本没跑过测试"。
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/lib/**',
            '**/public/**',
        ],
        setupFiles: ['./vitest.setup.ts'],
        // 慢测试（webgpu ChainMap 性能基线）单独放宽超时，避免 CI 机器抖动导致误报
        testTimeout: 30000,
        // 覆盖率（issue #74）：include 让「没被任何测试触及的文件」也进分母，否则它们
        // 根本不出现、覆盖率数字虚高。（vitest 5 已移除旧的 `all` 选项，include 即承担该职责——
        // 实测 643 个受统计文件里包含零测试的 packages/error-logger。）
        coverage: {
            provider: 'v8',
            reporter: ['text-summary'],
            include: ['packages/*/src/**/*.ts'],
            exclude: ['**/*.spec.ts', '**/*.d.ts'],
            // 阈值（issue #74）：取实测基线向下留余量——它的作用是「防止覆盖率下降」，
            // 不是「宣布已达标」。
            //
            // 实测基线（2026-09，vitest 5.0.2 / 本机 Node 22）：语句 36.44% / 分支 31.64% /
            // 函数 36.24% / 行 36.87%。
            //
            // 与 vitest 3 时期的数字**不可直接比较**：v8 provider 换了插桩/映射方式后，
            // 同一份代码的语句总数从 56571 降到 30142、分支分母从 4366 涨到 12996。
            // 升级 vitest 时必须按新口径重测阈值，不能沿用旧值（详见 docs/CI.md §1.3）。
            thresholds: {
                statements: 35,
                branches: 30,
                functions: 35,
                lines: 35,
            },
        },
    },
});
