import Shape from "./Shape";
import {LinearTransformDispatch} from "../useLinearTransform";
import Handle from "../handles/Handle";

class BoxHandle extends Handle {

    constructor(
        private getPosition: () => { readonly x: number; readonly y: number },
        private onMove: (deltaX: number, deltaY: number) => void
    ) {
        super();
    }

    position(): { readonly x: number; readonly y: number } {
        return this.getPosition()
    }

    move(deltaX: number, deltaY: number): void {
        this.onMove(deltaX, deltaY)
    }

}

export default class Box extends Shape {

    private readonly _handles: readonly Handle[];

    constructor(
        public _top: number,
        public _left: number,
        public _width: number,
        public _height: number
    ) {
        super();

        this._handles = [
            // Top-left handle
            new BoxHandle(
                () => { return { x: this._left, y: this._top }},
                (deltaX, deltaY) => {
                    this._left += deltaX
                    this._width -= deltaX
                    this._top += deltaY
                    this._height -= deltaY
                }
            ),

            // Top-right handle
            new BoxHandle(
                () => { return { x: this._left + this._width - 1, y: this._top }},
                (deltaX, deltaY) => {
                    this._width += deltaX
                    this._top += deltaY
                    this._height -= deltaY
                }
            ),

            // Bottom-left handle
            new BoxHandle(
                () => { return { x: this._left, y: this._top + this._height - 1 }},
                (deltaX, deltaY) => {
                    this._left += deltaX
                    this._width -= deltaX
                    this._height += deltaY
                }
            ),

            // Bottom-right handle
            new BoxHandle(
                () => { return { x: this._left + this._width - 1, y: this._top + this._height - 1 }},
                (deltaX, deltaY) => {
                    this._width += deltaX
                    this._height += deltaY
                }
            ),

            // TODO: Side-centre handles
        ]
    }

    move(deltaX: number, deltaY: number) {
        this._left += deltaX
        this._top += deltaY
    }

    contains(x: number, y: number): boolean {
        const relativeX = x - this._left
        const relativeY = y - this._top
        const inXBounds = this._width > 0
            ? 0 <= relativeX && relativeX < this._width
            : 0 >= relativeX && relativeX > this._width
        const inYBounds = this._height > 0
            ? 0 <= relativeY && relativeY < this._height
            : 0 >= relativeY && relativeY > this._height
        return inXBounds && inYBounds
    }

    handles(): readonly Handle[] {
        return this._handles
    }

    labelPosition(): { x: number; y: number } {
        return {
            x: this._left,
            y: this._top
        }
    }

    public getPath(transform: Omit<LinearTransformDispatch, "update">): Path2D {
        const { x, y, width, height } = this.translate(transform)
        const path = new Path2D()
        path.rect(x, y, width, height)
        return path
    }

    private translate(
        transform: Omit<LinearTransformDispatch, "update">
    ): {x: number, y: number, width: number, height: number} {
        const { x, y } = transform.transformPoint(this._left, this._top)
        const { x: width, y: height } = transform.transformVector(this._width, this._height)
        return { x, y, width, height }
    }

    height(): number {
        return Math.abs(this._height);
    }

    left(): number {
        return this._width < 0
            ? this._left + this._width + 1
            : this._left
    }

    top(): number {
        return this._height < 0
            ? this._top + this._height + 1
            : this._top;
    }

    width(): number {
        return Math.abs(this._width);
    }

    bottom(): number {
        return this._height <= 0
            ? this._top
            : this._top + this._height - 1
    }

    right(): number {
        return this._width <= 0
            ? this._left
            : this._left + this._width - 1
    }
}