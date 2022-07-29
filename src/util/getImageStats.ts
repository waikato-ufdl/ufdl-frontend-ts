import {rendezvous} from "./typescript/async/rendezvous";

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

    // Create a rendezvous to resolve the stats once the image loads
    const [promise, resolve, reject] = rendezvous<ImageStats>()

    dummyImageElement.onload = () => resolve(
        {
            width: dummyImageElement.naturalWidth,
            height: dummyImageElement.naturalHeight
        }
    )

    dummyImageElement.onerror = (ev) => reject(ev)

    // Add a URL to the file-data
    dummyImageElement.src = URL.createObjectURL(imageFile);

    return promise
}
