import {rendezvous} from "./typescript/async/rendezvous";

export type VideoStats ={ width: number, height: number, length: number }

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

    // Create a rendezvous to resolve the stats once the image loads
    const [promise, resolve, reject] = rendezvous<VideoStats>()

    dummyVideoElement.onloadedmetadata = () => resolve(
        {
            width: dummyVideoElement.videoWidth,
            height: dummyVideoElement.videoHeight,
            length: dummyVideoElement.duration
        }
    )

    dummyVideoElement.onerror = (ev) => reject(ev)

    // Add a URL to the file-data
    dummyVideoElement.src = URL.createObjectURL(videoFile)

    return promise
}
