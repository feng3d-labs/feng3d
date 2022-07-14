namespace feng3d
{
    functionwrap.extendFunction(View.prototype, "render", function (r, interval)
    {
        feng2d.CanvasRenderer.draw(this);
    });
}