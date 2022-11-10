import { AttributeBuffer } from '../data/AttributeBuffer';
import { ElementBuffer } from '../data/ElementBuffer';
import { RenderAtomic } from '../data/RenderAtomic';
import { WebGLAttributeBuffers } from './WebGLAttributeBuffers';
import { WebGLCapabilities } from './WebGLCapabilities';
import { WebGLElementBuffers } from './WebGLElementBuffers';
import { WebGLExtensions } from './WebGLExtensions';
import { WebGLShaders } from './WebGLShaders';

export class WebGLBindingStates
{
    private gl: WebGLRenderingContext;
    private extensions: WebGLExtensions;
    private attributes: WebGLAttributeBuffers;
    private elementBuffers: WebGLElementBuffers;
    private capabilities: WebGLCapabilities;
    private shaders: WebGLShaders;

    private currentState: BindingState;
    private defaultState: BindingState;
    private bindingStates = new WeakMap<RenderAtomic, BindingState>();

    constructor(gl: WebGLRenderingContext, extensions: WebGLExtensions, attributes: WebGLAttributeBuffers, elementBuffers: WebGLElementBuffers, capabilities: WebGLCapabilities, shaders: WebGLShaders)
    {
        this.gl = gl;
        this.extensions = extensions;
        this.attributes = attributes;
        this.elementBuffers = elementBuffers;
        this.capabilities = capabilities;
        this.shaders = shaders;

        this.defaultState = this.createBindingState(null);
        this.currentState = this.defaultState;
    }

    setup(renderAtomic: RenderAtomic)
    {
        const { elementBuffers: indexedBufferRenderer, capabilities } = this;

        let updateBuffers = false;

        if (capabilities.vaoAvailable)
        {
            const state = this.getBindingState(renderAtomic);
            if (this.currentState !== state)
            {
                this.currentState = state;
                this.bindVertexArrayObject(this.currentState.vao);
            }
            updateBuffers = this.needsUpdate(renderAtomic);

            if (updateBuffers) this.saveCache(renderAtomic);
        }
        else if (this.currentState.renderAtomic !== renderAtomic)
        {
            this.currentState.renderAtomic = renderAtomic;

            updateBuffers = true;
        }

        if (updateBuffers)
        {
            this.setupVertexAttributes(renderAtomic);

            const index = renderAtomic.getIndexBuffer();
            indexedBufferRenderer.bindBuffer(index);
        }
    }

    /**
     * 判断是否需要更新。
     *
     * @param renderAtomic 渲染原子。
     * @returns 是否需要更新。
     */
    private needsUpdate(renderAtomic: RenderAtomic)
    {
        const { currentState, shaders } = this;

        const cachedAttributes = currentState.attributes;

        const shader = renderAtomic.getShader();
        const shaderResult = shaders.activeShaderProgram(shader);
        const attributeInfos = shaderResult.attributes;

        let attributesNum = 0;

        for (const name in attributeInfos)
        {
            const attributeInfo = attributeInfos[name];

            if (attributeInfo.location >= 0)
            {
                const cachedAttribute = cachedAttributes[name];
                const attribute = renderAtomic.getAttributeByKey(name);

                if (cachedAttribute === undefined) return true;

                if (cachedAttribute.attribute !== attribute) return true;

                if (cachedAttribute.version !== attribute.version) return true;

                attributesNum++;
            }
        }

        if (currentState.attributesNum !== attributesNum) return true;

        const index = renderAtomic.getIndexBuffer();
        if (currentState.index !== index) return true;

        return false;
    }

    /**
     * 保存缓存。
     *
     * @param renderAtomic 渲染原子。
     */
    private saveCache(renderAtomic: RenderAtomic)
    {
        const { currentState, shaders } = this;

        const cache: { [key: string]: { version: number, attribute: AttributeBuffer } } = {};
        let attributesNum = 0;

        const shader = renderAtomic.getShader();
        const shaderResult = shaders.activeShaderProgram(shader);
        const attributeInfos = shaderResult.attributes;

        for (const name in attributeInfos)
        {
            const programAttribute = attributeInfos[name];

            if (programAttribute.location >= 0)
            {
                const attribute = renderAtomic.getAttributeByKey(name);

                const data: { version: number, attribute: AttributeBuffer } = {} as any;
                data.attribute = attribute;
                data.version = attribute.version;

                cache[name] = data;

                attributesNum++;
            }
        }

        currentState.attributes = cache;
        currentState.attributesNum = attributesNum;

        const index = renderAtomic.getIndexBuffer();
        currentState.index = index;
    }

    /**
     * 设置顶点属性。
     *
     * @param renderAtomic 渲染原子。
     */
    private setupVertexAttributes(renderAtomic: RenderAtomic)
    {
        const { attributes, capabilities, extensions, shaders } = this;

        if (capabilities.isWebGL2 === false && renderAtomic.getInstanceCount() > 0)
        {
            if (extensions.get('ANGLE_instanced_arrays') === null) return;
        }

        this.initAttributes();

        const shader = renderAtomic.getShader();
        const shaderResult = shaders.activeShaderProgram(shader);

        for (const name in shaderResult.attributes)
        {
            const activeInfo = shaderResult.attributes[name];
            const location = activeInfo.location;
            // 处理 WebGL 内置属性 gl_VertexID 等
            if (location < 0)
            {
                continue;
            }

            const attribute = renderAtomic.getAttributeByKey(name);

            this.enableAttribute(location, attribute.divisor);

            attributes.update(attribute);

            attributes.vertexAttribPointer(location, attribute);
        }

        this.disableUnusedAttributes();
    }

    /**
     * 绑定顶点数组对象。
     *
     * @param vao 顶点数组对象。
     */
    private bindVertexArrayObject(vao: WebGLVertexArrayObject)
    {
        const { gl, extensions, capabilities } = this;

        if (capabilities.isWebGL2) return (gl as any as WebGL2RenderingContext).bindVertexArray(vao);

        const extension = extensions.get('OES_vertex_array_object');
        extension.bindVertexArrayOES(vao);
    }

    /**
     * 启用属性。
     *
     * @param location 指向要激活的顶点属性。
     * @param divisor drawElementsInstanced时将会用到的因子，表示divisor个geometry共用一个数据。
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enableVertexAttribArray
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribDivisor
     */
    enableAttribute(location: number, divisor?: number)
    {
        const { gl, extensions, capabilities, currentState } = this;
        divisor = ~~divisor;

        //
        const newAttributes = currentState.newAttributes;
        const enabledAttributes = currentState.enabledAttributes;
        const attributeDivisors = currentState.attributeDivisors;

        newAttributes[location] = 1;

        if (enabledAttributes[location] === 0)
        {
            gl.enableVertexAttribArray(location);
            enabledAttributes[location] = 1;
        }

        if (attributeDivisors[location] !== divisor)
        {
            if (capabilities.isWebGL2)
            {
                (gl as WebGL2RenderingContext).vertexAttribDivisor(location, divisor);
            }
            else
            {
                const extension = extensions.get('ANGLE_instanced_arrays');
                extension.vertexAttribDivisorANGLE(location, divisor);
            }
            attributeDivisors[location] = divisor;
        }
    }

    /**
     * 初始化WebGL属性使用情况
     */
    initAttributes()
    {
        const { currentState } = this;

        const newAttributes = currentState.newAttributes;

        for (let i = 0, il = newAttributes.length; i < il; i++)
        {
            newAttributes[i] = 0;
        }
    }

    /**
     * 关闭未使用的WebGL属性。
     */
    disableUnusedAttributes()
    {
        const { gl, currentState } = this;

        const newAttributes = currentState.newAttributes;
        const enabledAttributes = currentState.enabledAttributes;

        for (let i = 0, il = enabledAttributes.length; i < il; i++)
        {
            if (enabledAttributes[i] !== newAttributes[i])
            {
                gl.disableVertexAttribArray(i);
                enabledAttributes[i] = 0;
            }
        }
    }

    /**
     * 获取对应的绑定状态。
     *
     * @param renderAtomic 渲染原子。
     * @returns 对应的绑定状态。
     */
    private getBindingState(renderAtomic: RenderAtomic)
    {
        let bindingState = this.bindingStates.get(renderAtomic);
        if (!bindingState)
        {
            const vao = this.createVertexArrayObject();
            bindingState = this.createBindingState(vao);
            this.bindingStates.set(renderAtomic, bindingState);
        }

        return bindingState;
    }

    /**
     * 创建WebGL顶点数组对象。
     *
     * @returns WebGL顶点数组对象。
     */
    private createVertexArrayObject()
    {
        const { gl, extensions, capabilities } = this;

        if (capabilities.isWebGL2)
        {
            return (gl as any as WebGL2RenderingContext).createVertexArray();
        }

        const extension = extensions.get('OES_vertex_array_object');

        return extension.createVertexArrayOES();
    }

    /**
     * 创建绑定状态。
     *
     * @param vao WebGL顶点数组对象。
     * @returns 绑定状态。
     */
    private createBindingState(vao: WebGLVertexArrayObject)
    {
        const { gl } = this;
        const maxVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        const bindingState = new BindingState(vao, maxVertexAttributes);

        return bindingState;
    }
}

/**
 * 绑定状态
 */
class BindingState
{
    renderAtomic: RenderAtomic;

    /**
     * 最新启用的WebGL属性。
     */
    newAttributes: number[] = [];

    /**
     * 已启用的WebGL属性。
     */
    enabledAttributes: number[] = [];

    /**
     * WebGL属性对应的divisor值。
     */
    attributeDivisors: number[] = [];

    /**
     * WebGL顶点数组对象
     */
    vao: WebGLVertexArrayObject;

    /**
     * WebGL属性缓存信息
     */
    attributes: { [key: string]: { version: number, attribute: AttributeBuffer } } = {};

    /**
     * 顶点索引缓冲
     */
    index: ElementBuffer;

    /**
     * 属性数量。
     */
    attributesNum: number;

    constructor(vao: WebGLVertexArrayObject, maxVertexAttributes: number)
    {
        this.vao = vao;

        for (let i = 0; i < maxVertexAttributes; i++)
        {
            this.newAttributes[i] = 0;
            this.enabledAttributes[i] = 0;
            this.attributeDivisors[i] = 0;
        }
    }
}
