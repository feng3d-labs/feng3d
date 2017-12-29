namespace feng3d
{
    export class UnitTest
    {
        constructor()
        {
            log(`执行单元测试`);
            var start = Date.now();
            this.test();
            log(`通过单元测试，耗时${(Date.now() - start) / 1000}s`);
        }

        test()
        {
            this.testClass([
                ArrayListTest,
                ClassUtilsTest,
                EulerTest,
                SerializationTest,
            ]);
        }

        testClass<T extends (new (...param) => {})>(cls: T | T[])
        {
            if (cls instanceof Array)
            {
                for (var i = 0; i < cls.length; i++)
                {
                    this.testClass(cls[i]);
                }
                return;
            }
            var classname = cls["name"];
            log(`执行 ${classname} 测试`);
            var start = Date.now();
            new cls();
            log(`${classname} 测试通过，耗时${(Date.now() - start) / 1000}s`);
        }
    }
}