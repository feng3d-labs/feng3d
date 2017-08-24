declare namespace feng3d {
    /**
     * 加载类
     * @author feng 2016-12-14
     */
    var Loader: {
        loadText: (url: string, onCompleted?: (content: string) => void, onRequestProgress?: () => void, onError?: () => void) => void;
        loadBinary: (url: string, onCompleted?: (content: string) => void, onRequestProgress?: () => void, onError?: () => void) => void;
        loadImage: (url: string, onCompleted?: (content: HTMLImageElement) => void, onRequestProgress?: () => void, onError?: () => void) => void;
    };
}
