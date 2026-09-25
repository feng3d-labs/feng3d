import { CustomGeometry, reactive } from 'feng3d';

/**
 * OBJ 加载器。
 *
 * 解析 Wavefront OBJ 文件（v/vt/vn/f），返回 CustomGeometry[]（每个 'o'/'g' 一组）。
 * 对应 three.js addons/loaders/OBJLoader.js（简化版，不含材质）。
 */

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
 */
export function parseOBJ(text: string): CustomGeometry[]
{
    const vertices: number[][] = []; // [[x,y,z], ...]
    const uvs: number[][] = []; // [[u,v], ...]
    const normals: number[][] = []; // [[nx,ny,nz], ...]
    const objects: {
        name: string;
        faces: { v: [number, number, number][]; vt: ([number, number] | null)[]; vn: ([number, number, number] | null)[] }[];
    }[] = [];
    let current: { name: string; faces: any[] } | null = null;

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
            objects.push(current);
        }
        else if (cmd === 'f')
        {
            if (!current)
            {
                current = { name: 'default', faces: [] };
                objects.push(current);
            }
            const face: { v: [number, number, number][]; vt: any[]; vn: any[] } = { v: [], vt: [], vn: [] };
            for (let i = 1; i <= 3; i++) // 只取前 3 个顶点（三角化）
            {
                const idx = parts[i].split('/');
                face.v.push([Number(idx[0]) - 1, Number(idx[0]) - 1, Number(idx[0]) - 1]);
                face.vt.push(idx[1] ? [Number(idx[1]) - 1, uvs[Number(idx[1]) - 1]] : null);
                face.vn.push(idx[2] ? normals[Number(idx[2]) - 1] : null);
            }
            current.faces.push(face);
        }
    }

    // 为每个对象构建 CustomGeometry
    const geometries: CustomGeometry[] = [];
    for (const obj of objects)
    {
        const positions: number[] = [];
        const norms: number[] = [];
        const uvArr: number[] = [];

        for (const face of obj.faces)
        {
            for (let i = 0; i < 3; i++)
            {
                const vi = face.v[i][0];
                const v = vertices[vi];
                positions.push(v[0], v[1], v[2]);
                if (face.vn[i]) norms.push(face.vn[i]![0], face.vn[i]![1], face.vn[i]![2]);
                else norms.push(0, 1, 0);
                if (face.vt[i]) uvArr.push(face.vt[i]![0], face.vt[i]![1]);
                else uvArr.push(0, 0);
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
