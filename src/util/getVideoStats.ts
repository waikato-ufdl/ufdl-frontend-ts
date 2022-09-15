import loadedAwaitable from "./loadedAwaitable";
import {identity} from "./identity";

export type VideoStats = {
    width: number
    height: number
    length: number
}

/**
 * Gets the pixel-width, pixel-height, length in seconds, and format of a video.
 *
 * TODO: Add format.
 *
 * @param videoFile
 *          The video file.
 * @return
 *          The video's stats.
 */
export default async function getVideoStats(
    videoFile: Blob
): Promise<VideoStats> {

    // Create a dummy video element
    const dummyVideoElement = document.createElement("video")

    // Create a promise to await the loading of the video's metadata
    const loaded = loadedAwaitable(dummyVideoElement, identity, "onloadedmetadata")

    // Add a URL to the file-data to trigger loading
    dummyVideoElement.src = URL.createObjectURL(videoFile)

    // Await the meta-data to finish loading
    await loaded

    // Interrogate the dummy element for the video's stats (now they are loaded)
    return {
        width: dummyVideoElement.videoWidth,
        height: dummyVideoElement.videoHeight,
        length: dummyVideoElement.duration
    }
}
