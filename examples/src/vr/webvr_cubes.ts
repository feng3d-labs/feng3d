// namespace feng3d
// {
//     export interface GameObjectUserData
//     {
//         velocity: Vector3;
//     }
// }

// class webvr_cubes extends feng3d.Script
// {
//     /**
//      * 初始化时调用
//      */
//     init()
//     {

//         var scene = this.gameObject.scene;
//         var camera = scene.getComponentsInChildren(feng3d.Camera)[0];
//         var canvas = document.getElementById("glcanvas");

//         var clock = new Clock(true);

//         var container: HTMLDivElement;

//         var room: feng3d.GameObject;
//         var isMouseDown = false;

//         var INTERSECTED;
//         var crosshair: feng3d.GameObject;

//         init();
//         animate();

//         function init()
//         {

//             container = document.createElement('div');
//             document.body.appendChild(container);

//             var info = document.createElement('div');
//             info.style.position = 'absolute';
//             info.style.top = '10px';
//             info.style.width = '100%';
//             info.style.textAlign = 'center';
//             info.innerHTML = '<a href="http://threejs.org" target="_blank" rel="noopener">three.js</a> webgl - interactive cubes';
//             container.appendChild(info);

//             scene.background.fromUnit(0x505050);

//             var lens = camera.lens = new feng3d.PerspectiveLens(70);
//             lens.aspect = window.innerWidth / window.innerHeight;
//             lens.near = 0.1;
//             lens.far = 10;
//             camera.gameObject.addComponent(feng3d.FPSController);
//             scene.gameObject.addChild(camera.gameObject);

//             crosshair = feng3d.serialization.setValue(new feng3d.GameObject(), { name: "crosshair" });
//             var model = crosshair.addComponent(feng3d.Renderable);
//             model.geometry = feng3d.serialization.setValue(new feng3d.TorusGeometry(), { radius: 0.02, tubeRadius: 0.004, segmentsR: 32, segmentsT: 8, yUp: false });
//             var material = model.material = feng3d.serialization.setValue(new feng3d.Material(), { uniforms: { u_diffuse: { a: 0.5 } } });
//             material.renderParams.enableBlend = true;
//             crosshair.transform.z = 2;
//             camera.gameObject.addChild(crosshair);

//             room = feng3d.serialization.setValue(new feng3d.GameObject(), {
//                 name: "room",
//                 components: [
//                     { __class__: "Transform", y: 3 },
//                     {
//                         __class__: "MeshRenderer",
//                         geometry: {
//                             __class__: "CubeGeometry",
//                             width: 6, height: 6, depth: 6,
//                             segmentsW: 8, segmentsH: 8, segmentsD: 8,
//                         },
//                         material: {
//                             __class__: "Material",
//                             shaderName: "standard",
//                             uniforms: { u_diffuse: { r: 0.25, g: 0.25, b: 0.25 } },
//                             renderParams: { renderMode: feng3d.RenderMode.LINES },
//                         }
//                     }
//                 ]
//             });
//             scene.gameObject.addChild(room);

//             // scene.add(new THREE.HemisphereLight(0x606060, 0x404040));

//             var light = feng3d.serialization.setValue(new feng3d.GameObject(), {
//                 name: "light",
//                 components: [
//                     { __class__: "Transform", rx: 0.577, ry: 0.577, rz: 0.577 },
//                     { __class__: "DirectionalLight" }
//                 ],
//             });
//             scene.gameObject.addChild(light);

//             var geometry = feng3d.serialization.setValue(new feng3d.CubeGeometry(), { width: 0.15, height: 0.15, depth: 0.15 });

//             for (var i = 0; i < 200; i++)
//             {
//                 var object = feng3d.serialization.setValue(new feng3d.GameObject(), { name: `box${i}` });

//                 object.addComponent(feng3d.Renderable, (component) =>
//                 {
//                     component.geometry = geometry;
//                     var material = component.material = new feng3d.Material();
//                     (<feng3d.StandardUniforms>material.uniforms).u_diffuse.fromUnit(Math.random() * 0xffffff);
//                 });

//                 object.transform.position = feng3d.Vector3.random().scaleNumber(4).subNumber(2);
//                 object.transform.rotation = feng3d.Vector3.random().scaleNumber(2 * Math.PI);
//                 object.transform.scale = feng3d.Vector3.random().addNumber(0.5);

//                 object.userData.velocity = feng3d.Vector3.random().scaleNumber(0.01).subNumber(0.005);

//                 room.addChild(object);
//             }

//             // renderer = new THREE.WebGLRenderer({ antialias: true });
//             // renderer.setPixelRatio(window.devicePixelRatio);
//             // renderer.setSize(window.innerWidth, window.innerHeight);
//             // renderer.vr.enabled = true;
//             // container.appendChild(renderer.domElement);

//             canvas.addEventListener('mousedown', onMouseDown, false);
//             canvas.addEventListener('mouseup', onMouseUp, false);
//             canvas.addEventListener('touchstart', onMouseDown, false);
//             canvas.addEventListener('touchend', onMouseUp, false);

//             window.addEventListener('resize', onWindowResize, false);

//             //

//             window.addEventListener('vrdisplaypointerrestricted', onPointerRestricted, false);
//             window.addEventListener('vrdisplaypointerunrestricted', onPointerUnrestricted, false);

//             document.body.appendChild(WEBVR.createButton(canvas));

//         }

//         function onMouseDown()
//         {

//             isMouseDown = true;

//         }

//         function onMouseUp()
//         {

//             isMouseDown = false;

//         }

//         function onPointerRestricted()
//         {
//             var pointerLockElement = canvas;
//             if (pointerLockElement && typeof (pointerLockElement.requestPointerLock) === 'function')
//             {
//                 pointerLockElement.requestPointerLock();

//             }
//         }

//         function onPointerUnrestricted()
//         {
//             var currentPointerLockElement = document.pointerLockElement;
//             var expectedPointerLockElement = canvas;
//             if (currentPointerLockElement && currentPointerLockElement === expectedPointerLockElement && typeof (document.exitPointerLock) === 'function')
//             {
//                 document.exitPointerLock();
//             }
//         }

//         function onWindowResize()
//         {
//             camera.lens.aspect = window.innerWidth / window.innerHeight;

//             // engine.setSize(window.innerWidth, window.innerHeight);
//         }

//         //

//         function animate()
//         {

//             // renderer.animate(render);

//         }

//         function render()
//         {

//             var delta = clock.getDelta() * 60;

//             if (isMouseDown === true)
//             {

//                 var cube = room.children[0];
//                 room.removeChild(cube);

//                 cube.transform.position = new feng3d.Vector3(0, 0, - 0.75).applyQuaternion(camera.transform.orientation);
//                 cube.userData.velocity.x = (Math.random() - 0.5) * 0.02 * delta;
//                 cube.userData.velocity.y = (Math.random() - 0.5) * 0.02 * delta;
//                 cube.userData.velocity.z = (Math.random() * 0.01 - 0.05) * delta;
//                 cube.userData.velocity.applyQuaternion(camera.transform.orientation);
//                 room.addChild(cube);

//             }

//             // find intersections

//             // raycaster.setFromCamera({ x: 0, y: 0 }, camera);

//             // var intersects = raycaster.intersectObjects(room.children);

//             // if (intersects.length > 0)
//             // {

//             //     if (INTERSECTED != intersects[0].object)
//             //     {

//             //         if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

//             //         INTERSECTED = intersects[0].object;
//             //         INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
//             //         INTERSECTED.material.emissive.setHex(0xff0000);

//             //     }

//             // } else
//             // {

//             //     if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

//             //     INTERSECTED = undefined;

//             // }

//             // // Keep cubes inside room

//             // for (var i = 0; i < room.children.length; i++)
//             // {

//             //     var cube = room.children[i];

//             //     cube.userData.velocity.multiplyScalar(1 - (0.001 * delta));

//             //     cube.position.add(cube.userData.velocity);

//             //     if (cube.position.x < - 3 || cube.position.x > 3)
//             //     {

//             //         cube.position.x = THREE.mathUtil.clamp(cube.position.x, - 3, 3);
//             //         cube.userData.velocity.x = - cube.userData.velocity.x;

//             //     }

//             //     if (cube.position.y < - 3 || cube.position.y > 3)
//             //     {

//             //         cube.position.y = THREE.mathUtil.clamp(cube.position.y, - 3, 3);
//             //         cube.userData.velocity.y = - cube.userData.velocity.y;

//             //     }

//             //     if (cube.position.z < - 3 || cube.position.z > 3)
//             //     {

//             //         cube.position.z = THREE.mathUtil.clamp(cube.position.z, - 3, 3);
//             //         cube.userData.velocity.z = - cube.userData.velocity.z;

//             //     }

//             //     cube.rotation.x += cube.userData.velocity.x * 2 * delta;
//             //     cube.rotation.y += cube.userData.velocity.y * 2 * delta;
//             //     cube.rotation.z += cube.userData.velocity.z * 2 * delta;

//             // }

//             // renderer.render(scene, camera);

//         }
//     }
//     /**
//      * 更新
//      */
//     update()
//     {
//     }

//     /**
//     * 销毁时调用
//     */
//     dispose()
//     {

//     }
// }
