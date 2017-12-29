namespace feng3d
{
    export var mdlLoader = {
        load: load,
    };

    function load(mdlurl: string, callback: (gameObject: GameObject) => void)
    {
        Loader.loadText(mdlurl, (content) =>
        {
            war3.MdlParser.parse(content, (war3Model) =>
            {
                war3Model.root = mdlurl.substring(0, mdlurl.lastIndexOf("/") + 1);

                var showMesh = war3Model.getMesh();

                callback(showMesh);
            });
        });
    }
}