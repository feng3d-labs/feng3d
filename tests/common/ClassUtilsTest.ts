module feng3d
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
            this.testGetQualifiedSuperclassName();
        }

        testGetQualifiedClassName()
        {

            var className = ClassUtils.getQualifiedClassName(Event);
            console.assert(className == "feng3d.Event");

            var className = ClassUtils.getQualifiedClassName(true);
            console.assert(className == "Boolean");

            var className = ClassUtils.getQualifiedClassName(Boolean);
            console.assert(className == "Boolean");

            var className = ClassUtils.getQualifiedClassName("1");
            console.assert(className == "String");

            var className = ClassUtils.getQualifiedClassName(String);
            console.assert(className == "String");

            var className = ClassUtils.getQualifiedClassName(123);
            console.assert(className == "Number");

            var className = ClassUtils.getQualifiedClassName(Number);
            console.assert(className == "Number");
        }

        testGetQualifiedSuperclassName()
        {
            var className = ClassUtils.getQualifiedSuperclassName(new ChildClassTest());
            console.assert(className == "feng3d.SuperClassTest");

            var className = ClassUtils.getQualifiedSuperclassName(ChildClassTest);
            console.assert(className == "feng3d.SuperClassTest");
        }
    }

    export class SuperClassTest { }
    export class ChildClassTest extends SuperClassTest { }
}