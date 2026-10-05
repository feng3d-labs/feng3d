import { Array as TSLArray } from './array';
import { ShaderValue, StructValueMeta } from '../core/IElement';
import { Uniform } from './uniform';

/**
 * 结构体成员类型
 * 支持以下形式：
 * - 类型构造函数（如 `vec4`、`mat4`、`float`），由 struct 内部解析为实例
 * - Array 实例（如 `array(vec4, 2)`）
 * - ShaderValue 实例（如 `vec4()`）
 * - 嵌套结构体构造函数（由 struct() 返回的可调用对象）
 */
export type StructMemberType = (() => ShaderValue) | TSLArray<ShaderValue> | ShaderValue | StructType<StructMembers>;

/**
 * 结构体成员定义
 */
export type StructMembers = Record<string, StructMemberType>;

/**
 * 将成员类型映射为其实际类型
 *
 * 成员可能是构造函数（如 vec4）、Array 实例或嵌套结构体构造函数。
 * 解析后：
 * - 构造函数成员 -> 对应的 ShaderValue 实例类型
 * - Array 实例 -> TSLArray
 * - 嵌套结构体 -> 递归解析
 */
export type ResolveMembers<T extends StructMembers> = {
    [K in keyof T]: T[K] extends StructType<infer U>
    ? ResolveMembers<U>
    : T[K] extends TSLArray<infer E>
    ? TSLArray<E>
    : T[K] extends () => infer R
    ? R
    : T[K];
};

/**
 * 结构体类型标记
 */
const STRUCT_TYPE_MARKER = Symbol('structType');

/**
 * 结构体类型定义（由 struct() 返回）
 *
 * 既是可调用的构造函数（调用时传入 Uniform 返回 Struct 实例），
 * 又携带结构体定义信息（用于嵌套结构体和类型判断）。
 */
export interface StructType<T extends StructMembers>
{
    [STRUCT_TYPE_MARKER]: true;
    _definition: StructDefinition<T>;
    /** 调用结构体构造函数，关联到指定 uniform 并返回结构体实例 */
    (uniformVar: Uniform): Struct<T>;
}

/**
 * 判断是否为结构体类型
 */
export function isStructType(obj: unknown): obj is StructType<StructMembers>
{
    return (typeof obj === 'object' || typeof obj === 'function')
        && obj !== null
        && (obj as Record<symbol, unknown>)[STRUCT_TYPE_MARKER] === true;
}

// 保留旧的名称作为别名，以便向后兼容
export const isStructConstructor = isStructType;
export type StructConstructor<T extends StructMembers> = StructType<T>;

/**
 * 将成员类型解析为实例（用于读取 glslType/wgslType 等类型信息）
 *
 * 成员可能是：
 * - 类型构造函数（如 `vec4`、`mat4`）：调用 `()` 得到实例
 * - ShaderValue 实例：直接返回
 * - 嵌套结构体构造函数：返回 null（不参与标量类型推断）
 * - TSLArray 实例：直接返回
 *
 * @param member 成员定义
 * @returns 解析后的实例（可能为 null）
 */
function resolveMemberInstance(member: StructMemberType): ShaderValue | TSLArray<ShaderValue> | null
{
    // 嵌套结构体：不具备标量类型信息
    if (isStructType(member))
    {
        return null;
    }

    // Array 实例
    if (member instanceof TSLArray)
    {
        return member;
    }

    // 构造函数（如 vec4、mat4）
    if (typeof member === 'function')
    {
        try
        {
            const instance = (member as () => ShaderValue)();

            return instance ?? null;
        }
        catch
        {
            return null;
        }
    }

    // ShaderValue 实例
    return member as ShaderValue;
}

/**
 * 结构体定义
 */
export class StructDefinition<T extends StructMembers>
{
    readonly name: string;
    readonly members: T;

    constructor(name: string, members: T)
    {
        this.name = name;
        this.members = members;
    }

    /**
     * 生成 GLSL 纯结构体声明（用于嵌套结构体）
     */
    toGLSLStruct(): string
    {
        const memberLines = Object.entries(this.members).map(([name, type]) =>
        {
            // 检查是否是嵌套结构体
            if (isStructConstructor(type))
            {
                return `    ${type._definition.name} ${name};`;
            }

            // 解析成员实例以获取类型信息（支持构造函数形式如 vec4/mat4）
            const instance = resolveMemberInstance(type);
            if (instance instanceof TSLArray)
            {
                return `    ${instance.glslType} ${name}[${instance.length}];`;
            }
            if (instance)
            {
                return `    ${(instance as ShaderValue).glslType} ${name};`;
            }

            return `    ${name};`;
        });

        return `struct ${this.name}\n{\n${memberLines.join('\n')}\n};`;
    }

    /**
     * 生成 GLSL 结构体声明（用于 UBO）
     */
    toGLSLBlock(instanceName: string): string
    {
        const memberLines = Object.entries(this.members).map(([name, type]) =>
        {
            // 检查是否是嵌套结构体
            if (isStructConstructor(type))
            {
                return `    ${type._definition.name} ${name};`;
            }

            // 解析成员实例以获取类型信息（支持构造函数形式如 vec4/mat4）
            const instance = resolveMemberInstance(type);
            if (instance instanceof TSLArray)
            {
                return `    ${instance.glslType} ${name}[${instance.length}];`;
            }
            if (instance)
            {
                return `    ${(instance as ShaderValue).glslType} ${name};`;
            }

            return `    ${name};`;
        });

        return `layout(std140, column_major) uniform;\nuniform ${this.name}\n{\n${memberLines.join('\n')}\n} ${instanceName};`;
    }

    /**
     * 生成 WGSL 结构体声明
     */
    toWGSLStruct(): string
    {
        const memberLines = Object.entries(this.members).map(([name, type]) =>
        {
            // 检查是否是嵌套结构体
            if (isStructConstructor(type))
            {
                return `    ${name}: ${type._definition.name}`;
            }

            // 解析成员实例以获取类型信息（支持构造函数形式如 vec4/mat4）
            const instance = resolveMemberInstance(type);
            if (instance instanceof TSLArray)
            {
                return `    ${name}: array<${instance.wgslType}, ${instance.length}>`;
            }
            if (instance)
            {
                return `    ${name}: ${(instance as ShaderValue).wgslType}`;
            }

            return `    ${name}`;
        });

        return `struct ${this.name}\n{\n${memberLines.join(',\n')}\n}`;
    }

    /**
     * 生成 WGSL uniform 声明
     */
    toWGSLUniform(instanceName: string, group: number, binding: number): string
    {
        return `@group(${group}) @binding(${binding}) var<uniform> ${instanceName}: ${this.name};`;
    }

    /**
     * 获取所有嵌套的结构体定义（用于生成完整的声明）
     */
    getNestedStructDefinitions(): StructDefinition<StructMembers>[]
    {
        const nested: StructDefinition<StructMembers>[] = [];
        for (const type of Object.values(this.members))
        {
            if (isStructConstructor(type))
            {
                // 递归获取嵌套结构体的嵌套结构体
                nested.push(...type._definition.getNestedStructDefinitions());
                nested.push(type._definition);
            }
            else if (type instanceof TSLArray && type._elementStructCtor)
            {
                // 数组成员：元素是结构体时，也要把该结构体的定义带上
                // （如 LightsUniform.u_pointLights: array<PointLightData, 8>）
                const elementDef = type._elementStructCtor._definition;
                nested.push(...elementDef.getNestedStructDefinitions());
                nested.push(elementDef);
            }
        }

        return nested;
    }
}

/**
 * 结构体实例类 - 包含所有成员的访问
 */
/** 结构体实例的元数据部分（与成员访问器分离，便于用映射类型精确描述成员） */
export interface StructBase<T extends StructMembers>
{
    readonly _uniform: Uniform;
    readonly _structDef: StructDefinition<T>;
}

/**
 * 结构体实例：元数据 + 各成员访问器。
 *
 * 成员类型由 {@link ResolveMembers} 精确推导（`Transform.u_modelMatrix` 是 `Mat4` 而不是宽联合），
 * 这样 `transform.u_modelMatrix.multiply(...)` 之类的调用才有类型。
 */
export type Struct<T extends StructMembers> = StructBase<T> & ResolveMembers<T>;

/** {@link Struct} 的运行时实现（成员动态挂载，构造后断言为该类型） */
class StructImpl<T extends StructMembers> implements StructBase<T>
{
    readonly _uniform: Uniform;
    readonly _structDef: StructDefinition<T>;

    [key: string]: unknown;

    constructor(uniformVar: Uniform, definition: StructDefinition<T>, parentPath?: string)
    {
        this._uniform = uniformVar;
        this._structDef = definition;

        const instanceName = parentPath ?? uniformVar.name;

        // 为每个成员创建访问器
        for (const [memberName, memberType] of Object.entries(definition.members))
        {
            // 直接是 Array 实例（array(mat4(), 2) 返回的）
            if (memberType instanceof TSLArray)
            {
                // 创建数组副本并设置访问路径（调用工厂函数获取元素类型实例）
                const arrayInstance = memberType._clone();
                arrayInstance._setAccessPath(instanceName, instanceName, memberName);
                arrayInstance.dependencies = [uniformVar];
                // 结构体元素数组需要父 uniform 才能构造元素实例
                arrayInstance._setParentUniform(uniformVar);
                if (memberType._elementStructCtor)
                {
                    const elementDef = memberType._elementStructCtor._definition;
                    // 元素实例以"数组访问路径 + 下标"为父路径（如 lights.u_pointLights[0]）
                    arrayInstance._setStructElementFactory((path: string) =>
                        new StructImpl(uniformVar, elementDef, path) as unknown as never);
                }
                this[memberName] = arrayInstance;
                continue;
            }

            // 检查是否是嵌套结构体（struct 返回的对象）
            if (isStructType(memberType))
            {
                // 嵌套结构体：递归创建成员访问器
                const nestedPath = `${instanceName}.${memberName}`;
                const nestedStruct = new StructImpl(uniformVar, memberType._definition, nestedPath) as unknown as Struct<StructMembers>;
                this[memberName] = nestedStruct;
                continue;
            }

            // 成员可能是类型构造函数（如 vec4、mat4）或 ShaderValue 实例
            // 统一通过构造函数创建实例
            const ctor = typeof memberType === 'function'
                ? (memberType as unknown as new () => ShaderValue)
                : ((memberType as ShaderValue).constructor as new () => ShaderValue);
            const instance = new ctor();
            instance.toGLSL = () => `${instanceName}.${memberName}`;
            instance.toWGSL = () => `${instanceName}.${memberName}`;
            instance.dependencies = [uniformVar];
            this[memberName] = instance;
        }

        // 仅在顶层结构体时设置 uniform 的 value
        if (!parentPath)
        {
            uniformVar.value = {
                glslType: definition.name,
                wgslType: definition.name,
                toGLSL: () => instanceName,
                toWGSL: () => instanceName,
                dependencies: [],
                _isStruct: true,
                _structDef: definition,
                _instanceName: instanceName,
            } as ShaderValue & StructValueMeta;
        }
    }
}

/**
 * 创建结构体定义
 *
 * 返回一个可调用的结构体构造函数：
 * - 调用 `StructCtor(uniform)` 创建关联到指定 uniform 的结构体实例
 * - 该函数也携带结构体定义信息，可作为嵌套结构体的成员或用于类型判断
 *
 * 成员定义支持以下形式：
 * - 类型构造函数：如 `vec4`、`mat4`、`float`
 * - 数组实例：如 `array(vec4, 4)`
 * - 嵌套结构体构造函数：由 `struct()` 返回的对象
 *
 * @param name 结构体名称
 * @param members 成员定义
 * @returns 结构体构造函数（可调用，携带类型定义）
 */
export function struct<T extends StructMembers>(name: string, members: T): StructType<T>
{
    const definition = new StructDefinition(name, members);

    // 创建可调用的结构体构造函数
    const structCtor = ((uniformVar: Uniform) =>
    {
        return new StructImpl(uniformVar, definition) as unknown as Struct<T>;
    }) as StructType<T>;

    // 携带结构体类型标记和定义，使其可作为嵌套结构体成员并支持 isStructType 判断
    Object.defineProperty(structCtor, STRUCT_TYPE_MARKER, { value: true, enumerable: false });
    structCtor._definition = definition;

    return structCtor;
}
