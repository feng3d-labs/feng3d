import { logic as getLogic } from 'feng3d';
import type { Object3D } from 'feng3d';
import { getObjectId, requireSceneRoot } from './readCore';
import { isInsideNdc, getProjector } from './viewProject';

/**
 * 场景健康检查（只读）。
 *
 * 为什么需要它：AI 改完场景常遇到"画面不对但看不出原因"——没有相机、没有光源、
 * scale 为 0 导致对象不可见、MeshRenderer 没有几何。这些都能从数据里直接判断，
 * 不必让 AI（或用户）靠猜。级别 `error` 表示"基本渲染不出来"，`warn` 表示"很可能不是你要的效果"。
 *
 * @param params.issues 返回多少条问题（默认 50，上限 200）——两百个对象的场景里问题可能有上百条，
 *   全给同样会撑爆上下文；`issueCount` 始终是总数，被截断时带 `truncated`
 */
export function sceneValidate(params: Record<string, unknown> = {}): unknown
{
    const requested = params.issues === undefined ? 50 : Number(params.issues);
    const limit = Number.isFinite(requested) ? Math.max(1, Math.min(200, Math.floor(requested))) : 50;
    const root = requireSceneRoot();
    const issues: { level: 'error' | 'warn', code: string, message: string, objectId?: string }[] = [];
    const stats = {
        objects: 0, cameras: 0, lights: 0, renderers: 0, withGeometry: 0, withMaterial: 0, triangles: 0,
        visible: 0, invisible: 0,
    };

    /**
     * 可渲染对象的世界中心，用于判断"在不在相机视野里"。
     *
     * "为什么看不到"最常见的原因就是对象根本不在视野内（坐标写大了、父级有位移、相机没对准），
     * 而这一点从数据上完全看不出来——体检把它摆出来，比让调用方反复猜要省事得多。
     */
    const renderCenters: { objectId: string, center: { x: number, y: number, z: number } }[] = [];
    const project = getProjector();
    /** 视野判断：取不到相机就一律返回 true（别把"不知道"报成问题） */
    const inView = (point: { x: number, y: number, z: number }): boolean =>
        !project || isInsideNdc(project(point));

    const walk = (object: Object3D) =>
    {
        stats.objects++;
        const objectId = getObjectId(object);

        for (const component of object.components ?? [])
        {
            const type = component.__type__;
            if (type === 'PerspectiveCamera' || type === 'OrthographicCamera') stats.cameras++;
            if (type === 'DirectionalLight' || type === 'PointLight' || type === 'SpotLight') stats.lights++;
            if (type !== 'MeshRenderer') continue;

            stats.renderers++;
            const worldCenter = getLogic(object)?.boundingBox?.worldBounds?.getCenter();
            if (worldCenter) renderCenters.push({ objectId, center: worldCenter });
            const renderer = component as { geometry?: unknown, material?: unknown };
            if (renderer.geometry)
            {
                stats.withGeometry++;
                // 三角面数是「这个场景重不重」最直接的量；几何 logic 的 indices 是惰性求值的，
                // 这里只读长度，必要时会触发一次几何构建
                const geometryLogic = getLogic(renderer.geometry as never) as unknown as { indices?: ArrayLike<number> } | null;
                const indices = geometryLogic?.indices;
                if (indices) stats.triangles += Math.floor(indices.length / 3);
            }
            else issues.push({ level: 'error', code: 'empty-renderer', message: 'MeshRenderer 没有几何，不会被渲染', objectId });
            if (renderer.material)
            {
                stats.withMaterial++;
                // 纯黑材质在深色背景下就是"看不见"，而且不会有任何报错——正是体检该抓的东西
                const diffuse = (renderer.material as {
                    uniforms?: { u_diffuse?: { r?: number, g?: number, b?: number } },
                }).uniforms?.u_diffuse;
                if (diffuse && diffuse.r === 0 && diffuse.g === 0 && diffuse.b === 0)
                {
                    issues.push({
                        level: 'warn',
                        code: 'black-material',
                        message: '材质漫反射色是纯黑，在深色背景下看不见（若确实要全黑可忽略）',
                        objectId,
                    });
                }
            }
            else
            {
                // 无材质的 MeshRenderer 会走引擎兜底渲染路径：历史上它与一次排列组合让后续操作栈溢出
                // （见 docs 已知限制），所以哪怕能画出来也值得提醒
                issues.push({
                    level: 'warn',
                    code: 'no-material',
                    message: 'MeshRenderer 没有材质，走的是引擎兜底路径（历史上与排列组合一起引发过栈溢出），建议补一个材质',
                    objectId,
                });
            }
        }

        // 变换异常：NaN/Infinity 会让矩阵求值出问题，scale 为 0 则该方向不可见
        for (const key of ['position', 'rotation', 'scale'] as const)
        {
            const value = object[key] as { x?: number, y?: number, z?: number } | undefined;
            if (!value) continue;
            for (const axis of ['x', 'y', 'z'] as const)
            {
                const component = value[axis];
                if (component !== undefined && !Number.isFinite(component))
                {
                    issues.push({
                        level: 'error',
                        code: 'invalid-transform',
                        message: `${key}.${axis} 不是有限数字（${component}）`,
                        objectId,
                    });
                }
            }
        }

        const scale = object.scale;
        if (scale && (scale.x === 0 || scale.y === 0 || scale.z === 0))
        {
            issues.push({ level: 'warn', code: 'zero-scale', message: 'scale 有一维为 0，该方向上不可见', objectId });
        }

        // 同级重名：路径 id 会带 `#序号`，AI 引用时容易搞错，值得提醒
        const counts = new Map<string, number>();
        for (const child of object.children ?? [])
        {
            const name = child.name ?? 'Object3D';
            counts.set(name, (counts.get(name) ?? 0) + 1);
        }
        for (const [name, count] of counts)
        {
            if (count > 1)
            {
                issues.push({
                    level: 'warn',
                    code: 'duplicate-name',
                    message: `同级有 ${count} 个名为 ${name} 的对象（路径 id 会带 #序号）`,
                    objectId,
                });
            }
        }

        for (const child of object.children ?? []) walk(child);
    };
    walk(root);

    if (stats.cameras === 0) issues.push({ level: 'error', code: 'no-camera', message: '场景里没有相机，运行起来什么都看不到' });
    if (stats.lights === 0) issues.push({ level: 'warn', code: 'no-light', message: '场景里没有光源，未受光的材质会呈现全黑' });

    // 只汇总一条，不逐个对象报——否则大场景的 issues 会被"视野外"淹没
    const outside = renderCenters.filter((item) => !inView(item.center));
    // 可见数放进 stats：与 scene.summary 的口径一致，两处都能回答"几个看得见"
    stats.visible = renderCenters.length - outside.length;
    stats.invisible = outside.length;
    if (outside.length > 0)
    {
        const names = outside.slice(0, 5).map((item) => item.objectId);
        issues.push({
            level: 'warn',
            code: 'outside-view',
            message: `${outside.length} 个可渲染对象不在当前相机视野内：${names.join('、')}`
                + `${outside.length > names.length ? ' …' : ''}（可用 camera.focus 把镜头对准其中一个）`,
        });
    }

    // 完全重叠：两个对象中心重合时其中一个永远看不见，而数据上毫无异常——
    // AI 摆东西时最容易犯（复制之后忘了挪开、坐标算错落在同一点）
    const overlaps: string[] = [];
    for (let i = 0; i < renderCenters.length; i++)
    {
        for (let j = i + 1; j < renderCenters.length; j++)
        {
            const a = renderCenters[i].center;
            const b = renderCenters[j].center;
            const same = Math.abs(a.x - b.x) < 1e-4 && Math.abs(a.y - b.y) < 1e-4 && Math.abs(a.z - b.z) < 1e-4;
            if (same) overlaps.push(`${renderCenters[i].objectId} / ${renderCenters[j].objectId}`);
        }
    }
    if (overlaps.length > 0)
    {
        issues.push({
            level: 'warn',
            code: 'overlapping',
            message: `${overlaps.length} 对可渲染对象中心完全重合，其中一个看不见：`
                + `${overlaps.slice(0, 3).join('、')}${overlaps.length > 3 ? ' …' : ''}`,
        });
    }

    return {
        ok: issues.every((issue) => issue.level !== 'error'),
        issueCount: issues.length,
        // 按 code 分组：一眼看出"是材质问题多还是视野问题多"，不必读完列表（被截断时尤其有用）
        issueCounts: issues.reduce<Record<string, number>>((counts, issue) =>
        {
            counts[issue.code] = (counts[issue.code] ?? 0) + 1;

            return counts;
        }, {}),
        issues: issues.slice(0, limit),
        ...(issues.length > limit
            ? { truncated: true, hint: `共 ${issues.length} 条问题，只返回前 ${limit} 条（可用 issues 调整）` }
            : {}),
        stats,
    };
}
