import {Point} from "./Point";

export type Vector = { readonly x: number, readonly y: number }

export function pointDifference(
    start: Point,
    end: Point
): Vector {
    return {
        x: end.x - start.x,
        y: end.y - start.y
    }
}

export function offsetPoint(
    point: Point,
    by: Vector
): Point {
    return {
        x: point.x + by.x,
        y: point.y + by.y
    }
}

export function multiplyVector(vec: Vector, factor: number): Vector {
    return {
        x: vec.x * factor,
        y: vec.y * factor
    }
}

export function normaliseVector(vec: Vector): Vector {
    const norm = Math.sqrt(vec.x * vec.x + vec.y * vec.y)
    return {
        x: vec.x / norm,
        y: vec.y / norm
    }
}

export function flipVector(vec: Vector): Vector {
    return {
        x: -vec.x,
        y: -vec.y
    }
}