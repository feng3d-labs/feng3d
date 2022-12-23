import { equal } from 'assert';
import { Vector2 } from '../../src/math/geom/Vector2';
import { Vector3 } from '../../src/math/geom/Vector3';
import { classUtils, serializable } from '../../src/serialization/ClassUtils';

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

describe('ClassUtils', () =>
{
    it('getClassName 内置类型', () =>
    {
        const name = classUtils.getClassName(new Vector3())
        // const name = classUtils.getClassName({})
        // const name = classUtils.getClassName(new Vector2())
        name;

        classUtils.getInstance('Vector2')
        classUtils.getInstance('Vector2')
    });

    it('getClassName 自定义类', () =>
    {
        let className: string;

        className = classUtils.getClassName(UnregisteredClass);
        equal(className, null); // UnregisteredClass 未注册返回 null

        className = classUtils.getClassName(RegisteredClass);
        equal(className, 'RegisteredClass');

        className = classUtils.getClassName(RegisteredClass别名);
        equal(className, '别名');
    });
});
