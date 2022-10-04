export default abstract class Handle {

    public abstract position(): { readonly x: number, readonly y: number }

    public abstract move(deltaX: number, deltaY: number): void

}