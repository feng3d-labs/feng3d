import { mat4, quat, vec3 } from 'gl-matrix';

type IVertexDataTypes =
    | Float32Array
    | Uint32Array
    | Int32Array
    | Uint16Array
    | Int16Array | Uint8ClampedArray
    | Uint8Array
    | Int8Array;

type IIndicesDataTypes = Uint16Array | Uint32Array;

// Data classes
class Scene
{
    meshes: Mesh[];

    constructor()
    {
        // not 1-1 to meshes in json file
        // each mesh with a different node hierarchy is a new instance
        this.meshes = [];
        // this.meshes = {};
    }
}

// Node
class Mesh
{
    meshID: string;
    primitives: Primitive[];

    constructor()
    {
        this.meshID = ''; // mesh id name in glTF json meshes
        this.primitives = [];
    }
}

export class Primitive
{
    mode: number;
    indices: IIndicesDataTypes;
    indicesComponentType: number;
    vertexBuffer: IVertexDataTypes;
    matrix: mat4;
    attributes: {
        [key: string]: { size: 1 | 2 | 3 | 4, type?: number, stride: number, offset: number },
    };

    constructor()
    {
        this.mode = 4; // default: gl.TRIANGLES

        this.indices = null;
        this.indicesComponentType = 5123; // default: gl.UNSIGNED_SHORT

        // !!: assume vertex buffer is interleaved
        // see discussion https://github.com/KhronosGroup/glTF/issues/21
        this.vertexBuffer = null;

        this.matrix = mat4.create();

        // attribute info (stride, offset, etc)
        this.attributes = {};
    }
}

export class GlTFModel
{
    defaultScene: string;
    scenes: {};
    json: null;

    constructor()
    {
        this.defaultScene = '';
        this.scenes = {};

        this.json = null;
    }
}

export class GlTFLoader
{
    glTF: GlTFModel;
    _parseDone: boolean;
    _loadDone: boolean;
    _bufferRequested: number;
    _bufferLoaded: number;
    _buffers: {};
    _bufferTasks: {};
    _bufferViews: {};
    _pendingTasks: number;
    _finishedPendingTasks: number;
    onload: (glTF: GlTFModel) => void;
    baseUri: string;

    constructor()
    {
        this._init();
        this.glTF = null;
    }

    _init()
    {
        this._parseDone = false;
        this._loadDone = false;

        this._bufferRequested = 0;
        this._bufferLoaded = 0;
        this._buffers = {};
        this._bufferTasks = {};

        this._bufferViews = {};

        this._pendingTasks = 0;
        this._finishedPendingTasks = 0;

        this.onload = null;
    }

    _getBufferViewData(json, bufferViewID, callback)
    {
        const bufferViewData = this._bufferViews[bufferViewID];
        if (!bufferViewData)
        {
            // load bufferView for the first time
            const bufferView = json.bufferViews[bufferViewID];
            const bufferData = this._buffers[bufferView.buffer];
            if (bufferData)
            {
                // buffer already loaded
                // console.log("dependent buffer ready, create bufferView" + bufferViewID);
                this._bufferViews[bufferViewID] = bufferData.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
                callback(bufferViewData);
            }
            else
            {
                // buffer not yet loaded
                // add pending task to _bufferTasks
                // console.log("pending Task: wait for buffer to load bufferView " + bufferViewID);
                this._pendingTasks++;
                let bufferTask = this._bufferTasks[bufferView.buffer];
                if (!bufferTask)
                {
                    this._bufferTasks[bufferView.buffer] = [];
                    bufferTask = this._bufferTasks[bufferView.buffer];
                }
                const loader = this;
                bufferTask.push(function (newBufferData)
                {
                    // share same bufferView
                    // hierarchy needs to be post processed in the renderer
                    let curBufferViewData = loader._bufferViews[bufferViewID];
                    if (!curBufferViewData)
                    {
                        console.log(`create new BufferView Data for ${bufferViewID}`);
                        curBufferViewData = loader._bufferViews[bufferViewID] = newBufferData.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
                    }
                    loader._finishedPendingTasks++;
                    callback(curBufferViewData);

                    // // create new bufferView for each mesh access with a different hierarchy
                    // // hierarchy transformation will be prepared in this way
                    // console.log('create new BufferView Data for ' + bufferViewID);
                    // loader._bufferViews[bufferViewID] = newBufferData.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
                    // loader._finishedPendingTasks++;
                    // callback(loader._bufferViews[bufferViewID]);
                });
            }
        }
        else
        {
            // no need to load buffer from file
            // use cached ones
            // console.log("use cached bufferView " + bufferViewID);
            callback(bufferViewData);
        }
    }

    _checkComplete()
    {
        if (this._bufferRequested === this._bufferLoaded
        // && other resources finish loading
        )
        {
            this._loadDone = true;
        }

        if (this._loadDone && this._parseDone && this._pendingTasks === this._finishedPendingTasks)
        {
            this.onload(this.glTF);
        }
    }

    _parseGLTF(json)
    {
        this.glTF.json = json;
        this.glTF.defaultScene = json.scene;

        // Iterate through every scene
        for (const sceneID in json.scenes)
        {
            const newScene = new Scene();
            this.glTF.scenes[sceneID] = newScene;

            const scene = json.scenes[sceneID];
            const nodes = scene.nodes;
            const nodeLen = nodes.length;

            // Iterate through every node within scene
            for (let n = 0; n < nodeLen; ++n)
            {
                const nodeName = nodes[n];
                const node = json.nodes[nodeName];

                // Traverse node
                this._parseNode(json, node, newScene);
            }
        }

        this._parseDone = true;
        this._checkComplete();
    }

    _parseNode(json, node, newScene, matrix?)
    {
        if (matrix === undefined)
        {
            matrix = mat4.create();
        }

        const curMatrix = mat4.create();

        if (node.hasOwnProperty('matrix'))
        {
            // matrix
            for (let i = 0; i < 16; ++i)
            {
                curMatrix[i] = node.matrix[i];
            }
            mat4.multiply(curMatrix, matrix, curMatrix);
            // mat4.multiply(curMatrix, curMatrix, matrix);
        }
        else
        {
            // translation, rotation, scale (TRS)
            // TODO: these labels are optional
            vec3.set(translationVec3, node.translation[0], node.translation[1], node.translation[2]);
            quat.set(rotationQuat, node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]);
            mat4.fromRotationTranslation(TRMatrix, rotationQuat, translationVec3);
            mat4.multiply(curMatrix, curMatrix, TRMatrix);
            vec3.set(scaleVec3, node.scale[0], node.scale[1], node.scale[2]);
            mat4.scale(curMatrix, curMatrix, scaleVec3);
        }

        // Iterate through every mesh within node
        const meshes = node.meshes;
        if (meshes)
        {
            const meshLen = meshes.length;
            for (let m = 0; m < meshLen; ++m)
            {
                const newMesh = new Mesh();
                newScene.meshes.push(newMesh);

                const meshName = meshes[m];
                const mesh = json.meshes[meshName];

                newMesh.meshID = meshName;

                // Iterate through primitives
                const primitives = mesh.primitives;
                const primitiveLen = primitives.length;

                for (let p = 0; p < primitiveLen; ++p)
                {
                    const newPrimitive = new Primitive();
                    newMesh.primitives.push(newPrimitive);

                    const primitive = primitives[p];

                    if (primitive.indices)
                    {
                        this._parseIndices(json, primitive, newPrimitive);
                    }

                    this._parseAttributes(json, primitive, newPrimitive, curMatrix);
                }
            }
        }

        // Go through all the children recursively
        const children = node.children;
        const childreLen = children.length;
        for (let c = 0; c < childreLen; ++c)
        {
            const childName = children[c];
            const childNode = json.nodes[childName];
            this._parseNode(json, childNode, newScene, curMatrix);
        }
    }

    _parseIndices(json, primitive, newPrimitive: Primitive)
    {
        const accessorName = primitive.indices;
        const accessor = json.accessors[accessorName];

        newPrimitive.mode = primitive.mode || 4;
        newPrimitive.indicesComponentType = IDrawElementType2Name[accessor.componentType];

        const loader = this;
        this._getBufferViewData(json, accessor.bufferView, function (bufferViewData)
        {
            newPrimitive.indices = _getAccessorData(bufferViewData, accessor) as any;
            loader._checkComplete();
        });
    }

    _parseAttributes(json, primitive, newPrimitive: Primitive, matrix)
    {
        // !! Assume interleaved vertex attributes
        // i.e., all attributes share one bufferView

        // vertex buffer processing
        const firstSemantic = Object.keys(primitive.attributes)[0];
        const firstAccessor = json.accessors[primitive.attributes[firstSemantic]];
        const vertexBufferViewID = firstAccessor.bufferView;
        const bufferView = json.bufferViews[vertexBufferViewID];

        const loader = this;

        this._getBufferViewData(json, vertexBufferViewID, function (bufferViewData)
        {
            const data = newPrimitive.vertexBuffer = _arrayBuffer2TypedArray(
                bufferViewData,
                0,
                bufferView.byteLength / ComponentType2ByteSize[firstAccessor.componentType],
                firstAccessor.componentType,
            );

            for (const attributeName in primitive.attributes)
            {
                const accessorName = primitive.attributes[attributeName];
                const accessor = json.accessors[accessorName];

                const componentTypeByteSize = ComponentType2ByteSize[accessor.componentType];

                const stride = accessor.byteStride / componentTypeByteSize;
                const offset = accessor.byteOffset / componentTypeByteSize;
                const count = accessor.count;

                // // Matrix transformation
                // if (attributeName === 'POSITION') {
                //     for (var i = 0; i < count; ++i) {
                //         // TODO: add vec2 and other(needed?) support
                //         vec4.set(tmpVec4, data[stride * i + offset]
                //                         , data[stride * i + offset + 1]
                //                         , data[stride * i + offset + 2]
                //                         , 1);
                //         vec4.transformMat4(tmpVec4, tmpVec4, matrix);
                //         vec4.scale(tmpVec4, tmpVec4, 1 / tmpVec4[3]);
                //         data[stride * i + offset] = tmpVec4[0];
                //         data[stride * i + offset + 1] = tmpVec4[1];
                //         data[stride * i + offset + 2] = tmpVec4[2];
                //     }
                // }
                // else if (attributeName === 'NORMAL') {
                //     mat4.invert(inverseTransposeMatrix, matrix);
                //     mat4.transpose(inverseTransposeMatrix, inverseTransposeMatrix);

                //     for (var i = 0; i < count; ++i) {
                //         // @todo: add vec2 and other(needed?) support
                //         vec4.set(tmpVec4, data[stride * i + offset]
                //                         , data[stride * i + offset + 1]
                //                         , data[stride * i + offset + 2]
                //                         , 0);
                //         vec4.transformMat4(tmpVec4, tmpVec4, inverseTransposeMatrix);
                //         vec4.normalize(tmpVec4, tmpVec4);
                //         data[stride * i + offset] = tmpVec4[0];
                //         data[stride * i + offset + 1] = tmpVec4[1];
                //         data[stride * i + offset + 2] = tmpVec4[2];
                //     }
                // }

                // local transform matrix

                mat4.copy(newPrimitive.matrix, matrix);

                // for vertexAttribPointer
                newPrimitive.attributes[attributeName] = {
                    // GLuint program location,
                    size: Type2NumOfComponent[accessor.type],
                    type: accessor.componentType,
                    // GLboolean normalized
                    stride: accessor.byteStride,
                    offset: accessor.byteOffset,
                };
            }

            loader._checkComplete();
        });
    }

    /**
     * load a glTF model
     *
     * @param {String} uri uri of the .glTF file. Other resources (bins, images) are assumed to be in the same base path
     * @param {Function} callback the onload callback function
     */
    loadGLTF(uri, callback)
    {
        this._init();

        this.onload = callback || ((glTF) =>
        {
            console.log('glTF model loaded.');
            console.log(glTF);
        });

        this.glTF = new GlTFModel();

        this.baseUri = _getBaseUri(uri);

        const loader = this;

        _loadJSON(uri, function (response)
        {
            // Parse JSON string into object
            const json = JSON.parse(response);

            let b;

            const loadArrayBufferCallback = (resource) =>
            {
                loader._buffers[b] = resource;
                loader._bufferLoaded++;
                if (loader._bufferTasks[b])
                {
                    let i; let len;
                    for (i = 0, len = loader._bufferTasks[b].length; i < len; ++i)
                    {
                        (loader._bufferTasks[b][i])(resource);
                    }
                }
                loader._checkComplete();
            };

            // Launch loading resources: buffers, images, etc.
            if (json.buffers)
            {
                for (b in json.buffers)
                {
                    loader._bufferRequested++;

                    _loadArrayBuffer(`${loader.baseUri}/${json.buffers[b].uri}`, loadArrayBufferCallback);
                }
            }

            // Meanwhile start glTF scene parsing
            loader._parseGLTF(json);
        });
    }
}

const translationVec3 = vec3.create();
const rotationQuat = quat.create();
const scaleVec3 = vec3.create();
const TRMatrix = mat4.create();

// TODO: get from gl context
const ComponentType2ByteSize = {
    5120: 1, // BYTE
    5121: 1, // UNSIGNED_BYTE
    5122: 2, // SHORT
    5123: 2, // UNSIGNED_SHORT
    5126: 4, // FLOAT
};

const Type2NumOfComponent = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16,
};

const IDrawElementType2Name = {
    5121: 'UNSIGNED_BYTE',
    5123: 'UNSIGNED_SHORT',
    5124: 'UNSIGNED_INT',
};

export const Attributes = [
    'POSITION',
    'NORMAL',
    'TEXCOORD',
    'COLOR',
    'JOINT',
    'WEIGHT',
];

// ------ Scope limited private util functions---------------

function _arrayBuffer2TypedArray(resource, byteOffset, countOfComponentType, componentType)
{
    switch (componentType)
    {
        // @todo: finish
        case 5122: return new Int16Array(resource, byteOffset, countOfComponentType);
        case 5123: return new Uint16Array(resource, byteOffset, countOfComponentType);
        case 5126: return new Float32Array(resource, byteOffset, countOfComponentType);
        default: return null;
    }
}

function _getAccessorData(bufferViewData, accessor)
{
    return _arrayBuffer2TypedArray(
        bufferViewData,
        accessor.byteOffset,
        accessor.count * Type2NumOfComponent[accessor.type],
        accessor.componentType,
    );
}

function _getBaseUri(uri)
{
    // https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Source/Core/getBaseUri.js

    let basePath = '';
    const i = uri.lastIndexOf('/');
    if (i !== -1)
    {
        basePath = uri.substring(0, i + 1);
    }

    return basePath;
}

function _loadJSON(src, callback)
{
    // native json loading technique from @KryptoniteDove:
    // http://codepen.io/KryptoniteDove/post/load-json-file-locally-using-pure-javascript

    const xobj = new XMLHttpRequest();
    xobj.overrideMimeType('application/json');
    xobj.open('GET', src, true);
    xobj.onreadystatechange = function ()
    {
        if (xobj.readyState === 4 // Request finished, response ready
            && xobj.status === 200)
        { // Status OK
            callback(xobj.responseText, this);
        }
    };
    xobj.send(null);
}

function _loadArrayBuffer(url, callback)
{
    const xobj = new XMLHttpRequest();
    xobj.responseType = 'arraybuffer';
    xobj.open('GET', url, true);
    xobj.onreadystatechange = function ()
    {
        if (xobj.readyState === 4 // Request finished, response ready
            && xobj.status === 200)
        { // Status OK
            const arrayBuffer = xobj.response;
            if (arrayBuffer && callback)
            {
                callback(arrayBuffer);
            }
        }
    };
    xobj.send(null);
}
