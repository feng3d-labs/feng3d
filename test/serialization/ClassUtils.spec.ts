import { equal } from 'assert';
import { classUtils, decoratorRegisterClass } from '../../src/serialization/ClassUtils';

describe('ClassUtils', () =>
{
    it('getQualifiedClassName 自定义类', () =>
    {
        /**
         * 未使用 @decoratorRegisterClass() 进行注册的类
         */
        class UnregisteredClass
        {

        }

        /**
         * 使用 @decoratorRegisterClass() 进行注册的类
         */
        @decoratorRegisterClass()
        class RegisteredClass
        {

        }

        @decoratorRegisterClass('别名')
        class RegisteredClass别名
        {

        }

        let className: string;

        className = classUtils.getQualifiedClassName(UnregisteredClass);
        equal(className, null); // UnregisteredClass 未注册返回 null

        className = classUtils.getQualifiedClassName(RegisteredClass);
        equal(className, 'RegisteredClass');

        className = classUtils.getQualifiedClassName(RegisteredClass别名);
        equal(className, '别名');
    });
});
