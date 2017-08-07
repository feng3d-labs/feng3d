namespace feng3d
{
    export class ObjectBase
    {
        @serialize
        public id = 1;
    }

    export class C extends ObjectBase
    {
        // @serialize()
        // id = 2;

        @serialize
        a = 1;

        @serialize
        c = 1;

        change()
        {
            console.log("change", this.a, arguments);
        }
    }

    export class SerializationTest
    {
        constructor()
        {
            var base = new ObjectBase();
            base.id = Math.random();
            var resultb = serialization.serialize(base);
            var base1 = new ObjectBase();
            serialization.deserialize(base1);
            console.assert(base.id == base1.id);


            var c = new C();
            c.id = Math.random();
            c.a = Math.random();
            c.c = Math.random();
            var result = serialization.serialize(c);
            var c1 = new C();
            serialization.deserialize(c1);
            console.assert(c.id == c1.id);
            console.assert(c.a == c1.a);
            console.assert(c.c == c1.c);
        }
    }

}