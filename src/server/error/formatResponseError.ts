/**
 * Formats the body of an error response.
 *
 * @param response
 *          The error response.
 * @return
 *          The body of the response, formatted as a string.
 */
export async function formatResponseError(
    response: Response
): Promise<string> {
    // Parse the error body
    const body = await response.json();

    return Object
        .entries(body)
        .map(
            ([key, value]) => `${key}: ${value}`
        )
        .join("\n");
}
