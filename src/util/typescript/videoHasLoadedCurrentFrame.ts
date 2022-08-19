import {rendezvous} from "./async/rendezvous";
import range from "./range";

function currentFrameLoaded(
    video: HTMLVideoElement
): boolean {
    const timeRanges = video.buffered
    const time = video.currentTime
    for (const index of range(timeRanges.length)) {
        if (time >= timeRanges.start(index) && time <= timeRanges.end(index)) return true
    }
    return false
}

/**
 * Creates a promise which resolves when the given video has seeked to
 * the currentTime and has loaded the data at that time.
 *
 * @param video
 *          The video to track.
 * @param throwOnCurrentTimeChanged
 *          Whether to reject the promise if the currentTime changes while waiting. The default
 *          is to wait until the video is loaded and has returned to the currentTime.
 */
export default async function videoHasLoadedCurrentFrame(
    video: HTMLVideoElement,
    throwOnCurrentTimeChanged: boolean = false
): Promise<void> {
    // Cache the currentTime of the video, so we can check if it changes
    const currentTime = video.currentTime

    // Need to keep checking until the video has seeked to original currentTime
    // and has loaded the frame-data for that time
    while (video.seeking || !currentFrameLoaded(video) || video.currentTime !== currentTime) {
        // Create a rendezvous so the video can wake us up when it has
        // made progress toward synchronising the frame
        const [promise, resolve] = rendezvous<unknown>()

        // Attach the event listeners which tell us when to check again
        video.addEventListener("progress", resolve)
        video.addEventListener("seeked", resolve)

        // Wait for the next time we should check for synchronisation
        await promise

        // Remove the event listeners again
        video.removeEventListener("progress", resolve)
        video.removeEventListener("seeked", resolve)

        // Check if the currentTime changed while we were waiting, and error
        // if the user has selected this functionality
        if (currentTime !== video.currentTime && throwOnCurrentTimeChanged)
            throw new Error("currentTime changed")
    }
}
