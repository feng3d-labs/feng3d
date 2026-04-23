import { render, RenderInput } from '@feng3d/rendering';
import { pointcloudVertWGSL } from './shaders/pointcloud.vert.wgsl.js';
import { pointcloudFragWGSL } from './shaders/pointcloud.frag.wgsl.js';

interface Point {
    x: number;
    y: number;
    z: number;
    r: number;
    g: number;
    b: number;
}

async function loadPointCloud(url: string): Promise<Float32Array>
{
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.split('\n');

    const points: Point[] = [];

    for (const line of lines)
    {
        // 跳过注释和空行
        if (line.startsWith('#') || line.trim() === '')
        {
            continue;
        }

        const parts = line.trim().split(/\s+/);
        if (parts.length < 8)
        {
            continue;
        }

        // 格式: pixel_x pixel_y x(mm) y(mm) z(mm) r g b confidence
        const x = parseFloat(parts[2]) / 1000; // mm to meters
        const y = parseFloat(parts[3]) / 1000;
        const z = parseFloat(parts[4]) / 1000;
        const r = parseFloat(parts[5]);
        const g = parseFloat(parts[6]);
        const b = parseFloat(parts[7]);

        points.push({ x, y, z, r, g, b });
    }

    // 创建顶点数组：每个点包含 position (x,y,z,1) 和 color (r,g,b,1)
    const vertexData = new Float32Array(points.length * 8);

    for (let i = 0; i < points.length; i++)
    {
        const p = points[i];
        vertexData[i * 8 + 0] = p.x;
        vertexData[i * 8 + 1] = p.y;
        vertexData[i * 8 + 2] = p.z;
        vertexData[i * 8 + 3] = 1.0;
        vertexData[i * 8 + 4] = p.r;
        vertexData[i * 8 + 5] = p.g;
        vertexData[i * 8 + 6] = p.b;
        vertexData[i * 8 + 7] = 1.0;
    }

    console.log(`Loaded ${points.length} points`);

    return vertexData;
}

async function main()
{
    const canvas = document.getElementById('webgpu1') as HTMLCanvasElement;

    // 加载点云数据
    const vertexData = await loadPointCloud('./pointcloud.txt');

    const input: RenderInput = {
        canvas,
        pipeline: {
            vertex: { code: pointcloudVertWGSL },
            fragment: { code: pointcloudFragWGSL },
            primitive: {
                topology: 'point-list',
            },
        },
        vertices: {
            position: {
                data: vertexData,
                format: 'float32x4',
                offset: 0,
                arrayStride: 32, // 8 floats * 4 bytes
            },
            color: {
                data: vertexData,
                format: 'float32x4',
                offset: 16, // 4 floats * 4 bytes
                arrayStride: 32,
            },
        },
        vertexCount: vertexData.length / 8,
        rotation: 0,
        renderMode: 'on-demand',
    };

    // 启动渲染
    render(input);

    // 使用 requestAnimationFrame 更新旋转角度
    let lastTime = performance.now();

    function animate(currentTime: number): void
    {
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        input.rotation += deltaTime * 0.5;

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

main();
