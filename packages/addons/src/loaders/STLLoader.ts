import { CustomGeometry, reactive } from 'feng3d';

/**
 * STL 加载器。
 *
 * 解析 STL 文件（二进制或 ASCII），返回 CustomGeometry（非索引，每面 3 顶点 + 法线）。
 * 对应 three.js addons/loaders/STLLoader.js。
 */

/**
 * 从 URL 加载 STL 文件并解析为 CustomGeometry。
 *
 * @param url STL 文件地址
 * @returns CustomGeometry（含 positions/normals，非索引）
 */
export async function loadSTLFromUrl(url: string): Promise<CustomGeometry>
{
    const resp = await fetch(url);
    const buffer = await resp.arrayBuffer();

    return parseSTL(buffer);
}

/**
 * 解析 STL ArrayBuffer（自动判断二进制/ASCII）。
 */
export function parseSTL(data: ArrayBuffer): CustomGeometry
{
    // 判断是否 ASCII：前 5 字节 == "solid" 且包含 "facet"
    const view = new Uint8Array(data);
    let isAscii = false;
    if (data.byteLength >= 5)
    {
        const header = String.fromCharCode(...view.slice(0, 5));
        if (header === 'solid')
        {
            // 进一步检查是否包含 "facet"（某些二进制 STL 也以 "solid" 开头）
            const sample = new TextDecoder().decode(view.slice(0, Math.min(data.byteLength, 512)));
            isAscii = sample.indexOf('facet') >= 0;
        }
    }

    if (isAscii)
    {
        return parseASCIISTL(new TextDecoder().decode(data));
    }

    return parseBinarySTL(data);
}

/**
 * 解析二进制 STL。
 */
function parseBinarySTL(data: ArrayBuffer): CustomGeometry
{
    const reader = new DataView(data);
    const faces = reader.getUint32(80, true);

    const positions: number[] = [];
    const normals: number[] = [];

    const dataOffset = 84;
    const faceLength = 50; // 12 floats + 2 bytes

    for (let face = 0; face < faces; face++)
    {
        const start = dataOffset + face * faceLength;
        const nx = reader.getFloat32(start, true);
        const ny = reader.getFloat32(start + 4, true);
        const nz = reader.getFloat32(start + 8, true);

        for (let i = 1; i <= 3; i++)
        {
            const vs = start + i * 12;
            positions.push(reader.getFloat32(vs, true), reader.getFloat32(vs + 4, true), reader.getFloat32(vs + 8, true));
            normals.push(nx, ny, nz);
        }
    }

    return buildGeometry(positions, normals);
}

/**
 * 解析 ASCII STL。
 */
function parseASCIISTL(text: string): CustomGeometry
{
    const positions: number[] = [];
    const normals: number[] = [];

    const lines = text.split('\n');
    let currentNormal = [0, 0, 1];

    for (const line of lines)
    {
        const trimmed = line.trim();
        if (trimmed.startsWith('facet normal'))
        {
            const parts = trimmed.split(/\s+/).slice(2);
            currentNormal = parts.map(Number);
        }
        else if (trimmed.startsWith('vertex'))
        {
            const parts = trimmed.split(/\s+/).slice(1);
            positions.push(Number(parts[0]), Number(parts[1]), Number(parts[2]));
            normals.push(currentNormal[0], currentNormal[1], currentNormal[2]);
        }
    }

    return buildGeometry(positions, normals);
}

function buildGeometry(positions: number[], normals: number[]): CustomGeometry
{
    const geo: CustomGeometry = { __type__: 'CustomGeometry' };
    // 顶点数据通过响应式数据接口写入（logic 字段只读）
    const r_geo = reactive(geo);
   r_geo.positions = positions;
   r_geo.normals = normals;
    // 非索引：每 3 个顶点一个三角形
    const vCount = positions.length / 3;
    const indices: number[] = [];
    for (let i = 0; i < vCount; i++) indices.push(i);
   r_geo.indices = indices;
    // 顶点色白色
    const colors: number[] = [];
    for (let i = 0; i < vCount; i++) colors.push(1, 1, 1, 1);
   r_geo.colors = colors;
   r_geo.uvs = new Array(vCount * 2).fill(0);

    return geo;
}
