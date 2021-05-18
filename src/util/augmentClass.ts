import {HTMLAttributes} from "react";

/**
 * Augments the props object of a component with additional class-names.
 *
 * @param props
 *          The props object to augment.
 * @param classNames
 *          The additional classes to add.
 * @return
 *          An equivalent props object with the additional classes.
 */
export function augmentClass<P extends HTMLAttributes<any>>(
    props: P,
    ...classNames: string[]
): P {
    // If no class-names provided, no augmentation is necessary
    if (classNames.length === 0) return props;

    return {
        ...props,
        className: augmentClassName(props.className, ...classNames)
    }
}

/**
 * Augments the className property of a props object with
 * the given additional class-names.
 *
 * @param className
 *          The current value of the className property.
 * @param classNames
 *          The additional classes to add.
 * @return
 *          The augmented value of the className property.
 */
export function augmentClassName(
    className: string | undefined,
    ...classNames: string[]
): string | undefined {
    // If no additional class-names were provided, className remains unchanged
    if (classNames.length === 0) return className;

    // Join the provided class-names with a space
    const joined = classNames.join(" ");

    // If the current value is undefined, the final value is just the joined addenda
    if (className === undefined) return joined;

    // Otherwise it's the current value joined with the addenda
    return className + " " + joined;
}
