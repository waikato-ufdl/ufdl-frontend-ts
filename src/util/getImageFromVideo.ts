import {rendezvous} from "./typescript/async/rendezvous";
import {DEFAULT, handleSingleDefault, WithDefault} from "./typescript/default";
import {constantInitialiser} from "./typescript/initialisers";
import UNREACHABLE from "./typescript/UNREACHABLE";

export type SupportedImageTypes = "png" | "jpeg"

/**
 * Extracts the current frame as an image from the given
 * video in the requested format.
 *
 * @param video
 *          The video element to extract the current frame from.
 * @param type
 *          The format to extract the image in (png/jpeg).
 * @param width
 *          The width to scale the image to. Defaults to the video's native width.
 * @param height
 *          The height to scale the image to. Defaults to the video's native height.
 */
export default async function getImageFromVideo(
    video: HTMLVideoElement,
    type: WithDefault<SupportedImageTypes> = DEFAULT,
    width: number = video.videoWidth,
    height: number = video.videoHeight
): Promise<Blob> {
    // Handle default type (png)
    type = handleSingleDefault(type, constantInitialiser("png"));

    // Create a canvas of the desired width and height
    const dummyCanvas = document.createElement("canvas")
    dummyCanvas.width = width
    dummyCanvas.height = height

    // Get the 2D drawing context for drawing the video into
    const context = dummyCanvas.getContext("2d")
    if (context === null) UNREACHABLE("getContext returned null")

    // Draw the video into the canvas, scaling to the desired dimensions
    context.drawImage(video, 0, 0, width, height)

    // The extracted image data is provided through a callback, so create a rendezvous
    // promise to receive the value
    const [promise, resolve, reject] = rendezvous<Blob>();

    // Schedule the promise to be resolved with the image data in the requested format
    dummyCanvas.toBlob(
        (blob) => {
            if (blob === null) {
                reject("toBlob returned null");
            } else {
                resolve(blob)
            }
        },
        `image/${type}`
    )

    return promise;
}
