import {constantInitialiser} from "../../typescript/initialisers";
import useNonUpdatingState from "./useNonUpdatingState";
import {forEachOwnProperty} from "../../typescript/object";

/**
 * Helper hook which can be used to log when a component is rendered. Useful
 * for debugging unnecessary renders.
 *
 * @param name
 *          A title to log to differentiate from other components.
 * @param props
 *          The props of the component.
 */
export default function useRenderNotify<P extends object>(
    name: string,
    props: P
): void {
    // Remember the last set of prop values the component received
    const [getLastProps, setLastProps] = useNonUpdatingState<P | undefined>(
        constantInitialiser(undefined)
    );

    const lastProps = getLastProps()

    // Special case for the first time rendering the component
    if (lastProps === undefined) {
        console.group(`Initial render of ${name}`);
        forEachOwnProperty(props, logInitial)
        console.groupEnd()
        setLastProps(props);
        return
    }

    // Get the set of all changed properties
    const changedProperties: Set<[keyof P, P[keyof P], P[keyof P]]> = new Set()
    forEachOwnProperty(
        props,
        (propName, propValue) => {
            // Get the previous value of the prop
            const lastPropValue = lastProps[propName];

            // Log it if it has changed
            if (propValue !== lastProps[propName]) changedProperties.add([propName, propValue, lastPropValue]);
        }
    )

    // Special case for when no properties changed
    if (changedProperties.size === 0) {
        console.group(`Rerender without change in props of ${name}`)
        console.groupEnd()
        return
    }

    // Create a group for the prop-change messages
    console.group(`Change in props of ${name}`);
    changedProperties.forEach(args => logChange(...args))
    console.groupEnd()

    // Save the props for next render
    setLastProps(props);
}

/**
 * Logs a prop-value on the initial render of a component.
 *
 * @param propName
 *          The name of the prop.
 * @param propValue
 *          The value of the prop.
 */
function logInitial<P extends object, K extends keyof P>(
    propName: K,
    propValue: P[K]
): void {
    console.log(propName, propValue);
}

/**
 * Logs a change in value to a prop.
 *
 * @param propName
 *          The name of the prop.
 * @param propValue
 *          The new value of the prop.
 * @param lastPropValue
 *          The old value of the prop.
 */
function logChange<P extends object, K extends keyof P>(
    propName: K,
    propValue: P[K],
    lastPropValue: P[K]
): void {
    console.group(propName);
    console.log("FROM", lastPropValue);
    console.log("TO", propValue);
    console.groupEnd()
}
