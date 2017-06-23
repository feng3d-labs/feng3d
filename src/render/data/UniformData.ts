namespace feng3d
{
    export class UniformData extends RenderElement
    {
        constructor(public name: string,public  data: any)
        {
            super();
        }
    }

    export class RenderInstanceCount extends RenderElement
    {
        public name = "instanceCount";
        public  data: number|(()=>number);
        constructor()
        {
            super();
        }
    }
}