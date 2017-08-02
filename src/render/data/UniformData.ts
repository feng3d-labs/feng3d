namespace feng3d
{
    export class UniformData extends RenderElement
    {
        name: string;
        data: any
        constructor(name: string, data: any)
        {
            super();
            this.name = name;
            this.data = data;
        }
    }

    export class RenderInstanceCount extends RenderElement
    {
        name = "instanceCount";
        data: number | (() => number);
        constructor()
        {
            super();
        }
    }
}