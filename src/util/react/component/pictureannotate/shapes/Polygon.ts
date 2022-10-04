import Shape from "./Shape";
import {LinearTransformDispatch} from "../useLinearTransform";
import Handle from "../handles/Handle";
import robustPointInPolygon from "robust-point-in-polygon";
import {Point} from "../util/Point";
import {flipVector, multiplyVector, normaliseVector, offsetPoint, pointDifference} from "../util/Vector";

class PolygonHandle extends Handle {
    constructor(
        private readonly points: [Point, Point, Point, ...Point[]],
        private readonly index: number
    ) {
        super();
    }

    position(): { readonly x: number; readonly y: number } {
        return this.points[this.index]
    }

    move(deltaX: number, deltaY: number): void {
        const { x, y } = this.position()
        this.points[this.index] = { x: x + deltaX, y: y + deltaY }
    }

}

export default class Polygon extends Shape {
    public top(): number {
        return this.points.map(point => point.y).reduce((top, y) => y < top ? y : top)
    }

    public left(): number {
        return this.points.map(point => point.x).reduce((left, x) => x < left ? x : left)
    }

    public bottom(): number {
        return this.points.map(point => point.y).reduce((top, y) => y > top ? y : top)
    }

    public right(): number {
        return this.points.map(point => point.x).reduce((left, x) => x > left ? x : left)
    }

    public width(): number {
        return this.right() - this.left() + 1
    }

    public height(): number {
        return this.bottom() - this.top() + 1
    }

    move(deltaX: number, deltaY: number) {
        for (const handle of this._handles) {
            handle.move(deltaX, deltaY)
        }
    }

    contains(x: number, y: number): boolean {
        return robustPointInPolygon(
            this.points.map(point => [point.x, point.y]),
            [x, y]
        ) !== 1
    }

    onBorder(x: number, y: number): number | undefined {
        const testPoint = [x, y] as [number, number]

        const centroidX = this.points.reduce((acc, next) => acc + next.x, 0)
        const centroidY = this.points.reduce((acc, next) => acc + next.y, 0)
        const centroid = {
            x: centroidX / this.points.length,
            y: centroidY / this.points.length
        }

        for (const [index, point] of this.points.entries()) {
            const prevIndex = index === 0 ? this.points.length - 1 : index - 1
            const prevPoint = this.points[prevIndex]

            const vector = multiplyVector(normaliseVector(pointDifference(centroid, point)), 4)
            const prevVector = multiplyVector(normaliseVector(pointDifference(centroid, prevPoint)), 4)

            const borderPolygon = [
                offsetPoint(point, vector),
                offsetPoint(point, flipVector(vector)),
                offsetPoint(prevPoint, flipVector(prevVector)),
                offsetPoint(prevPoint, prevVector)
            ].map(point => [point.x, point.y] as [number, number])

            if (
                robustPointInPolygon(
                    borderPolygon,
                    testPoint
                ) !== 1
            ) {
                console.log(`On border @ ${prevIndex}`)
                return prevIndex
            }
        }

        return undefined
    }

    readonly points: [Point, Point, Point, ...Point[]];

    private _handles: readonly Handle[];

    handles(): readonly Handle[] {
        return this._handles
    }

    labelPosition(): { readonly x: number, readonly y: number } {
        return this.points[0]
    }

    constructor(
        ...points: [Point, Point, Point, ...Point[]]
    ) {
        super();

        this.points = points
        this._handles = points.map((_, index) => new PolygonHandle(points, index))
    }

    public insertPoint(index: number, x: number, y: number) {
        this.points.splice(index + 1, 0, { x, y })
        this._handles = this.points.map((_, index) => new PolygonHandle(this.points, index))
    }

    public deletePoint(index: number): boolean {
        if (this.points.length <= 3) return false
        this.points.splice(index, 1)
        this._handles = this.points.map((_, index) => new PolygonHandle(this.points, index))
        return true
    }

    public getPath(
        transform: Omit<LinearTransformDispatch, "update">
    ): Path2D {
        return Polygon.getPolygonPath(this.points, transform)
    }

    public static getPolygonPath(
        points: readonly [Point, Point, ...Point[]],
        transform: Omit<LinearTransformDispatch, "update">
    ): Path2D {
        const path = new Path2D()
        const { x: startX, y: startY } = Polygon.transformPoint(transform, points[0])
        path.moveTo(startX, startY)
        for (const point of points.slice(1)) {
            const { x, y } = Polygon.transformPoint(transform, point)
            path.lineTo(x, y)
        }
        path.closePath()
        return path
    }

    private static transformPoint(
        transform: Omit<LinearTransformDispatch, "update">,
        point: Point
    ): Point {
        return transform.transformPoint(point.x, point.y)
    }
}