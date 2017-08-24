declare namespace feng3d {
    var loadjs: {
        load: (params: {
            paths: string | string[] | {
                url: string;
                type: string;
            } | {
                url: string;
                type: string;
            }[];
            bundleId?: string;
            success?: () => void;
            error?: (pathsNotFound?: string[]) => void;
            async?: boolean;
            numRetries?: number;
            before?: (path: {
                url: string;
                type: string;
            }, e: any) => boolean;
            onitemload?: (url: string, content: string) => void;
        }) => void;
        ready: (params: {
            depends: string | string[];
            success?: () => void;
            error?: (pathsNotFound?: string[]) => void;
        }) => any;
    };
}
