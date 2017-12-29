namespace feng3d
{
    export class ClassUtilsTest
    {
        constructor()
        {

            this.init();
        }

        init()
        {
            this.testGetQualifiedClassName();
        }

        testGetQualifiedClassName()
        {

            var className = ClassUtils.getQualifiedClassName(Event);
            assert(className == "feng3d.Event");

            var className = ClassUtils.getQualifiedClassName(true);
            assert(className == "Boolean");

            var className = ClassUtils.getQualifiedClassName(Boolean);
            assert(className == "Boolean");

            var className = ClassUtils.getQualifiedClassName("1");
            assert(className == "String");

            var className = ClassUtils.getQualifiedClassName(String);
            assert(className == "String");

            var className = ClassUtils.getQualifiedClassName(123);
            assert(className == "Number");

            var className = ClassUtils.getQualifiedClassName(Number);
            assert(className == "Number");
        }
    }

    export class SuperClassTest { }
    export class ChildClassTest extends SuperClassTest { }
}