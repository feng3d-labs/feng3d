import { bezier } from 'feng3d';
import { clearCanvas, createCanvas, drawBezierCurve, drawPointsCurve } from './Common';

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
        const xs = [Math.random(), Math.random(), Math.random(), Math.random()].map((i) => i * canvas.width);
        const ys = [Math.random(), Math.random(), Math.random(), Math.random()].map((i) => (1 - i) * canvas.height);

        // 使用 canvas提供的 bezierCurveTo,CanvasRenderingContext2D.bezierCurveTo,CanvasPathMethods.bezierCurveTo 进行绘制曲线
        drawBezierCurve(canvas, xs, ys, 'red', 15);

        // 使用 bezierCurve 进行采样曲线点
        const xSamples = bezier.getSamples(xs);
        const ySamples = bezier.getSamples(ys);
        drawPointsCurve(canvas, xSamples, ySamples, 'green', 5);
    }
})();
