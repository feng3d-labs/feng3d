import { Matrix4x4, Quaternion, Vector3 } from '@feng3d/math';
import { CustomGeometry, Object3D, reactive, StandardMaterial } from 'feng3d';
import type { Components, Skeleton } from 'feng3d';

/**
 * glTF 2.0 加载器（做深而非做多）。
 *
 * 支持：
 * - GLB 二进制容器（JSON chunk + BIN chunk）
 * - `.gltf` JSON 文档 + **内嵌 base64 buffer**（`data:application/octet-stream;base64,...`）
 * - 一个 mesh 的**全部 primitive**：每个 primitive 独立产出一份几何（不跨 primitive 合并）
 * - 节点层级（scenes/nodes/children）与节点变换（translation/rotation/scale，含 `matrix` 形式）
 * - POSITION / NORMAL / TEXCOORD_0 顶点属性与 indices
 * - 蒙皮顶点属性 `JOINTS_0`/`WEIGHTS_0`（存在时含第二组 `JOINTS_1`/`WEIGHTS_1`）→ 几何的
 *   `a_skinIndices`/`a_skinWeights`（第二组 `a_skinIndices1`/`a_skinWeights1`），每顶点最多 8 根骨骼
 * - 骨骼蒙皮数据（`skins`）：`joints` → `Skeleton.boneNames`、`inverseBindMatrices` → `Skeleton.boneInverses`，
 *   Skeleton 组件挂在引用该 skin 的节点上
 * - glTF `materials` 的**因子**映射到 StandardMaterial：`pbrMetallicRoughness.baseColorFactor` → `u_diffuse`、
 *   `doubleSided` → `cullFace`、`alphaMode`/`alphaCutoff` → `u_alphaThreshold`、`name` → `Material.name`
 *   （逐条映射依据见 `parseGLTFDocument` 内的 `buildMaterial`）
 * - primitive 按自身的 `material` 下标取材质；下标缺失或越界时回落到默认材质（灰色无高光），
 *   且每个 primitive 各持一份**独立**的材质数据（不共享实例，避免"改一处影响全部"）
 *
 * 变换语义：**顶点在解析期被烘焙到世界空间**——每个节点沿父链累乘得到世界矩阵
 * （`M_world = M_local × M_parent_world`，与 {@link Object3DLogic.local2world} 同一约定），
 * 位置用世界矩阵变换、法线用其逆转置变换。因此产出的 Object3D 树只承载层级/名称，
 * 其自身 transform 保持单位矩阵，避免对已烘焙的顶点二次变换。
 *
 * 不支持：**纹理与采样器**（`baseColorTexture` / `normalTexture` 等需要异步加载图片）、
 * `metallicFactor` / `roughnessFactor` / `emissiveFactor`（StandardMaterial 是 Phong 风格，
 * 没有对应字段，不做臆造的等价映射）、`alphaMode: 'BLEND'` 的透明混合（无可用开关）、
 * 动画、形变目标、Draco 压缩、外部文件 URI
 * （`buffers[].uri` 指向外部文件需网络/文件读取，暂不实现）。
 *
 * **着色器尚未实现蒙皮**：`a_skinIndices`/`a_skinWeights` 当前只解析落盘（由 `SkinnedMeshRenderer`
 * 与面元着色器消费它们属于后续工作）。
 *
 * 对应 three.js addons/loaders/GLTFLoader.js（大幅简化）。
 */

declare module 'feng3d'
{
    /**
     * 蒙皮顶点属性（issue #337 第一步：加载器负责解析落盘）。
     *
     * 命名沿用主库既有约定（见 `packages/feng3d/src/shaders/modules/skeleton_pars_vert.glsl` 的
     * `a_skinIndices`/`a_skinWeights`，第二组 `a_skinIndices1`/`a_skinWeights1` 对应
     * `JOINTS_1`/`WEIGHTS_1`，每顶点最多 8 根骨骼）。名字带 `a_` 前缀是因为它们最终要以顶点属性
     * 形式进入着色器。
     *
     * 这些字段目前只是几何数据上的附加数据：`CustomGeometryLogic` 尚未把它们接入顶点属性表，
     * 消费它们是 issue #337 第二步（着色器 + `SkinnedMeshRenderer`）的工作。
     */
    interface CustomGeometry
    {
        /** 骨骼索引（每顶点 4 个，来自 `JOINTS_0`；无蒙皮属性时为 undefined） */
        readonly a_skinIndices?: ReadonlyArray<number>;
        /** 骨骼权重（每顶点 4 个，来自 `WEIGHTS_0`；无蒙皮属性时为 undefined） */
        readonly a_skinWeights?: ReadonlyArray<number>;
        /** 骨骼索引第二组（每顶点 4 个，来自 `JOINTS_1`；缺失时为 undefined） */
        readonly a_skinIndices1?: ReadonlyArray<number>;
        /** 骨骼权重第二组（每顶点 4 个，来自 `WEIGHTS_1`；缺失时为 undefined） */
        readonly a_skinWeights1?: ReadonlyArray<number>;
    }
}

/** glTF componentType → TypedArray 构造器 */
const COMPONENT_TYPES: Record<number, { new (n: number): ArrayBufferView; new (buffer: ArrayBufferLike): ArrayBufferView; BYTES_PER_ELEMENT: number }> = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
};

/** glTF accessor.type → 每元素分量数 */
const TYPE_COMPONENTS: Record<string, number> = {
    SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16,
};

/**
 * glTF `normalized` 整数分量类型 → 反归一化除数。
 *
 * 规范（3.6.2.2）：无符号类型映射到 [0,1]（除以最大值）、有符号类型映射到 [-1,1]（除以最大值）。
 * 注意 `UNSIGNED_SHORT(5123)` 的除数是 65535 而非 255——蒙皮权重允许用 normalized 的 ushort。
 */
const NORMALIZED_DIVISORS: Record<number, number> = {
    5120: 127,   // BYTE
    5121: 255,   // UNSIGNED_BYTE
    5122: 32767, // SHORT
    5123: 65535, // UNSIGNED_SHORT
};

/** GLB 容器魔数 'glTF'（小端） */
const GLB_MAGIC = 0x46546c67;
/** GLB JSON chunk 类型 'JSON'（小端） */
const GLB_CHUNK_JSON = 0x4e4f534a;
/** GLB BIN chunk 类型 'BIN\0'（小端） */
const GLB_CHUNK_BIN = 0x004e4942;

/**
 * glTF 材质定义（`materials[i]`）。
 *
 * 只声明**本轮实际消费**的因子字段：纹理引用（`baseColorTexture` / `normalTexture` / …）、
 * `metallicFactor` / `roughnessFactor` / `emissiveFactor` 有意不声明——目标材质
 * `StandardMaterial` 是 Phong 风格，这些量没有对应字段，声明了也无法消费，
 * 详见 `parseGLTFDocument` 内的 `buildMaterial`。
 */
interface GLTFMaterialDef
{
    /** 材质名称（glTF 可选） */
    name?: string;
    /** PBR 金属-粗糙度参数（仅取其 `baseColorFactor`） */
    pbrMetallicRoughness?: {
        /** 基础色因子 `[r,g,b,a]`，glTF 缺省 `[1,1,1,1]` */
        baseColorFactor?: number[];
    };
    /** 是否双面渲染（glTF 缺省 `false`，即单面 + 剔除背面） */
    doubleSided?: boolean;
    /** 透明度模式（glTF 缺省 `'OPAQUE'`） */
    alphaMode?: 'OPAQUE' | 'MASK' | 'BLEND';
    /** 透明度裁剪阈值，**仅 `alphaMode === 'MASK'` 时有效**（glTF 缺省 `0.5`） */
    alphaCutoff?: number;
}

/** glTF JSON 文档结构（仅声明本加载器用到的字段） */
interface GLTFJson
{
    asset?: { version?: string };
    buffers?: { byteLength: number; uri?: string }[];
    bufferViews?: { buffer?: number; byteOffset?: number; byteLength: number; target?: number }[];
    accessors?: {
        bufferView?: number;
        componentType: number;
        count: number;
        byteOffset?: number;
        type: string;
        normalized?: boolean;
    }[];
    /** 材质定义（primitive 的 `material` 指向本数组下标） */
    materials?: GLTFMaterialDef[];
    meshes?: {
        name?: string;
        primitives: { attributes: Record<string, number>; indices?: number; material?: number; mode?: number }[];
    }[];
    nodes?: {
        mesh?: number;
        skin?: number;
        children?: number[];
        matrix?: number[];
        translation?: number[];
        rotation?: number[];
        scale?: number[];
        name?: string;
    }[];
    /** 骨骼蒙皮定义（`joints` 为 node 下标列表，`inverseBindMatrices` 为 MAT4 accessor 下标） */
    skins?: {
        name?: string;
        joints: number[];
        inverseBindMatrices?: number;
        skeleton?: number;
    }[];
    scenes?: { nodes?: number[]; name?: string }[];
    scene?: number;
}

/** 单个 glTF primitive 解析结果 */
export interface GLTFPrimitive
{
    /** 所属 glTF mesh 在 `meshes` 中的下标 */
    readonly meshIndex: number;
    /** 该 primitive 在 `mesh.primitives` 中的下标 */
    readonly primitiveIndex: number;
    /** 产出该 primitive 的节点在 `nodes` 中的下标（未挂在任何节点上时为 -1） */
    readonly nodeIndex: number;
    /** 顶点数 */
    readonly vertexCount: number;
    /** primitive 的绘制模式（glTF 默认 4 = TRIANGLES） */
    readonly mode: number;
    /**
     * 该 primitive 的材质（按自身 `material` 下标解析 `materials[i]` 的因子）。
     *
     * `material` 下标缺失或越界时回落到默认材质；无论哪条路径，每个 primitive
     * 都持有**独立**的材质数据实例。
     */
    readonly material: StandardMaterial;
    /** 该 primitive 的几何数据（顶点已烘焙到世界空间） */
    readonly geometry: CustomGeometry;
}

/** 一个 glTF mesh 的解析结果（含它挂载到的节点） */
export interface GLTFMesh
{
    /** 所属 glTF mesh 在 `meshes` 中的下标 */
    readonly meshIndex: number;
    /** 承载该 mesh 的节点在 `nodes` 中的下标（未挂载时为 -1） */
    readonly nodeIndex: number;
    /** 该 mesh 的**全部** primitive（顺序与 glTF 一致） */
    readonly primitives: GLTFPrimitive[];
}

/** 一个 glTF skin（骨骼蒙皮）的解析结果 */
export interface GLTFSkin
{
    /** 该 skin 在 `skins` 中的下标 */
    readonly skinIndex: number;
    /** skin 名称（glTF 未命名时为 undefined） */
    readonly name?: string;
    /** 引用该 skin 的节点在 `nodes` 中的下标（即 `node.skin` 所在节点） */
    readonly nodeIndex: number;
    /**
     * 骨骼名称列表（与 `skins[].joints` 逐项对应）。
     *
     * 取名规则与建树时**完全一致**（`nodeDef.name || \`node_${index}\``），
     * 因此 `SkeletonLogic` 能在实体树里按这些名字找到骨骼对象。
     */
    readonly boneNames: string[];
    /** 骨骼逆绑定矩阵列表（与 `joints` 逐项对应，列主序） */
    readonly boneInverses: Matrix4x4[];
}

/** glTF 解析结果 */
export interface GLTFResult
{
    /** 根节点（含所有 node 层级 + mesh） */
    readonly root: Object3D;
    /** 全部 primitive 的平铺列表（含未挂在场景中的 mesh） */
    readonly primitives: GLTFPrimitive[];
    /** 按 glTF mesh 分组的 primitive 列表 */
    readonly meshes: GLTFMesh[];
    /** 全部 skin 的平铺列表（无 `skins` 的文档为空数组） */
    readonly skins: GLTFSkin[];
}

/** glTF accessor 读取结果 */
interface AccessorData
{
    /** 类型化数组（已按 accessor 的 byteOffset/byteLength 从 buffer 中切出独立副本） */
    readonly array: ArrayBufferView;
    /** 该 accessor 是否为整数归一化数据（如 Int8/Uint16 归一化到 [0,1] 或 [-1,1]） */
    readonly normalized: boolean;
    /** 分量类型（glTF componentType） */
    readonly componentType: number;
}

/**
 * 从 URL 加载 glTF 资源。
 *
 * 依据内容魔数分发（比看 URL 后缀可靠，后缀可能是查询串/带 hash 的）：
 * 以 `glTF` 魔数开头走 {@link parseGLB}，否则按 JSON 文档走 {@link parseGLTF}。
 * 外部文件 URI 未支持，`.gltf` 仅支持内嵌 base64 buffer。
 *
 * @param url glTF/GLB 资源地址
 */
export async function loadGltfFromUrl(url: string): Promise<GLTFResult>
{
    const resp = await fetch(url);
    const buffer = await resp.arrayBuffer();

    if (buffer.byteLength >= 4 && new DataView(buffer).getUint32(0, true) === GLB_MAGIC)
    {
        return parseGLB(buffer);
    }

    return parseGLTF(new TextDecoder().decode(buffer));
}

/**
 * 从 URL 加载 glTF 资源（`loadGltfFromUrl` 的历史别名，保留以免破坏既有调用）。
 *
 * @deprecated 拼写有误，请改用 {@link loadGltfFromUrl}。
 */
export const loadGLFFromUrl = loadGltfFromUrl;

/**
 * 解析 GLB 二进制容器。
 *
 * @param buffer GLB 文件字节
 */
export function parseGLB(buffer: ArrayBuffer): GLTFResult
{
    const view = new DataView(buffer);
    if (buffer.byteLength < 12) throw new Error('GLB: 文件长度不足 12 字节，缺少文件头');

    // GLB header: magic(4) + version(4) + length(4)
    const magic = view.getUint32(0, true);
    if (magic !== GLB_MAGIC) throw new Error('Not a GLB file (magic mismatch)');

    const totalLength = view.getUint32(8, true);

    // GLB chunks: JSON chunk + BIN chunk
    let offset = 12;
    let jsonChunk: ArrayBuffer | null = null;
    let binChunk: ArrayBuffer | null = null;

    while (offset + 8 <= totalLength && offset + 8 <= buffer.byteLength)
    {
        const chunkLength = view.getUint32(offset, true);
        const chunkType = view.getUint32(offset + 4, true);
        const chunkData = buffer.slice(offset + 8, offset + 8 + chunkLength);

        if (chunkType === GLB_CHUNK_JSON) jsonChunk = chunkData;
        else if (chunkType === GLB_CHUNK_BIN) binChunk = chunkData;

        offset += 8 + chunkLength;
        // 4-byte padding
        if (offset % 4 !== 0) offset += 4 - (offset % 4);
    }

    if (!jsonChunk) throw new Error('GLB: no JSON chunk');

    const json: GLTFJson = JSON.parse(new TextDecoder().decode(jsonChunk));

    // buffers[i] 无 uri 时数据来自 BIN chunk（解码失败直接抛错，不静默产出空几何）
    const buffers = (json.buffers || []).map((bufferDef, i) => decodeBuffer(bufferDef, i, binChunk));

    return parseGLTFDocument(json, buffers);
}

/**
 * 解析 `.gltf` JSON 文档。
 *
 * 仅支持内嵌 base64 buffer（`data:` URI）；外部文件 URI 会抛错而不是静默产出空几何。
 *
 * @param text `.gltf` 文档内容
 */
export function parseGLTF(text: string): GLTFResult
{
    const json: GLTFJson = JSON.parse(text);
    const buffers = (json.buffers || []).map((bufferDef, i) => decodeBuffer(bufferDef, i, null));

    return parseGLTFDocument(json, buffers);
}

/**
 * 解码 `buffers[i]`。
 *
 * glTF 规范：`uri` 缺省表示数据来自 GLB 的 BIN chunk，此时必须传入 `binChunk`
 * （否则会退化成空 buffer，读 accessor 时报 "Invalid typed array length"）。
 * `data:` URI 直接解码；外部文件 URI 显式报错。
 *
 * @param bufferDef buffers[i] 定义
 * @param index buffers 下标（用于报错定位）
 * @param binChunk GLB 的 BIN chunk（非 GLB 来源时传 null）
 */
function decodeBuffer(
    bufferDef: { byteLength: number; uri?: string }, index: number, binChunk: ArrayBuffer | null): ArrayBuffer
{
    if (bufferDef.uri === undefined)
    {
        if (!binChunk || binChunk.byteLength === 0)
        {
            throw new Error(`glTF: buffers[${index}] 没有 uri 且没有可用的 GLB BIN chunk`);
        }

        return binChunk;
    }

    if (!bufferDef.uri.startsWith('data:'))
    {
        throw new Error(`glTF: buffers[${index}] 使用外部 URI "${bufferDef.uri}"，当前仅支持 GLB 的 BIN chunk 与内嵌 base64 buffer`);
    }

    const commaIndex = bufferDef.uri.indexOf(',');
    if (commaIndex < 0) throw new Error(`glTF: buffers[${index}] 的 data URI 缺少逗号分隔符`);

    const meta = bufferDef.uri.slice(5, commaIndex);
    const payload = bufferDef.uri.slice(commaIndex + 1);

    return meta.includes(';base64') ? decodeBase64(payload) : decodePercentEncoded(payload);
}

/** 解码 base64 字符串（不依赖 atob/Buffer，浏览器与 Node 通用） */
function decodeBase64(base64: string): ArrayBuffer
{
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    // 去掉 URL-safe 变体字符与空白，并忽略尾部 padding
    const clean = base64.replace(/[\s]/g, '').replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
    const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
    let byteIndex = 0;
    let buffer = 0;
    let bits = 0;

    for (let i = 0; i < clean.length; i++)
    {
        const value = alphabet.indexOf(clean[i]);
        if (value < 0) throw new Error(`glTF: base64 buffer 含非法字符 "${clean[i]}"`);
        buffer = (buffer << 6) | value;
        bits += 6;
        if (bits >= 8)
        {
            bits -= 8;
            bytes[byteIndex++] = (buffer >> bits) & 0xff;
        }
    }

    return bytes.buffer;
}

/** 解码 `data:...;charset=...` 形式的非 base64（百分号转义）buffer */
function decodePercentEncoded(payload: string): ArrayBuffer
{
    const decoded = decodeURIComponent(payload);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i) & 0xff;

    return bytes.buffer;
}

/**
 * 解析 glTF JSON + 已解码的 buffers。
 *
 * @param json glTF JSON 文档
 * @param buffers 与 `json.buffers` 一一对应的二进制数据
 */
function parseGLTFDocument(json: GLTFJson, buffers: ArrayBuffer[]): GLTFResult
{
    const accessors = json.accessors || [];
    const bufferViews = json.bufferViews || [];
    const meshesDef = json.meshes || [];
    const nodes = json.nodes || [];
    const skinsDef = json.skins || [];
    const scenes = json.scenes || [];
    const materialsDef = json.materials || [];

    /**
     * 默认 StandardMaterial（灰色无高光，不触发 envmap 采样）。
     *
     * 做成工厂而不是共享常量：多个 primitive 回落时各自拿到独立实例，
     * 消除"改一个材质影响全部 primitive"的隐患；内容与此前的 `defaultMat` 完全一致。
     */
    function createDefaultMaterial(): StandardMaterial
    {
        return {
            __type__: 'StandardMaterial',
            uniforms: {
                u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 },
                u_specular: { __type__: 'Color4', r: 0.04, g: 0.04, b: 0.04, a: 1 },
                u_glossiness: 32, u_reflectivity: 0,
            },
        };
    }

    /**
     * 把 `materials[index]` 的**因子**解析为一份 StandardMaterial 数据。
     *
     * 映射及其依据（glTF 2.0 规范条目 + 仓库字段）：
     * - `pbrMetallicRoughness.baseColorFactor`（规范 5.20，4 分量 `[r,g,b,a]`，缺省 `[1,1,1,1]`）
     *   → `uniforms.u_diffuse`（`StandardUniforms.u_diffuse`，类型 `Color4`）；
     * - `doubleSided`（规范 5.19，缺省 `false`）→ `cullFace`：`true` → `'none'`（双面，
     *   与 `StandardMaterial.cullFace` 的注释"对应 three.js DoubleSide"一致），否则 `'back'`；
     * - `alphaMode` / `alphaCutoff`（规范 5.19 / 3.9.2）→ `uniforms.u_alphaThreshold`：
     *   `'MASK'` 用 `alphaCutoff`（缺省 `0.5`），其余模式为 `0`（规范明确 `alphaCutoff`
     *   只对 `'MASK'` 有效，`'OPAQUE'`/`'BLEND'` 不应受它影响）；
     * - `name`（规范 5.19）→ `Material.name`。
     *
     * **有意不映射**（无依据，不臆造等价映射）：
     * - `metallicFactor` / `roughnessFactor`：StandardMaterial 没有 metallic/roughness 字段；
     * - `emissiveFactor`：StandardMaterial 没有自发光字段；
     * - `alphaMode: 'BLEND'` 的透明混合：`StandardMaterial` 数据接口没有 `blend` 字段
     *   （该字段只存在于 `TextureMaterial`，见 `packages/feng3d/src/materials/TextureMaterial.ts`），
     *   其 logic（`StandardMaterialLogic`）也未覆写 `isTransparent`（基类 `MaterialLogic.isTransparent`
     *   恒为 `false`），因此既没有可写的开关、也不该靠写 `s_diffuse` 贴图绕过——如实不做。
     *
     * @param index primitive 的 `material` 下标（缺省/越界时回落默认材质）
     */
    function buildMaterial(index: number | undefined): StandardMaterial
    {
        const materialDef = index === undefined ? undefined : materialsDef[index];
        if (!materialDef) return createDefaultMaterial();

        // Color4 是纯数据接口（packages/feng3d/src/core/Color4.ts）：下面用 __type__ 字面量构造，禁止 new。
        // baseColorFactor 缺省 [1,1,1,1]（规范 5.20），分量缺失按 1 处理
        const baseColor = materialDef.pbrMetallicRoughness?.baseColorFactor;
        const alphaMode = materialDef.alphaMode ?? 'OPAQUE';
        const alphaThreshold = alphaMode === 'MASK' ? (materialDef.alphaCutoff ?? 0.5) : 0;

        return {
            __type__: 'StandardMaterial',
            ...(materialDef.name !== undefined && { name: materialDef.name }),
            // doubleSided 缺省 false：glTF 默认单面 + 剔除背面
            cullFace: materialDef.doubleSided === true ? 'none' : 'back',
            uniforms: {
                u_diffuse: {
                    __type__: 'Color4',
                    r: baseColor?.[0] ?? 1,
                    g: baseColor?.[1] ?? 1,
                    b: baseColor?.[2] ?? 1,
                    a: baseColor?.[3] ?? 1,
                },
                u_alphaThreshold: alphaThreshold,
                // Phong 高光参数沿用默认材质：glTF 的 metallic/roughness 无对应字段，不能塞到这里
                u_specular: { __type__: 'Color4', r: 0.04, g: 0.04, b: 0.04, a: 1 },
                u_glossiness: 32,
                u_reflectivity: 0,
            },
        };
    }

    /** 解析 accessor → 类型化数组视图 + 元信息 */
    function getAccessorData(index: number): AccessorData
    {
        const acc = accessors[index];
        if (!acc) throw new Error(`glTF: accessors[${index}] 不存在`);
        if (acc.bufferView === undefined) throw new Error(`glTF: accessors[${index}] 没有 bufferView`);

        const bv = bufferViews[acc.bufferView];
        if (!bv) throw new Error(`glTF: bufferViews[${acc.bufferView}] 不存在`);

        const buffer = buffers[bv.buffer ?? 0];
        const TypedArrayCtor = COMPONENT_TYPES[acc.componentType];
        if (!TypedArrayCtor) throw new Error(`Unknown componentType ${acc.componentType}`);
        if (!buffer) throw new Error(`glTF: buffers[${bv.buffer ?? 0}] 未提供`);

        const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
        const components = TYPE_COMPONENTS[acc.type] || 1;
        const bytesPerElement = TypedArrayCtor.BYTES_PER_ELEMENT;
        const byteLength = acc.count * components * bytesPerElement;

        if (byteOffset + byteLength > buffer.byteLength)
        {
            throw new Error(`glTF: accessors[${index}] 越界（需要 ${byteOffset + byteLength} 字节，buffer 只有 ${buffer.byteLength} 字节）`);
        }

        // `new TypedArray(buffer, byteOffset, length)` 要求 byteOffset 按元素大小对齐，而 glTF 只保证
        // accessor 起点 4 字节对齐——当元素更大（如 MAT4）或从奇数偏移读 uint16 时会直接抛错。
        // 统一 slice 出对齐的独立副本：既绕开对齐限制，也避免视图共享外部 buffer。
        const slice = buffer.slice(byteOffset, byteOffset + byteLength);
        const array = new TypedArrayCtor(slice);

        return { array, normalized: acc.normalized === true, componentType: acc.componentType };
    }

    /**
     * 把 accessor 读成普通 number[]。
     *
     * 带 `normalized` 标记的整数 accessor 按 glTF 规范反归一化：
     * 无符号映射到 [0,1]、有符号映射到 [-1,1]。
     */
    function readAccessor(index: number): number[]
    {
        const data = getAccessorData(index);
        const view = data.array as unknown as ArrayLike<number>;
        if (!data.normalized) return Array.from(view);

        const out = new Array<number>(view.length);
        const divisor = NORMALIZED_DIVISORS[data.componentType] ?? 1;
        const unsigned = data.componentType === 5121 || data.componentType === 5123;

        for (let i = 0; i < view.length; i++)
        {
            out[i] = unsigned ? view[i] / divisor : Math.max(view[i] / divisor, -1);
        }

        return out;
    }

    /**
     * 节点名。
     *
     * 建树（`buildNode`）与骨骼名（`boneNames`）必须共用**同一个取名规则**，
     * 否则 `SkeletonLogic` 按名字在实体树里找不到骨骼对象、逆绑定矩阵形同虚设。
     */
    function getNodeName(index: number): string
    {
        const nodeDef = nodes[index];
        if (!nodeDef) throw new Error(`glTF: nodes[${index}] 不存在`);

        return nodeDef.name || `node_${index}`;
    }

    /**
     * 解析一个 skin：`joints`（node 下标）→ 骨骼名，`inverseBindMatrices` accessor → 逆绑定矩阵。
     *
     * 列主序依据：glTF 规范（3.6.2.4）规定 MAT4 accessor 的 16 个元素按**列主序**排列
     * （即连续 4 个 float 是一列），而 {@link Matrix4x4} 的 `elements` 同样是列主序
     * （构造器注释「每四个元素可以是 4x4 矩阵的一列」，且 `elements[12..14]` 是平移）。二者一致，
     * 因此读出的 16 个 float 直接交给 `new Matrix4x4(...)`，**不做转置**。
     *
     * @param skinIndex skin 在 `skins` 中的下标
     * @param nodeIndex 引用该 skin 的节点下标（`node.skin`）
     */
    function buildSkin(skinIndex: number, nodeIndex: number): GLTFSkin
    {
        const skinDef = skinsDef[skinIndex];
        if (!skinDef) throw new Error(`glTF: skins[${skinIndex}] 不存在`);

        const joints = skinDef.joints || [];
        const boneNames = joints.map(getNodeName);

        let boneInverses: Matrix4x4[];
        if (skinDef.inverseBindMatrices === undefined)
        {
            // 规范允许省略（绑定姿势即初始姿势）：逆绑定矩阵按单位矩阵处理
            boneInverses = joints.map(() => new Matrix4x4());
        }
        else
        {
            const values = readAccessor(skinDef.inverseBindMatrices);
            const expected = joints.length * 16;
            if (values.length < expected)
            {
                throw new Error(`glTF: accessors[${skinDef.inverseBindMatrices}] 只有 ${values.length} 个分量，`
                    + `不足 ${joints.length} 根骨骼的逆绑定矩阵（需要 ${expected}）`);
            }

            boneInverses = joints.map((_, i) => new Matrix4x4(values.slice(i * 16, i * 16 + 16) as never));
        }

        const skin: GLTFSkin = {
            skinIndex,
            nodeIndex,
            boneNames,
            boneInverses,
            ...(skinDef.name !== undefined && { name: skinDef.name }),
        };
        allSkins.push(skin);

        return skin;
    }

    /**
     * 读取一组蒙皮顶点属性（`JOINTS_n` + `WEIGHTS_n`），并校验分量数与顶点数一致。
     *
     * 语义依据（glTF 2.0 规范 3.6.2.2 / 3.7.2.1）：
     * - `JOINTS_n` 是 4 分量**无符号整数**（只允许 UNSIGNED_BYTE / UNSIGNED_SHORT），且不允许 `normalized`；
     * - `WEIGHTS_n` 是 4 分量浮点（也允许 `normalized` 的 ubyte/ushort），规范要求每顶点权重和为 1。
     *
     * 两者必须成对出现；**整组都缺失时返回 undefined**——没有蒙皮属性的 glTF（如 collision-world.glb）
     * 因此完全不走这条路径。
     *
     * @param attributes primitive 的属性表（属性名 → accessor 下标）
     * @param indicesName `JOINTS_n` 属性名
     * @param weightsName `WEIGHTS_n` 属性名
     * @param vertexCount 顶点数（分量数应为 4 × 顶点数）
     */
    function readSkinAttributeGroup(
        attributes: Record<string, number>, indicesName: string, weightsName: string, vertexCount: number
    ): { indices: number[]; weights: number[] } | undefined
    {
        const indicesAccessor = attributes[indicesName];
        const weightsAccessor = attributes[weightsName];

        if (indicesAccessor === undefined && weightsAccessor === undefined) return undefined;

        if (indicesAccessor === undefined || weightsAccessor === undefined)
        {
            throw new Error(`glTF: primitive 的 ${indicesName} 与 ${weightsName} 必须成对出现`);
        }

        // 索引走 getAccessorData 而非 readAccessor：骨骼索引是整数，即使被误标 `normalized` 也不能反归一化
        // （除以 255/65535 会把索引全压到 0 号骨骼）
        const indicesData = getAccessorData(indicesAccessor);
        if (indicesData.componentType !== 5121 && indicesData.componentType !== 5123)
        {
            throw new Error(`glTF: ${indicesName} 的 componentType 必须是 UNSIGNED_BYTE(5121) 或 UNSIGNED_SHORT(5123)，`
                + `实际为 ${indicesData.componentType}`);
        }
        const indices = Array.from(indicesData.array as unknown as ArrayLike<number>);

        // 权重走 readAccessor：normalized 的 ubyte/ushort 按规范反归一化到 [0,1]
        const weights = readAccessor(weightsAccessor);

        const expected = vertexCount * 4;
        if (indices.length !== expected)
        {
            throw new Error(`glTF: ${indicesName} 有 ${indices.length} 个分量，与顶点数 ${vertexCount} 不匹配（应为 ${expected}）`);
        }
        if (weights.length !== expected)
        {
            throw new Error(`glTF: ${weightsName} 有 ${weights.length} 个分量，与顶点数 ${vertexCount} 不匹配（应为 ${expected}）`);
        }

        return { indices, weights };
    }

    /**
     * 构建单个 primitive 的几何：顶点先按世界矩阵烘焙到世界空间。
     *
     * @param prim glTF primitive 定义
     * @param worldMatrix 该 primitive 所属节点的世界矩阵（顶点与法线据此烘焙）
     */
    function buildPrimitiveGeometry(
        prim: { attributes: Record<string, number>; indices?: number },
        worldMatrix: Matrix4x4): CustomGeometry
    {
        if (prim.attributes.POSITION === undefined) throw new Error('glTF: primitive 缺少 POSITION 属性');

        const positions = readAccessor(prim.attributes.POSITION);
        const vertexCount = positions.length / 3;

        // 位置：世界矩阵（先拷贝，transformPoints 会就地写 vout，不能与 vin 同一数组）
        const worldPositions: number[] = [];
        worldMatrix.transformPoints(positions, worldPositions);

        // 法线：世界矩阵的逆转置（等比缩放下等价于旋转，非等比时保持法线垂直于表面）
        let normals: number[];
        if (prim.attributes.NORMAL !== undefined)
        {
            normals = transformNormals(readAccessor(prim.attributes.NORMAL), worldMatrix);
        }
        else
        {
            normals = new Array(vertexCount * 3).fill(0);
        }

        let uvs: number[];
        if (prim.attributes.TEXCOORD_0 !== undefined)
        {
            uvs = readAccessor(prim.attributes.TEXCOORD_0);
        }
        else
        {
            uvs = new Array(vertexCount * 2).fill(0);
        }

        let indices: number[];
        if (prim.indices !== undefined)
        {
            indices = readAccessor(prim.indices);
        }
        else
        {
            indices = Array.from({ length: vertexCount }, (_, i) => i);
        }

        const colors: number[] = [];
        for (let i = 0; i < vertexCount; i++) colors.push(1, 1, 1, 1);

        const geo: CustomGeometry = { __type__: 'CustomGeometry' };
        // 顶点数据通过响应式数据接口写入（logic 字段只读）
        const r_geo = reactive(geo);
        r_geo.positions = worldPositions;
        r_geo.normals = normals;
        r_geo.uvs = uvs;
        r_geo.indices = indices;
        r_geo.colors = colors;

        // 蒙皮顶点属性（issue #337 第一步）：解析落盘到几何数据，字段名与主库着色器约定一致。
        // 无蒙皮属性的 glTF 两个分组都为 undefined，几何上不会多出任何字段。
        const skinGroup0 = readSkinAttributeGroup(prim.attributes, 'JOINTS_0', 'WEIGHTS_0', vertexCount);
        const skinGroup1 = readSkinAttributeGroup(prim.attributes, 'JOINTS_1', 'WEIGHTS_1', vertexCount);

        if (skinGroup0)
        {
            r_geo.a_skinIndices = skinGroup0.indices;
            r_geo.a_skinWeights = skinGroup0.weights;
        }
        if (skinGroup1)
        {
            r_geo.a_skinIndices1 = skinGroup1.indices;
            r_geo.a_skinWeights1 = skinGroup1.weights;
        }

        return geo;
    }

    /** 用世界矩阵的逆转置变换法线并归一化 */
    function transformNormals(source: number[], worldMatrix: Matrix4x4): number[]
    {
        const normalMatrix = worldMatrix.clone().invert().transpose();
        const out = new Array<number>(source.length);
        const v = new Vector3();

        for (let i = 0; i < source.length; i += 3)
        {
            v.x = source[i]; v.y = source[i + 1]; v.z = source[i + 2];
            const n = normalMatrix.transformVector3(v);
            const len = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z);
            // 退化法线（零向量或不可逆矩阵）保持原值，避免 NaN
            if (len > 0 && Number.isFinite(len))
            {
                out[i] = n.x / len; out[i + 1] = n.y / len; out[i + 2] = n.z / len;
            }
            else
            {
                out[i] = source[i]; out[i + 1] = source[i + 1]; out[i + 2] = source[i + 2];
            }
        }

        return out;
    }

    /** 节点局部矩阵：优先 `matrix`（列主序 16 元素），否则 T × R × S */
    function getLocalMatrix(nodeDef: NonNullable<GLTFJson['nodes']>[number]): Matrix4x4
    {
        if (nodeDef.matrix && nodeDef.matrix.length === 16)
        {
            return new Matrix4x4(nodeDef.matrix as never);
        }

        const t = nodeDef.translation;
        const r = nodeDef.rotation;
        const s = nodeDef.scale;

        const position = new Vector3(t ? t[0] : 0, t ? t[1] : 0, t ? t[2] : 0);
        const scale = new Vector3(s ? s[0] : 1, s ? s[1] : 1, s ? s[2] : 1);

        // glTF 四元数顺序为 [x, y, z, w]，与 Quaternion(x, y, z, w) 一致
        const rotationMatrix = r
            ? Matrix4x4.fromQuaternion(new Quaternion(r[0], r[1], r[2], r[3]))
            : new Matrix4x4();

        // T × R × S：append 是左乘（this = lhs × this）
        return new Matrix4x4()
            .append(Matrix4x4.fromScale(scale.x, scale.y, scale.z))
            .append(rotationMatrix)
            .append(Matrix4x4.fromPosition(position.x, position.y, position.z));
    }

    // 自顶向下算出每个节点的世界矩阵（M_world = M_local × M_parent_world）
    const worldMatrices = new Map<number, Matrix4x4>();

    function computeWorldMatrices(nodeIndex: number, parentWorld: Matrix4x4 | null, visiting: Set<number>): void
    {
        if (worldMatrices.has(nodeIndex)) return;
        if (visiting.has(nodeIndex)) throw new Error(`glTF: nodes 存在循环引用（node ${nodeIndex}）`);
        visiting.add(nodeIndex);

        const nodeDef = nodes[nodeIndex];
        if (!nodeDef) throw new Error(`glTF: nodes[${nodeIndex}] 不存在`);

        // append 左乘：M_local × M_parent_world
        const world = getLocalMatrix(nodeDef);
        if (parentWorld) world.append(parentWorld);
        worldMatrices.set(nodeIndex, world);

        for (const child of nodeDef.children || []) computeWorldMatrices(child, world, visiting);
        visiting.delete(nodeIndex);
    }

    const sceneDef = scenes[json.scene ?? 0] || scenes[0] || { nodes: nodes.length > 0 ? [0] : [] };
    const visiting = new Set<number>();
    for (const sceneNode of sceneDef.nodes || [])
    {
        computeWorldMatrices(sceneNode, null, visiting);
    }
    // 未挂在场景里的节点也要算，否则它的 mesh 拿不到世界矩阵
    for (let i = 0; i < nodes.length; i++)
    {
        if (!worldMatrices.has(i)) computeWorldMatrices(i, null, visiting);
    }

    const allPrimitives: GLTFPrimitive[] = [];
    const meshGroups: GLTFMesh[] = [];
    const allSkins: GLTFSkin[] = [];

    /**
     * 为一个 mesh 产出**全部** primitive 的 MeshRenderer 组件。
     *
     * 语义选择：多个 primitive 之间**不做几何合并**——CustomGeometry 承载顶点/索引数组，
     * 跨 primitive 合并需要同时重排索引与顶点属性（且各 primitive 可有不同属性集与材质），
     * 收益不抵复杂度。因此每个 primitive 独立产出一份几何 + 一份 MeshRenderer，
     * 全部组件挂在同一个节点下，结果里另有 `primitives`/`meshes` 两个平铺列表可供检索。
     */
    function buildMeshComponents(
        meshIndex: number, nodeIndex: number, worldMatrix: Matrix4x4): { __type__: 'MeshRenderer'; geometry: CustomGeometry; material: StandardMaterial }[]
    {
        const meshDef = meshesDef[meshIndex];
        if (!meshDef) throw new Error(`glTF: meshes[${meshIndex}] 不存在`);

        const components: { __type__: 'MeshRenderer'; geometry: CustomGeometry; material: StandardMaterial }[] = [];
        const group: GLTFPrimitive[] = [];

        for (let primitiveIndex = 0; primitiveIndex < meshDef.primitives.length; primitiveIndex++)
        {
            const prim = meshDef.primitives[primitiveIndex];
            const geometry = buildPrimitiveGeometry(prim, worldMatrix);
            // 每个 primitive 按自身 material 下标解析材质（各持独立实例，不共享 defaultMat）
            const material = buildMaterial(prim.material);

            components.push({ __type__: 'MeshRenderer', geometry, material });

            const info: GLTFPrimitive = {
                meshIndex,
                primitiveIndex,
                nodeIndex,
                vertexCount: (geometry.positions || []).length / 3,
                mode: prim.mode === undefined ? 4 : prim.mode,
                material,
                geometry,
            };
            group.push(info);
            allPrimitives.push(info);
        }

        meshGroups.push({ meshIndex, nodeIndex, primitives: group });

        return components;
    }

    // 构建 node 树（transform 已在顶点上烘焙，节点自身保持单位变换）
    function buildNode(nodeIndex: number): Object3D
    {
        const nodeDef = nodes[nodeIndex];
        if (!nodeDef) throw new Error(`glTF: nodes[${nodeIndex}] 不存在`);

        const worldMatrix = worldMatrices.get(nodeIndex) || new Matrix4x4();

        const components: Components[] = nodeDef.mesh !== undefined
            ? buildMeshComponents(nodeDef.mesh, nodeIndex, worldMatrix)
            : [];

        // 引用 skin 的节点挂上 Skeleton 组件数据（joints → boneNames，inverseBindMatrices → boneInverses）
        if (nodeDef.skin !== undefined)
        {
            const skin = buildSkin(nodeDef.skin, nodeIndex);
            const skeleton: Skeleton = {
                __type__: 'Skeleton',
                boneNames: skin.boneNames,
                boneInverses: skin.boneInverses,
            };
            components.push(skeleton);
        }

        const children = nodeDef.children && nodeDef.children.length > 0
            ? nodeDef.children.map(buildNode)
            : undefined;

        // 一次性组装字面量（确保响应式系统在 init 时能读到所有字段）
        const obj: Object3D = {
            __type__: 'Object3D',
            name: getNodeName(nodeIndex),
            ...(components.length > 0 && { components }),
            ...(children && { children }),
        };

        return obj;
    }

    // 构建场景（sceneDef 已在计算世界矩阵时确定）
    const root: Object3D = {
        __type__: 'Object3D',
        name: 'glTF Scene',
        children: (sceneDef.nodes || []).map(buildNode),
    };

    return { root, primitives: allPrimitives, meshes: meshGroups, skins: allSkins };
}
