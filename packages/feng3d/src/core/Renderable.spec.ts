import { afterEach, describe, expect, it, vi } from 'vitest';

import '../test/webgpu-stub';

import { logic, reactive } from '@feng3d/reactivity';
import type { MeshRenderer } from './MeshRenderer';
import './MeshRenderer';
import type { Object3D } from './Object3D';
import './Object3D';
import '../materials/StandardMaterial';
import '../primitives/CubeGeometry';
import '../primitives/PlaneGeometry';
import '../primitives/SphereGeometry';

/**
 * `RenderableLogic` 对渲染数据（`geometry` / `material`）的解析。
 *
 * 现场（用户报的浏览器报错）：组件上一份缺 `__type__` 的 `geometry` 会让 `logic()` 返回 null，
 * 紧接着 `.bounding` 在 computed 里抛 `Cannot read properties of null`——
 * 包围盒、拾取、选中整条链路一起挂，而控制台只有一句
 * `未注册的 __type__ 'undefined'`（既不知是哪个对象，也不知该改什么）。
 *
 * 这里覆盖修复后的三条承诺：
 * 1. **不抛异常**：脏数据回退到默认几何体/材质，包围盒与拾取照常可用；
 * 2. **报得清楚**：一条指名道姓的 `[Renderable]` 错误（对象名 + 组件 + 缺什么），且**只报一次**；
 * 3. **不误伤**：合法声明与缺省字段照常，旧格式（`__class__`）就地兼容。
 */
describe('RenderableLogic 渲染数据解析', () =>
{
    /** 造一个挂着单个 MeshRenderer 的对象并触发组件初始化 */
    function mountRenderer(name: string, component: Record<string, unknown>): MeshRenderer
    {
        const renderer = component as unknown as MeshRenderer;
        const object: Object3D = { __type__: 'Object3D', name, components: [renderer] };
        logic(object);

        return renderer;
    }

    /** 捕获 console.error 的消息（不打印到测试输出） */
    function captureErrors(): string[]
    {
        const messages: string[] = [];
        vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) =>
        {
            messages.push(args.map((arg) => String(arg)).join(' '));
        });

        return messages;
    }

    /** 只挑出本模块的报错（`[logic]` 等其它来源不参与判据） */
    function renderableErrors(messages: readonly string[]): string[]
    {
        return messages.filter((message) => message.includes('[Renderable]'));
    }

    afterEach(() =>
    {
        vi.restoreAllMocks();
    });

    it('geometry 缺 __type__：回退默认 Cube，不抛异常，且只报一条指名道姓的错', () =>
    {
        const messages = captureErrors();
        const renderer = mountRenderer('脏几何体', {
            __type__: 'MeshRenderer',
            geometry: { width: 1, height: 1 },
        });

        const bounds = logic(renderer).selfLocalBounds.value;

        expect(bounds.min.x).toBeCloseTo(-0.5);
        expect(bounds.max.x).toBeCloseTo(0.5);

        // 换一份同样脏的几何体：computed 失效重算，也不该重复刷屏
        const r_renderer = reactive(renderer);
        r_renderer.geometry = { width: 2, height: 2 } as MeshRenderer['geometry'];
        logic(renderer).selfLocalBounds.value;

        const reported = renderableErrors(messages);
        expect(reported).toHaveLength(1);
        expect(reported[0]).toMatch(/脏几何体/);
        expect(reported[0]).toMatch(/MeshRenderer\.geometry/);
        expect(reported[0]).toMatch(/缺少 __type__/);
        expect(reported[0]).toMatch(/width, height/);
        // 不再有"未注册的 __type__ 'undefined'"这种无信息量的报错
        expect(messages.some((message) => message.includes("未注册的 __type__ 'undefined'"))).toBe(false);
    });

    it('geometry 的 __type__ 拼错：同样回退并指出该类型没注册', () =>
    {
        const messages = captureErrors();
        const renderer = mountRenderer('类型名拼错', {
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometory' },
        });

        expect(logic(renderer).selfLocalBounds.value.max.x).toBeCloseTo(0.5);

        const reported = renderableErrors(messages);
        expect(reported).toHaveLength(1);
        expect(reported[0]).toMatch(/__type__ 'CubeGeometory' 没有注册/);
    });

    it('旧格式（无 __type__ 但有 __class__）：就地兼容，不改变渲染结果并提示重存场景', () =>
    {
        const messages = captureErrors();
        const renderer = mountRenderer('旧格式几何体', {
            __type__: 'MeshRenderer',
            geometry: { assetId: 'Ball', __class__: 'SphereGeometry', radius: 0.25 },
        });

        const bounds = logic(renderer).selfLocalBounds.value;

        expect(bounds.min.x).toBeCloseTo(-0.25);
        expect(bounds.max.x).toBeCloseTo(0.25);

        const reported = renderableErrors(messages);
        expect(reported).toHaveLength(1);
        expect(reported[0]).toMatch(/旧格式/);
        expect(reported[0]).toMatch(/__class__: 'SphereGeometry'/);
    });

    it('material 缺 __type__：isLoaded 不抛异常，报的是 material 字段', () =>
    {
        const messages = captureErrors();
        const renderer = mountRenderer('脏材质', {
            __type__: 'MeshRenderer',
            material: { uniforms: { u_diffuse: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 } } },
        });

        // 回退的 StandardMaterial 没有纹理依赖，天然就绪；关键是**读取不抛异常**
        expect(() => logic(renderer).isLoaded).not.toThrow();
        expect(logic(renderer).isLoaded).toBe(true);

        const reported = renderableErrors(messages);
        expect(reported).toHaveLength(1);
        expect(reported[0]).toMatch(/脏材质/);
        expect(reported[0]).toMatch(/MeshRenderer\.material/);
        expect(reported[0]).toMatch(/已回退为 StandardMaterial/);
    });

    it('合法声明与缺省字段都不报警（回退只针对真错的那些数据）', () =>
    {
        const messages = captureErrors();

        const explicit = mountRenderer('合法几何体', {
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SphereGeometry', radius: 0.25 },
            material: { __type__: 'StandardMaterial' },
        });
        expect(logic(explicit).selfLocalBounds.value.max.x).toBeCloseTo(0.25);

        const omitted = mountRenderer('省略几何体', { __type__: 'MeshRenderer' });
        expect(logic(omitted).selfLocalBounds.value.max.x).toBeCloseTo(0.5);

        // 缺省字段（含 dispose 后写回的 null）走 fallback，但**不报错**——那不是脏数据
        const nulled = mountRenderer('显式 null', { __type__: 'MeshRenderer', geometry: null, material: null });
        expect(logic(nulled).selfLocalBounds.value.max.x).toBeCloseTo(0.5);

        expect(renderableErrors(messages)).toEqual([]);
    });
});
