/*
 * Types of annotations.
 */

/** Symbol which represents no classification label for a dataset item. */
export const NO_CLASSIFICATION = Symbol("The dataset entry has no classification.")

/** The type of annotation for classification tasks. */
export type Classification = string | typeof NO_CLASSIFICATION

/** The type of a point in a polygon. */
export class Point {
    constructor(
        readonly x: number,
        readonly y: number
    ) {
        DetectedObject.ensureInteger("x", x)
        DetectedObject.ensureInteger("y", y)
    }
}

/** A polygon describing the border of a detected object. */
export class Polygon {

    readonly points: readonly [Point, Point, Point, ...Point[]]

    constructor(
        p1: Point,
        p2: Point,
        p3: Point,
        ...ps: Point[]
    ) {
        this.points = [p1, p2, p3, ...ps]
    }
}

/** A single detected object in an image. */
export class DetectedObject {

    static create(
        x: number,
        y: number,
        width: number,
        height: number,
        label: string,
        prefix?: string,
        polygon?: Polygon
    ) {
        return new DetectedObject(x, y, width, height, label, prefix, polygon);
    }

    private constructor(
        readonly x: number,
        readonly y: number,
        readonly width: number,
        readonly height: number,
        readonly label: string,
        readonly prefix?: string,
        readonly polygon?: Polygon,
        checkX: boolean = true,
        checkY: boolean = true,
        checkWidth: boolean = true,
        checkHeight: boolean = true,
        checkLabel: boolean = true,
        checkPrefix: boolean = true
    ) {
        if (checkX) DetectedObject.ensureInteger("x", x);
        if (checkY) DetectedObject.ensureInteger("y", y);
        if (checkWidth) {
            DetectedObject.ensureInteger("width", width);
            DetectedObject.ensureNonNegative("width", width);
        }
        if (checkHeight) {
            DetectedObject.ensureInteger("height", height);
            DetectedObject.ensureNonNegative("height", height);
        }
        if (checkLabel) DetectedObject.ensureNotEmpty("label", label);
        if (prefix !== undefined && checkPrefix) DetectedObject.ensureNotEmpty("prefix", prefix);
    }

    static ensureInteger(name: string, value: number) {
        if (!Number.isInteger(value))
            throw new Error(`${name} (${value}) must be an integer`)
    }

    static ensureNonNegative(name: string, value: number) {
        if (value < 0)
            throw new Error(`${name} (${value}) must be non-negative`)
    }

    static ensureNotEmpty(name: string, value: string) {
        if (value === "")
            throw new Error(`${name} must not be empty`)
    }

}

/** The type of annotation for image object-detection tasks. */
export type DetectedObjects = readonly DetectedObject[]
