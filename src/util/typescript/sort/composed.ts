import {CompareFunction} from "./CompareFunction";
import {AtLeastOne} from "../types/array/AtLeastOne";

/**
 * Composes a number of compare functions into a compare
 * function which sorts according to the priority of the
 * defined order of the components.
 *
 * @param components
 *          The component comparisons in priority order.
 * @return
 *          The composed compare function.
 */
export function composed<T>(
    ...components: AtLeastOne<CompareFunction<T>>
): CompareFunction<T> {
    return (a, b) => {
        for (const component of components) {
            const result = component(a, b);
            if (result !== 0) return result;
        }
        return 0;
    }
}
