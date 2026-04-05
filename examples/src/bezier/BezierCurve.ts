import { bezier } from 'feng3d';
import { createCanvas, clearCanvas, drawPointsCurve, drawPoints } from './Common';

(() =>
{
    // 创建画布
    const canvas = createCanvas(0, 60, window.innerWidth, window.innerHeight - 60);
    const button = document.getElementById('button');
    draw();

    button.onclick = function ()
    {
        draw();
    };

    function draw()
    {
        clearCanvas(canvas);

        // 随机生成4个点坐标
        const ys = [Math.random(), Math.random(), Math.random(), Math.random()].map((i) => (1 - i) * canvas.height);

        // 使用 bezierCurve 进行采样曲线点
        const ySamples = bezier.getSamples(ys);

        const xSamples: number[] = [];
        for (let i = 0, n = ySamples.length - 1; i <= n; i++)
        {
            xSamples[i] = canvas.width * i / n;
        }
        drawPointsCurve(canvas, xSamples, ySamples, 'green', 5);

        drawPoints(canvas, xSamples, ySamples);
    }
})();
