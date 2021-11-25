/**
 * Saves a URL to disk with the given filename.
 *
 * @param filename
 *          The filename to save the data under.
 * @param url
 *          The URL to the file data.
 */
export default async function saveURL(
    filename: string,
    url: string
) {
    // Create a dummy anchor link to download the file-data
    const dummyLink: HTMLAnchorElement = document.createElement("a");

    // Add a URL to the file-data
    dummyLink.href = url;

    // Add the name to give the file
    dummyLink.download = filename;

    // Click the link to initiate download of the data
    dummyLink.click();
}
