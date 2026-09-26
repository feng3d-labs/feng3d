import { describe, expect, it } from 'vitest';
import {
    assertBatchSize, assertFiniteNumbers, cloneValue, isFiniteF32, MAX_BATCH_OBJECTS,
    primitiveTypeOf, replayStacks, resolvePath, rewindStacks, toColor4, toColor4Strict,
} from '../src/bridge/write/writePure';
import type { UndoableCommand } from '../src/bridge/write/writePure';

/** 造指定层数的嵌套对象 */
function nest(depth: number): unknown
{
    let value: unknown = 1;
    for (let i = 0; i < depth; i++) value = { child: value };

    return value;
}

describe('isFiniteF32', () =>
{
    it('接受 f32 能表示的数', () =>
    {
        expect(isFiniteF32(0)).toBe(true);
        expect(isFiniteF32(-1.5)).toBe(true);
        expect(isFiniteF32(1e38)).toBe(true);
    });

    it('拒绝 NaN / Infinity 与 f32 装不下的数（JS 里却是有限数）', () =>
    {
        expect(isFiniteF32(Number.NaN)).toBe(false);
        expect(isFiniteF32(Number.POSITIVE_INFINITY)).toBe(false);
        expect(isFiniteF32(1e39)).toBe(false);
        expect(isFiniteF32(-1e39)).toBe(false);
        expect(isFiniteF32(Number.MAX_VALUE)).toBe(false);
    });
});

describe('toColor4', () =>
{
    it('补全 __type__ 与缺失分量', () =>
    {
        expect(toColor4({ r: 1, g: 0, b: 0 })).toEqual({ __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 });
        expect(toColor4({})).toEqual({ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 });
    });

    it('保留已有的 __type__ 与分量', () =>
    {
        expect(toColor4({ __type__: 'Color4', r: 0.2, g: 0.3, b: 0.4, a: 0.5 }))
            .toEqual({ __type__: 'Color4', r: 0.2, g: 0.3, b: 0.4, a: 0.5 });
    });

    it('给了非法分量就报错，不静默替换（否则调用方以为改成功了）', () =>
    {
        expect(() => toColor4({ r: 'x' }, 'background')).toThrow(/background\.r/);
        expect(() => toColor4({ r: 1e39 }, 'background')).toThrow(/f32/);
        expect(() => toColor4({ r: 0, g: Number.NaN })).toThrow(/g/);
    });

    it('非对象原样返回（由调用方的类型检查负责）', () =>
    {
        expect(toColor4(null)).toBeNull();
        expect(toColor4('red')).toBe('red');
    });

    it('不改动传入的对象', () =>
    {
        const source = { r: 1, g: 0, b: 0 };
        toColor4(source);
        expect(source).toEqual({ r: 1, g: 0, b: 0 });
    });
});

describe('assertFiniteNumbers', () =>
{
    it('放行正常值（含嵌套与数组）', () =>
    {
        expect(() => assertFiniteNumbers({ x: 1, y: -2, z: 0 }, 'position')).not.toThrow();
        expect(() => assertFiniteNumbers([1, 2, 3], 'items')).not.toThrow();
        expect(() => assertFiniteNumbers(nest(5), 'value')).not.toThrow();
    });

    it('指出非法数字所在的字段路径', () =>
    {
        expect(() => assertFiniteNumbers({ x: 1e39, y: 0 }, 'position')).toThrow(/position\.x/);
        expect(() => assertFiniteNumbers([0, Number.NaN], 'items')).toThrow(/items\[1\]/);
    });

    it('非数字的值不参与检查（类型由 prepareSet 的防呆负责）', () =>
    {
        expect(() => assertFiniteNumbers({ name: 'cube', flag: true }, 'value')).not.toThrow();
    });

    it('嵌套过深直接拒绝', () =>
    {
        expect(() => assertFiniteNumbers(nest(12), 'value')).toThrow(/嵌套过深/);
    });
});

describe('resolvePath', () =>
{
    it('解析点路径与数组下标', () =>
    {
        const root = { position: { x: 0, y: 0, z: 0 }, components: [{ material: { uniforms: {} } }] };
        expect(resolvePath(root, 'position.y')).toEqual({ holder: root.position, key: 'y' });
        expect(resolvePath(root, 'components[0].material'))
            .toEqual({ holder: root.components[0], key: 'material' });
        expect(resolvePath(root, 'components.0')).toEqual({ holder: root.components, key: 0 });
    });

    it('中间段不存在时报错并列出候选字段', () =>
    {
        expect(() => resolvePath({ position: {} }, 'postion.y')).toThrow(/找不到 postion/);
        expect(() => resolvePath({ position: {} }, 'postion.y')).toThrow(/可用字段/);
    });

    it('空路径与穿到非对象都报错', () =>
    {
        expect(() => resolvePath({}, '')).toThrow(/路径为空/);
        expect(() => resolvePath({ a: 1 }, 'a.b')).toThrow(/不是对象/);
    });
});

describe('assertBatchSize', () =>
{
    it('上限内放行', () =>
    {
        expect(() => assertBatchSize(new Array(MAX_BATCH_OBJECTS).fill('/a'), 'scene.setMany')).not.toThrow();
        expect(() => assertBatchSize([], 'scene.setMany')).not.toThrow();
    });

    it('超限时报出方法名与下一步（AI 全靠这句话自救）', () =>
    {
        expect(() => assertBatchSize(new Array(MAX_BATCH_OBJECTS + 1).fill('/a'), 'scene.setMany'))
            .toThrow(/scene\.setMany 一次最多 200 个对象（收到 201）——拆成多次调用即可/);
    });

    it('上限是个具名常量，不是散落在各处的字面量', () =>
    {
        expect(MAX_BATCH_OBJECTS).toBe(200);
    });
});

describe('primitiveTypeOf / cloneValue', () =>
{
    it('只认三种原始类型', () =>
    {
        expect(primitiveTypeOf(1)).toBe('number');
        expect(primitiveTypeOf('a')).toBe('string');
        expect(primitiveTypeOf(false)).toBe('boolean');
        expect(primitiveTypeOf(null)).toBeNull();
        expect(primitiveTypeOf(undefined)).toBeNull();
        expect(primitiveTypeOf({})).toBeNull();
    });

    it('深拷贝，改副本不影响原值（撤销依赖这一点）', () =>
    {
        const source = { position: { x: 1 } };
        const copy = cloneValue(source) as typeof source;
        copy.position.x = 9;
        expect(source.position.x).toBe(1);
        expect(cloneValue(3)).toBe(3);
    });
});

describe('toColor4Strict', () =>
{
    it('没给颜色时用全 1 默认值（与 scene.add 的默认材质一致）', () =>
    {
        expect(toColor4Strict(undefined)).toEqual({ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 });
        expect(toColor4Strict(null)).toEqual({ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 });
    });

    it('非对象直接报错，不把字符串写进 u_diffuse', () =>
    {
        expect(() => toColor4Strict('red', 'color')).toThrow(/color/);
        expect(() => toColor4Strict(1, 'color')).toThrow(/color/);
    });

    it('分量非法时沿用 toColor4 的报错', () =>
    {
        expect(() => toColor4Strict({ r: 'x' }, 'color')).toThrow(/color\.r/);
        expect(() => toColor4Strict({ b: 1e39 }, 'color')).toThrow(/f32/);
    });
});

/** 造一条撤销/重做都记进日志的假命令，用来验证栈的顺序语义 */
function makeCommand(label: string, log: string[], failOnUndo = false): UndoableCommand
{
    return {
        label,
        undo: () =>
        {
            if (failOnUndo) throw new Error(`${label} 撤销失败`);
            log.push(`undo ${label}`);
        },
        redo: () => log.push(`redo ${label}`),
    };
}

describe('rewindStacks / replayStacks', () =>
{
    it('回退到指定深度，被撤销的命令按顺序进重做栈', () =>
    {
        const log: string[] = [];
        const undoStack = [makeCommand('a', log), makeCommand('b', log), makeCommand('c', log)];
        const redoStack: UndoableCommand[] = [];

        const undone = rewindStacks(undoStack, redoStack, 1);

        expect(undone).toEqual(['c', 'b']);
        expect(undoStack.map((c) => c.label)).toEqual(['a']);
        expect(redoStack.map((c) => c.label)).toEqual(['c', 'b']);
        expect(log).toEqual(['undo c', 'undo b']);
    });

    it('discard：预演产生的命令不进重做栈（否则一次 redo 就把预演变成真实写入）', () =>
    {
        const log: string[] = [];
        const undoStack = [makeCommand('preview', log)];
        const redoStack: UndoableCommand[] = [];

        rewindStacks(undoStack, redoStack, 0, true);

        expect(undoStack).toHaveLength(0);
        expect(redoStack).toHaveLength(0);
        expect(log).toEqual(['undo preview']);
    });

    it('undo 抛错时命令留在栈上：场景与撤销栈保持一致，不会查无记录', () =>
    {
        const log: string[] = [];
        const undoStack = [makeCommand('a', log), makeCommand('bad', log, true)];
        const redoStack: UndoableCommand[] = [];

        expect(() => rewindStacks(undoStack, redoStack, 0)).toThrow(/bad 撤销失败/);
        // 先 pop 再 undo 的写法会让它两层栈都不在，这里必须还在
        expect(undoStack.map((c) => c.label)).toEqual(['a', 'bad']);
        expect(redoStack).toHaveLength(0);
    });

    it('replayStacks 是对称操作，重做抛错时同样留在栈上', () =>
    {
        const log: string[] = [];
        const redoStack = [makeCommand('a', log), makeCommand('b', log)];
        const undoStack: UndoableCommand[] = [];

        expect(replayStacks(redoStack, undoStack, 1)).toEqual(['b']);
        expect(redoStack.map((c) => c.label)).toEqual(['a']);
        expect(undoStack.map((c) => c.label)).toEqual(['b']);
        expect(log).toEqual(['redo b']);
    });

    it('已到目标深度时是空操作', () =>
    {
        const log: string[] = [];
        const undoStack = [makeCommand('a', log)];
        const redoStack: UndoableCommand[] = [];

        expect(rewindStacks(undoStack, redoStack, 5)).toEqual([]);
        expect(undoStack).toHaveLength(1);
        expect(redoStack).toHaveLength(0);
    });
});
