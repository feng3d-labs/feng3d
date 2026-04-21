import { reactive } from '@feng3d/reactivity';
import { BindingResources, Buffer, PassEncoder, RenderObject, RenderPass, RenderPassDescriptor, Submit, Texture } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { GUI } from 'dat.gui';
import { Mat4, mat4, quat, vec3 } from 'wgpu-matrix';

import { convertGLBToJSONAndBinary, GLTFSkin } from './glbUtils';
import gltfWGSL from './gltf.wgsl';
import gridWGSL from './grid.wgsl';
import { gridIndices } from './gridData';
import { createSkinnedGridBuffers, createSkinnedGridRenderPipeline } from './gridUtils';

const init = async (canvas: HTMLCanvasElement, gui: GUI) =>
{
    const MAT4X4_BYTES = 64;

    interface BoneObject
    {
        transforms: Mat4[];
        bindPoses: Mat4[];
        bindPosesInv: Mat4[];
    }

    enum RenderMode
    {
        NORMAL,
        JOINTS,
        WEIGHTS,
    }

    enum SkinMode
    {
        ON,
        OFF,
    }

    /*
    // Copied from toji/gl-matrix
    const getRotation = (mat: Mat4): Quat => {
      // Initialize our output quaternion
      const out = [0, 0, 0, 0];
      // Extract the scaling factor from the final matrix transformation
      // to normalize our rotation;
      const scaling = mat4.getScaling(mat);
      const is1 = 1 / scaling[0];
      const is2 = 1 / scaling[1];
      const is3 = 1 / scaling[2];

      // Scale the matrix elements by the scaling factors
      const sm11 = mat[0] * is1;
      const sm12 = mat[1] * is2;
      const sm13 = mat[2] * is3;
      const sm21 = mat[4] * is1;
      const sm22 = mat[5] * is2;
      const sm23 = mat[6] * is3;
      const sm31 = mat[8] * is1;
      const sm32 = mat[9] * is2;
      const sm33 = mat[10] * is3;

      // The trace of a square matrix is the sum of its diagonal entries
      // While the matrix trace has many interesting mathematical properties,
      // the primary purpose of the trace is to assess the characteristics of the rotation.
      const trace = sm11 + sm22 + sm33;
      let S = 0;

      // If all matrix elements contribute equally to the rotation.
      if (trace > 0) {
        S = Math.sqrt(trace + 1.0) * 2;
        out[3] = 0.25 * S;
        out[0] = (sm23 - sm32) / S;
        out[1] = (sm31 - sm13) / S;
        out[2] = (sm12 - sm21) / S;
        // If the rotation is primarily around the x-axis
      } else if (sm11 > sm22 && sm11 > sm33) {
        S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
        out[3] = (sm23 - sm32) / S;
        out[0] = 0.25 * S;
        out[1] = (sm12 + sm21) / S;
        out[2] = (sm31 + sm13) / S;
        // If rotation is primarily around the y-axis
      } else if (sm22 > sm33) {
        S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
        out[3] = (sm31 - sm13) / S;
        out[0] = (sm12 + sm21) / S;
        out[1] = 0.25 * S;
        out[2] = (sm23 + sm32) / S;
        // If the rotation is primarily around the z-axis
      } else {
        S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
        out[3] = (sm12 - sm21) / S;
        out[0] = (sm31 + sm13) / S;
        out[1] = (sm23 + sm32) / S;
        out[2] = 0.25 * S;
      }

      return out;
    };
    */

    // Normal setup
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    const settings = {
        cameraX: 0,
        cameraY: -5.1,
        cameraZ: -14.6,
        objectScale: 1,
        angle: 0.2,
        speed: 50,
        object: 'Whale',
        renderMode: 'NORMAL',
        skinMode: 'ON',
    };

    // Determine whether we want to render our whale or our skinned grid
    gui.add(settings, 'object', ['Whale', 'Skinned Grid']).onChange(() =>
    {
        if (settings.object === 'Skinned Grid')
        {
            settings.cameraX = -10;
            settings.cameraY = 0;
            settings.objectScale = 1.27;
        }
        else
        {
            if (settings.skinMode === 'OFF')
            {
                settings.cameraX = 0;
                settings.cameraY = 0;
                settings.cameraZ = -11;
            }
            else
            {
                settings.cameraX = 0;
                settings.cameraY = -5.1;
                settings.cameraZ = -14.6;
            }
        }
    });

    // Output the mesh normals, its joints, or the weights that influence the movement of the joints
    gui
        .add(settings, 'renderMode', ['NORMAL', 'JOINTS', 'WEIGHTS'])
        .onChange(() =>
        {
            const buffer = Buffer.getBuffer(generalUniformsBuffer.buffer);
            const writeBuffers = buffer.writeBuffers || [];

            writeBuffers.push({
                data: new Uint32Array([RenderMode[settings.renderMode]]),
            });

            reactive(buffer).writeBuffers = writeBuffers;
        });
    // Determine whether the mesh is static or whether skinning is activated
    gui.add(settings, 'skinMode', ['ON', 'OFF']).onChange(() =>
    {
        if (settings.object === 'Whale')
        {
            if (settings.skinMode === 'OFF')
            {
                settings.cameraX = 0;
                settings.cameraY = 0;
                settings.cameraZ = -11;
            }
            else
            {
                settings.cameraX = 0;
                settings.cameraY = -5.1;
                settings.cameraZ = -14.6;
            }
        }
        const buffer = Buffer.getBuffer(generalUniformsBuffer.buffer);
        const writeBuffers = buffer.writeBuffers || [];

        writeBuffers.push({
            bufferOffset: 4,
            data: new Uint32Array([SkinMode[settings.skinMode]]),
        });
        reactive(buffer).writeBuffers = writeBuffers;
    });
    const animFolder = gui.addFolder('Animation Settings');

    animFolder.add(settings, 'angle', 0.05, 0.5).step(0.05);
    animFolder.add(settings, 'speed', 10, 100).step(10);

    const depthTexture: Texture = {
        descriptor: {
            size: [canvas.width, canvas.height],
            format: 'depth24plus',
        },
    };

    const cameraBuffer = new Float32Array(48);

    const cameraBGCluster: BindingResources = {
        camera_uniforms: {
            bufferView: cameraBuffer,
        },
    };

    const generalUniformsBuffer = new Uint32Array(2);

    const generalUniformsBGCLuster: BindingResources = {
        general_uniforms: {
            bufferView: generalUniformsBuffer,
        },
    };

    // Fetch whale resources from the glb file
    const whaleScene = await fetch('../../../assets/gltf/whale.glb')
        .then((res) => res.arrayBuffer())
        .then((buffer) => convertGLBToJSONAndBinary(buffer));

    // Builds a render pipeline for our whale mesh
    // Since we are building a lightweight gltf parser around a gltf scene with a known
    // quantity of meshes, we only build a renderPipeline for the singular mesh present
    // within our scene. A more robust gltf parser would loop through all the meshes,
    // cache replicated pipelines, and perform other optimizations.
    whaleScene.meshes[0].buildRenderPipeline(
        gltfWGSL,
        gltfWGSL,
    );

    // Create skinned grid resources
    const skinnedGridVertexBuffers = createSkinnedGridBuffers();
    // Buffer for our uniforms, joints, and inverse bind matrices
    const skinnedGridJointUniformBuffer = new Uint8Array(MAT4X4_BYTES * 5);
    const skinnedGridInverseBindUniformBuffer = new Uint8Array(MAT4X4_BYTES * 5);
    const skinnedGridBoneBGCluster: BindingResources = {
        joint_matrices: { bufferView: skinnedGridJointUniformBuffer },
        inverse_bind_matrices: { bufferView: skinnedGridInverseBindUniformBuffer },
    };

    const skinnedGridPipeline = createSkinnedGridRenderPipeline(
        gridWGSL,
        gridWGSL,
    );

    // Global Calc
    const aspect = canvas.width / canvas.height;
    const perspectiveProjection = mat4.perspective(
        (2 * Math.PI) / 5,
        aspect,
        0.1,
        100.0,
    );

    const orthographicProjection = mat4.ortho(-20, 20, -10, 10, -100, 100);

    function getProjectionMatrix()
    {
        if (settings.object !== 'Skinned Grid')
        {
            return perspectiveProjection;
        }

        return orthographicProjection;
    }

    function getViewMatrix()
    {
        const viewMatrix = mat4.identity();

        if (settings.object === 'Skinned Grid')
        {
            mat4.translate(
                viewMatrix,
                vec3.fromValues(
                    settings.cameraX * settings.objectScale,
                    settings.cameraY * settings.objectScale,
                    settings.cameraZ,
                ),
                viewMatrix,
            );
        }
        else
        {
            mat4.translate(
                viewMatrix,
                vec3.fromValues(settings.cameraX, settings.cameraY, settings.cameraZ),
                viewMatrix,
            );
        }

        return viewMatrix;
    }

    function getModelMatrix()
    {
        const modelMatrix = mat4.identity();
        const scaleVector = vec3.fromValues(
            settings.objectScale,
            settings.objectScale,
            settings.objectScale,
        );

        mat4.scale(modelMatrix, scaleVector, modelMatrix);
        if (settings.object === 'Whale')
        {
            mat4.rotateY(modelMatrix, (Date.now() / 1000) * 0.5, modelMatrix);
        }

        return modelMatrix;
    }

    // Pass Descriptor for GLTFs
    const gltfRenderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } }, // Assigned later

                clearValue: [0.3, 0.3, 0.3, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
        depthStencilAttachment: {
            view: { texture: depthTexture },
            depthLoadOp: 'clear',
            depthClearValue: 1.0,
            depthStoreOp: 'store',
        },
    };

    // Pass descriptor for grid with no depth testing
    const skinnedGridRenderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } }, // Assigned later

                clearValue: [0.3, 0.3, 0.3, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
    };

    const animSkinnedGrid = (boneTransforms: Mat4[], angle: number) =>
    {
        const m = mat4.identity();

        mat4.rotateZ(m, angle, boneTransforms[0]);
        mat4.translate(boneTransforms[0], vec3.create(4, 0, 0), m);
        mat4.rotateZ(m, angle, boneTransforms[1]);
        mat4.translate(boneTransforms[1], vec3.create(4, 0, 0), m);
        mat4.rotateZ(m, angle, boneTransforms[2]);
    };

    // Create a group of bones
    // Each index associates an actual bone to its transforms, bindPoses, uniforms, etc
    const createBoneCollection = (numBones: number): BoneObject =>
    {
        // Initial bone transformation
        const transforms: Mat4[] = [];
        // Bone bind poses, an extra matrix per joint/bone that represents the starting point
        // of the bone before any transformations are applied
        const bindPoses: Mat4[] = [];

        // Create a transform, bind pose, and inverse bind pose for each bone
        for (let i = 0; i < numBones; i++)
        {
            transforms.push(mat4.identity());
            bindPoses.push(mat4.identity());
        }

        // Get initial bind pose positions
        animSkinnedGrid(bindPoses, 0);
        const bindPosesInv = bindPoses.map((bindPose) =>
            mat4.inverse(bindPose));

        return {
            transforms,
            bindPoses,
            bindPosesInv,
        };
    };

    // Create bones of the skinned grid and write the inverse bind positions to
    // the skinned grid's inverse bind matrix array
    const buffer = Buffer.getBuffer(skinnedGridInverseBindUniformBuffer.buffer);
    const writeBuffers = buffer.writeBuffers || [];
    const gridBoneCollection = createBoneCollection(5);

    for (let i = 0; i < gridBoneCollection.bindPosesInv.length; i++)
    {
        writeBuffers.push({
            bufferOffset: i * 64,
            data: gridBoneCollection.bindPosesInv[i],
        });
    }
    reactive(buffer).writeBuffers = writeBuffers;

    // A map that maps a joint index to the original matrix transformation of a bone
    const origMatrices = new Map<number, Mat4>();
    const animWhaleSkin = (skin: GLTFSkin, angle: number) =>
    {
        for (let i = 0; i < skin.joints.length; i++)
        {
            // Index into the current joint
            const joint = skin.joints[i];

            // If our map does
            if (!origMatrices.has(joint))
            {
                origMatrices.set(joint, whaleScene.nodes[joint].source.getMatrix());
            }
            // Get the original position, rotation, and scale of the current joint
            const origMatrix = origMatrices.get(joint);
            let m = mat4.create();

            // Depending on which bone we are accessing, apply a specific rotation to the bone's original
            // transformation to animate it
            if (joint === 1 || joint === 0)
            {
                m = mat4.rotateY(origMatrix, -angle);
            }
            else if (joint === 3 || joint === 4)
            {
                m = mat4.rotateX(origMatrix, joint === 3 ? angle : -angle);
            }
            else
            {
                m = mat4.rotateZ(origMatrix, angle);
            }
            // Apply the current transformation to the transform values within the relevant nodes
            // (these nodes, of course, each being nodes that represent joints/bones)
            whaleScene.nodes[joint].source.position = mat4.getTranslation(m);
            whaleScene.nodes[joint].source.scale = mat4.getScaling(m);
            whaleScene.nodes[joint].source.rotation = quat.fromMat(m);
        }
    };

    const passEncoders: PassEncoder[] = [];
    const submit: Submit = { commandEncoders: [{ passEncoders }] };

    const whaleRenderPass = (() =>
    {
        const renderObjects: RenderObject[] = [];
        const bindingResources: BindingResources = {
            ...cameraBGCluster,
            ...generalUniformsBGCLuster,
        };

        for (const scene of whaleScene.scenes)
        {
            scene.root.renderDrawables(renderObjects, bindingResources);
        }
        const passEncoder: RenderPass = {
            descriptor: gltfRenderPassDescriptor,
            renderPassObjects: renderObjects,
        };

        return passEncoder;
    })();
    const skinnedGridRenderPass = (() =>
    {
        // Our skinned grid isn't checking for depth, so we pass it
        // a separate render descriptor that does not take in a depth texture
        // Pass in vertex and index buffers generated from our static skinned grid
        // data at ./gridData.ts
        const renderObject: RenderObject = {
            pipeline: skinnedGridPipeline,
            bindingResources: {
                ...cameraBGCluster,
                ...generalUniformsBGCLuster,
                ...skinnedGridBoneBGCluster,
            },
            vertices: skinnedGridVertexBuffers.vertices,
            indices: skinnedGridVertexBuffers.indices,
            draw: { __type__: 'DrawIndexed', indexCount: gridIndices.length },
        };
        //
        const passEncoder: RenderPass = {
            descriptor: gltfRenderPassDescriptor,
            renderPassObjects: [renderObject],
        };

        return passEncoder;
    })();

    function frame()
    {
        // Calculate camera matrices
        const projectionMatrix = getProjectionMatrix();
        const viewMatrix = getViewMatrix();
        const modelMatrix = getModelMatrix();

        // Calculate bone transformation
        const t = (Date.now() / 20000) * settings.speed;
        const angle = Math.sin(t) * settings.angle;

        // Compute Transforms when angle is applied
        animSkinnedGrid(gridBoneCollection.transforms, angle);

        // Write to mvp to camera buffer
        const buffer = Buffer.getBuffer(cameraBuffer.buffer);
        const writeBuffers = buffer.writeBuffers || [];

        writeBuffers.push({
            bufferOffset: 0,
            data: projectionMatrix,
        });
        writeBuffers.push({
            bufferOffset: 64,
            data: viewMatrix,
        });
        writeBuffers.push({
            bufferOffset: 128,
            data: modelMatrix,
        });
        reactive(buffer).writeBuffers = writeBuffers;

        // Write to skinned grid bone uniform buffer
        const buffer0 = Buffer.getBuffer(skinnedGridJointUniformBuffer.buffer);
        const writeBuffers0 = buffer0.writeBuffers || [];

        for (let i = 0; i < gridBoneCollection.transforms.length; i++)
        {
            writeBuffers0.push({
                bufferOffset: i * 64,
                data: gridBoneCollection.transforms[i],
            });
        }
        reactive(buffer0).writeBuffers = writeBuffers0;

        // Update node matrixes
        for (const scene of whaleScene.scenes)
        {
            scene.root.updateWorldMatrix();
        }

        // Updates skins (we index into skins in the renderer, which is not the best approach but hey)
        animWhaleSkin(whaleScene.skins[0], Math.sin(t) * settings.angle);
        // Node 6 should be the only node with a drawable mesh so hopefully this works fine
        whaleScene.skins[0].update(6, whaleScene.nodes);

        passEncoders.length = 0;
        if (settings.object === 'Whale')
        {
            passEncoders.push(whaleRenderPass);
        }
        else
        {
            passEncoders.push(skinnedGridRenderPass);
        }

        webgpu.submit(submit);

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
};

const panel = new GUI({ width: 310 });
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas, panel);
