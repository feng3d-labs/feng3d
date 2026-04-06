namespace examples
{
    var scene = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Untitled' }).addComponent(feng3d.Scene);
    scene.background = new feng3d.Color4(0.408, 0.38, 0.357, 1.0);

    var camera = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'Main Camera' }).addComponent(feng3d.Camera);
    camera.transform.position = new feng3d.Vector3(0, 1, -10);
    scene.gameObject.addChild(camera.gameObject);

    var engine = new feng3d.View(null, scene, camera);

    var segment = feng3d.serialization.setValue(new feng3d.GameObject(), { name: 'segment' });
    segment.transform.z = 3;
    scene.gameObject.addChild(segment);

    // 初始化材质
    var model = segment.addComponent(feng3d.Renderable);
    model.material = feng3d.Material.getDefault('Segment-Material');
    var segmentGeometry = model.geometry = new feng3d.SegmentGeometry();

    var length = 200;
    var height = 2 / Math.PI;
    var preVec: feng3d.Vector3;
    for (let x = -length; x <= length; x++)
    {
        const angle = x / length * Math.PI;
        if (preVec == null)
        {
            preVec = new feng3d.Vector3(x / 100, Math.sin(angle) * height, 0);
        }
 else
        {
            const vec = new feng3d.Vector3(x / 100, Math.sin(angle) * height, 0);
            segmentGeometry.addSegment({ start: preVec, end: vec });
            preVec = vec;
        }
    }

    // 变化旋转
    setInterval(function ()
    {
        segment.transform.ry += 1;
    }, 15);
}
