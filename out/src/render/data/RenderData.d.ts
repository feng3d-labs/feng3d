declare namespace feng3d {
    class RenderData extends Event {
        private _elementMap;
        readonly elements: RenderElement[];
        private _elements;
        createIndexBuffer(indices: Uint16Array): IndexRenderData;
        createUniformData<K extends keyof UniformRenderData>(name: K, data: UniformRenderData[K]): UniformData;
        createAttributeRenderData<K extends keyof AttributeRenderDataStuct>(name: K, data?: Float32Array, size?: number, divisor?: number): AttributeRenderData;
        createShaderCode(code: {
            vertexCode: string;
            fragmentCode: string;
        } | (() => {
            vertexCode: string;
            fragmentCode: string;
        })): ShaderCode;
        createValueMacro<K extends keyof ValueMacros>(name: K, value: number | (() => number)): ValueMacro;
        createBoolMacro<K extends keyof BoolMacros>(name: K, value: boolean | (() => boolean)): BoolMacro;
        createAddMacro<K extends keyof IAddMacros>(name: K, value: number): AddMacro;
        createInstanceCount(value: number | (() => number)): RenderInstanceCount;
        createShaderParam<K extends keyof ShaderParams>(name: K, value: ShaderParams[K]): ShaderParam;
        addRenderElement(element: RenderElement | RenderElement[]): void;
        removeRenderElement(element: RenderElement | RenderElement[]): void;
    }
}
