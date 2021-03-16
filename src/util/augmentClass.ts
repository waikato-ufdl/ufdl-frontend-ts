import {HTMLAttributes} from "react";

export function augmentClass<P extends HTMLAttributes<any>>(
    props: P,
    ...classNames: string[]
): P {
    if (classNames.length === 0) return props;

    return {
        ...props,
        className: augmentClassName(props.className, ...classNames)
    }
}

export function augmentClassName(
    className: string | undefined,
    ...classNames: string[]
): string | undefined {
    if (classNames.length === 0) return className;

    const joined = classNames.join(" ");

    if (className === undefined) return joined;

    return className + " " + joined;
}
