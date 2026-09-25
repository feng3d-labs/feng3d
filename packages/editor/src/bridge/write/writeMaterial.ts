import { logic as getLogic } from 'feng3d';
import type { Object3D, Scene } from 'feng3d';
import { toRaw } from '@feng3d/reactivity';
import { getActiveEditorView } from '../../feng3d/editorViewRegistry';
import { EditorData } from '../../global/EditorData';
import { resolveObjectId } from '../EditorBridge';
import { requireWriteEnabled, cloneValue, writeValue, pushCommand, redoStack, undoStack } from './writeCore';
import { toColor4, isFiniteF32, MATERIAL_FIELD_MAP } from './writePure';
import { revertSet, commitSet, prepareSet, SetOutcome } from './writeGuards';
import { assertNoDuplicateObjects } from './writeGeometry';

/**
 * 设置场景环境（背景色 / 环境光），可撤销。
 *
 * 为什么单独开一个入口：这两个字段挂在 `Scene` 组件上，而 AI 手里只有**场景根的路径 id**，
 * 还得先查出 `components[N]` 里的 N 才能写——多一步、多一个出错点。
 *
 * 要写**两处**：视口里看到的背景/环境光来自**编辑器视图的 Scene**（`EditorView.viewScene`），
 * 游戏场景自身那个 Scene 组件只在导出后运行时才起作用。实测只改后者画面毫无变化。
 *
 * @param params.background 背景色，如 `{ r: 0.1, g: 0.2, b: 0.4 }`
 * @param params.ambientColor 环境光颜色
 */
export function sceneSetEnvironment(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const wanted: { key: 'background' | 'ambientColor', value: unknown }[] = [];
    if (params.background !== undefined) wanted.push({ key: 'background', value: toColor4(params.background, 'background') });
    if (params.ambientColor !== undefined) wanted.push({ key: 'ambientColor', value: toColor4(params.ambientColor, 'ambientColor') });
    if (wanted.length === 0)
    {
        throw new Error('至少要给 background 或 ambientColor，例如 { background: { r: 0.1, g: 0.2, b: 0.4 } }');
    }

    // 收集两处的 Scene 组件：视图场景（决定视口里看到的背景/环境光）+ 游戏场景（导出后运行时用）
    const components: object[] = [];
    const names: string[] = [];
    const collect = (scene: Scene | null) =>
    {
        if (!scene) return;
        const host = toRaw(getLogic(scene)?.entity as Object3D | null);
        if (!host) return;
        const index = (host.components ?? []).findIndex((component) => toRaw(component) === toRaw(scene));
        if (index < 0) return;

        components.push(host.components[index] as object);
        names.push(`${host.name ?? 'Object3D'}`);
    };
    collect(getActiveEditorView()?.viewScene ?? null);
    collect(EditorData.editorData.gameScene);

    if (components.length === 0) throw new Error('找不到可写的 Scene 组件（编辑器视图尚未就绪？）');

    // 直接对组件对象写入，不走路径式 id：`editorViewRoot` 不在游戏场景树里，桥接的 id
    // 寻址不到它（`resolveObjectId` 会拒绝这种路径），用 id 往返只会写到别的对象上
    interface SceneWrite { readonly component: object, readonly key: string, readonly before: unknown, readonly after: unknown }
    const writes: SceneWrite[] = [];
    for (const component of components)
    {
        const source = component as Record<string, unknown>;
        for (const item of wanted)
        {
            writes.push({ component, key: item.key, before: cloneValue(source[item.key]), after: cloneValue(item.value) });
        }
    }

    for (const write of writes) writeValue(write.component, write.key, cloneValue(write.after));

    pushCommand({
        label: `setEnvironment ${wanted.map((item) => item.key).join('+')}`,
        undo: () => { for (const write of writes) writeValue(write.component, write.key, cloneValue(write.before)); },
        redo: () => { for (const write of writes) writeValue(write.component, write.key, cloneValue(write.after)); },
    });

    // 返回**实际落笔**的值（而不是入参）：颜色会被补全，回显真实结果才便于自证
    const applied: Record<string, unknown> = {};
    for (const write of writes) applied[write.key] = write.after;

    return {
        set: applied,
        updated: names,
        history: { undoCount: undoStack.length, redoCount: redoStack.length },
    };
}

/**
 * 设置材质外观（一次撤销，可批量）。
 *
 * 为什么要单开入口：走 `components[0].material.uniforms.u_glossiness` 这类路径又长又容易写错，
 * 而 AI 的意图通常只是「更反光一点」「半透明」——这里用语义化字段名映射到 StandardMaterial 的 uniforms。
 *
 * @param params.objectId / objectIds 目标（其 MeshRenderer 的材质必须是 StandardMaterial）
 * @param params.color 漫反射色、`specular` 高光色、`ambient` 环境色（均为 `{ r, g, b, a? }`）
 * @param params.glossiness 光泽度、`reflectivity` 反射强度、`alphaThreshold` 透明裁剪阈值
 */
export function sceneSetMaterial(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const rawIds = params.objectIds ?? (params.objectId === undefined ? undefined : [params.objectId]);
    if (rawIds === undefined) throw new Error('需要 objectId 或 objectIds');
    if (!Array.isArray(rawIds) || rawIds.length === 0) throw new Error('objectIds 必须是非空数组');
    if (rawIds.length > 200) throw new Error(`一次最多 200 个对象（收到 ${rawIds.length}）`);
    assertNoDuplicateObjects(rawIds);

    const wanted = Object.keys(MATERIAL_FIELD_MAP)
        .filter((field) => params[field] !== undefined)
        .map((field) =>
        {
            const isColor = MATERIAL_FIELD_MAP[field].color;
            const value = isColor ? toColor4(params[field], field) : Number(params[field]);
            // 数值字段必须是有限数字：NaN 写进 uniform 会让渲染崩掉（实测栈溢出）
            if (!isColor && !isFiniteF32(value as number))
            {
                throw new Error(`${field} 需要有限数字（且不超出 f32 范围），收到：${JSON.stringify(params[field])}`);
            }

            return { ...MATERIAL_FIELD_MAP[field], field, value };
        });
    if (wanted.length === 0)
    {
        throw new Error(`至少要给 ${Object.keys(MATERIAL_FIELD_MAP).join(' / ')} 之一`);
    }

    // 先全部解析校验，再统一落笔：要么全改、要么一个都不改
    const outcomes: SetOutcome[] = [];
    const updated: string[] = [];
    for (const id of rawIds)
    {
        const objectId = String(id);
        const object = resolveObjectId(objectId);
        const index = (object.components ?? []).findIndex((component) => component.__type__ === 'MeshRenderer');
        if (index < 0) throw new Error(`${objectId} 上没有 MeshRenderer，无法设置材质`);

        const material = (object.components[index] as { material?: { __type__?: string, uniforms?: object } }).material;
        if (!material)
        {
            throw new Error(
                `${objectId} 的 MeshRenderer 还没有材质（用 scene.add 的 color 参数，或先写 `
                + `components[${index}].material 为 { __type__: "StandardMaterial" }）`,
            );
        }
        if (material.__type__ !== 'StandardMaterial')
        {
            throw new Error(`${objectId} 的材质是 ${material.__type__}，本方法只支持 StandardMaterial`);
        }
        if (!material.uniforms) throw new Error(`${objectId} 的材质缺少 uniforms`);

        for (const item of wanted)
        {
            outcomes.push(prepareSet(objectId, `components[${index}].material.uniforms.${item.uniform}`, item.value, true));
        }
        updated.push(objectId);
    }

    for (const outcome of outcomes) commitSet(outcome);

    pushCommand({
        label: `setMaterial ${wanted.map((item) => item.field).join('+')} x${updated.length}`,
        undo: () => { for (const outcome of outcomes) revertSet(outcome); },
        redo: () => { for (const outcome of outcomes) commitSet(outcome); },
    });

    const applied: Record<string, unknown> = {};
    for (const item of wanted) applied[item.field] = item.value;

    return {
        objects: updated,
        applied,
        history: { undoCount: undoStack.length, redoCount: redoStack.length },
    };
}
