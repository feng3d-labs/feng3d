declare namespace feng3d {
    class UnitTest {
        constructor();
        test(): void;
        testClass<T extends (new (...param) => {})>(cls: T | T[]): void;
    }
}
