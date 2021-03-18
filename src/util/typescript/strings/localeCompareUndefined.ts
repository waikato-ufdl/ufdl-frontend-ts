/**
 * Determines whether two (possibly undefined) strings are equivalent
 * in the current or specified locale.
 *
 * @param a
 *          The target string.
 * @param b
 *          String to compare to target string
 * @param locales
 *          A locale string or array of locale strings that contain one or more
 *          language or locale tags. If you include more than one locale string,
 *          list them in descending order of priority so that the first entry is
 *          the preferred locale. If you omit this parameter, the default locale
 *          of the JavaScript runtime is used. This parameter must conform to
 *          BCP 47 standards; see the Intl.Collator object for details.
 * @param options
 *          An object that contains one or more properties that specify comparison
 *          options. see the Intl.Collator object for details.
 * @param undefinedFirst
 *          Whether undefined values should be sorted before string values. Default
 *          is to sort undefined after string values.
 */
export function localeCompareUndefined(
    a: string | undefined,
    b: string | undefined,
    locales?: string | string[],
    options?: Intl.CollatorOptions,
    undefinedFirst: boolean = false
): number {
    if (a === undefined) {
        if (b === undefined) {
            return 0;
        } else {
            return undefinedFirst ? -1 : 1;
        }
    } else {
        if (b === undefined) {
            return undefinedFirst ? 1 : -1;
        } else {
            return a.localeCompare(b, locales, options);
        }
    }
}
