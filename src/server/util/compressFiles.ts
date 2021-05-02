import JSZip from "jszip";

/**
 * Compressed a map of filename to file-data into a zip archive.
 *
 * @param files
 *          The filename/data map to compress.
 * @return
 *          The serialised archive.
 */
export default async function compressFiles(
    files: ReadonlyMap<string, Blob>
): Promise<Uint8Array> {
    // Create a new archive to hold the data
    const archive = new JSZip();

    // Add each file to the archive
    files.forEach(
        (data, filename) => {
            archive.file(filename, data)
        }
    )

    // Serialise and return the archive data
    return archive.generateAsync({platform: "UNIX", type: "uint8array"})
}
