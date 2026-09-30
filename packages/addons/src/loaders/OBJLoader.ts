import { CustomGeometry, reactive, StandardMaterial } from 'feng3d';

/**
 * OBJ / MTL 加载器。
 *
 * 解析 Wavefront OBJ 文件（v/vt/vn/o/g/f + mtllib/usemtl）与配套的 MTL 材质库，
 * 返回 CustomGeometry[]（每个 'o'/'g' 一组）以及「几何 ↔ 材质名」的绑定关系。
 * 对应 three.js addons/loaders/OBJLoader.js + MTLLoader.js（简化版）。
 *
 * 已支持：
 * - 顶点/纹理坐标/法线（v/vt/vn）与多边形面（f，扇形三角化）；
 * - `mtllib`（可多行、每行多个文件名）→ {@link ParseOBJResult.mtlLibs}；
 * - `usemtl` → **从该指令起的面开始切换材质**，逐面记录材质名，再按分组汇总为
 *   {@link OBJGroupMaterial}（见 {@link parseOBJWithMaterials}）；
 * - MTL 的 `newmtl` / `Kd` / `Ka` / `Ks` / `Ns` → StandardMaterial 的
 *   `u_diffuse` / `u_ambient` / `u_specular` / `u_glossiness` + `Material.name`。
 *
 * 不支持：
 * - `map_Kd` 等纹理贴图：**只记录文件名，不加载**（图片加载是异步的，本加载器不做；见
 *   {@link MTLMaterialRecord.textureFiles}）；
 * - MTL 的 `d` / `Tr`（透明度）：`StandardMaterial` 是 Phong 风格材质，数据接口没有
 *   `blend` 字段（该字段只存在于 `TextureMaterial`），其 logic（`StandardMaterialLogic`）
 *   也未覆写 `isTransparent`，渲染管线不写 blend state——没有可写的开关，**如实不映射**
 *   （原始值原样保留在 {@link MTLMaterialRecord} 的 `d` / `tr` 字段供调用方自行消费）；
 * - MTL 的 `illum` / `Ni` / `Ke` / `Tf`：`StandardMaterial` 无对应字段，只解析不映射；
 * - `CustomGeometry` 上的材质字段：它是几何（没有材质字段，加字段要改 `packages/feng3d`），
 *   绑定关系只能落在返回值里，由调用方把 {@link OBJGroupMaterial.material} 挂到 renderer 上。
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
    /** 组内出现过的材质名（按出现顺序去重；未出现 usemtl 时为空数组） */
    materialNames: string[];
}

/**
 * `usemtl` 原始记录：材质名 + 所属分组名
 */
export interface OBJMaterialUse
{
    /** 所属分组名（'o'/'g'） */
    readonly groupName: string;
    /** `usemtl` 引用的材质名 */
    readonly materialName: string;
}
/**
 * MTL 纹理贴图字段（`map_Kd` / `map_Ka` / `map_Ks` / `map_d` / `bump`）。
 *
 * **只记录文件名，不加载图片**：解析器是同步的，而纹理加载是异步的，本加载器不做；
 * 文件名原样保留（含 MTL 允许的可选参数，如 `map_Kd -s 1 1 1 wall.png` 里的 `-s 1 1 1`），
 * 由调用方决定是否/如何加载。
 */
export interface MTLTextureFiles
{
    /** 漫反射贴图 `map_Kd` */
    readonly map_Kd?: string;
    /** 环境光贴图 `map_Ka` */
    readonly map_Ka?: string;
    /** 高光贴图 `map_Ks` */
    readonly map_Ks?: string;
    /** 透明度贴图 `map_d` */
    readonly map_d?: string;
    /** 凹凸贴图 `bump`（本仓库无对应纹理槽位，同样只记录不加载） */
    readonly bump?: string;
}

/**
 * 一条 MTL 材质记录：映射后的 StandardMaterial 数据 + **未映射**字段的原始值。
 *
 * `material` 只填有依据的字段（见 {@link parseMTL} 的 JSDoc）；没有依据的字段
 * （`d` / `Tr` / `illum` / `Ni` / `Ke` / `Tf`）原样保留在旁边的字段里，
 * 便于调用方自行消费，同时明确「本加载器不映射它们」。
 */
export interface MTLMaterialRecord
{
    /** 材质名（`newmtl`） */
    readonly name: string;
    /** 映射后的标准材质数据（纯数据；`name` 即 `newmtl` 名） */
    readonly material: StandardMaterial;
    /** `Ns` 高光指数（已映射到 `u_glossiness`，此处冗余保留原文） */
    readonly ns?: number;
    /** `d` 溶解值（1=不透明，**未映射**：无可用开关） */
    readonly d?: number;
    /** `Tr` 透明度（= 1 - d，**未映射**：无可用开关） */
    readonly tr?: number;
    /** `illum` 光照模型编号（**未映射**：StandardMaterial 无对应字段） */
    readonly illum?: number;
    /** `Ni` 折射率（**未映射**） */
    readonly ni?: number;
    /** `Ke` 自发光（**未映射**：无自发光字段；保留原始分量） */
    readonly ke?: readonly number[];
    /** `Tf` 透射滤色（**未映射**；保留原始分量） */
    readonly tf?: readonly number[];
    /** 贴图文件名（**只记录，不加载**） */
    readonly textureFiles: MTLTextureFiles;
}

/**
 * `parseMTL` 的结果。
 */
export interface ParseMTLResult
{
    /**
     * 材质表：`Map` 保持**文件内声明顺序**（便于调用方按名查表或按序建材质）。
     *
     * 同名材质被再次 `newmtl` 时按后定义覆盖（MTL 的实际加载语义）。
     */
    readonly materials: Map<string, MTLMaterialRecord>;
    /**
     * 材质名 → 该材质所属的 `.mtl` 文件名（`newmtl` 本身不记录文件来源，故由调用方
     * 通过 `parseMTL(text, sourceFile)` 传入，见该函数的 `sourceFile` 参数；未传时为 `''`）。
     */
    readonly sourceFiles: Map<string, string>;
}

/**
 * 一个分组上的材质绑定（issue #12 的核心产物）。
 */
export interface OBJGroupMaterial
{
    /** 材质名（`usemtl` 的原文，即 MTL 里 `newmtl` 的名字） */
    readonly name: string;
    /**
     * 映射后的标准材质；纹理贴图**未加载**（`map_Kd` 只在
     * {@link MTLMaterialRecord.textureFiles} 里留了文件名）。
     *
     * 同一材质名被多个分组引用时，各组拿到的是**独立的一份**（见
     * {@link parseOBJWithMaterials}），避免"改一处影响全部"。
     */
    readonly material: StandardMaterial;
}

/**
 * `parseOBJWithMaterials` 的一项：一个分组的几何 + 该分组用到的材质绑定。
 */
export interface OBJGeometryWithMaterials
{
    /** 该分组的几何（与 {@link parseOBJ} 在同一段文本下的产出完全一致） */
    readonly geometry: CustomGeometry;
    /** 分组名（'o'/'g'） */
    readonly name: string;
    /**
     * 该分组用到的材质（按 `usemtl` 出现顺序去重）。
     *
     * **空数组表示没有材质**（OBJ 里没有 `usemtl`，或该分组内没有任何面）——调用方据此
     * 使用自己的默认材质，而不是拿到一个杜撰的"默认材质名"。
     */
    readonly materials: OBJGroupMaterial[];
}

/**
 * `parseOBJ` 的低层解析结果（不含材质表，只含材质名引用）。
 */
export interface ParseOBJResult
{
    /** 每个 'o'/'g' 分组的几何（与 {@link parseOBJ} 返回同一数组内容） */
    readonly geometries: CustomGeometry[];
    /** 分组名，与 {@link geometries} 同序 */
    readonly groupNames: string[];
    /** `mtllib` 引用的 mtl 文件名（按出现顺序，保留文件名原文） */
    readonly mtlLibs: string[];
    /** 全部 `usemtl` 记录（按出现顺序，含所属分组名） */
    readonly materialUses: OBJMaterialUse[];
}

/**
 * 解析 MTL 文本为材质表。
 *
 * 映射依据（Wavefront MTL 规范条目 + 本仓库 `StandardMaterial` 字段）：
 * - `newmtl <name>`（规范：开启一个新材质，后续字段属于它直到下一个 `newmtl`）
 *   → {@link Material.name}；
 * - `Kd r g b [a]`（漫反射色）→ `uniforms.u_diffuse`（`StandardMaterial` 是 Phong 风格，
 *   `u_diffuse` 为其漫反射色）；
 * - `Ka r g b [a]`（环境光色）→ `uniforms.u_ambient`；
 * - `Ks r g b [a]`（高光色）→ `uniforms.u_specular`；
 * - `Ns n`（高光指数，0..1000）→ `uniforms.u_glossiness`（`u_glossiness` 即 Phong 的
 *   shininess，两者语义一致；见 `packages/feng3d/src/materials/StandardMaterial.ts`
 *   的 `calculateLightSpecular(..., glossiness)`）。
 *
 * **有意不映射**（没有依据就不猜，如实留在记录里）：
 * - `d` / `Tr`（透明度）：`StandardMaterial` 数据接口没有 `blend` 字段（该字段只在
 *   `TextureMaterial` 上），`StandardMaterialLogic` 未覆写 `isTransparent`，渲染管线也不写
 *   blend state——写了 alpha 也无法真正透明；把它硬塞到 `u_alphaThreshold`（alpha 测试）
 *   是语义不同的另一回事（会把半透明材质变成硬边镂空），故不映射；
 * - `illum`（光照模型）：StandardMaterial 无对应字段（着色模型由着色器固定）；
 * - `Ni`（折射率）、`Ke`（自发光）、`Tf`（透射滤色）：无对应字段；
 * - `map_Kd` / `map_Ka` / `map_Ks` / `map_d` / `bump`：**只记录文件名，不加载**——
 *   图片加载是异步的，本同步解析器不做（见 {@link MTLTextureFiles}）。
 *
 * 容错：`#` 注释与空行跳过；数值支持 `0.5` 与 `.5` 两种写法；
 * 未知指令（`Pr` / `Pm` / `Ps` / `norm` 等）静默忽略；`newmtl` 之前出现的字段被忽略
 * （无法归属于任何材质）。**不自造默认材质**：没有任何 `newmtl` 时返回空表。
 * 已知未支持：`d -halo <f>` 的 `-halo` 形式（此时 `d` 记为未解析，不报错）。
 *
 * @param text MTL 文件内容
 * @param sourceFile 可选：该文本对应的 mtl 文件名（仅用于填充 {@link ParseMTLResult.sourceFiles}）
 * @returns 材质表（按声明顺序的 `Map`）
 */
export function parseMTL(text: string, sourceFile = ''): ParseMTLResult
{
    /** 解析过程中的可写中间态（与 {@link MTLMaterialRecord} 同结构，只是字段可写） */
    interface MutableRecord
    {
        name: string;
        uniforms: Record<string, unknown>;
        ns?: number;
        d?: number;
        tr?: number;
        illum?: number;
        ni?: number;
        ke?: number[];
        tf?: number[];
        textureFiles: MTLTextureFiles;
    }

    const records = new Map<string, MutableRecord>();
    let current: MutableRecord | null = null;

    /** 取走 `parts` 中从 `start` 起位置 i 的数值（缺失或非有限数为 undefined） */
    const readComponent = (parts: string[], i: number): number | undefined =>
    {
        if (i >= parts.length) return undefined;
        const value = Number(parts[i]);

        return Number.isFinite(value) ? value : undefined;
    };

    /** 取走 `parts` 中从 `start` 起的第一个可解析有限数 */
    const readNumber = (parts: string[], start: number): number | undefined =>
    {
        for (let i = start; i < parts.length; i++)
        {
            const value = readComponent(parts, i);
            if (value !== undefined) return value;
        }

        return undefined;
    };

    /** 取走 `parts` 中从 `start` 起的全部可解析有限数（忽略解析不出的项） */
    const readNumbers = (parts: string[], start: number): number[] =>
    {
        const numbers: number[] = [];
        for (let i = start; i < parts.length; i++)
        {
            const value = readComponent(parts, i);
            if (value !== undefined) numbers.push(value);
        }

        return numbers;
    };

    /**
     * 颜色分量（缺失按 1 处理，与 `StandardMaterial` 的默认色一致；a 缺省 1）。
     *
     * 纯数据字面量（`__type__: 'Color4'`），**不用 `new`**。
     */
    const readColor = (parts: string[]) => ({
        __type__: 'Color4' as const,
        r: readComponent(parts, 1) ?? 1,
        g: readComponent(parts, 2) ?? 1,
        b: readComponent(parts, 3) ?? 1,
        a: readComponent(parts, 4) ?? 1,
    });

    for (const line of text.split('\n'))
    {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('#')) continue;

        const parts = trimmed.split(/\s+/);
        const cmd = parts[0];

        if (cmd === 'newmtl')
        {
            // 材质名取原文剩余部分（去掉首尾空白），与 three.js MTLLoader 对换行/多空格的容忍一致
            const name = trimmed.slice('newmtl'.length).trim();
            if (name === '') continue;
            current = { name, uniforms: {}, textureFiles: {} };
            records.set(name, current);
            continue;
        }

        if (current === null) continue; // `newmtl` 之前的字段无法归属任何材质，忽略

        if (cmd === 'Kd' || cmd === 'Ka' || cmd === 'Ks')
        {
            const color = readColor(parts);
            if (cmd === 'Kd') current.uniforms.u_diffuse = color;
            else if (cmd === 'Ka') current.uniforms.u_ambient = color;
            else current.uniforms.u_specular = color;
        }
        else if (cmd === 'Ns')
        {
            const ns = readNumber(parts, 1);
            if (ns !== undefined)
            {
                current.ns = ns;
                current.uniforms.u_glossiness = ns;
            }
        }
        else if (cmd === 'd')
        {
            current.d = readNumber(parts, 1);
        }
        else if (cmd === 'Tr')
        {
            current.tr = readNumber(parts, 1);
        }
        else if (cmd === 'illum')
        {
            current.illum = readNumber(parts, 1);
        }
        else if (cmd === 'Ni')
        {
            current.ni = readNumber(parts, 1);
        }
        else if (cmd === 'Ke')
        {
            current.ke = readNumbers(parts, 1);
        }
        else if (cmd === 'Tf')
        {
            current.tf = readNumbers(parts, 1);
        }
        else if (cmd === 'map_Kd' || cmd === 'map_Ka' || cmd === 'map_Ks' || cmd === 'map_d' || cmd === 'bump')
        {
            // 只记录文件名（原样，含 MTL 允许的可选参数），**不加载图片**
            const fileName = trimmed.slice(cmd.length).trim();
            if (fileName !== '')
            {
                current.textureFiles = { ...current.textureFiles, [cmd]: fileName } as MTLTextureFiles;
            }
        }
        // 其余指令（`Pr` / `Pm` / `Ps` / `norm` 等）静默忽略
    }

    // 转成对外的只读记录（`StandardMaterial` 的字段是 readonly，故在解析结束后一次性产字面量）
    const materials = new Map<string, MTLMaterialRecord>();
    const sourceFiles = new Map<string, string>();
    for (const [name, record] of records)
    {
        const material: StandardMaterial = {
            __type__: 'StandardMaterial',
            name,
            uniforms: record.uniforms,
        };
        materials.set(name, {
            name,
            material,
            ns: record.ns,
            d: record.d,
            tr: record.tr,
            illum: record.illum,
            ni: record.ni,
            ke: record.ke,
            tf: record.tf,
            textureFiles: record.textureFiles,
        });
        sourceFiles.set(name, sourceFile);
    }

    return { materials, sourceFiles };
}

/**
 * 从 URL 加载 OBJ 文件并解析（**不含材质**，与 {@link parseOBJ} 同一产出）。
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
    return parseOBJInternal(text).geometries;
}

/**
 * 解析 OBJ 文本并保留 `mtllib` / `usemtl` 信息。
 *
 * 与 {@link parseOBJ} 共用同一套解析实现，因此几何产出**逐字节一致**；额外返回 mtl 文件名
 * 与逐条 `usemtl` 记录（含所属分组名），供调用方进一步加载 MTL。
 *
 * @param text OBJ 文件内容
 */
export function parseOBJWithMTLInfo(text: string): ParseOBJResult
{
    return parseOBJInternal(text);
}

/**
 * 克隆一份材质数据，供**同一个材质的多个分组各持一份**。
 *
 * 依据（与 `GLTFLoader.ts` 的 `createDefaultMaterial` 同一约定）：多个 primitive/分组
 * 共享同一个材质实例会有「改一处影响全部」的隐患，故在绑定处各自产出一份独立数据。
 * 只做浅拷贝：`uniforms` 与其内的 `Color4` 字面量一并新建，`s_diffuse` 等纹理引用
 * （若将来由调用方补上）保持共享——纹理对象本就该共享。
 *
 * 纯数据字面量（`__type__: 'StandardMaterial'`），**不用 `new`**。
 */
function cloneStandardMaterial(material: StandardMaterial): StandardMaterial
{
    const uniforms: Record<string, unknown> = {};
    for (const key of Object.keys(material.uniforms ?? {}))
    {
        const value = (material.uniforms as Record<string, unknown>)[key];
        uniforms[key] = typeof value === 'object' && value !== null ? { ...value } : value;
    }

    return {
        ...material,
        __type__: 'StandardMaterial',
        uniforms,
    };
}

/**
 * 解析 OBJ 文本，并把分组与 MTL 材质绑定在一起（issue #12）。
 *
 * `CustomGeometry` 是几何、没有材质字段，因此绑定关系落在返回值里：
 * 每个分组带 `materials: { name, material }[]`，由调用方挂到 renderer 上。
 * 返回的 `geometry` 与 {@link parseOBJ} 在同一段文本下的产出完全一致（同一实现、同一顺序）。
 *
 * 每个分组拿到的 `material` 是**独立的一份数据**（同一材质被多个分组引用时各克隆一份），
 * 避免"改一个分组的材质影响另一个"。
 *
 * 校验（**可判别失败，不静默成功**）：`usemtl` 引用了 `mtlTexts` 里不存在的材质名时抛错，
 * 错误信息带上缺失的名字与当时已有的材质名。分组没有 `usemtl` 时不报错——`materials` 为空数组。
 *
 * @param text OBJ 文件内容
 * @param mtlTexts 与 OBJ 的 `mtllib` 对应的 MTL 文本（多个文件按顺序合并，同名以后者为准）
 * @throws Error `usemtl` 引用的材质名在 MTL 文本里不存在
 */
export function parseOBJWithMaterials(text: string, mtlTexts: string[] = []): OBJGeometryWithMaterials[]
{
    const parsed = parseOBJInternal(text);

    const materialTable = new Map<string, MTLMaterialRecord>();
    for (const mtlText of mtlTexts)
    {
        for (const [name, record] of parseMTL(mtlText).materials)
        {
            materialTable.set(name, record);
        }
    }

    const result: OBJGeometryWithMaterials[] = [];
    for (let i = 0; i < parsed.geometries.length; i++)
    {
        const materialNames = parsed.groupMaterialNames[i] ?? [];
        const materials: OBJGroupMaterial[] = [];
        for (const name of materialNames)
        {
            const record = materialTable.get(name);
            if (record === undefined)
            {
                throw new Error(
                    `OBJ: usemtl "${name}" 在已提供的 MTL 中不存在`
                    + `（可用材质：${[...materialTable.keys()].join(', ') || '无'}）`,
                );
            }
            materials.push({ name, material: cloneStandardMaterial(record.material) });
        }
        result.push({ geometry: parsed.geometries[i], name: parsed.groupNames[i], materials });
    }

    return result;
}

/**
 * OBJ 解析的内部结果（几何 + 分组名 + 逐组材质名 + mtllib/usemtl 记录）。
 */
interface ParseOBJInternalResult extends ParseOBJResult
{
    /** 逐分组的材质名（与 geometries 同序、同长度） */
    readonly groupMaterialNames: string[][];
}

/**
 * 解析期的可变 `usemtl` 记录（`usemtl` 出现在任何 `o`/`g`/`f` 之前时无法立即确定
 * 所属分组名，等分组出现时回填）。
 */
interface MutableMaterialUse
{
    groupName: string;
    materialName: string;
}

/**
 * OBJ 文本解析的唯一实现（{@link parseOBJ} / {@link parseOBJWithMTLInfo} /
 * {@link parseOBJWithMaterials} 共用，保证几何产出不分叉）。
 */
function parseOBJInternal(text: string): ParseOBJInternalResult
{
    const vertices: number[][] = []; // [[x,y,z], ...]
    const uvs: number[][] = []; // [[u,v], ...]
    const normals: number[][] = []; // [[nx,ny,nz], ...]
    const groups: OBJGroup[] = [];
    const mtlLibs: string[] = [];
    // 解析期用可变类型（`usemtl` 在分组出现前无法确定 groupName，稍后回填）
    const materialUses: MutableMaterialUse[] = [];
    let current: OBJGroup | null = null;
    // 当前生效的材质名（`usemtl` 切换点）：为 null 表示该分组尚无材质
    let currentMaterialName: string | null = null;

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
        else if (cmd === 'mtllib')
        {
            // 一行可引用多个 mtl 文件；文件名可能含空格，此处按空白切分（与 three.js 一致）
            for (let i = 1; i < parts.length; i++)
            {
                if (parts[i] !== '') mtlLibs.push(parts[i]);
            }
        }
        else if (cmd === 'usemtl')
        {
            // 从此处开始的**面**使用该材质；同一分组内允许多次切换。
            // 面会各自记下当时的材质名（见下方 'f' 分支），所以新分组不会继承旧分组的材质。
            const name = parts[1];
            if (name === undefined) continue;
            currentMaterialName = name;
            materialUses.push({ groupName: current?.name ?? '', materialName: name });
        }
        else if (cmd === 'o' || cmd === 'g')
        {
            current = { name: parts[1] || 'object', faces: [], materialNames: [] };
            groups.push(current);
            // 新分组从「零材质」开始：`usemtl` 在此前声明时，材质名由随后的**面**带入
            // （若该 `usemtl` 尚未归属到任何分组，把新分组名补记到它上面，便于调用方定位）。
            if (currentMaterialName !== null)
            {
                const lastUse = materialUses[materialUses.length - 1];
                if (lastUse !== undefined && lastUse.groupName === '') lastUse.groupName = current.name;
            }
        }
        else if (cmd === 'f')
        {
            if (!current)
            {
                current = { name: 'default', faces: [], materialNames: [] };
                groups.push(current);
                const lastUse = materialUses[materialUses.length - 1];
                if (lastUse !== undefined && lastUse.groupName === '') lastUse.groupName = current.name;
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
            if (face.length >= 3)
            {
                current.faces.push(face);
                // 逐面记录当时的 `usemtl`：分组内材质切换、跨分组不继承，都由此保证
                if (currentMaterialName !== null && !current.materialNames.includes(currentMaterialName))
                {
                    current.materialNames.push(currentMaterialName);
                }
            }
        }
    }

    // 为每个对象构建 CustomGeometry
    const geometries: CustomGeometry[] = [];
    const groupNames: string[] = [];
    const groupMaterialNames: string[][] = [];
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
        groupNames.push(group.name);
        groupMaterialNames.push(group.materialNames);
    }

    return {
        geometries,
        groupNames,
        mtlLibs,
        // 对外是只读数组（规范 8.5：纯数据接口字段 readonly）
        materialUses,
        groupMaterialNames,
    };
}
