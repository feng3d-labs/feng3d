import { lazy } from '@feng3d/polyfill';
import { watcher } from '@feng3d/watcher';
import { DrawElementTypes, ElementBuffer, ElementBufferSourceTypes } from '../data/ElementBuffer';
import { RenderAtomic } from '../data/RenderAtomic';
import { WebGLRenderer } from '../WebGLRenderer';
import { AttributeUsage } from './WebGLEnums';

export class WebGLElementBuffers
{
    private webGLRenderer: WebGLRenderer;
    private buffers = new WeakMap<ElementBuffer, WebGLElementBuffer>();

    constructor(webGLRenderer: WebGLRenderer)
    {
        this.webGLRenderer = webGLRenderer;
    }

    render(renderAtomic: RenderAtomic, offset: number, count: number)
    {
        const { gl, extensions, info, capabilities, attributeBuffers: attributes } = this.webGLRenderer;

        let instanceCount = ~~lazy.getValue(renderAtomic.getInstanceCount());
        const mode = gl[renderAtomic.getRenderParams().renderMode];

        const element = renderAtomic.getIndexBuffer();

        let type: number;
        let bytesPerElement: number;
        let vertexNum: number;

        if (element)
        {
            const elementCache = this.get(element);
            type = gl[elementCache.type];
            bytesPerElement = elementCache.bytesPerElement;
            vertexNum = elementCache.count;
        }
        else
        {
            vertexNum = renderAtomic.getAttributeVertexNum(attributes);

            if (vertexNum === 0)
            {
                // console.warn(`顶点数量为0，不进行渲染！`);

                // return;
                vertexNum = 6;
            }
        }

        if (offset === undefined)
        {
            offset = 0;
        }

        if (count === undefined)
        {
            count = vertexNum - offset;
        }

        if (instanceCount > 1)
        {
            if (capabilities.isWebGL2)
            {
                if (element)
                {
                    (gl as WebGL2RenderingContext).drawElementsInstanced(mode, count, type, offset * bytesPerElement, instanceCount);
                }
                else
                {
                    (gl as WebGL2RenderingContext).drawArraysInstanced(mode, offset, count, instanceCount);
                }
            }
            else
            {
                const extension = extensions.get('ANGLE_instanced_arrays');

                if (extension === null)
                {
                    console.error('hardware does not support extension ANGLE_instanced_arrays.');

                    return;
                }
                if (element)
                {
                    extension.drawElementsInstancedANGLE(mode, count, type, offset * bytesPerElement, instanceCount);
                }
                else
                {
                    extension.drawArraysInstancedANGLE(mode, offset, count, instanceCount);
                }
            }
        }
        else
        {
            if (element)
            {
                gl.drawElements(mode, count, type, offset * bytesPerElement);
            }
            else
            {
                gl.drawArrays(mode, offset, count);
            }
            instanceCount = 1;
        }

        info.update(count, mode, instanceCount);
    }

    bindBuffer(element: ElementBuffer)
    {
        const { gl } = this.webGLRenderer;

        if (element)
        {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.get(element).buffer);
        }
    }

    get(element: ElementBuffer)
    {
        const { gl } = this.webGLRenderer;
        const buffers = this.buffers;

        let data = buffers.get(element);

        if (data === undefined)
        {
            data = new WebGLElementBuffer(gl, element);
            buffers.set(element, data);
        }

        data.updateBuffer();

        return data;
    }

    remove(element: ElementBuffer)
    {
        const { buffers } = this;

        const data = buffers.get(element);

        if (data)
        {
            data.dispose();

            buffers.delete(element);
        }
    }
}

/**
 * WebGL元素数组缓冲，用于处理每个 ElementBuffer 向WebGL上传数据。
 */
class WebGLElementBuffer
{
    gl: WebGLRenderingContext;
    //
    element: ElementBuffer;
    buffer: WebGLBuffer;

    /**
     * 元素数据类型
     */
    type: DrawElementTypes;

    /**
     * 每个元素占用字符数量
     */
    bytesPerElement: number;

    /**
     * 元素数组长度
     */
    count: number;

    version = -1;

    constructor(gl: WebGLRenderingContext, element: ElementBuffer)
    {
        this.gl = gl;
        this.element = element;

        //
        watcher.watch(element, 'array', this.needsUpdate, this);
    }

    private needsUpdate()
    {
        this.element.version += ~~this.element.version;
    }

    updateBuffer()
    {
        const { gl, element } = this;

        if (this.version === element.version)
        {
            return;
        }
        this.version = element.version;

        // 删除过时的缓冲
        let buffer = this.buffer;
        if (buffer)
        {
            gl.deleteBuffer(buffer);
        }

        //
        const { type, array } = transfromArrayType(element.array, element.type);
        const usage: AttributeUsage = element.usage || 'STATIC_DRAW';

        buffer = gl.createBuffer();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, gl[usage]);

        this.type = type;
        this.count = array.length;
        this.bytesPerElement = array.BYTES_PER_ELEMENT;
        this.buffer = buffer;
    }

    dispose()
    {
        const { gl, buffer, element } = this;

        gl.deleteBuffer(buffer);

        watcher.watch(element, 'array', this.needsUpdate, this);

        this.gl = null;
        this.element = null;
        this.buffer = null;
    }
}

function transfromArrayType(array: ElementBufferSourceTypes, type?: DrawElementTypes)
{
    // 处理 type
    if (type === undefined)
    {
        if (array instanceof Uint8Array)
        {
            type = 'UNSIGNED_BYTE';
        }
        else if (array instanceof Uint16Array)
        {
            type = 'UNSIGNED_SHORT';
        }
        else if (array instanceof Uint32Array)
        {
            type = 'UNSIGNED_INT';
        }
        else
        {
            type = 'UNSIGNED_SHORT';
        }
    }

    // 处理数组
    if (Array.isArray(array))
    {
        if (type === 'UNSIGNED_BYTE')
        {
            array = new Uint8Array(array);
        }
        else if (type === 'UNSIGNED_INT')
        {
            array = new Uint32Array(array);
        }
        else if (type === 'UNSIGNED_SHORT')
        {
            array = new Uint16Array(array);
        }
        else
        {
            throw `未知元素缓冲数据类型 ${type}`;
        }
    }

    // 处理数据类型不匹配情况
    if (type === 'UNSIGNED_BYTE')
    {
        if (!(array instanceof Uint8Array))
        {
            array = new Uint8Array(array);
        }
    }
    else if (type === 'UNSIGNED_SHORT')
    {
        if (!(array instanceof Uint16Array))
        {
            array = new Uint16Array(array);
        }
    }
    else if (type === 'UNSIGNED_INT')
    {
        if (!(array instanceof Uint32Array))
        {
            array = new Uint32Array(array);
        }
    }
    else
    {
        throw `未知元素缓冲数据类型 ${type}`;
    }

    return { array, type };
}
