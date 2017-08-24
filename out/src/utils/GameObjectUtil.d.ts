declare namespace feng3d {
    var GameObjectUtil: {
        addScript: (gameObject: GameObject, scriptPath: string) => void;
        removeScript: (gameObject: GameObject, script: string | Script) => void;
        reloadJS: (scriptPath: any) => void;
        loadJs: (scriptPath: any, onload?: (resultScript: {
            className: string;
            script: HTMLScriptElement;
        }) => void) => void;
    };
}
