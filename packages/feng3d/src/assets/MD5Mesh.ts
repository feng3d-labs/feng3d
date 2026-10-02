import { Quaternion, QuaternionLike, quatRotatePoint, Vector3, Vector3Like } from '@feng3d/math';

/**
 * MD5 模型中的关节（骨骼）。
 *
 * 需要特别说明：`.md5mesh` 的 `joints` 段保存的是**模型空间中的绝对绑定姿态**
 * （Doom3 `idRenderModelMD5::LoadModel` 直接把文件里的 pos/orient 作为关节的绝对矩阵 `poseMat3`，
 * 再反推出相对父的局部姿态供动画使用）。因此：
 * - {@link MD5Joint.position} / {@link MD5Joint.orientation} 为文件声明值（绝对绑定姿态）；
 * - {@link MD5Joint.localPosition} / {@link MD5Joint.localOrientation} 为反推出的局部姿态（`.md5anim` 用）；
 * - {@link MD5Joint.absolutePosition} / {@link MD5Joint.absoluteOrientation} 由局部姿态沿父链累乘还原。
 */
export interface MD5Joint
{
    readonly __type__: 'MD5Joint';

    /** 关节名称 */
    readonly name: string;

    /** 父关节索引，-1 表示根关节 */
    readonly parent: number;

    /**
     * 文件声明的关节位置（模型空间中的绝对绑定姿态）。
     *
     * 类型为 {@link Vector3Like}（issue #134）：任何提供 `x/y/z` 的纯数据对象都算，
     * 解析器实际写入的仍是 `Vector3` 实例。
     */
    readonly position: Vector3Like;

    /**
     * 文件声明的关节朝向四元数（模型空间中的绝对绑定姿态）。
     *
     * 类型为 {@link QuaternionLike}（issue #134）：解析器实际写入的仍是 `Quaternion` 实例。
     */
    readonly orientation: QuaternionLike;

    /** 相对父关节的局部位置（由绝对姿态反推，供 `.md5anim` 使用） */
    readonly localPosition: Vector3Like;

    /**
     * 相对父关节的局部朝向（由绝对姿态反推，供 `.md5anim` 使用）。
     *
     * 类型为 {@link QuaternionLike}（issue #134）：解析器实际写入的仍是 `Quaternion` 实例。
     */
    readonly localOrientation: QuaternionLike;

    /**
     * 关节的绝对位置：由局部姿态沿父链累乘得到（`父绝对朝向.rotate(局部位置) + 父绝对位置`），
     * 数值上等于文件声明的 {@link MD5Joint.position}
     */
    readonly absolutePosition: Vector3Like;

    /**
     * 关节的绝对朝向：由局部姿态沿父链累乘得到（`父绝对朝向 * 局部朝向`），
     * 数值上等于文件声明的 {@link MD5Joint.orientation}
     *
     * 类型为 {@link QuaternionLike}（issue #134）：解析器实际写入的仍是 `Quaternion` 实例。
     */
    readonly absoluteOrientation: QuaternionLike;
}

/**
 * MD5 顶点的一个权重项：把顶点绑定到某个关节上。
 */
export interface MD5Weight
{
    readonly __type__: 'MD5Weight';

    /** 权重索引（在该 mesh 的 weights 数组中的下标） */
    readonly index: number;

    /** 所属关节索引 */
    readonly joint: number;

    /** 权重系数 */
    readonly bias: number;

    /** 该权重在关节局部空间中的位置（`Vector3Like`：纯数据对象也算） */
    readonly position: Vector3Like;
}

/**
 * MD5 顶点。
 *
 * 顶点**没有绝对坐标**：最终位置由它引用的 weights 加权求和得到，见 {@link MD5Vertex.position}。
 */
export interface MD5Vertex
{
    readonly __type__: 'MD5Vertex';

    /** 顶点索引（在该 mesh 的 vertices 数组中的下标） */
    readonly index: number;

    /** 纹理坐标 u */
    readonly u: number;

    /** 纹理坐标 v */
    readonly v: number;

    /** 该顶点引用的第一个权重在 weights 数组中的下标 */
    readonly weightStart: number;

    /** 该顶点引用的权重数量 */
    readonly weightCount: number;

    /**
     * 顶点的最终位置：对其引用的每个 weight，
     * 把 weight 的局部位置经所属关节的绝对变换后按 bias 加权求和，最后除以权重和。
     *
     * 类型为 {@link Vector3Like}（issue #134）：解析器实际写入的仍是 `Vector3` 实例。
     */
    readonly position: Vector3Like;
}

/**
 * MD5 三角形。
 */
export interface MD5Triangle
{
    readonly __type__: 'MD5Triangle';

    /** 三角形索引（在该 mesh 的 triangles 数组中的下标） */
    readonly index: number;

    /** 第一个顶点索引 */
    readonly v0: number;

    /** 第二个顶点索引 */
    readonly v1: number;

    /** 第三个顶点索引 */
    readonly v2: number;
}

/**
 * MD5 模型中的一个子网格（一个 shader 对应一个子网格）。
 */
export interface MD5SubMesh
{
    readonly __type__: 'MD5SubMesh';

    /** 着色器（材质）路径 */
    readonly shader: string;

    /** 顶点列表 */
    readonly vertices: readonly MD5Vertex[];

    /** 三角形列表 */
    readonly triangles: readonly MD5Triangle[];

    /** 权重列表 */
    readonly weights: readonly MD5Weight[];
}

/**
 * MD5 模型文件（`.md5mesh`）的解析结果。
 */
export interface MD5Mesh
{
    readonly __type__: 'MD5Mesh';

    /** 文件声明的 MD5 版本号（MD5Version） */
    readonly version: number;

    /** 文件声明的命令行（commandline） */
    readonly commandline: string;

    /** 文件头部声明的关节数量（numJoints） */
    readonly numJoints: number;

    /** 文件头部声明的子网格数量（numMeshes） */
    readonly numMeshes: number;

    /** 关节列表，已包含计算好的绝对姿态 */
    readonly joints: readonly MD5Joint[];

    /** 子网格列表 */
    readonly meshes: readonly MD5SubMesh[];
}

/**
 * 计算单个 weight 在世界空间中的位置。
 *
 * 测试中可用它验证「共享同一个 weight 的两个顶点，在该 weight 影响下的位置一致」。
 *
 * @param weight 权重项
 * @param joint 该权重所属的关节（需含绝对姿态）
 * @returns weight 的局部位置经关节绝对变换后的世界位置
 */
export function getMD5WeightPosition(weight: MD5Weight, joint: MD5Joint): Vector3
{
    // 位置类字段与朝向类字段都已放宽（`Vector3Like` / `QuaternionLike`，没有实例方法）：
    // 旋转走纯函数 `quatRotatePoint`，再显式构造 Vector3 相加——返回类型仍是 Vector3 实例（P8c）
    const rotated = quatRotatePoint(joint.absoluteOrientation, weight.position);

    return new Vector3(
        rotated.x + joint.absolutePosition.x,
        rotated.y + joint.absolutePosition.y,
        rotated.z + joint.absolutePosition.z,
    );
}

/**
 * 解析 MD5 模型文件（`.md5mesh`）文本。
 *
 * 顶点没有绝对坐标，解析时会完成两步计算：关节的局部/绝对变换、顶点的最终位置（weights 加权融合）。
 *
 * 关于坐标语义（依据 Doom3 GPL 源码 `neo/renderer/Model_md5.cpp` 的 `idRenderModelMD5::LoadModel`
 * 与 `idMD5Mesh::ParseMesh`）：`.md5mesh` 的 `joints` 段保存的是绝对绑定姿态，Doom3 直接将其作为
 * 关节的绝对矩阵来变换顶点；只有 `.md5anim` 的帧数据才是相对父的局部姿态。本解析器按官方语义
 * 反推局部姿态并沿父链累乘还原绝对姿态，见 {@link MD5Joint}。
 *
 * @param text `.md5mesh` 文件的全部文本
 * @returns 解析结果（纯数据，不含任何方法）
 */
export function parseMD5Mesh(text: string): MD5Mesh
{
    return new MD5MeshParser(text).parse();
}

/** 关节解析中间态（绝对姿态尚未计算） */
interface JointDraft
{
    name: string;
    parent: number;
    position: Vector3;
    orientation: Quaternion;
}

/** 关节的局部姿态与绝对姿态 */
interface JointTransform
{
    localPosition: Vector3;
    localOrientation: Quaternion;
    absolutePosition: Vector3;
    absoluteOrientation: Quaternion;
}

/** 顶点解析中间态（最终位置尚未计算） */
interface VertexDraft
{
    index: number;
    u: number;
    v: number;
    weightStart: number;
    weightCount: number;
}

/** 三角形解析中间态 */
interface TriangleDraft
{
    index: number;
    v0: number;
    v1: number;
    v2: number;
}

/** 权重解析中间态 */
interface WeightDraft
{
    index: number;
    joint: number;
    bias: number;
    position: Vector3;
}

/** 子网格解析中间态 */
interface SubMeshDraft
{
    shader: string;
    vertices: VertexDraft[];
    triangles: TriangleDraft[];
    weights: WeightDraft[];
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
 * 解析行内的字符串字面量（如 `shader "xxx"`）。
 */
function parseString(text: string): string
{
    const match = /"([^"]*)"/.exec(text);

    return match ? match[1] : '';
}

/**
 * 解析关节朝向四元数。
 *
 * MD5 文件中的四元数只有 x、y、z 三个分量，w 由 `w = sqrt(1 - x² - y² - z²)` 补出；
 * 若文件给出了四个分量（部分变体），则直接采用第四个分量。
 */
function parseOrientation(values: readonly number[]): Quaternion
{
    const x = values[0] || 0;
    const y = values[1] || 0;
    const z = values[2] || 0;
    const w = values.length >= 4 ? values[3] : Math.sqrt(Math.max(0, 1 - (x * x) - (y * y) - (z * z)));

    return new Quaternion(x, y, z, w);
}

/**
 * 沿父链累乘关节的绝对变换。
 *
 * `.md5mesh` 文件中 `joints` 段给出的 pos/orient 是**绝对绑定姿态**，因此这里先按 Doom3 的
 * 公式反推出相对父的局部姿态：
 * - `局部朝向 = 绝对朝向 * 父绝对朝向的逆`
 * - `局部位置 = 父绝对朝向的逆.rotate(绝对位置 - 父绝对位置)`
 *
 * 再沿父链累乘还原绝对姿态（与反推互为逆运算）：
 * - `绝对朝向 = 父绝对朝向 * 局部朝向`
 * - `绝对位置 = 父绝对朝向.rotate(局部位置) + 父绝对位置`
 *
 * 这样 `.md5mesh` 得到正确的绑定姿态，同时产出的局部姿态可直接用于 `.md5anim` 动画数据。
 */
function computeJointTransforms(joints: readonly JointDraft[]): JointTransform[]
{
    const transforms: JointTransform[] = [];
    for (let i = 0; i < joints.length; i++)
    {
        const joint = joints[i];
        const parent: JointTransform | undefined = joint.parent >= 0 ? transforms[joint.parent] : undefined;
        if (!parent)
        {
            // 根关节（或父关节尚未出现）：绝对姿态就是文件声明的绑定姿态
            transforms.push({
                localPosition: joint.position.clone(),
                localOrientation: joint.orientation.clone(),
                absolutePosition: joint.position.clone(),
                absoluteOrientation: joint.orientation.clone(),
            });
            continue;
        }
        // 反推局部姿态
        const inverseParentOrientation = parent.absoluteOrientation.inverseTo();
        const offset = joint.position.clone();
        offset.sub(parent.absolutePosition);
        const localPosition = inverseParentOrientation.rotatePoint(offset);
        const localOrientation = joint.orientation.multTo(inverseParentOrientation);
        // 沿父链累乘还原绝对姿态
        transforms.push({
            localPosition,
            localOrientation,
            absolutePosition: parent.absoluteOrientation.rotatePoint(localPosition).add(parent.absolutePosition),
            absoluteOrientation: localOrientation.multTo(parent.absoluteOrientation),
        });
    }

    return transforms;
}

/**
 * 计算顶点的最终位置：对其引用的每个 weight 加权求和，最后除以权重和。
 */
function blendVertexPosition(vertex: VertexDraft, weights: readonly MD5Weight[], joints: readonly MD5Joint[]): Vector3
{
    const position = new Vector3();
    let biasSum = 0;
    const end = vertex.weightStart + vertex.weightCount;
    for (let i = vertex.weightStart; i < end && i < weights.length; i++)
    {
        const weight = weights[i];
        const joint: MD5Joint | undefined = joints[weight.joint];
        if (!joint)
        {
            continue;
        }
        position.addScaledVector(weight.bias, getMD5WeightPosition(weight, joint));
        biasSum += weight.bias;
    }
    if (biasSum !== 0)
    {
        position.divideNumber(biasSum);
    }

    return position;
}

/**
 * MD5 模型文本解析器。
 *
 * 逐行扫描文本：先取头部声明（版本、命令行、数量），再顺序解析 `joints { }` 与 `mesh { }` 块，
 * 最后统一计算关节绝对变换与顶点最终位置。
 */
class MD5MeshParser
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
    parse(): MD5Mesh
    {
        const joints: JointDraft[] = [];
        const subMeshDrafts: SubMeshDraft[] = [];
        let version = 0;
        let commandline = '';
        let numJoints = 0;
        let numMeshes = 0;

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
            else if (line.startsWith('numJoints'))
            {
                numJoints = this.#parseHeaderNumber(line);
            }
            else if (line.startsWith('numMeshes'))
            {
                numMeshes = this.#parseHeaderNumber(line);
            }
            else if (line.startsWith('joints'))
            {
                this.#parseJoints(joints);
            }
            else if (line.startsWith('mesh'))
            {
                this.#parseSubMesh(subMeshDrafts);
            }
        }

        return this.#buildResult(version, commandline, numJoints, numMeshes, joints, subMeshDrafts);
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
     * 解析 `joints { ... }` 块。
     */
    #parseJoints(joints: JointDraft[]): void
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
            const match = /^"([^"]*)"\s+(-?\d+)\s+\(\s*([^)]*)\)\s+\(\s*([^)]*)\)/.exec(line);
            if (!match)
            {
                continue;
            }
            const positions = parseNumbers(match[3]);
            joints.push({
                name: match[1],
                parent: Number(match[2]),
                position: new Vector3(positions[0] || 0, positions[1] || 0, positions[2] || 0),
                orientation: parseOrientation(parseNumbers(match[4])),
            });
        }
    }

    /**
     * 解析 `mesh { ... }` 块。
     */
    #parseSubMesh(subMeshDrafts: SubMeshDraft[]): void
    {
        const draft: SubMeshDraft = { shader: '', vertices: [], triangles: [], weights: [] };

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
            if (line.startsWith('shader'))
            {
                draft.shader = parseString(line);
            }
            else if (line.startsWith('num'))
            {
                // numverts / numtris / numweights 仅为声明，实际数量以解析结果为准
                continue;
            }
            else if (line.startsWith('vert '))
            {
                this.#parseVertex(line, draft.vertices);
            }
            else if (line.startsWith('tri '))
            {
                this.#parseTriangle(line, draft.triangles);
            }
            else if (line.startsWith('weight '))
            {
                this.#parseWeight(line, draft.weights);
            }
        }
        subMeshDrafts.push(draft);
    }

    /**
     * 解析 `vert <index> ( u v ) <weightStart> <weightCount>`。
     */
    #parseVertex(line: string, vertices: VertexDraft[]): void
    {
        const match = /^vert\s+(\d+)\s+\(\s*([^)]*)\)\s+(\d+)\s+(\d+)/.exec(line);
        if (!match)
        {
            return;
        }
        const uvs = parseNumbers(match[2]);
        vertices.push({
            index: Number(match[1]),
            u: uvs[0] || 0,
            v: uvs[1] || 0,
            weightStart: Number(match[3]),
            weightCount: Number(match[4]),
        });
    }

    /**
     * 解析 `tri <index> <v0> <v1> <v2>`。
     */
    #parseTriangle(line: string, triangles: TriangleDraft[]): void
    {
        const match = /^tri\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/.exec(line);
        if (!match)
        {
            return;
        }
        triangles.push({
            index: Number(match[1]),
            v0: Number(match[2]),
            v1: Number(match[3]),
            v2: Number(match[4]),
        });
    }

    /**
     * 解析 `weight <index> <jointIndex> <bias> ( posX posY posZ )`。
     */
    #parseWeight(line: string, weights: WeightDraft[]): void
    {
        const match = /^weight\s+(\d+)\s+(\d+)\s+(\S+)\s+\(\s*([^)]*)\)/.exec(line);
        if (!match)
        {
            return;
        }
        const positions = parseNumbers(match[4]);
        weights.push({
            index: Number(match[1]),
            joint: Number(match[2]),
            bias: Number(match[3]),
            position: new Vector3(positions[0] || 0, positions[1] || 0, positions[2] || 0),
        });
    }

    /**
     * 组装纯数据结果，完成关节绝对变换与顶点位置计算。
     */
    #buildResult(version: number, commandline: string, numJoints: number, numMeshes: number, jointDrafts: readonly JointDraft[], subMeshDrafts: readonly SubMeshDraft[]): MD5Mesh
    {
        const transforms = computeJointTransforms(jointDrafts);
        const joints: MD5Joint[] = jointDrafts.map((joint, i) => ({
            __type__: 'MD5Joint' as const,
            name: joint.name,
            parent: joint.parent,
            position: joint.position,
            orientation: joint.orientation,
            localPosition: transforms[i].localPosition,
            localOrientation: transforms[i].localOrientation,
            absolutePosition: transforms[i].absolutePosition,
            absoluteOrientation: transforms[i].absoluteOrientation,
        }));

        const meshes: MD5SubMesh[] = subMeshDrafts.map((draft) => {
            const weights: MD5Weight[] = draft.weights.map((weight) => ({
                __type__: 'MD5Weight' as const,
                index: weight.index,
                joint: weight.joint,
                bias: weight.bias,
                position: weight.position,
            }));
            const vertices: MD5Vertex[] = draft.vertices.map((vertex) => ({
                __type__: 'MD5Vertex' as const,
                index: vertex.index,
                u: vertex.u,
                v: vertex.v,
                weightStart: vertex.weightStart,
                weightCount: vertex.weightCount,
                position: blendVertexPosition(vertex, weights, joints),
            }));
            const triangles: MD5Triangle[] = draft.triangles.map((triangle) => ({
                __type__: 'MD5Triangle' as const,
                index: triangle.index,
                v0: triangle.v0,
                v1: triangle.v1,
                v2: triangle.v2,
            }));

            return {
                __type__: 'MD5SubMesh' as const,
                shader: draft.shader,
                vertices,
                triangles,
                weights,
            };
        });

        return {
            __type__: 'MD5Mesh' as const,
            version,
            commandline,
            numJoints,
            numMeshes,
            joints,
            meshes,
        };
    }
}
