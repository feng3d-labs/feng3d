import { lazy } from '@feng3d/polyfill';
import { WebGLRenderer } from '../WebGLRenderer';
import { WebGLUniformType } from '../const/WebGLUniformType';
import { WebGLRenderAtomic } from './WebGLRenderAtomic';

/**
 * WebGL统一变量
 */
export interface WebGLUniform
{
    /**
     * WebGL激活信息。
     */
    activeInfo: WebGLActiveInfo;

    /**
     * WebGL中Uniform类型
     */
    type: WebGLUniformType;

    /**
     * uniform地址
     */
    location: WebGLUniformLocation;

    /**
     * texture索引
     */
    textureID: number;

    /**
     * Uniform数组索引，当Uniform数据为数组数据时生效
     */
    paths: string[];
}

/**
 * WebGL统一变量
 */
export class WebGLUniforms
{
    /**
     * 激活常量
     */
    activeUniforms(webGLRenderer: WebGLRenderer, renderAtomic: WebGLRenderAtomic, uniformInfos: { [name: string]: WebGLUniform })
    {
        for (const name in uniformInfos)
        {
            const activeInfo = uniformInfos[name];
            const paths = activeInfo.paths;
            let uniformData = lazy.getValue(renderAtomic.uniforms[paths[0]], renderAtomic.uniforms);
            for (let i = 1; i < paths.length; i++)
            {
                uniformData = uniformData[paths[i]];
            }
            if (uniformData === undefined)
            {
                console.error(`沒有找到Uniform ${name} 數據！`);
            }
            this.setContext3DUniform(webGLRenderer, activeInfo, uniformData);
        }
    }

    /**
     * 设置环境Uniform数据
     */
    private setContext3DUniform(webGLRenderer: WebGLRenderer, webGLUniform: WebGLUniform, data)
    {
        const { textures, webGLContext } = webGLRenderer;

        let vec: number[] = data;
        if (data.toArray) vec = data.toArray();
        const location = webGLUniform.location;
        switch (webGLUniform.type)
        {
            case 'BOOL':
            case 'INT':
                webGLContext.uniform1i(location, data);
                break;
            case 'FLOAT_MAT3':
                webGLContext.uniformMatrix3fv(location, false, vec);
                break;
            case 'FLOAT_MAT4':
                webGLContext.uniformMatrix4fv(location, false, vec);
                break;
            case 'FLOAT':
                webGLContext.uniform1f(location, data);
                break;
            case 'FLOAT_VEC2':
                webGLContext.uniform2f(location, vec[0], vec[1]);
                break;
            case 'FLOAT_VEC3':
                webGLContext.uniform3f(location, vec[0], vec[1], vec[2]);
                break;
            case 'FLOAT_VEC4':
                webGLContext.uniform4f(location, vec[0], vec[1], vec[2], vec[3]);
                break;
            case 'SAMPLER_2D':
            case 'SAMPLER_CUBE':
                textures.active(data, webGLUniform);
                break;
            default:
                console.error(`无法识别的uniform类型 ${webGLUniform.activeInfo.name} ${data}`);
        }
    }
}
