declare namespace feng3d {
    class ObjectBase {
        id: number;
    }
    class C extends ObjectBase {
        a: number;
        c: number;
        change(): void;
    }
    class SerializationTest {
        constructor();
    }
}
