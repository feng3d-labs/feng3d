declare module 'file-saver' {
    /**
     * FileSaver options
     */
    export interface FileSaverOptions {
        /** Automatically add BOM for UTF-8 files */
        autoBom?: boolean;
    }

    /**
     * Saves a file using the FileSaver.js implementation
     * @param blob The blob or URL to save
     * @param name The filename to save as
     * @param opts Optional options
     */
    export function saveAs(
        blob: Blob | string,
        name?: string,
        opts?: FileSaverOptions | boolean
    ): void;
}
