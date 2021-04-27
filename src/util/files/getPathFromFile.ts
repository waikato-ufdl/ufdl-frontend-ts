import getPropertyUnchecked from "../typescript/getPropertyUnchecked";

/**
 * Gets the path from a File if one is present.
 *
 * @param file
 *          The file to get the path from.
 * @return
 *          The path to the file, as an array of directory names.
 */
export default function getPathFromFile(
    file: File
): string[] {
    // Get the relative path from the file
    const relativePath = getPropertyUnchecked<string | undefined>(
        file,
        "webkitRelativePath"
    );

    // If no relative path exists, return the empty directory structure
    if (relativePath === undefined) return [];

    // Split the directories on separators
    return relativePath.split("/");
}
