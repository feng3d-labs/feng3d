import { CustomGeometry, reactive } from 'feng3d';

/**
 * PLY 加载器。
 *
 * 解析 Stanford PLY 文件（ASCII / binary_little_endian / binary_big_endian），返回 CustomGeometry。
 * 支持 vertex 属性 x/y/z（以及可选的 nx/ny/nz 法线）与 face 的 list 属性（扇形三角化）。
 * 对应 three.js addons/loaders/PLYLoader.js（简化版）。
 */

/**
 * PLY 标量类型 → 字节数与读取方式
 */
const SCALAR_TYPES: Record<string, {
    /** 该类型占用的字节数 */
    size: number;
    /** 从 DataView 读出数值 */
    read: (view: DataView, offset: number, littleEndian: boolean) => number;
}> = {
    char: { size: 1, read: (view, offset) => view.getInt8(offset) },
    int8: { size: 1, read: (view, offset) => view.getInt8(offset) },
    uchar: { size: 1, read: (view, offset) => view.getUint8(offset) },
    uint8: { size: 1, read: (view, offset) => view.getUint8(offset) },
    short: { size: 2, read: (view, offset, littleEndian) => view.getInt16(offset, littleEndian) },
    int16: { size: 2, read: (view, offset, littleEndian) => view.getInt16(offset, littleEndian) },
    ushort: { size: 2, read: (view, offset, littleEndian) => view.getUint16(offset, littleEndian) },
    uint16: { size: 2, read: (view, offset, littleEndian) => view.getUint16(offset, littleEndian) },
    int: { size: 4, read: (view, offset, littleEndian) => view.getInt32(offset, littleEndian) },
    int32: { size: 4, read: (view, offset, littleEndian) => view.getInt32(offset, littleEndian) },
    uint: { size: 4, read: (view, offset, littleEndian) => view.getUint32(offset, littleEndian) },
    uint32: { size: 4, read: (view, offset, littleEndian) => view.getUint32(offset, littleEndian) },
    float: { size: 4, read: (view, offset, littleEndian) => view.getFloat32(offset, littleEndian) },
    float32: { size: 4, read: (view, offset, littleEndian) => view.getFloat32(offset, littleEndian) },
    double: { size: 8, read: (view, offset, littleEndian) => view.getFloat64(offset, littleEndian) },
    float64: { size: 8, read: (view, offset, littleEndian) => view.getFloat64(offset, littleEndian) },
};

/**
 * PLY header 中的一个属性
 */
interface PLYProperty
{
    /** 元素值类型（list 属性为其中元素的值类型） */
    type: string;
    /** 属性名 */
    name: string;
    /** list 属性的元素个数字段类型；非 list 属性为 undefined */
    listCountType?: string;
}

/**
 * PLY header 中的一个 element（vertex / face / ...）
 */
interface PLYElement
{
    /** 元素名 */
    name: string;
    /** 元素个数 */
    count: number;
    /** 属性列表（前一个 element 之后出现的 property 行归属该 element） */
    properties: PLYProperty[];
}

/**
 * 从 URL 加载 PLY 文件并解析为 CustomGeometry。
 *
 * @param url PLY 文件地址
 * @returns CustomGeometry（含 positions/normals/indices）
 */
export async function loadPLYFromUrl(url: string): Promise<CustomGeometry>
{
    const resp = await fetch(url);
    const buffer = await resp.arrayBuffer();

    return parsePLY(buffer);
}

/**
 * 解析 PLY ArrayBuffer（按 header 中的 format 行判断 ASCII / 二进制）。
 *
 * @param buffer PLY 文件数据
 * @returns CustomGeometry
 */
export function parsePLY(buffer: ArrayBuffer): CustomGeometry
{
    const bytes = new Uint8Array(buffer);
    const headerEnd = findHeaderEnd(bytes);
    const header = parseHeader(new TextDecoder().decode(bytes.slice(0, headerEnd)));

    if (header.isBinary)
    {
        return parseBinaryPLY(buffer, headerEnd, header.elements, header.littleEndian);
    }

    return parseASCIIPLY(new TextDecoder().decode(bytes.slice(headerEnd)), header.elements);
}

/**
 * 定位 header 结束位置（"end_header" 所在行的行尾之后；兼容 CRLF）。
 */
function findHeaderEnd(bytes: Uint8Array): number
{
    const target = [101, 110, 100, 95, 104, 101, 97, 100, 101, 114]; // "end_header"
    for (let i = 0; i + target.length <= bytes.length; i++)
    {
        let match = true;
        for (let j = 0; j < target.length; j++)
        {
            if (bytes[i + j] !== target[j]) { match = false; break; }
        }
        if (!match) continue;

        // 跳过该行剩余内容（\n 或 \r\n）
        let end = i + target.length;
        while (end < bytes.length && bytes[end] !== 10) end++;

        return end + 1;
    }

    return 0;
}

/**
 * 解析 header（format / element / property 行）。
 */
function parseHeader(text: string): { elements: PLYElement[]; isBinary: boolean; littleEndian: boolean }
{
    const elements: PLYElement[] = [];
    let isBinary = false;
    let littleEndian = true;

    for (const line of text.split('\n'))
    {
        const parts = line.trim().split(/\s+/);
        if (parts[0] === 'format')
        {
            isBinary = parts[1] !== 'ascii';
            littleEndian = parts[1] !== 'binary_big_endian';
        }
        else if (parts[0] === 'element')
        {
            elements.push({ name: parts[1], count: Number(parts[2]), properties: [] });
        }
        else if (parts[0] === 'property' && elements.length > 0)
        {
            const element = elements[elements.length - 1];
            // property list <countType> <valueType> <name> / property <type> <name>
            if (parts[1] === 'list')
            {
                element.properties.push({ type: parts[3], name: parts[4], listCountType: parts[2] });
            }
            else
            {
                element.properties.push({ type: parts[1], name: parts[2] });
            }
        }
    }

    return { elements, isBinary, littleEndian };
}

/**
 * 取标量类型描述；未知类型直接报错，避免静默错位读出垃圾数据。
 */
function getScalarType(name: string): { size: number; read: (view: DataView, offset: number, littleEndian: boolean) => number }
{
    const type = SCALAR_TYPES[name];
    if (!type) throw new Error(`PLY: 未知的属性类型 ${name}`);

    return type;
}

/**
 * 按 element 收下顶点与面数据：
 * - vertex：取 x/y/z 位置与 nx/ny/nz 法线（缺失的分量按 0）
 * - face：list 属性（顶点索引）扇形三角化
 */
function appendElement(elementName: string, values: Record<string, number>, list: number[] | null,
    positions: number[], normals: number[], indices: number[]): void
{
    if (elementName === 'vertex')
    {
        positions.push(values.x ?? 0, values.y ?? 0, values.z ?? 0);
        normals.push(values.nx ?? 0, values.ny ?? 0, values.nz ?? 0);
    }
    else if (elementName === 'face' && list && list.length >= 3)
    {
        // 扇形三角化
        for (let j = 1; j < list.length - 1; j++) indices.push(list[0], list[j], list[j + 1]);
    }
}

/**
 * 解析 ASCII PLY body（按空白切分成 token 流，跨行读取）。
 */
function parseASCIIPLY(text: string, elements: PLYElement[]): CustomGeometry
{
    const tokens = text.split(/\s+/).filter((token) => token !== '');
    let cursor = 0;

    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    for (const element of elements)
    {
        for (let i = 0; i < element.count; i++)
        {
            // 数据不足（文件截断）时按已读到的内容返回
            if (cursor >= tokens.length) return buildGeometry(positions, normals, indices);

            const values: Record<string, number> = {};
            let list: number[] | null = null;

            for (const prop of element.properties)
            {
                if (prop.listCountType)
                {
                    const count = Number(tokens[cursor++]);
                    const items: number[] = [];
                    for (let k = 0; k < count; k++) items.push(Number(tokens[cursor++]));
                    list = items;
                }
                else
                {
                    values[prop.name] = Number(tokens[cursor++]);
                }
            }

            appendElement(element.name, values, list, positions, normals, indices);
        }
    }

    return buildGeometry(positions, normals, indices);
}

/**
 * 解析二进制 PLY body（按属性类型逐个读取并推进偏移）。
 */
function parseBinaryPLY(buffer: ArrayBuffer, headerEnd: number, elements: PLYElement[], littleEndian: boolean): CustomGeometry
{
    const view = new DataView(buffer);
    let offset = headerEnd;

    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    for (const element of elements)
    {
        for (let i = 0; i < element.count; i++)
        {
            const values: Record<string, number> = {};
            let list: number[] | null = null;

            for (const prop of element.properties)
            {
                if (prop.listCountType)
                {
                    const countType = getScalarType(prop.listCountType);
                    const valueType = getScalarType(prop.type);
                    const count = countType.read(view, offset, littleEndian);
                    offset += countType.size;
                    const items: number[] = [];
                    for (let k = 0; k < count; k++)
                    {
                        items.push(valueType.read(view, offset, littleEndian));
                        offset += valueType.size;
                    }
                    list = items;
                }
                else
                {
                    const type = getScalarType(prop.type);
                    values[prop.name] = type.read(view, offset, littleEndian);
                    offset += type.size;
                }
            }

            appendElement(element.name, values, list, positions, normals, indices);
        }
    }

    return buildGeometry(positions, normals, indices);
}

/**
 * 组装 CustomGeometry（无索引时按顶点顺序索引补齐）。
 */
function buildGeometry(positions: number[], normals: number[], indices: number[]): CustomGeometry
{
    const geo: CustomGeometry = { __type__: 'CustomGeometry' };
    // 顶点数据通过响应式数据接口写入（logic 字段只读）
    const r_geo = reactive(geo);
    r_geo.positions = positions;
    r_geo.normals = normals;
    r_geo.indices = indices.length > 0 ? indices : Array.from({ length: positions.length / 3 }, (_, i) => i);
    const vCount = positions.length / 3;
    r_geo.uvs = new Array(vCount * 2).fill(0);
    const colors: number[] = [];
    for (let i = 0; i < vCount; i++) colors.push(1, 1, 1, 1);
    r_geo.colors = colors;

    return geo;
}
