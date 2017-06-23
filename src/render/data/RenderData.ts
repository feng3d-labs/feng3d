namespace feng3d
{
    export class RenderData extends EventDispatcher
    {
        private _elementMap = {};

        public get elements()
        {
            return this._elements.concat();
        }

        private _elements: RenderElement[] = [];

        public createIndexBuffer(indices: Uint16Array)
        {
            var renderData: IndexRenderData = this._elementMap["index"];
            if (!renderData)
            {
                this._elementMap["index"] = renderData = new IndexRenderData();
                this.addRenderElement(renderData);
            }
            renderData.indices = indices;
            return renderData;
        }

        public createUniformData<K extends keyof UniformRenderData>(name: K, data: UniformRenderData[K])
        {
            var renderData: UniformData = this._elementMap[<any>name];
            if (!renderData)
            {
                this._elementMap[<any>name] = renderData = new UniformData(name, data);
                this.addRenderElement(renderData);
            }
            renderData.data = data;
            return renderData;
        }

        public createAttributeRenderData<K extends keyof AttributeRenderDataStuct>(name: K, data: Float32Array = null, size: number = 3, divisor: number = 0)
        {
            var renderData: AttributeRenderData = this._elementMap[<any>name];
            if (!renderData)
            {
                this._elementMap[<any>name] = renderData = new AttributeRenderData(name, data, size, divisor);
                this.addRenderElement(renderData);
            }
            renderData.data = data;
            renderData.size = size;
            renderData.divisor = divisor;
            return renderData;
        }

        public createShaderCode(code: { vertexCode: string, fragmentCode: string } | (() => { vertexCode: string, fragmentCode: string }))
        {
            var renderData: ShaderCode = this._elementMap["shader"];
            if (!renderData)
            {
                this._elementMap["shader"] = renderData = new ShaderCode(code);
                this.addRenderElement(renderData);
            }
            renderData.code = code;
            return renderData;
        }

        public createValueMacro<K extends keyof ValueMacros>(name: K, value: number | (() => number)): ValueMacro
        {
            var renderData: ValueMacro = this._elementMap[<any>name];
            if (!renderData)
            {
                this._elementMap[<any>name] = renderData = new ValueMacro(name, value);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        }

        public createBoolMacro<K extends keyof BoolMacros>(name: K, value: boolean | (() => boolean)): BoolMacro
        {
            var renderData: BoolMacro = this._elementMap[<any>name];
            if (!renderData)
            {
                this._elementMap[<any>name] = renderData = new BoolMacro(name, value);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        }

        public createAddMacro<K extends keyof IAddMacros>(name: K, value: number): AddMacro
        {
            var renderData: AddMacro = this._elementMap[<any>name];
            if (!renderData)
            {
                this._elementMap[<any>name] = renderData = new AddMacro(name, value);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        }

        public createInstanceCount(value: number | (() => number))
        {
            var renderData: RenderInstanceCount = this._elementMap["instanceCount"];
            if (!renderData)
            {
                this._elementMap["instanceCount"] = renderData = new RenderInstanceCount();
                this.addRenderElement(renderData);
            }
            renderData.data = value;
            return renderData;
        }

        public createShaderParam<K extends keyof ShaderParams>(name: K, value: ShaderParams[K])
        {
            var renderData: ShaderParam = this._elementMap[<any>name];
            if (!renderData)
            {
                this._elementMap["instanceCount"] = renderData = new ShaderParam(name);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        }

        public addRenderElement(element: RenderElement | RenderElement[])
        {
            if (element instanceof RenderElement)
            {
                this._elements.push(element);
                this.dispatchEvent(new Event(Object3DRenderAtomic.ADD_RENDERELEMENT, element));
            } else
            {
                for (var i = 0; i < element.length; i++)
                {
                    this.addRenderElement(element[i]);
                }
            }
        }

        public removeRenderElement(element: RenderElement | RenderElement[])
        {
            if (element instanceof RenderElement)
            {
                var index = this._elements.indexOf(element);
                if (index != -1)
                {
                    this._elements.splice(i, 1);
                    this.dispatchEvent(new Event(Object3DRenderAtomic.REMOVE_RENDERELEMENT, element));
                }
            } else
            {
                for (var i = 0; i < element.length; i++)
                {
                    this.removeRenderElement(element[i]);
                }
            }
        }
    }
}