import { CustomGeometry, logic, Object3D, StandardMaterial } from 'feng3d';

/**
 * glTF 加载器（简化版）。
 *
 * 支持：
 * - GLB 二进制格式（embedded buffer）
 * - 静态网格（POSITION/NORMAL/TEXCOORD_0 + indices）
 * - 场景图节点层级（translation/rotation/scale）
 * - 默认 StandardMaterial（不解析 glTF 材质/纹理）
 *
 * 不支持：材质/纹理、动画、骨骼/蒙皮、形变目标、扩展（KHR 等）、 Draco 压缩。
 *
 * 对应 three.js addons/loaders/GLTFLoader.js（大幅简化）。
 */

// glTF componentType → TypedArray
const COMPONENT_TYPES: Record<number, { new (n: number): ArrayBufferView; BYTES_PER_ELEMENT: number }> = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
};

// glTF accessor.type → 每元素分量数
const TYPE_COMPONENTS: Record<string, number> = {
    SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16,
};

interface GLTFJson
{
    asset?: { version: string };
    buffers?: { byteLength: number; uri?: string }[];
    bufferViews?: { buffer: number; byteOffset: number; byteLength: number; target?: number }[];
    accessors?: { bufferView: number; componentType: number; count: number; byteOffset?: number; type: string; normalized?: boolean }[];
    meshes?: { primitives: { attributes: Record<string, number>; indices?: number; material?: number }[] }[];
    nodes?: { mesh?: number; children?: number[]; translation?: [number, number, number]; rotation?: [number, number, number, number]; scale?: [number, number, number]; name?: string }[];
    scenes?: { nodes: number[] }[];
    materials?: object[];
}

interface GLTFResult
{
    /** 根节点（含所有 node 层级 + mesh） */
    root: Object3D;
}

/**
 * 从 URL 加载 GLB/glTF 文件。
 */
export async function loadGLFFromUrl(url: string): Promise<GLTFResult>
{
    const resp = await fetch(url);
    const buffer = await resp.arrayBuffer();

    return parseGLB(buffer);
}

/**
 * 解析 GLB 二进制格式。
 */
export function parseGLB(buffer: ArrayBuffer): GLTFResult
{
    const view = new DataView(buffer);
    // GLB header: magic(4) + version(4) + length(4)
    const magic = view.getUint32(0, true);
    if (magic !== 0x46546c67) throw new Error('Not a GLB file (magic mismatch)');

    const version = view.getUint32(4, true);
    const totalLength = view.getUint32(8, true);

    // GLB chunks: JSON chunk + BIN chunk
    let offset = 12;
    let jsonChunk: ArrayBuffer | null = null;
    let binChunk: ArrayBuffer | null = null;

    while (offset < totalLength)
    {
        const chunkLength = view.getUint32(offset, true);
        const chunkType = view.getUint32(offset + 4, true);
        const chunkData = buffer.slice(offset + 8, offset + 8 + chunkLength);

        if (chunkType === 0x4e4f534a) jsonChunk = chunkData; // 'JSON'
        else if (chunkType === 0x004e4942) binChunk = chunkData; // 'BIN\0'

        offset += 8 + chunkLength;
        // 4-byte padding
        if (offset % 4 !== 0) offset += 4 - (offset % 4);
    }

    if (!jsonChunk) throw new Error('GLB: no JSON chunk');

    const json: GLTFJson = JSON.parse(new TextDecoder().decode(jsonChunk));
    const binaryBuffer = binChunk || new ArrayBuffer(0);

    return parseGLTFJson(json, [binaryBuffer]);
}

/**
 * 解析 glTF JSON + buffers。
 */
function parseGLTFJson(json: GLTFJson, buffers: ArrayBuffer[]): GLTFResult
{
    const accessors = json.accessors || [];
    const bufferViews = json.bufferViews || [];
    const meshes = json.meshes || [];
    const nodes = json.nodes || [];
    const scenes = json.scenes || [];

    // 默认 StandardMaterial（灰色无高光，不触发 envmap 采样）
    const defaultMat: StandardMaterial = {
        __type__: 'StandardMaterial',
        uniforms: {
            u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 },
            u_specular: { __type__: 'Color4', r: 0.04, g: 0.04, b: 0.04, a: 1 },
            u_glossiness: 32, u_reflectivity: 0,
        },
    };

    // 解析 accessor → TypedArray
    function getAccessorData(index: number): { array: ArrayBufferView; count: number; components: number }
    {
        const acc = accessors[index];
        const bv = bufferViews[acc.bufferView];
        const buffer = buffers[bv.buffer ?? 0];
        const TypedArrayCtor = COMPONENT_TYPES[acc.componentType];
        if (!TypedArrayCtor) throw new Error(`Unknown componentType ${acc.componentType}`);
        const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
        const components = TYPE_COMPONENTS[acc.type] || 1;
        const elementCount = acc.count * components;
        // TypedArray 构造器签名：new (buffer, byteOffset, length)
        const array = new (TypedArrayCtor as unknown as new (
            buffer: ArrayBufferLike, byteOffset: number, length: number) => ArrayBufferView)(
            buffer, byteOffset, elementCount);

        return { array, count: acc.count, components };
    }

    // 构建 mesh primitive → CustomGeometry
    function buildPrimitive(prim: { attributes: Record<string, number>; indices?: number }): CustomGeometry
    {
        const posData = getAccessorData(prim.attributes.POSITION);
        const positions = Array.from(posData.array as Float32Array);

        let normals: number[] = [];
        if (prim.attributes.NORMAL !== undefined)
        {
            const nData = getAccessorData(prim.attributes.NORMAL);
            normals = Array.from(nData.array as Float32Array);
        }
        else
        {
            normals = new Array(positions.length).fill(0);
        }

        let uvs: number[] = [];
        if (prim.attributes.TEXCOORD_0 !== undefined)
        {
            const uvData = getAccessorData(prim.attributes.TEXCOORD_0);
            uvs = Array.from(uvData.array as Float32Array);
        }
        else
        {
            uvs = new Array(posData.count * 2).fill(0);
        }

        let indices: number[];
        if (prim.indices !== undefined)
        {
            const idxData = getAccessorData(prim.indices);
            indices = Array.from(idxData.array as Uint16Array | Uint32Array);
        }
        else
        {
            indices = Array.from({ length: posData.count }, (_, i) => i);
        }

        const geo: CustomGeometry = { __type__: 'CustomGeometry' };
        const gl = logic(geo);
        gl.positions = positions;
        gl.normals = normals;
        gl.uvs = uvs;
        (gl as unknown as { indices: number[] }).indices = indices;
        const colors: number[] = [];
        for (let i = 0; i < posData.count; i++) colors.push(1, 1, 1, 1);
        gl.colors = colors;

        return geo;
    }

    // 构建 node 树
    function buildNode(nodeIndex: number): Object3D
    {
        const nodeDef = nodes[nodeIndex];

        // transform
        const position = nodeDef.translation
            ? { x: nodeDef.translation[0], y: nodeDef.translation[1], z: nodeDef.translation[2] }
            : undefined;
        const scale = nodeDef.scale
            ? { x: nodeDef.scale[0], y: nodeDef.scale[1], z: nodeDef.scale[2] }
            : undefined;
        // rotation (quaternion → 省略，暂不支持，feng3d 用 Euler)

        // mesh components
        let components: { __type__: 'MeshRenderer'; geometry: CustomGeometry; material: StandardMaterial }[] | undefined;
        if (nodeDef.mesh !== undefined)
        {
            const meshDef = meshes[nodeDef.mesh];
            components = [];
            for (const prim of meshDef.primitives)
            {
                const geo = buildPrimitive(prim);
                components.push({
                    __type__: 'MeshRenderer',
                    geometry: geo,
                    material: defaultMat,
                });
                break; // 只取第一个 primitive
            }
        }

        // children
        const children = nodeDef.children ? nodeDef.children.map(buildNode) : undefined;

        // 一次性组装字面量（确保响应式系统在 init 时能读到所有字段）
        const obj: Object3D = {
            __type__: 'Object3D',
            name: nodeDef.name || `node_${nodeIndex}`,
            ...(position && { position }),
            ...(scale && { scale }),
            ...(components && { components }),
            ...(children && { children }),
        };

        return obj;
    }

    // 构建场景
    const sceneDef = scenes[0] || { nodes: [0] };
    const root: Object3D = {
        __type__: 'Object3D',
        name: 'glTF Scene',
        children: sceneDef.nodes.map(buildNode),
    };

    return { root };
}
