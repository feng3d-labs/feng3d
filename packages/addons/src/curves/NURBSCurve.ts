import { Vector4Like, vec3From, WritableVector3Like, WritableVector4Like } from '@feng3d/math';

// ---- NURBS 工具函数（移植自 three.js addons/curves/NURBSUtils.js 的核心子集） ----

/** 查找节点向量区间（The NURBS Book, A2.1） */
function findSpan(p: number, u: number, U: number[]): number
{
    const n = U.length - p - 1;
    if (u >= U[n]) return n - 1;
    if (u <= U[p]) return p;
    let low = p;
    let high = n;
    let mid = Math.floor((low + high) / 2);
    while (u < U[mid] || u >= U[mid + 1])
    {
        if (u < U[mid]) high = mid;
        else low = mid;
        mid = Math.floor((low + high) / 2);
    }

    return mid;
}

/** 计算基函数（The NURBS Book, A2.2） */
function calcBasisFunctions(span: number, u: number, p: number, U: number[]): number[]
{
    const N = [1.0];
    const left: number[] = [];
    const right: number[] = [];
    for (let j = 1; j <= p; j++)
    {
        left[j] = u - U[span + 1 - j];
        right[j] = U[span + j] - u;
        let saved = 0.0;
        for (let r = 0; r < j; r++)
        {
            const rv = right[r + 1];
            const lv = left[j - r];
            const temp = N[r] / (rv + lv);
            N[r] = saved + rv * temp;
            saved = lv * temp;
        }
        N[j] = saved;
    }

    return N;
}

/** 计算 B 样条曲线点（The NURBS Book, A3.1），返回齐次坐标 Vector4(wx,wy,wz,w) */
function calcBSplinePoint(p: number, U: number[], P: readonly Vector4Like[], u: number): WritableVector4Like
{
    const span = findSpan(p, u, U);
    const N = calcBasisFunctions(span, u, p, U);
    const C: WritableVector4Like = { x: 0, y: 0, z: 0, w: 0 };
    for (let j = 0; j <= p; j++)
    {
        const point = P[span - p + j];
        const wNj = point.w * N[j];
        C.x += point.x * wNj;
        C.y += point.y * wNj;
        C.z += point.z * wNj;
        C.w += point.w * N[j];
    }

    return C;
}

/**
 * NURBS 曲线（非均匀有理 B 样条）。
 *
 * 移植自 three.js addons/curves/NURBSCurve.js（精简版，仅含 getPoint 点计算）。
 * 控制点用 Vector4(x, y, z, w=权重)，w=1 时等同普通点。
 *
 * @see https://github.com/mrdoob/three.js/blob/dev/examples/jsm/curves/NURBSCurve.js
 */
export class NURBSCurve
{
    readonly degree: number;
    readonly knots: number[];
    readonly controlPoints: WritableVector4Like[];
    readonly startKnot: number;
    readonly endKnot: number;

    constructor(
        degree: number,
        knots: number[],
        controlPoints: readonly { x: number; y: number; z: number; w?: number }[],
        startKnot = 0,
        endKnot = knots ? knots.length - 1 : 0,
    )
    {
        this.degree = degree;
        this.knots = knots;
        this.startKnot = startKnot;
        this.endKnot = endKnot;
        // 阶段 C-f：`Vector4` 的 class 已删除，控制点统一按纯数据补齐 w（缺省 1）
        this.controlPoints = controlPoints.map((p) => ({ x: p.x, y: p.y, z: p.z, w: p.w ?? 1 }));
    }

    /**
     * 返回参数 t∈[0,1] 对应的曲线点（3D 空间）。
     */
    getPoint(t: number, target: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
    {
        const u = this.knots[this.startKnot] + t * (this.knots[this.endKnot] - this.knots[this.startKnot]);
        const hpoint = calcBSplinePoint(this.degree, this.knots, this.controlPoints, u);
        if (hpoint.w !== 1.0)
        {
            hpoint.x /= hpoint.w;
            hpoint.y /= hpoint.w;
            hpoint.z /= hpoint.w;
        }

        return vec3From(hpoint.x, hpoint.y, hpoint.z, target);
    }

    /**
     * 在曲线上采样 numSamples 个点。
     */
    getPoints(numSamples: number): WritableVector3Like[]
    {
        const points: WritableVector3Like[] = [];
        for (let i = 0; i <= numSamples; i++)
        {
            points.push(this.getPoint(i / numSamples));
        }

        return points;
    }
}
