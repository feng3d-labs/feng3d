import { Array as TSLArray } from './array';
import { IElement, ShaderValue } from '../core/IElement';
import { Uniform } from './uniform';

/**
 * 结构体成员类型（支持 Array 实例、ShaderValue 实例和嵌套结构体）
 */
export type StructMemberType = TSLArray<any> | ShaderValue | StructType<any>;

/**
 * 结构体成员定义
 */
export type StructMembers = Record<string, StructMemberType>;

/**
 * 将成员类型映射为其实际类型
 * 对于嵌套结构体，递归解析其成员类型
 */
export type ResolveMembers<T extends StructMembers> = {
    [K in keyof T]: T[K] extends StructConstructor<infer U>
    ? ResolveMembers<U>
    : T[K] extends TSLArray<infer E>
    ? TSLArray<E>
    : T[K];
};

/**
 * 结构体类型标记
 */
const STRUCT_TYPE_MARKER = Symbol('structType');

/**
 * 结构体类型定义（由 struct() 返回）
 */
export interface StructType<T extends StructMembers>
{
    [STRUCT_TYPE_MARKER]: true;
    _definition: StructDefinition<T>;
}

/**
 * 判断是否为结构体类型
 */
export function isStructType(obj: unknown): obj is StructType<any>
{
    return typeof obj === 'object' && obj !== null && (obj as any)[STRUCT_TYPE_MARKER] === true;
}

// 保留旧的名称作为别名，以便向后兼容
export const isStructConstructor = isStructType;
export type StructConstructor<T extends StructMembers> = StructType<T>;

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

            // 检查是否是 Array 实例
            if (type instanceof TSLArray)
            {
                return `    ${type.glslType} ${name}[${type.length}];`;
            }

            // 普通成员（ShaderValue 实例）
            return `    ${(type as any).glslType} ${name};`;
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

            // 检查是否是 Array 实例
            if (type instanceof TSLArray)
            {
                return `    ${type.glslType} ${name}[${type.length}];`;
            }

            // 普通成员（ShaderValue 实例）
            return `    ${(type as any).glslType} ${name};`;
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

            // 检查是否是 Array 实例
            if (type instanceof TSLArray)
            {
                return `    ${name}: array<${type.wgslType}, ${type.length}>`;
            }

            // 普通成员（ShaderValue 实例）
            return `    ${name}: ${(type as any).wgslType}`;
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
    getNestedStructDefinitions(): StructDefinition<any>[]
    {
        const nested: StructDefinition<any>[] = [];
        for (const type of Object.values(this.members))
        {
            if (isStructConstructor(type))
            {
                // 递归获取嵌套结构体的嵌套结构体
                nested.push(...type._definition.getNestedStructDefinitions());
                nested.push(type._definition);
            }
        }

        return nested;
    }
}

/**
 * 结构体实例类 - 包含所有成员的访问
 */
export class Struct<T extends StructMembers>
{
    readonly _uniform: Uniform;
    readonly _structDef: StructDefinition<T>;

    // 动态成员通过索引签名访问
    [key: string]: any;

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
                const arrayInstance = new TSLArray(memberType.elementType(), memberType.length);
                arrayInstance._setAccessPath(instanceName, instanceName, memberName);
                arrayInstance.dependencies = [uniformVar];
                this[memberName] = arrayInstance;
                continue;
            }

            // 检查是否是嵌套结构体（struct 返回的对象）
            if (isStructType(memberType))
            {
                // 嵌套结构体：递归创建成员访问器
                const nestedPath = `${instanceName}.${memberName}`;
                const nestedStruct = new Struct(uniformVar, memberType._definition, nestedPath);
                this[memberName] = nestedStruct;
                continue;
            }

            // 普通成员（ShaderValue 实例，如 mat4()、vec3()）
            const instance = new ((memberType as any).constructor as new () => ShaderValue)();
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
            } as any;
        }
    }

    /**
     * 创建简单的 ShaderValue 成员
     */
    private _createMemberValue(instanceName: string, memberName: string, memberType: { glslType: string; wgslType: string }): ShaderValue
    {
        return {
            glslType: memberType.glslType,
            wgslType: memberType.wgslType,
            dependencies: [] as IElement[],
            toGLSL: () => `${instanceName}.${memberName}`,
            toWGSL: () => `${instanceName}.${memberName}`,
        };
    }
}

/**
 * 创建结构体定义
 * @param name 结构体名称
 * @param members 成员定义
 * @returns 结构体类型定义（可作为 uniform 的类型参数或嵌套结构体的成员）
 */
export function struct<T extends StructMembers>(name: string, members: T): T & StructType<T>
{
    const definition = new StructDefinition(name, members);

    // 创建结构体类型对象
    const structType = {
        ...members,
        [STRUCT_TYPE_MARKER]: true as const,
        _definition: definition,
    };

    return structType as T & StructType<T>;
}
