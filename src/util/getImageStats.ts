import loadedAwaitable from "./loadedAwaitable";
import {identity} from "./identity";

export type ImageStats = { width: number, height: number }

/**
 * Gets the pixel-width, pixel-height, and format of an image.
 *
 * TODO: Add format.
 *
 * @param imageFile
 *          The image file.
 * @return
 *          The image's stats.
 */
export default async function getImageStats(
    imageFile: Blob
): Promise<ImageStats> {

    // Create a dummy image element
    const dummyImageElement = document.createElement("img")

    const promise = loadedAwaitable(dummyImageElement, identity)

    // Add a URL to the file-data
    dummyImageElement.src = URL.createObjectURL(imageFile);

    await promise

    return {
        width: dummyImageElement.naturalWidth,
        height: dummyImageElement.naturalHeight
    }
}
