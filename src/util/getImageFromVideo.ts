import {DEFAULT, handleSingleDefault, WithDefault} from "./typescript/default";
import {constantInitialiser} from "./typescript/initialisers";
import UNREACHABLE from "./typescript/UNREACHABLE";
import videoHasLoadedCurrentFrame from "./typescript/videoHasLoadedCurrentFrame";
import callbackPromise from "./typescript/async/callbackPromise";

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
 * @param throwOnCurrentTimeChanged
 *          Whether to reject the promise if the currentTime changes while waiting. The default
 *          is to wait until the video is loaded and has returned to the currentTime.
 */
export default async function getImageFromVideo(
    video: HTMLVideoElement,
    type: WithDefault<SupportedImageTypes> = DEFAULT,
    width: WithDefault<number> = DEFAULT,
    height: WithDefault<number> = DEFAULT,
    throwOnCurrentTimeChanged: boolean = false
): Promise<Blob> {

    // Wait for the video to be loaded
    await videoHasLoadedCurrentFrame(video, throwOnCurrentTimeChanged)

    // Handle default type (png)
    type = handleSingleDefault(type, constantInitialiser("png"));
    width = handleSingleDefault(width, constantInitialiser(video.videoWidth))
    height = handleSingleDefault(height, constantInitialiser(video.videoHeight))

    // Create a canvas of the desired width and height
    const dummyCanvas = document.createElement("canvas")
    dummyCanvas.width = width
    dummyCanvas.height = height

    // Get the 2D drawing context for drawing the video into
    const context = dummyCanvas.getContext("2d")
    if (context === null) UNREACHABLE("getContext returned null")

    // Draw the video into the canvas, scaling to the desired dimensions
    context.drawImage(video, 0, 0, width, height)

    const blob = await callbackPromise(dummyCanvas.toBlob.bind(dummyCanvas))(`image/${type}`)

    if (blob === null)
        throw new Error("toBlob returned null")

    return blob;
}
