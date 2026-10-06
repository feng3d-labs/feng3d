import { getCurrentForStatement } from '../../core/forStack';
import { getCurrentFunc } from '../../core/currentFunc';
import { getCurrentIfStatement } from '../../core/ifStack';
import { IStatement } from '../../core/Statement';
import { IVec2 } from '../../types/vector/ivec2';
import { Uvec2 } from '../../types/vector/uvec2';
import { Vec4 } from '../../types/vector/vec4';
import { StorageTexture2D } from './storageTexture2D';
import { StorageTexture3D } from './storageTexture3D';
import { Uvec3 } from '../../types/vector/uvec3';

/**
 * 写入存储纹理：`textureStore(<tex>, <coord>, <value>)`
 *
 * 与 discard() 同类，是一条**语句**（挂到当前最近的语句容器）。
 *
 * @param texture 存储纹理
 * @param coord 坐标（ivec2 / uvec2）
 * @param value 写入值（vec4）
 */
export function textureStore(texture: StorageTexture2D, coord: IVec2 | Uvec2, value: Vec4): void;
export function textureStore(texture: StorageTexture3D, coord: Uvec3, value: Vec4): void;
export function textureStore(texture: StorageTexture2D | StorageTexture3D, coord: IVec2 | Uvec2 | Uvec3, value: Vec4): void
{
    const statement: IStatement = {
        toGLSL: () => `imageStore(${texture.name}, ${coord.toGLSL()}, ${value.toGLSL()});`,
        toWGSL: () => `textureStore(${texture.name}, ${coord.toWGSL()}, ${value.toWGSL()});`,
    };

    const currentFor = getCurrentForStatement();
    const currentIf = getCurrentIfStatement();
    const currentFunc = getCurrentFunc();

    if (currentFor) currentFor.addStatement(statement);
    else if (currentIf) currentIf.addStatement(statement);
    else if (currentFunc) currentFunc.statements.push(statement);

    // 坐标与写入值、纹理本身都要作为依赖被收集（否则缺声明 / 缺依赖）
    if (currentFunc)
    {
        currentFunc.dependencies.push(texture, coord, value);
    }
}
