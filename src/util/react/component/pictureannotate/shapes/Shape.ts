import {LinearTransformDispatch} from "../useLinearTransform";
import Handle from "../handles/Handle";

export default abstract class Shape {

    abstract top(): number
    abstract left(): number
    abstract bottom(): number
    abstract right(): number
    abstract width(): number
    abstract height(): number

    protected constructor() {}

    public abstract getPath(
        transform: Omit<LinearTransformDispatch, "update">
    ): Path2D;

    public abstract move(
        deltaX: number,
        deltaY: number
    ): void;

    public abstract contains(
        x: number,
        y: number
    ): boolean;

    public abstract labelPosition(): { readonly x: number, readonly y: number };

    public abstract handles(): readonly Handle[]

}