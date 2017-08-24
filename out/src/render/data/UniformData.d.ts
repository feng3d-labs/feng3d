declare namespace feng3d {
    class UniformData extends RenderElement {
        name: string;
        data: any;
        constructor(name: string, data: any);
    }
    class RenderInstanceCount extends RenderElement {
        name: string;
        data: number | (() => number);
        constructor();
    }
}
