import JSZip from "jszip";
import {startTask, Task} from "../../util/typescript/task/Task";
import enumerate from "../../util/typescript/iterate/enumerate";

/**
 * Compressed a map of filename to file-data into a zip archive.
 *
 * @param files
 *          The filename/data map to compress.
 * @param mayBeCancelled
 *          Whether you might cancel the task.
 * @return
 *          The serialised archive.
 */
export default function compressFiles(
    files: ReadonlyMap<string, Blob>,
    mayBeCancelled: boolean = false
): Task<Uint8Array> {
    return startTask<Uint8Array>(
        async (complete, _, updateProgress, checkCancelled) => {
            // Create a new archive to hold the data
            const archive = new JSZip();

            // Add each file to the archive
            for (const [index, [filename, data]] of enumerate(files.entries())) {
                archive.file(filename, data)
                if (!await updateProgress(((index + 1) / files.size) / 2, `Archived ${filename}`)) {
                    return
                }
            }

            updateProgress(0.5, "Finished archiving, beginning compression")
            await checkCancelled?.()

            // Serialise and return the archive data
            let lastFile: string | undefined = undefined
            const compressed = await archive.generateAsync(
                {platform: "UNIX", type: "uint8array"},
                metadata => {
                    if (metadata.currentFile === null) return
                    updateProgress(
                        metadata.percent / 200 + 0.5,
                        metadata.currentFile !== lastFile
                                ? `Compressed ${lastFile}`
                                : undefined
                    )
                    lastFile = metadata.currentFile
                }
            )

            updateProgress(1.0,`Compressed ${lastFile}`)
            complete(compressed)
        },
        mayBeCancelled
    )
}
