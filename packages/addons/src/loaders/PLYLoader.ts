import { CustomGeometry, logic } from 'feng3d';

/**
 * PLY 加载器。
 *
 * 解析 Stanford PLY 文件（ASCII 或 binary_little_endian），返回 CustomGeometry。
 * 支持 vertex（x y z nx ny nz red green blue）和 face 属性。
 * 对应 three.js addons/loaders/PLYLoader.js（简化版）。
 */

export async function loadPLYFromUrl(url: string): Promise<CustomGeometry>
{
    const resp = await fetch(url);
    const buffer = await resp.arrayBuffer();

    return parsePLY(buffer);
}

export function parsePLY(buffer: ArrayBuffer): CustomGeometry
{
    // 读 header（ASCII）判断格式
    const bytes = new Uint8Array(buffer);
    let headerEnd = 0;
    // 找 "end_header\n"
    const target = [101,110,100,95,104,101,97,100,101,114,10]; // "end_header\n"
    for (let i = 0; i < bytes.length - target.length; i++)
    {
        let match = true;
        for (let j = 0; j < target.length; j++) { if (bytes[i + j] !== target[j]) { match = false; break; } }
        if (match) { headerEnd = i + target.length; break; }
    }

    const headerText = new TextDecoder().decode(bytes.slice(0, headerEnd));
    const headerLines = headerText.split('\n');

    let isBinary = false;
    let vertexCount = 0;
    let faceCount = 0;
    const props: string[] = []; // vertex 属性名顺序

    for (const line of headerLines)
    {
        const parts = line.trim().split(/\s+/);
        if (parts[0] === 'format') isBinary = parts[1] !== 'ascii';
        else if (parts[0] === 'element' && parts[1] === 'vertex') vertexCount = Number(parts[2]);
        else if (parts[0] === 'element' && parts[1] === 'face') faceCount = Number(parts[2]);
        else if (parts[0] === 'property' && parts.length >= 3) props.push(parts[parts.length - 1]);
    }

    if (isBinary) return parseBinaryPLY(buffer, headerEnd, vertexCount, faceCount, props);

    return parseASCIIPLY(new TextDecoder().decode(bytes.slice(headerEnd)), vertexCount, faceCount, props);
}

function parseASCIIPLY(text: string, vertexCount: number, faceCount: number, props: string[]): CustomGeometry
{
    const lines = text.split('\n');
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    let li = 0;

    // 读顶点
    for (let i = 0; i < vertexCount && li < lines.length; i++)
    {
        while (li < lines.length && lines[li].trim() === '') li++;
        if (li >= lines.length) break;
        const vals = lines[li].trim().split(/\s+/).map(Number);
        li++;
        const obj: Record<string, number> = {};
        for (let p = 0; p < props.length && p < vals.length; p++) obj[props[p]] = vals[p];
        positions.push(obj.x || 0, obj.y || 0, obj.z || 0);
        normals.push(obj.nx || 0, obj.ny || 0, obj.nz || 0);
    }

    // 读面（三角形）
    for (let i = 0; i < faceCount && li < lines.length; i++)
    {
        while (li < lines.length && lines[li].trim() === '') li++;
        if (li >= lines.length) break;
        const vals = lines[li].trim().split(/\s+/).map(Number);
        li++;
        const cnt = vals[0];
        if (cnt >= 3)
        {
            // 三角化 fan
            for (let j = 1; j < cnt - 1; j++) indices.push(vals[1], vals[j + 1], vals[j + 2]);
        }
    }

    return buildGeometry(positions, normals, indices);
}

function parseBinaryPLY(buffer: ArrayBuffer, headerEnd: number, vertexCount: number, faceCount: number, props: string[]): CustomGeometry
{
    const view = new DataView(buffer);
    let offset = headerEnd;
    const positions: number[] = [];
    const normals: number[] = [];

    // 读顶点（假设 float32 for x/y/z/nx/ny/nz, uchar for r/g/b）
    for (let i = 0; i < vertexCount; i++)
    {
        const obj: Record<string, number> = {};
        for (const prop of props)
        {
            if (prop === 'x' || prop === 'y' || prop === 'z' || prop.startsWith('n') || prop === 's' || prop === 't')
            {
                obj[prop] = view.getFloat32(offset, true);
                offset += 4;
            }
            else
            {
                obj[prop] = view.getUint8(offset);
                offset += 1;
            }
        }
        positions.push(obj.x || 0, obj.y || 0, obj.z || 0);
        normals.push(obj.nx || 0, obj.ny || 0, obj.nz || 0);
    }

    // 读面（假设 uchar count + int32 indices）
    const indices: number[] = [];
    for (let i = 0; i < faceCount; i++)
    {
        const cnt = view.getUint8(offset);
        offset += 1;
        const faceIdx: number[] = [];
        for (let j = 0; j < cnt; j++) { faceIdx.push(view.getInt32(offset, true)); offset += 4; }
        for (let j = 0; j < cnt - 2; j++) indices.push(faceIdx[0], faceIdx[j + 1], faceIdx[j + 2]);
    }

    return buildGeometry(positions, normals, indices);
}

function buildGeometry(positions: number[], normals: number[], indices: number[]): CustomGeometry
{
    const geo: CustomGeometry = { __type__: 'CustomGeometry' };
    const gl = logic(geo);
    gl.positions = positions;
    gl.normals = normals;
    (gl as unknown as { indices: number[] }).indices = indices.length > 0 ? indices : Array.from({ length: positions.length / 3 }, (_, i) => i);
    const vCount = positions.length / 3;
    gl.uvs = new Array(vCount * 2).fill(0);
    const colors: number[] = [];
    for (let i = 0; i < vCount; i++) colors.push(1, 1, 1, 1);
    gl.colors = colors;

    return geo;
}
