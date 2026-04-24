import { getClassName } from './getClassName';
import { Serializable } from './Serializable';

import { assert, describe, it } from 'vitest';

/**
 * 使用 @Serializable() 进行注册的类
 */
@Serializable('RegisteredClass' as any)
class RegisteredClass
{

}

@Serializable('别名' as any)
class RegisteredClass别名
{

}

describe('getClassName', () =>
{
    it('getClassName 自定义类', () =>
    {
        let className: string;

        className = getClassName(RegisteredClass);
        assert.equal(className, 'RegisteredClass');
        className = getClassName(new RegisteredClass());
        assert.equal(className, 'RegisteredClass');

        className = getClassName(RegisteredClass别名);
        assert.equal(className, '别名');
        className = getClassName(new RegisteredClass别名());
        assert.equal(className, '别名');
    });
});
