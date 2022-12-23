export { };

declare global
{
    interface ArrayBuffer
    {
        image: HTMLImageElement
    }

    interface HTMLImageElement
    {
        arraybuffer: ArrayBuffer
    }
}
