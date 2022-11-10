import { RenderAtomic } from '../../../../src';
import { mouseListen as mouseChange } from '../mikolalysenko/mouse-change';
import { mouseWheelListen as mouseWheel } from '../mikolalysenko/mouse-wheel';
import { identity, lookAt, perspective } from '../stackgl/gl-mat4';

export function createCamera(props)
{
  const cameraState = {
    view: identity(new Float32Array(16)),
    projection: identity(new Float32Array(16)),
    center: new Float32Array(props.center || 3),
    theta: props.theta || 0,
    phi: props.phi || 0,
    distance: Math.log(props.distance || 10.0),
    eye: new Float32Array(3),
    up: new Float32Array(props.up || [0, 1, 0])
  };

  const right = new Float32Array([1, 0, 0]);
  const front = new Float32Array([0, 0, 1]);

  const minDistance = Math.log('minDistance' in props ? props.minDistance : 0.1);
  const maxDistance = Math.log('maxDistance' in props ? props.maxDistance : 1000);

  let dtheta = 0;
  let dphi = 0;
  let ddistance = 0;

  let prevX = 0;
  let prevY = 0;
  mouseChange(function (buttons, x, y)
  {
    if (buttons & 1)
    {
      const dx = (x - prevX) / window.innerWidth;
      const dy = (y - prevY) / window.innerHeight;
      const w = Math.max(cameraState.distance, 0.5);

      dtheta += w * dx;
      dphi += w * dy;
    }
    prevX = x;
    prevY = y;
  });

  mouseWheel(function (dx, dy)
  {
    ddistance += dy / window.innerHeight;
  });

  function damp(x)
  {
    const xd = x * 0.9;
    if (Math.abs(xd) < 0.1)
    {
      return 0;
    }

    return xd;
  }

  function clamp(x, lo, hi)
  {
    return Math.min(Math.max(x, lo), hi);
  }

  function updateCamera()
  {
    const center = cameraState.center;
    const eye = cameraState.eye;
    const up = cameraState.up;

    cameraState.theta += dtheta;
    cameraState.phi = clamp(
      cameraState.phi + dphi,
      -Math.PI / 2.0,
      Math.PI / 2.0);
    cameraState.distance = clamp(
      cameraState.distance + ddistance,
      minDistance,
      maxDistance);

    dtheta = damp(dtheta);
    dphi = damp(dphi);
    ddistance = damp(ddistance);

    const theta = cameraState.theta;
    const phi = cameraState.phi;
    const r = Math.exp(cameraState.distance);

    const vf = r * Math.sin(theta) * Math.cos(phi);
    const vr = r * Math.cos(theta) * Math.cos(phi);
    const vu = r * Math.sin(phi);

    for (let i = 0; i < 3; ++i)
    {
      eye[i] = center[i] + vf * front[i] + vr * right[i] + vu * up[i];
    }

    lookAt(cameraState.view, eye, center, up);
  }

  const injectContext = (renderAtomic: RenderAtomic, viewportWidth: number, viewportHeight: number) =>
  {
    Object.keys(cameraState).forEach(function (name)
    {
      renderAtomic.uniforms[name] = () => setupCamera[name];
    });

    renderAtomic.uniforms['projection'] = () =>
      perspective(cameraState.projection,
        Math.PI / 4.0,
        viewportWidth / viewportHeight,
        0.01,
        1000.0);
  };

  function setupCamera(renderAtomic: RenderAtomic, viewportWidth: number, viewportHeight: number)
  {
    updateCamera();
    injectContext(renderAtomic, viewportWidth, viewportHeight);
  }

  Object.keys(cameraState).forEach(function (name)
  {
    setupCamera[name] = cameraState[name];
  });

  return setupCamera;
}
