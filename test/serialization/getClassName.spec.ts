import { equal } from 'assert';
import { Vector2 } from '../../src/math/geom/Vector2';
import { Vector3 } from '../../src/math/geom/Vector3';
import { getClassName } from '../../src/serialization/getClassName';
import { getInstance } from '../../src/serialization/getInstance';
import { serializable } from '../../src/serialization/serializable';

declare global
{
    interface MixinsClassMap
    {
        Vector2: Vector2
        '别名': RegisteredClass别名
    }
}

/**
 * 未使用 @serializable() 进行注册的类
 */
class UnregisteredClass
{

}

/**
 * 使用 @serializable() 进行注册的类
 */
@serializable()
class RegisteredClass
{

}

@serializable('别名')
class RegisteredClass别名
{

}

describe('getClassName', () =>
{
    it('getClassName 内置类型', () =>
    {
        const name = getClassName(new Vector3())
        // const name = getClassName({})
        // const name = getClassName(new Vector2())
        name;

        getInstance('Vector2')
        // getInstance('Vector3')
    });

    it('getClassName 自定义类', () =>
    {
        let className: string;

        className = getClassName(UnregisteredClass);
        equal(className, null); // UnregisteredClass 未注册返回 null

        className = getClassName(RegisteredClass);
        equal(className, 'RegisteredClass');

        className = getClassName(RegisteredClass别名);
        equal(className, '别名');
    });
});
