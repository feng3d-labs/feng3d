/* eslint-disable no-new */
import { lazy } from '@feng3d/polyfill';
import { Attribute } from './data/Attribute';
import { RenderAtomic, RenderAtomicData } from './data/RenderAtomic';
import { AttributeInfo, UniformInfo } from './data/Shader';
import { Texture } from './data/Texture';
import { Uniforms } from './data/Uniform';
import { GL } from './gl/GL';
import { GLCache } from './gl/GLCache';
import { GLCapabilities } from './gl/GLCapabilities';
import { GLExtension } from './gl/GLExtension';

/**
 * WEBGL 渲染器
 *
 * 所有渲染都由该渲染器执行
 */
export class WebGLRenderer
{
    static glList: GL[] = [];

    gl: GL;
    private preActiveAttributes: number[] = [];

    constructor(canvas: HTMLCanvasElement, contextAttributes?: WebGLContextAttributes)
    {
        const contextIds = ['webgl2', 'webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl'];
        // var contextIds = ["webgl"];
        let gl: GL = <any>null;
        for (let i = 0; i < contextIds.length; ++i)
        {
            try
            {
                gl = <any>canvas.getContext(contextIds[i], contextAttributes);
                gl.contextId = contextIds[i];
                gl.contextAttributes = contextAttributes;
                break;
            }
            // eslint-disable-next-line no-empty
            catch (e) { }
        }
        if (!gl)
        { throw '无法初始化WEBGL'; }
        this.gl = gl;
        //
        new GLCache(gl);
        new GLExtension(gl);
        new GLCapabilities(gl);
        //
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        gl.clearDepth(1.0); // Clear everything
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Near things obscure far things
        WebGLRenderer.glList.push(gl);

        console.assert(!gl.render, `${gl} ${gl.render} 存在！`);
    }

    render(renderAtomic: RenderAtomic)
    {
        const instanceCount = renderAtomic.getInstanceCount();
        if (instanceCount === 0) return;
        const shaderMacro = renderAtomic.getShaderMacro();
        const shader = renderAtomic.getShader();
        shader.shaderMacro = shaderMacro;
        const shaderResult = shader.activeShaderProgram(this.gl);
        if (!shaderResult) return;
        //
        const checkedRenderAtomic: RenderAtomicData = this.checkRenderData(renderAtomic);
        if (!checkedRenderAtomic) return;
        //
        this.gl.useProgram(shaderResult.program);
        checkedRenderAtomic.renderParams.updateRenderParams(this.gl);
        this.activeAttributes(checkedRenderAtomic, shaderResult.attributes);
        this.activeUniforms(checkedRenderAtomic, shaderResult.uniforms);
        this.draw(checkedRenderAtomic, this.gl[checkedRenderAtomic.renderParams.renderMode]);
    }

    private checkRenderData(renderAtomic: RenderAtomic)
    {
        const shader = renderAtomic.getShader();
        const shaderResult = shader.activeShaderProgram(this.gl);
        if (!shaderResult)
        {
            console.warn(`缺少着色器，无法渲染!`);

            return null;
        }

        const attributes: { [name: string]: Attribute; } = {};
        for (const key in shaderResult.attributes)
        {
            const attribute = renderAtomic.getAttributeByKey(key);
            if (!attribute)
            {
                console.warn(`缺少顶点 attribute 数据 ${key} ，无法渲染!`);

                return null;
            }
            attributes[key] = attribute;
        }

        const uniforms: { [name: string]: Uniforms; } = {};
        for (let key in shaderResult.uniforms)
        {
            const activeInfo = shaderResult.uniforms[key];
            if (activeInfo.name)
            {
                key = activeInfo.name;
            }
            const uniform = renderAtomic.getUniformByKey(key);
            if (uniform === undefined)
            {
                console.warn(`缺少 uniform 数据 ${key} ,无法渲染！`);

                return null;
            }
            uniforms[key] = uniform;
        }

        const indexBuffer = renderAtomic.getIndexBuffer();

        const checkedRenderAtomic: RenderAtomicData
            = {
            shader,
            attributes,
            uniforms,
            renderParams: renderAtomic.getRenderParams(),
            index: indexBuffer,
            instanceCount: renderAtomic.getInstanceCount(),
        };

        return checkedRenderAtomic;
    }

    /**
     * 激活属性
     */
    private activeAttributes(renderAtomic: RenderAtomicData, attributeInfos: { [name: string]: AttributeInfo })
    {
        const gl = this.gl;

        const activeAttributes: number[] = [];
        for (const name in attributeInfos)
        {
            const activeInfo = attributeInfos[name];
            const buffer: Attribute = renderAtomic.attributes[name];
            buffer.active(gl, activeInfo.location);
            activeAttributes.push(activeInfo.location);

            const index = this.preActiveAttributes.indexOf(activeInfo.location);
            if (index !== -1)
            {
                this.preActiveAttributes.splice(index, 1);
            }
        }
        this.preActiveAttributes.forEach((location) =>
        {
            gl.disableVertexAttribArray(location);
        });
        this.preActiveAttributes = activeAttributes;
    }

    /**
     * 激活常量
     */
    private activeUniforms(renderAtomic: RenderAtomicData, uniformInfos: { [name: string]: UniformInfo })
    {
        const uniforms = renderAtomic.uniforms;
        for (const name in uniformInfos)
        {
            const activeInfo = uniformInfos[name];
            const paths = activeInfo.paths;
            let uniformData = uniforms[paths[0]];
            for (let i = 1; i < paths.length; i++)
            {
                uniformData = uniformData[paths[i]];
            }
            this.setContext3DUniform(activeInfo, uniformData);
        }
    }

    /**
     * 设置环境Uniform数据
     */
    private setContext3DUniform(activeInfo: UniformInfo, data)
    {
        const gl = this.gl;

        let vec: number[] = data;
        if (data.toArray) vec = data.toArray();
        const location = activeInfo.location;
        switch (activeInfo.type)
        {
            case gl.INT:
                gl.uniform1i(location, data);
                break;
            case gl.FLOAT_MAT3:
                gl.uniformMatrix3fv(location, false, vec);
                break;
            case gl.FLOAT_MAT4:
                gl.uniformMatrix4fv(location, false, vec);
                break;
            case gl.FLOAT:
                gl.uniform1f(location, data);
                break;
            case gl.FLOAT_VEC2:
                gl.uniform2f(location, vec[0], vec[1]);
                break;
            case gl.FLOAT_VEC3:
                gl.uniform3f(location, vec[0], vec[1], vec[2]);
                break;
            case gl.FLOAT_VEC4:
                gl.uniform4f(location, vec[0], vec[1], vec[2], vec[3]);
                break;
            case gl.SAMPLER_2D:
            case gl.SAMPLER_CUBE:
                const textureInfo = data as Texture;
                // 激活纹理编号
                gl.activeTexture(gl[`TEXTURE${activeInfo.textureID}`]);
                Texture.active(gl, textureInfo);
                // 设置纹理所在采样编号
                gl.uniform1i(location, activeInfo.textureID);
                break;
            default:
                console.error(`无法识别的uniform类型 ${activeInfo.name} ${data}`);
        }
    }

    /**
     */
    private draw(renderAtomic: RenderAtomicData, renderMode: number)
    {
        const gl = this.gl;

        const instanceCount = ~~lazy.getvalue(renderAtomic.instanceCount);

        const indexBuffer = renderAtomic.index;
        if (indexBuffer)
        {
            indexBuffer.active(gl);
            const arrayType = gl[indexBuffer.type];
            if (indexBuffer.count === 0)
            {
                // console.warn(`顶点索引为0，不进行渲染！`);
                return;
            }
            if (instanceCount > 1)
            {
                gl.drawElementsInstanced(renderMode, indexBuffer.count, arrayType, indexBuffer.offset, instanceCount);
            }
            else
            {
                gl.drawElements(renderMode, indexBuffer.count, arrayType, indexBuffer.offset);
            }
        }
        else
        {
            const vertexNum = ((attributes) =>
            {
                for (const attr in attributes)
                {
                    // eslint-disable-next-line no-prototype-builtins
                    if (attributes.hasOwnProperty(attr))
                    {
                        const attribute: Attribute = attributes[attr];

                        return attribute.data.length / attribute.size;
                    }
                }

                return 0;
            })(renderAtomic.attributes);
            if (vertexNum === 0)
            {
                console.warn(`顶点数量为0，不进行渲染！`);

                return;
            }
            if (instanceCount > 1)
            {
                gl.drawArraysInstanced(renderMode, 0, vertexNum, instanceCount);
            }
            else
            {
                gl.drawArrays(renderMode, 0, vertexNum);
            }
        }
    }
}
