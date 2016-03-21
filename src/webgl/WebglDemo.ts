/// <reference path="..\math\Matrix3D.ts" />

/**
 * WebglDemo
 */
class WebglDemo {
    private gl: WebGLRenderingContext;
    private shaderProgram: WebGLProgram;
    private vertexPositionAttribute: number;
    private squareVerticesBuffer: WebGLBuffer;

    constructor() {

        var canvas = document.getElementById("glcanvas");

        this.start(canvas);
    }

    private start(canvas) {
        this.initWebGL(canvas);

        // Only continue if WebGL is available and working

        if (this.gl) {
            this.initGL(this.gl);

            // Initialize the shaders; this is where all the lighting for the
            // vertices and so forth is established.

            this.initShaders(this.gl);

            // Here's where we call the routine that builds all the objects
            // we'll be drawing.

            this.initBuffers();

            // Set up to draw the scene periodically.

            setInterval(this.drawScene, 15, this);
        }
    }

    private initGL(gl: WebGLRenderingContext) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    }

    private initWebGL(canvas) {
        this.gl = null;
        try {
            this.gl = canvas.getContext("experimental-webgl");
        } catch (e) {

        }

        // If we don't have a GL context, give up now

        if (!this.gl) {
            alert("Unable to initialize WebGL. Your browser may not support it.");
        }
    }

    //
    // initShaders
    //
    // Initialize the shaders, so WebGL knows how to light our scene.
    //
    private initShaders(gl: WebGLRenderingContext) {
        var fragmentShader = this.getShader(this.gl, "shader-fs");
        var vertexShader = this.getShader(gl, "shader-vs");

        // Create the shader program

        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, vertexShader);
        gl.attachShader(this.shaderProgram, fragmentShader);
        gl.linkProgram(this.shaderProgram);

        // If creating the shader program failed, alert

        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            alert("Unable to initialize the shader program.");
        }

        gl.useProgram(this.shaderProgram);

        this.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(this.vertexPositionAttribute);
    }

    //
    // getShader
    //
    // Loads a shader program by scouring the current document,
    // looking for a script with the specified ID.
    //
    private getShader(gl: WebGLRenderingContext, id: string) {
        var shaderScript: any = document.getElementById(id);

        // Didn't find an element with the specified ID; abort.
        if (!shaderScript) {
            return null;
        }

        // Walk through the source element's children, building the
        // shader source string.

        var theSource = "";
        var currentChild = shaderScript.firstChild;

        while (currentChild) {
            if (currentChild.nodeType == 3) {
                theSource += currentChild.textContent;
            }

            currentChild = currentChild.nextSibling;
        }

        // Now figure out what type of shader script we have,
        // based on its MIME type.

        var shader;

        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;  // Unknown shader type
        }

        // Send the source to the shader object

        gl.shaderSource(shader, theSource);

        // Compile the shader program

        gl.compileShader(shader);

        // See if it compiled successfully

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    //
    // initBuffers
    //
    // Initialize the buffers we'll need. For this demo, we just have
    // one object -- a simple two-dimensional square.
    //
    private initBuffers() {

        // Create a buffer for the square's vertices.

        this.squareVerticesBuffer = this.gl.createBuffer();

        // Select the squareVerticesBuffer as the one to apply vertex
        // operations to from here out.

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVerticesBuffer);

        // Now create an array of vertices for the square. Note that the Z
        // coordinate is always 0 here.

        var vertices = [
            1.0, 1.0, 0.0,
            -1.0, 1.0, 0.0,
            1.0, -1.0, 0.0,
            -1.0, -1.0, 0.0
        ];

        // Now pass the list of vertices into WebGL to build the shape. We
        // do this by creating a Float32Array from the JavaScript array,
        // then use it to fill the current vertex buffer.

        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    }

    //
    // drawScene
    //
    // Draw the scene.
    //
    private drawScene(demo: WebglDemo) {
        // Clear the canvas before we start drawing on it.

        demo.gl.clear(demo.gl.COLOR_BUFFER_BIT | demo.gl.DEPTH_BUFFER_BIT);

        // Establish the perspective with which we want to view the
        // scene. Our field of view is 45 degrees, with a width/height
        // ratio of 640:480, and we only want to see objects between 0.1 units
        // and 100 units away from the camera.

        // Draw the square by binding the array buffer to the square's vertices
        // array, setting attributes, and pushing it to GL.

        demo.gl.bindBuffer(demo.gl.ARRAY_BUFFER, demo.squareVerticesBuffer);
        demo.gl.vertexAttribPointer(demo.vertexPositionAttribute, 3, demo.gl.FLOAT, false, 0, 0);
        demo.setMatrixUniforms();
        demo.gl.drawArrays(demo.gl.TRIANGLE_STRIP, 0, 4);
    }

    private setMatrixUniforms() {

        var perspectiveMatrix = new feng3d.Matrix3D([1.8106601717798214, 0, 0, 0, 0, 2.4142135623730954, 0, 0, 0, 0, -1.002002002002002, -1, 0, 0, -0.20020020020020018, 0])
        var mvMatrix = new feng3d.Matrix3D([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -6, 1]);

        var pUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
        this.gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.rawData));

        var mvUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
        this.gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.rawData));
    }
}

function start() {
    var demo = new WebglDemo();
    demo;
}