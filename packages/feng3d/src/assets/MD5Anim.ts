import { QuaternionLike, quatCopy, quatMult, quatNormalize, quatRotatePoint, quatSet, Vector3Like, WritableVector3Like, vec3Add, vec3Copy } from '@feng3d/math';

/** 标志位：平移 X 分量由帧数据提供 */
const COMPONENT_TX = 1;
/** 标志位：平移 Y 分量由帧数据提供 */
const COMPONENT_TY = 2;
/** 标志位：平移 Z 分量由帧数据提供 */
const COMPONENT_TZ = 4;
/** 标志位：朝向 X 分量由帧数据提供 */
const COMPONENT_QX = 8;
/** 标志位：朝向 Y 分量由帧数据提供 */
const COMPONENT_QY = 16;
/** 标志位：朝向 Z 分量由帧数据提供 */
const COMPONENT_QZ = 32;

/**
 * MD5 动画文件中的一根骨骼的层级声明。
 *
 * `hierarchy` 段每行给出：骨骼名、父骨骼索引、一个动作范围字段（`numComponents`）与
 * **标志位**（`flags`）。
 *
 * 关于帧数据的分配（已用真实资源逐值核对）：**每根骨骼消耗的分量个数由 `flags` 中置位的
 * 个数决定**（见 {@link MD5AnimHierarchy.flags}），各骨骼按 hierarchy 顺序依次取用。
 * `numComponents` **不参与**帧数据分配——实测 `stand.md5anim` 中该列累加为 2597，而文件声明
 * `numAnimatedComponents` 只有 150；按 `flags` 置位数累加则为 141，且逐值能与 `baseframe`
 * 的对应分量对齐（该文件另有 2 根骨骼的 `flags` 带出第 7 位（64），这些位不对应任何分量，
 * 余下的 9 个尾随值不在任何骨骼的声明范围内）。该字段原样保留供诊断与格式核对。
 */
export interface MD5AnimHierarchy
{
    readonly __type__: 'MD5AnimHierarchy';

    /** 骨骼名称 */
    readonly name: string;

    /** 父骨骼索引，-1 表示根骨骼 */
    readonly parent: number;

    /**
     * 文件中该骨骼的第三个声明值（原样保留，不参与帧数据分配）。
     *
     * 帧数据的分配由 `flags` 中置位的个数决定，详见 {@link MD5AnimHierarchy} 的说明。
     */
    readonly numComponents: number;

    /**
     * 标志位：决定该骨骼有哪些分量来自帧数据，其余分量回退到 `baseframe`。
     * 位 1 = `tx`、位 2 = `ty`、位 4 = `tz`、位 8 = `qx`、位 16 = `qy`、位 32 = `qz`；
     * 该骨骼消耗的帧数据个数即这些位中置位的个数。
     * 更高位的位（部分文件里出现 `64`）不对应任何分量，也不消耗帧数据。
     */
    readonly flags: number;
}

/**
 * 某一帧中一根骨骼的**局部**姿态（相对父骨骼）。
 *
 * 与 `.md5mesh` 不同，`.md5anim` 的帧数据全部是相对父的局部姿态，绝对变换必须沿父链累乘，
 * 见 {@link MD5FrameJoint.position}/{@link MD5FrameJoint.orientation} 与
 * {@link MD5FrameJoint.absolutePosition}/{@link MD5FrameJoint.absoluteOrientation} 的区别。
 */
export interface MD5FrameJoint
{
    readonly __type__: 'MD5FrameJoint';

    /** 骨骼索引（在 hierarchy 中的下标） */
    readonly index: number;

    /**
     * 相对父骨骼的局部平移：由帧数据按 {@link MD5AnimHierarchy.flags} 取值，
     * 帧数据未覆盖的分量回退到 `baseframe`。
     *
     * 类型为 {@link Vector3Like}（issue #134）：任何提供 `x/y/z` 的纯数据对象都算，
     * 解析器实际写入的仍是 `Vector3` 实例。
     */
    readonly position: Vector3Like;

    /**
     * 相对父骨骼的局部朝向：由帧数据按 {@link MD5AnimHierarchy.flags} 取值、
     * 未覆盖的分量与 `w` 一并回退到 `baseframe`，最后重新归一化。
     *
     * 类型为 {@link QuaternionLike}（issue #134）：任何提供 `x/y/z/w` 的纯数据对象都算。
     * **阶段 C-e 起解析器写入的就是普通字面量**（`Quaternion` 的 class 已删除，
     * 实例方法换成了 `quaternionOps` 的纯函数），不再是 `Quaternion` 实例。
     */
    readonly orientation: QuaternionLike;

    /** 沿父链累乘得到的绝对平移（`父绝对朝向.rotate(局部平移) + 父绝对平移`） */
    readonly absolutePosition: Vector3Like;

    /**
     * 沿父链累乘得到的绝对朝向（`父绝对朝向 * 局部朝向`）。
     *
     * 类型为 {@link QuaternionLike}（issue #134）；阶段 C-e 起解析器写入的是普通字面量。
     */
    readonly absoluteOrientation: QuaternionLike;
}

/**
 * MD5 动画文件中的一帧。
 */
export interface MD5Frame
{
    readonly __type__: 'MD5Frame';

    /** 帧号（文件中的 `frame <index>` 声明值） */
    readonly index: number;

    /**
     * 该帧的包围盒（`bounds` 段对应行的 min/max），文件未提供该行时为 `undefined`。
     * 包围盒按轴对齐盒处理，不保证是紧凑包围盒（Doom3 的 `bounds` 段本就如此）。
     */
    readonly bounds?: { readonly min: Vector3Like; readonly max: Vector3Like };

    /**
     * 该帧的骨骼姿态，下标与 hierarchy 一致。
     * 每根骨骼同时提供局部姿态与沿父链累乘得到的绝对姿态。
     */
    readonly joints: readonly MD5FrameJoint[];

    /**
     * 该帧的原始帧数据（`frame N { ... }` 中的 `numAnimatedComponents` 个浮点数），
     * 保留原样便于核对分量分配是否读对。
     */
    readonly components: readonly number[];
}

/**
 * MD5 动画文件（`.md5anim`）的解析结果。
 */
export interface MD5Anim
{
    readonly __type__: 'MD5Anim';

    /** 文件声明的 MD5 版本号（MD5Version） */
    readonly version: number;

    /** 文件声明的命令行（commandline） */
    readonly commandline: string;

    /** 文件头部声明的帧数（numFrames） */
    readonly numFrames: number;

    /** 文件头部声明的骨骼数（numJoints） */
    readonly numJoints: number;

    /** 文件头部声明的帧率（frameRate，单位 帧/秒） */
    readonly frameRate: number;

    /** 文件头部声明的每帧浮点数个数（numAnimatedComponents） */
    readonly numAnimatedComponents: number;

    /** 骨骼层级声明（`hierarchy` 段） */
    readonly hierarchy: readonly MD5AnimHierarchy[];

    /** 基础姿态（`baseframe` 段）：帧数据未覆盖的分量取这里的值 */
    readonly baseframe: readonly MD5FrameJoint[];

    /** 全部帧（`frame` 段），下标即帧号 */
    readonly frames: readonly MD5Frame[];
}

/**
 * 取指定帧指定骨骼的**绝对**姿态。
 *
 * @param anim 解析结果
 * @param frameIndex 帧号（越界返回 `undefined`）
 * @param jointIndex 骨骼索引（越界返回 `undefined`）
 * @returns 该骨骼在该帧的绝对姿态，无对应数据时为 `undefined`
 */
export function getMD5AnimJoint(anim: MD5Anim, frameIndex: number, jointIndex: number): MD5FrameJoint | undefined
{
    return anim.frames[frameIndex]?.joints[jointIndex];
}

/**
 * 解析 MD5 动画文件（`.md5anim`）文本。
 *
 * 解析分三步（依据 Doom3 GPL 源码的 `idMD5Anim` 加载流程）：
 * 1. `hierarchy` 段给出骨骼名、父索引、动作范围字段与标志位；
 * 2. 每帧的 `numAnimatedComponents` 个浮点数**按 hierarchy 顺序**依次分配给各骨骼，
 *    **每根骨骼消耗的个数 = 其 `flags` 中置位的个数**；标志位决定这些分量对应
 *    `tx/ty/tz/qx/qy/qz` 中的哪些，**未覆盖的分量回退到 `baseframe`**；
 * 3. 得到每帧每骨骼的**局部**姿态后，**沿父链累乘**得到绝对变换——
 *    这一步是 `.md5anim` 必须做而 `.md5mesh` 不需要做的（后者文件里存的就是绝对绑定姿态）。
 *
 * `baseframe` 的朝向只有 3 个分量，`w` 由 `w = sqrt(1 - x² - y² - z²)` 补出；
 * 组装时若用了帧数据的 `qx/qy/qz` 与 baseframe 的 `w`，结果会重新归一化。
 *
 * @param text `.md5anim` 文件的全部文本
 * @returns 解析结果（纯数据，不含任何方法）
 */
export function parseMD5Anim(text: string): MD5Anim
{
    return new MD5AnimParser(text).parse();
}

/** hierarchy 段的一行（解析中间态） */
interface HierarchyDraft
{
    name: string;
    parent: number;
    numComponents: number;
    flags: number;
}

/** bounds 段的一行（解析中间态） */
interface BoundsDraft
{
    min: Vector3Like;
    max: Vector3Like;
}

/** frame 段的帧数据（解析中间态） */
interface FrameDraft
{
    index: number;
    components: number[];
}

/**
 * 去除行内注释（`//` 之后的内容），双引号内的 `//` 不视为注释起始。
 */
function stripComment(line: string): string
{
    let inQuote = false;
    for (let i = 0; i < line.length; i++)
    {
        const char = line[i];
        if (char === '"')
        {
            inQuote = !inQuote;
        }
        else if (!inQuote && char === '/' && line[i + 1] === '/')
        {
            return line.slice(0, i);
        }
    }

    return line;
}

/**
 * 解析括号内的数字列表（如 `( 0 0 80.109 )`）。
 */
function parseNumbers(text: string): number[]
{
    return text.trim().split(/\s+/)
        .filter((value) => value !== '')
        .map((value) => Number(value));
}

/**
 * 解析行内的字符串字面量（如 `commandline "xxx"`）。
 */
function parseString(text: string): string
{
    const match = /"([^"]*)"/.exec(text);

    return match ? match[1] : '';
}

/**
 * 判断某个分量是否由帧数据提供。
 */
function hasComponent(flags: number, mask: number): boolean
{
    return (flags & mask) !== 0;
}

/**
 * 按 `baseframe` 的 3 分量朝向补出 `w`：`w = sqrt(1 - x² - y² - z²)`。
 *
 * 当 x² + y² + z² > 1（文件使用了非归一化朝向）时，`w` 取 0，由
 * {@link parseOrientationFromBase} 补出的结果随后会归一化，仍得到有效四元数。
 */
function recoverOrientationW(x: number, y: number, z: number): number
{
    const squared = (x * x) + (y * y) + (z * z);

    return Math.sqrt(Math.max(0, 1 - squared));
}

/**
 * 解析 `( x y z )` 形式的 3 分量朝向并补出 `w`，同时归一化。
 */
function parseOrientationFromBase(values: readonly number[]): QuaternionLike
{
    const x = values[0] || 0;
    const y = values[1] || 0;
    const z = values[2] || 0;

    // 阶段 C-e：`Quaternion` 的 class 已删除，`new Quaternion(x, y, z, w).normalize()`
    // 换成「纯数据 out + 纯函数」（缺省 out 是新建的 w=1 字面量，与构造默认一致）
    return quatNormalize(quatSet(x, y, z, recoverOrientationW(x, y, z)));
}

/**
 * 组装某一帧某根骨骼的**局部**姿态。
 *
 * 帧数据按 hierarchy 顺序、**每根骨骼按 flags 中置位的个数**依次分配；标志位决定分量含义，
 * 未覆盖的分量取 `baseframe`。朝向组装后统一归一化（避免「帧数据的 xyz + baseframe 的 w」
 * 在数值上偏离单位模长）。
 *
 * @param hierarchy 该骨骼的层级声明
 * @param baseJoint 该骨骼的 baseframe 姿态
 * @param components 整帧的原始浮点数
 * @param start 该骨骼的分量在帧数组中的起始下标
 * @returns 局部姿态，以及该骨骼消耗的分量个数
 */
function assembleLocalPose(hierarchy: MD5AnimHierarchy, baseJoint: MD5FrameJoint, components: readonly number[], start: number): { position: WritableVector3Like; orientation: QuaternionLike; consumed: number }
{
    const flags = hierarchy.flags;
    let cursor = start;

    // 平移：帧数据覆盖的分量按序取，未覆盖的回退 baseframe
    const tx = hasComponent(flags, COMPONENT_TX) ? nextComponent() : baseJoint.position.x;
    const ty = hasComponent(flags, COMPONENT_TY) ? nextComponent() : baseJoint.position.y;
    const tz = hasComponent(flags, COMPONENT_TZ) ? nextComponent() : baseJoint.position.z;

    // 朝向：帧数据覆盖的分量按序取，未覆盖的回退 baseframe（w 始终来自 baseframe）
    const knownW = Number(hasComponent(flags, COMPONENT_QX))
        + Number(hasComponent(flags, COMPONENT_QY))
        + Number(hasComponent(flags, COMPONENT_QZ));
    const qx = hasComponent(flags, COMPONENT_QX) ? nextComponent() : baseJoint.orientation.x;
    const qy = hasComponent(flags, COMPONENT_QY) ? nextComponent() : baseJoint.orientation.y;
    const qz = hasComponent(flags, COMPONENT_QZ) ? nextComponent() : baseJoint.orientation.z;
    const qw = knownW === 3 ? Math.sqrt(Math.max(0, 1 - (qx * qx) - (qy * qy) - (qz * qz))) : baseJoint.orientation.w;

    return {
        position: { x: tx, y: ty, z: tz },
        orientation: quatNormalize(quatSet(qx, qy, qz, qw)),
        consumed: cursor - start,
    };

    /** 取下一个帧数据分量；超出帧数据长度时取 0，避免产生 NaN */
    function nextComponent(): number
    {
        if (cursor >= components.length)
        {
            return 0;
        }
        const value = components[cursor];

        cursor++;

        return Number.isFinite(value) ? value : 0;
    }
}

/**
 * 沿父链累乘每根骨骼的绝对变换。
 *
 * `.md5anim` 的帧数据是**相对父**的局部姿态，因此：
 * - `绝对朝向 = 父绝对朝向 * 局部朝向`
 * - `绝对位置 = 父绝对朝向.rotate(局部位置) + 父绝对位置`
 *
 * 父索引必然指向更早的骨骼（合法拓扑），因此正序一次遍历即可完成累乘。
 */
function accumulateAbsolutePoses(local: readonly { position: Vector3Like; orientation: QuaternionLike }[], hierarchy: readonly MD5AnimHierarchy[]): { position: WritableVector3Like; orientation: QuaternionLike }[]
{
    const absolute: { position: WritableVector3Like; orientation: QuaternionLike }[] = [];
    for (let i = 0; i < local.length; i++)
    {
        const hierarchyItem = hierarchy[i];
        const parent = hierarchyItem && hierarchyItem.parent >= 0 ? absolute[hierarchyItem.parent] : undefined;
        if (!parent)
        {
            // 根骨骼：绝对姿态即局部姿态
            absolute.push({
                position: vec3Copy(local[i].position),
                orientation: quatCopy(local[i].orientation),
            });
            continue;
        }
        // 阶段 C-e：实例方法换成等价纯函数（`rotatePoint` → `quatRotatePoint` + `add`、
        // `multTo` → `quatMult`），中间量落在真正的 Vector3 上以保留 `.add`
        const rotated = { x: 0, y: 0, z: 0 };

        quatRotatePoint(parent.orientation, local[i].position, rotated);
        vec3Add(rotated, parent.position, rotated);
        absolute.push({
            position: rotated,
            orientation: quatMult(local[i].orientation, parent.orientation),
        });
    }

    return absolute;
}

/**
 * MD5 动画文本解析器。
 *
 * 逐行扫描文本：先取头部声明（版本、命令行、帧数、骨骼数、帧率、分量数），
 * 再顺序解析 `hierarchy { }`、`bounds { }`、`baseframe { }` 与全部 `frame N { }` 块，
 * 最后按 flags/numComp 组装局部姿态并沿父链累乘出绝对姿态。
 */
class MD5AnimParser
{
    /** 文件按行切分后的内容 */
    #lines: readonly string[];

    /** 待解析的当前行下标 */
    #index = 0;

    constructor(text: string)
    {
        this.#lines = text.split(/\r?\n/);
    }

    /**
     * 执行解析，输出纯数据结果。
     */
    parse(): MD5Anim
    {
        const hierarchyDrafts: HierarchyDraft[] = [];
        const boundsDrafts: BoundsDraft[] = [];
        const baseframeDrafts: { position: WritableVector3Like; orientation: QuaternionLike }[] = [];
        const frameDrafts: FrameDraft[] = [];
        let version = 0;
        let commandline = '';
        let numFrames = 0;
        let numJoints = 0;
        let frameRate = 0;
        let numAnimatedComponents = 0;

        while (this.#index < this.#lines.length)
        {
            const line = this.#nextLine();
            if (line === '')
            {
                continue;
            }
            if (line.startsWith('MD5Version'))
            {
                version = this.#parseHeaderNumber(line);
            }
            else if (line.startsWith('commandline'))
            {
                commandline = parseString(line);
            }
            else if (line.startsWith('numFrames'))
            {
                numFrames = this.#parseHeaderNumber(line);
            }
            else if (line.startsWith('numJoints'))
            {
                numJoints = this.#parseHeaderNumber(line);
            }
            else if (line.startsWith('frameRate'))
            {
                frameRate = this.#parseHeaderNumber(line);
            }
            else if (line.startsWith('numAnimatedComponents'))
            {
                numAnimatedComponents = this.#parseHeaderNumber(line);
            }
            else if (line.startsWith('hierarchy'))
            {
                this.#parseHierarchy(hierarchyDrafts);
            }
            else if (line.startsWith('bounds'))
            {
                this.#parseBounds(boundsDrafts);
            }
            else if (line.startsWith('baseframe'))
            {
                this.#parseBaseframe(baseframeDrafts);
            }
            else if (line.startsWith('frame '))
            {
                this.#parseFrame(line, frameDrafts);
            }
        }

        return this.#buildResult({
            version,
            commandline,
            numFrames,
            numJoints,
            frameRate,
            numAnimatedComponents,
            hierarchyDrafts,
            boundsDrafts,
            baseframeDrafts,
            frameDrafts,
        });
    }

    /**
     * 取下一行，并去除注释与首尾空白。
     */
    #nextLine(): string
    {
        const line = this.#lines[this.#index];

        this.#index++;

        return stripComment(line).trim();
    }

    /**
     * 取头部声明的整数值（如 `MD5Version 10`、`numJoints 110`）。
     *
     * 取行内最后一个词，避免把关键字中的数字（如 `MD5Version` 的 `5`）当成声明值。
     */
    #parseHeaderNumber(line: string): number
    {
        const parts = line.trim().split(/\s+/);
        const value = Number(parts[parts.length - 1]);

        return Number.isFinite(value) ? value : 0;
    }

    /**
     * 解析 `hierarchy { ... }` 块：`"name" parentIndex numComp flags`。
     */
    #parseHierarchy(hierarchyDrafts: HierarchyDraft[]): void
    {
        while (this.#index < this.#lines.length)
        {
            const line = this.#nextLine();
            if (line === '')
            {
                continue;
            }
            if (line.startsWith('}'))
            {
                break;
            }
            const match = /^"([^"]*)"\s+(-?\d+)\s+(\d+)\s+(\d+)/.exec(line);
            if (!match)
            {
                continue;
            }
            hierarchyDrafts.push({
                name: match[1],
                parent: Number(match[2]),
                numComponents: Number(match[3]),
                flags: Number(match[4]),
            });
        }
    }

    /**
     * 解析 `bounds { ... }` 块：`( minX minY minZ ) ( maxX maxY maxZ )`。
     *
     * 行内出现多个括号组（每帧的 bounds 可能写成一行），因此逐组循环解析。
     */
    #parseBounds(boundsDrafts: BoundsDraft[]): void
    {
        while (this.#index < this.#lines.length)
        {
            const line = this.#nextLine();
            if (line === '')
            {
                continue;
            }
            if (line.startsWith('}'))
            {
                break;
            }
            const groups = this.#findBracketGroups(line);
            for (let i = 0; i + 1 < groups.length; i += 2)
            {
                const min = parseNumbers(groups[i]);
                const max = parseNumbers(groups[i + 1]);
                boundsDrafts.push({
                    min: { x: min[0] || 0, y: min[1] || 0, z: min[2] || 0 },
                    max: { x: max[0] || 0, y: max[1] || 0, z: max[2] || 0 },
                });
            }
        }
    }

    /**
     * 解析 `baseframe { ... }` 块：`( posX posY posZ ) ( quatX quatY quatZ )`。
     *
     * 与 `.md5mesh` 相同，朝向只有 3 个分量，`w` 用 `w = sqrt(1 - x² - y² - z²)` 补出。
     */
    #parseBaseframe(baseframeDrafts: { position: WritableVector3Like; orientation: QuaternionLike }[]): void
    {
        while (this.#index < this.#lines.length)
        {
            const line = this.#nextLine();
            if (line === '')
            {
                continue;
            }
            if (line.startsWith('}'))
            {
                break;
            }
            const groups = this.#findBracketGroups(line);
            for (let i = 0; i + 1 < groups.length; i += 2)
            {
                const positions = parseNumbers(groups[i]);
                baseframeDrafts.push({
                    position: { x: positions[0] || 0, y: positions[1] || 0, z: positions[2] || 0 },
                    orientation: parseOrientationFromBase(parseNumbers(groups[i + 1])),
                });
            }
        }
    }

    /**
     * 解析 `frame <index> { ... }` 块：块内是 `numAnimatedComponents` 个浮点数（可跨多行）。
     */
    #parseFrame(headerLine: string, frameDrafts: FrameDraft[]): void
    {
        const match = /^frame\s+(\d+)/.exec(headerLine);
        const components: number[] = [];
        while (this.#index < this.#lines.length)
        {
            const line = this.#nextLine();
            if (line === '')
            {
                continue;
            }
            if (line.startsWith('}'))
            {
                break;
            }
            // 帧数据里可能残留左花括号（如 `frame 0 { 0 0 0 ...`）。
            // 只取左花括号之后的内容，避免把 `frame` / 帧号当成数据。
            const braceIndex = line.indexOf('{');
            const dataText = parseNumbers(braceIndex >= 0 ? line.slice(braceIndex + 1) : line);
            dataText.forEach((value) =>
            {
                if (Number.isFinite(value))
                {
                    components.push(value);
                }
            });
        }
        frameDrafts.push({
            index: match ? Number(match[1]) : frameDrafts.length,
            components,
        });
    }

    /**
     * 取出一行中所有 `( ... )` 组的内容（不含括号）。
     */
    #findBracketGroups(line: string): string[]
    {
        const groups: string[] = [];
        const regex = /\(\s*([^)]*)\)/g;
        let match = regex.exec(line);
        while (match)
        {
            groups.push(match[1]);
            match = regex.exec(line);
        }

        return groups;
    }

    /**
     * 组装纯数据结果：按 flags/numComp 分配帧数据、组装局部姿态、沿父链累乘绝对姿态。
     */
    #buildResult(drafts: {
        version: number;
        commandline: string;
        numFrames: number;
        numJoints: number;
        frameRate: number;
        numAnimatedComponents: number;
        hierarchyDrafts: readonly HierarchyDraft[];
        boundsDrafts: readonly BoundsDraft[];
        baseframeDrafts: readonly { position: Vector3Like; orientation: QuaternionLike }[];
        frameDrafts: readonly FrameDraft[];
    }): MD5Anim
    {
        const hierarchy: MD5AnimHierarchy[] = drafts.hierarchyDrafts.map((draft) => ({
            __type__: 'MD5AnimHierarchy' as const,
            name: draft.name,
            parent: draft.parent,
            numComponents: draft.numComponents,
            flags: draft.flags,
        }));

        // baseframe 本身没有父链语义：它只是「帧数据缺分量时的取值来源」，因此直接作为局部姿态
        const baseframe: MD5FrameJoint[] = drafts.baseframeDrafts.map((draft, index) => ({
            __type__: 'MD5FrameJoint' as const,
            index,
            position: draft.position,
            orientation: draft.orientation,
            absolutePosition: vec3Copy(draft.position),
            absoluteOrientation: quatCopy(draft.orientation),
        }));

        // 骨架缺失或 baseframe 行数不足时补出零姿态，保证后续按 hierarchy 长度取值安全
        // （`orientation` / `absoluteOrientation` 是 `QuaternionLike`，零姿态是 `w = 1` 的字面量，
        //   与 `new Quaternion()` 的默认值一致——阶段 C-e 起 class 已删除）
        const baseJointOf = (jointIndex: number): MD5FrameJoint => baseframe[jointIndex] || {
            __type__: 'MD5FrameJoint' as const,
            index: jointIndex,
            position: { x: 0, y: 0, z: 0 },
            orientation: { x: 0, y: 0, z: 0, w: 1 },
            absolutePosition: { x: 0, y: 0, z: 0 },
            absoluteOrientation: { x: 0, y: 0, z: 0, w: 1 },
        };

        // 分量按 hierarchy 顺序分配：每根骨骼消耗的个数 = flags 中置位的个数
        // （flags 只使用低 6 位：1=tx、2=ty、4=tz、8=qx、16=qy、32=qz；
        //  高位（如部分文件里出现的 64）不代表任何分量，不消耗帧数据）
        const frames: MD5Frame[] = drafts.frameDrafts.map((draft, frameIndex) => {
            let cursor = 0;
            const local = hierarchy.map((item, jointIndex) =>
            {
                const pose = assembleLocalPose(item, baseJointOf(jointIndex), draft.components, cursor);

                cursor += pose.consumed;

                return pose;
            });
            const absolute = accumulateAbsolutePoses(local, hierarchy);
            const joints: MD5FrameJoint[] = hierarchy.map((_item, jointIndex) => ({
                __type__: 'MD5FrameJoint' as const,
                index: jointIndex,
                position: local[jointIndex].position,
                orientation: local[jointIndex].orientation,
                absolutePosition: absolute[jointIndex].position,
                absoluteOrientation: absolute[jointIndex].orientation,
            }));
            // bounds 段行数与帧数一一对应（缺行时不构造 bounds 字段）
            const boundsDraft = drafts.boundsDrafts[frameIndex];
            // 中间态已放宽为 Vector3Like（没有 clone()）：显式复制出 Vector3 实例
            const bounds = boundsDraft
                ? {
                    min: { x: boundsDraft.min.x, y: boundsDraft.min.y, z: boundsDraft.min.z },
                    max: { x: boundsDraft.max.x, y: boundsDraft.max.y, z: boundsDraft.max.z },
                }
                : undefined;

            return {
                __type__: 'MD5Frame' as const,
                index: draft.index,
                bounds,
                joints,
                components: draft.components,
            };
        });

        return {
            __type__: 'MD5Anim' as const,
            version: drafts.version,
            commandline: drafts.commandline,
            numFrames: drafts.numFrames,
            numJoints: drafts.numJoints,
            frameRate: drafts.frameRate,
            numAnimatedComponents: drafts.numAnimatedComponents,
            hierarchy,
            baseframe,
            frames,
        };
    }
}
