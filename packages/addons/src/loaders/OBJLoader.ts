import { CustomGeometry, reactive } from 'feng3d';

/**
 * OBJ 加载器。
 *
 * 解析 Wavefront OBJ 文件（v/vt/vn/f），返回 CustomGeometry[]（每个 'o'/'g' 一组）。
 * 对应 three.js addons/loaders/OBJLoader.js（简化版，不含材质）。
 */

/**
 * 面的一个顶点引用（索引均已转为 0 基；缺失或越界的 vt/vn 为 null）
 */
interface OBJVertexRef
{
    /** 顶点索引（v） */
    v: number;
    /** 纹理坐标索引（vt），无则为 null */
    vt: number | null;
    /** 法线索引（vn），无则为 null */
    vn: number | null;
}

/**
 * 一个对象（'o'/'g' 分组）
 */
interface OBJGroup
{
    /** 组名 */
    name: string;
    /** 面的顶点引用列表（保留面的全部顶点，展开时再扇形三角化） */
    faces: OBJVertexRef[][];
}

/**
 * 从 URL 加载 OBJ 文件并解析。
 *
 * @param url OBJ 文件地址
 * @returns CustomGeometry 数组（每组对应一个 'o' 对象）
 */
export async function loadOBJFromUrl(url: string): Promise<CustomGeometry[]>
{
    const resp = await fetch(url);
    const text = await resp.text();

    return parseOBJ(text);
}

/**
 * 解析 OBJ 文本。
 *
 * @param text OBJ 文件内容
 * @returns CustomGeometry 数组（每个 'o'/'g' 分组一项）
 */
export function parseOBJ(text: string): CustomGeometry[]
{
    const vertices: number[][] = []; // [[x,y,z], ...]
    const uvs: number[][] = []; // [[u,v], ...]
    const normals: number[][] = []; // [[nx,ny,nz], ...]
    const groups: OBJGroup[] = [];
    let current: OBJGroup | null = null;

    // OBJ 索引以 1 为基，且允许负数（相对当前已读入的最后一个元素），0 非法
    const resolveIndex = (raw: string | undefined, count: number): number | null =>
    {
        if (raw === undefined || raw === '') return null;
        const index = Number(raw);
        if (!Number.isInteger(index) || index === 0) return null;

        return index < 0 ? count + index : index - 1;
    };

    // 解析索引并校验范围；越界引用按“缺失”处理，避免读到 undefined 而产出 NaN
    const resolveRef = (raw: string | undefined, count: number): number | null =>
    {
        const index = resolveIndex(raw, count);

        return index !== null && index >= 0 && index < count ? index : null;
    };

    for (const line of text.split('\n'))
    {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('#')) continue;

        const parts = trimmed.split(/\s+/);
        const cmd = parts[0];

        if (cmd === 'v')
        {
            vertices.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
        }
        else if (cmd === 'vt')
        {
            uvs.push([Number(parts[1]), Number(parts[2])]);
        }
        else if (cmd === 'vn')
        {
            normals.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
        }
        else if (cmd === 'o' || cmd === 'g')
        {
            current = { name: parts[1] || 'object', faces: [] };
            groups.push(current);
        }
        else if (cmd === 'f')
        {
            if (!current)
            {
                current = { name: 'default', faces: [] };
                groups.push(current);
            }
            // 面可以是三角形、四边形或任意多边形：先完整收下所有顶点，展开时再三角化
            const face: OBJVertexRef[] = [];
            for (let i = 1; i < parts.length; i++)
            {
                const indices = parts[i].split('/');
                const v = resolveRef(indices[0], vertices.length);
                if (v === null) continue; // 顶点引用非法，丢弃该顶点
                face.push({
                    v,
                    vt: resolveRef(indices[1], uvs.length),
                    vn: resolveRef(indices[2], normals.length),
                });
            }
            if (face.length >= 3) current.faces.push(face);
        }
    }

    // 为每个对象构建 CustomGeometry
    const geometries: CustomGeometry[] = [];
    for (const group of groups)
    {
        const positions: number[] = [];
        const norms: number[] = [];
        const uvArr: number[] = [];

        for (const face of group.faces)
        {
            // 扇形三角化：多边形 (v0, vi, vi+1) 依次构成三角形
            for (let i = 1; i < face.length - 1; i++)
            {
                for (const ref of [face[0], face[i], face[i + 1]])
                {
                    const v = vertices[ref.v] ?? [0, 0, 0];
                    positions.push(v[0], v[1], v[2]);

                    const n = ref.vn === null ? undefined : normals[ref.vn];
                    if (n) norms.push(n[0], n[1], n[2]);
                    else norms.push(0, 1, 0);

                    const uv = ref.vt === null ? undefined : uvs[ref.vt];
                    if (uv) uvArr.push(uv[0], uv[1]);
                    else uvArr.push(0, 0);
                }
            }
        }

        if (positions.length === 0) continue;

        const geo: CustomGeometry = { __type__: 'CustomGeometry' };
        // 顶点数据通过响应式数据接口写入（logic 字段只读）
        const r_geo = reactive(geo);
        r_geo.positions = positions;
        r_geo.normals = norms;
        const vCount = positions.length / 3;
        const indices: number[] = [];
        for (let i = 0; i < vCount; i++) indices.push(i);
        r_geo.indices = indices;
        r_geo.uvs = uvArr;
        const colors: number[] = [];
        for (let i = 0; i < vCount; i++) colors.push(1, 1, 1, 1);
        r_geo.colors = colors;

        geometries.push(geo);
    }

    return geometries;
}
