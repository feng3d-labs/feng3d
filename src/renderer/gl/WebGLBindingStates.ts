import { AttributeBuffer } from '../data/AttributeBuffer';
import { ElementBuffer } from '../data/ElementBuffer';
import { WebGLRenderer } from '../WebGLRenderer';
import { WebGLRenderAtomic } from './WebGLRenderAtomic';

export class WebGLBindingStates
{
    private currentState: BindingState;
    private defaultState: BindingState;
    private bindingStates = new WeakMap<WebGLRenderAtomic, BindingState>();

    private _webGLRenderer: WebGLRenderer;
    constructor(webGLRenderer: WebGLRenderer)
    {
        this._webGLRenderer = webGLRenderer;

        //
        this.defaultState = this.createBindingState(null);
        this.currentState = this.defaultState;
    }

    setup(renderAtomic: WebGLRenderAtomic)
    {
        const { elementBuffers: indexedBufferRenderer, capabilities } = this._webGLRenderer;

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

            const index = renderAtomic.index;
            indexedBufferRenderer.bindBuffer(index);
        }
    }

    /**
     * 判断是否需要更新。
     *
     * @param renderAtomic 渲染原子。
     * @returns 是否需要更新。
     */
    private needsUpdate(renderAtomic: WebGLRenderAtomic)
    {
        const { currentState } = this;
        const { shaders } = this._webGLRenderer;

        const cachedAttributes = currentState.attributes;

        const shaderResult = shaders.activeShader(renderAtomic);
        const attributeInfos = shaderResult.attributes;

        let attributesNum = 0;

        for (const name in attributeInfos)
        {
            const attributeInfo = attributeInfos[name];

            if (attributeInfo.location >= 0)
            {
                const cachedAttribute = cachedAttributes[name];
                const attribute = renderAtomic.attributes[name];

                if (cachedAttribute === undefined) return true;

                if (cachedAttribute.attribute !== attribute) return true;

                if (cachedAttribute.version !== attribute.version) return true;

                attributesNum++;
            }
        }

        if (currentState.attributesNum !== attributesNum) return true;

        const index = renderAtomic.index;
        if (currentState.index !== index) return true;

        return false;
    }

    /**
     * 保存缓存。
     *
     * @param renderAtomic 渲染原子。
     */
    private saveCache(renderAtomic: WebGLRenderAtomic)
    {
        const { shaders } = this._webGLRenderer;
        const { currentState } = this;

        const cache: { [key: string]: { version: number, attribute: AttributeBuffer } } = {};
        let attributesNum = 0;

        const shaderResult = shaders.activeShader(renderAtomic);
        const attributeInfos = shaderResult.attributes;

        for (const name in attributeInfos)
        {
            const programAttribute = attributeInfos[name];

            if (programAttribute.location >= 0)
            {
                const attribute = renderAtomic.attributes[name];

                const data: { version: number, attribute: AttributeBuffer } = {} as any;
                data.attribute = attribute;
                data.version = attribute.version;

                cache[name] = data;

                attributesNum++;
            }
        }

        currentState.attributes = cache;
        currentState.attributesNum = attributesNum;

        const index = renderAtomic.index;
        currentState.index = index;
    }

    /**
     * 设置顶点属性。
     *
     * @param renderAtomic 渲染原子。
     */
    private setupVertexAttributes(renderAtomic: WebGLRenderAtomic)
    {
        const { attributeBuffers, shaders } = this._webGLRenderer;

        this.initAttributes();

        const shaderResult = shaders.activeShader(renderAtomic);

        for (const name in shaderResult.attributes)
        {
            const activeInfo = shaderResult.attributes[name];
            const location = activeInfo.location;
            // 处理 WebGL 内置属性 gl_VertexID 等
            if (location < 0)
            {
                continue;
            }

            const attribute = renderAtomic.attributes[name];

            this.enableAttribute(location, attribute.divisor);

            attributeBuffers.update(attribute);

            attributeBuffers.vertexAttribPointer(location, attribute);
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
        const { webGLContext } = this._webGLRenderer;
        webGLContext.bindVertexArray(vao);
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
        const { webGLContext } = this._webGLRenderer;
        const { currentState } = this;
        divisor = ~~divisor;

        //
        const newAttributes = currentState.newAttributes;
        const enabledAttributes = currentState.enabledAttributes;
        const attributeDivisors = currentState.attributeDivisors;

        newAttributes[location] = 1;

        if (enabledAttributes[location] === 0)
        {
            webGLContext.enableVertexAttribArray(location);
            enabledAttributes[location] = 1;
        }

        if (attributeDivisors[location] !== divisor)
        {
            webGLContext.vertexAttribDivisor(location, divisor);
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
        const { webGLContext } = this._webGLRenderer;
        const { currentState } = this;

        const newAttributes = currentState.newAttributes;
        const enabledAttributes = currentState.enabledAttributes;

        for (let i = 0, il = enabledAttributes.length; i < il; i++)
        {
            if (enabledAttributes[i] !== newAttributes[i])
            {
                webGLContext.disableVertexAttribArray(i);
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
    private getBindingState(renderAtomic: WebGLRenderAtomic)
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
        const { webGLContext } = this._webGLRenderer;

        return webGLContext.createVertexArray();
    }

    /**
     * 创建绑定状态。
     *
     * @param vao WebGL顶点数组对象。
     * @returns 绑定状态。
     */
    private createBindingState(vao: WebGLVertexArrayObject)
    {
        const { webGLContext } = this._webGLRenderer;
        const maxVertexAttributes = webGLContext.getParameter('MAX_VERTEX_ATTRIBS');
        const bindingState = new BindingState(vao, maxVertexAttributes);

        return bindingState;
    }
}

/**
 * 绑定状态
 */
class BindingState
{
    renderAtomic: WebGLRenderAtomic;

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
