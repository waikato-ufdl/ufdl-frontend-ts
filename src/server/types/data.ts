/*
 * Types of data items that can exist in datasets.
 */

import isDefined from "../../util/typescript/isDefined";

/**
 * Base class for all data-types of domains. Only requires that the
 * raw binary data can be requested.
 */
export class Data {
    /** The raw binary data of the dataset item. */
    readonly raw: Blob

    constructor(
        raw: Blob
    ) {
        this.raw = raw
    }

}

/**
 * Data items in the object detection domain are either images
 * or videos. This type represents a URL to the image/video data,
 * and which it is (true is video).
 */
export class ImageOrVideo extends Data {
    /** The URL to the in-memory data. */
    readonly url: string

    constructor(
        raw: Blob,
        readonly format: string | undefined,
        readonly dimensions: readonly [number, number] | undefined,
        readonly videoLength: number | undefined
    ) {
        super(raw)
        if (isDefined(videoLength) && videoLength < 0) throw new Error(`Negative video length: ${videoLength}`)
        this.url = URL.createObjectURL(raw)
    }

    get isVideo(): boolean {
        return isDefined(this.videoLength)
    }
}


/** Images are represented by URLs to the image data. */
export class Image extends ImageOrVideo {

    constructor(
        raw: Blob,
        format: string | undefined,
        dimensions: readonly [number, number] | undefined
    ) {
        super(raw, format, dimensions, undefined)
    }

}
