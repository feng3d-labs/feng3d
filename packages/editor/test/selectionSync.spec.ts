import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 「订阅选中变化必须经 `useSelectionSync`」的机器执行者（issue #173）。
 *
 * ## 为什么需要它
 *
 * 读选中的消费者都是**异步加载**的组件：chunk 到位、组件挂载可能已经是几百毫秒之后，
 * 而"选中变化"是一次性事件——**订阅之前发生的选中永远收不到**。慢机器上这就是
 * "点了层级树、检查器一直显示未选择对象"，而且它**不会自愈**（再点同一个对象时
 * `setSelectedObjects` 认为选中没变，不再发事件）。
 *
 * 修法是把两件事绑在一起：**先订阅 + 挂载时补一次当前值**。但"记得补一次"这件事
 * 靠人记是不可靠的——层级树那版甚至用一个新的箭头函数去 `off`，取消都取消不掉。
 * 所以这里加一条机器判据：**编辑器源码里只允许两处自己订阅**，
 * 其余一律走 composable。
 *
 * 白名单不是"免检名单"，而是"这两处有理由、且理由写在代码里"：
 * 每一条都必须**确实还在订阅**，否则本用例会报"白名单过期"（防止它悄悄变成摆设）。
 */

/**
 * 允许自己订阅的地方：每一条都要给理由，并且**必须自证"订阅后补了一次当前选中"**。
 *
 * 白名单不是免检名单：`mustMatch` 就是那条自证的证据（正则必须命中），
 * 加上"该文件仍存在且仍订阅"的反向校验——两条都过不了就说明这条登记已经失效。
 */
const ALLOWED = new Map<string, { readonly reason: string; readonly mustMatch: RegExp }>([
    [
        'packages/editor/src/vue-app/composables/useSelectionSync.ts',
        {
            reason: 'composable 本身（唯一入口：订阅 + 挂载补值 + 取消订阅都在这里）',
            mustMatch: /onMounted\(\s*notify\s*\)/,
        },
    ],
    [
        'packages/editor/src/feng3d/hierarchy/Hierarchy.ts',
        {
            reason: '非 Vue 类（旧层级树模型），用不了 Vue composable；建树后自己补一次当前选中',
            mustMatch: /^\s*this\.onSelectedObject3DChanged\(\);/m,
        },
    ],
    [
        'packages/editor/src/feng3d/mrsTool/MRSTool.ts',
        {
            reason: '非 Vue 类（变换工具 Logic），用不了 Vue composable；构造末尾自己补一次当前选中',
            mustMatch: /^\s*this\.onSelectedObject3DChange\(\);/m,
        },
    ],
    [
        'packages/editor/src/feng3d/mrsTool/MRSToolTarget.ts',
        {
            reason: '非 Vue 类（工具操作目标 Logic），同上',
            mustMatch: /^\s*this\.onSelectedObject3DChange\(\);/m,
        },
    ],
]);

/** 递归收集 .ts / .vue 文件 */
function collect(dir: string): string[] {
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) out.push(...collect(full));
        else if ((name.endsWith('.ts') || name.endsWith('.vue')) && !name.endsWith('.d.ts')) out.push(full);
    }

    return out;
}

/**
 * 去掉行注释后再做匹配。
 *
 * **这不是洁癖**：第一版没有这一步，破坏性验证时把 `onMounted(notify);` 整行注释掉，
 * 这条判据**照样通过**——因为正则匹配的是文本，不区分代码与注释。
 * 一条"能被注释满足"的门禁等于没有。
 *
 * @param source 源码
 * @returns 去掉 `// …` 之后的源码
 */
function stripLineComments(source: string): string {
    return source
        .split('\n')
        .map((line) => line.replace(/\/\/.*$/, ''))
        .join('\n');
}

/** 读文件并去掉行注释 */
function readCode(file: string): string {
    return stripLineComments(readFileSync(join(ROOT, file), 'utf8'));
}

/**
 * 仓库根（统一成正斜杠，便于比对）。
 *
 * 用文件自身位置定位，而不是 `process.cwd()`：后者在仓库根跑（`vitest run`）时是仓库根、
 * 在 `packages/editor` 下跑（`npm run test`）时却是 `packages/editor`，
 * 于是同一套用例换个目录就 ENOENT（issue #139 顺带发现）。
 */
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..', '..');
const files = collect(join(ROOT, 'packages/editor/src')).map((file) => file.slice(ROOT.length + 1).split('\\').join('/'));

describe('订阅「选中对象变化」的唯一入口', () => {
    it('除白名单外，没有别处自己 globalEmitter.on 订阅选中变化', () => {
        const pattern = /globalEmitter\.on\(\s*'editor\.selectedObjectsChanged'/;
        const offenders = files.filter((file) => pattern.test(readCode(file)));

        const unexpected = offenders.filter((file) => !ALLOWED.has(file));

        expect(
            unexpected,
            '这些文件自己订阅了选中变化——请改用 useSelectionSync（它会补一次当前选中并负责取消订阅）；'
                + '确实有理由的，把理由加进本用例的白名单',
        ).toEqual([]);
    });

    it('白名单里的每一处都确实还在订阅，并且自证补过一次当前选中', () => {
        const pattern = /globalEmitter\.on\(\s*'editor\.selectedObjectsChanged'/;
        const problems: string[] = [];

        for (const [file, entry] of ALLOWED) {
            if (!files.includes(file)) {
                problems.push(`${file}：文件不存在了（请删掉这条登记）`);
                continue;
            }
            const source = readCode(file);
            if (!pattern.test(source)) problems.push(`${file}：已不再订阅（请删掉这条登记）`);
            if (!entry.mustMatch.test(source)) {
                problems.push(`${file}：缺少"补一次当前选中"的自证（${entry.mustMatch}）——白名单条目必须带着它`);
            }
        }

        expect(problems).toEqual([]);
    });

    it('`useSelectionSync` 确实既订阅又在挂载时补一次（否则它和裸订阅没区别）', () => {
        const source = readCode('packages/editor/src/vue-app/composables/useSelectionSync.ts');

        expect(source).toMatch(/globalEmitter\.on\(\s*'editor\.selectedObjectsChanged'/);
        expect(source, '缺少"挂载时补一次当前选中"——那正是这条纪律的核心').toMatch(/onMounted\(\s*notify\s*\)/);
        expect(source, '缺少取消订阅').toMatch(/globalEmitter\.off\(\s*'editor\.selectedObjectsChanged'/);
    });

    it('取消订阅用的是同一个函数引用（传新箭头函数是取消不掉的）', () => {
        const source = readCode('packages/editor/src/vue-app/composables/useSelectionSync.ts');

        // `off(事件名, () => {})` 这种写法在旧层级树里真实存在过：每次重挂载都会多留一个监听器
        expect(source, 'off 的第二个参数不应是内联箭头函数').not.toMatch(
            /globalEmitter\.off\(\s*'editor\.selectedObjectsChanged'\s*,\s*\(\s*\)\s*=>/,
        );
    });
});
