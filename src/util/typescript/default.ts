import {OmitNever} from "./types/OmitNever";
import {forEachOwnProperty} from "./object";
import {IndexType} from "./types/array/IndexType";
import {If} from "./types/conditional/If";

/*
 * Module for handling default values to React component props.
 *
 * TODO: Added default handling to functions as well.
 */

/** Unique symbol indicating a parameter should take its default value. */
export const DEFAULT = Symbol("Specifies a parameter should take its default value");

/** The type of T, or the default indicator symbol. */
export type WithDefault<T> = T | typeof DEFAULT;

/** The type of T, excluding the default indicator symbol. */
export type WithoutDefault<T> = Exclude<T, typeof DEFAULT>

/** Whether the given type has a default value. */
export type HasDefault<T> = typeof DEFAULT extends T ? true : false

/** The type of a function which handles generating the default value for a parameter. */
export type DefaultHandler<T> = () => WithoutDefault<T>

/**
 * The type of a set of default handlers for a function with parameters P.
 * TODO: WIP.
 */
export type FunctionDefaultHandlers<P extends readonly any[]>
    = OmitNever<{ [index in IndexType<P>]: If<HasDefault<P[index]>, DefaultHandler<P[index]>, never>}>

/** The prop keys which require default handlers. */
export type PropsDefaultHandlersKeys<P extends object> = {
    [K in keyof P]: typeof DEFAULT extends P[K] ? K : never
}[keyof P]

/** The type of a set of default handlers for a given props type. */
export type PropsDefaultHandlers<P extends object> = {
    [K in PropsDefaultHandlersKeys<P>]: DefaultHandler<P[K]>
}

/** The props which require default handling. */
export type PropsRequiringDefaultHandling<P extends object> = {
    [K in PropsDefaultHandlersKeys<P>]: P[K]
}

/** The type of the props with all default arguments applied their default values. */
export type DefaultHandled<P extends object> = {
    [K in keyof P]: WithoutDefault<P[K]>
}

/**
 * Checks if the value is specified (i.e. not defaulted).
 *
 * @param value
 *          The value to check.
 * @return
 *          Whether the parameter has been specified.
 */
export function isSpecified<T>(
    value: WithDefault<T>
): value is T extends typeof DEFAULT ? never : T {
    return value !== DEFAULT;
}

/**
 * Whether the given property has a default handler.
 *
 * @param handlers
 *          The set of default handlers.
 * @param property
 *          The property to check for default handling.
 */
export function hasHandler<P extends object>(
    handlers: PropsDefaultHandlers<P>,
    property: keyof P
): property is keyof PropsDefaultHandlers<P> {
    return (handlers as any)[property] !== undefined
}

/**
 * Handles the properties of props that should take their default
 * value.
 *
 * @param props
 *          The props.
 * @param handlers
 *          The default handlers for props.
 * @return
 *          Props with all default values handled.
 */
export function handleDefaults<P extends object>(
    props: P,
    handlers: PropsDefaultHandlers<P>
): DefaultHandled<P> {
    const handled: Partial<DefaultHandled<P>> = {};

    forEachOwnProperty(
        props,
        (property, value) => {
            handled[property] = !hasHandler(handlers, property)
                ? value as any
                : handleDefault(handlers, props, property)
        }
    )

    return handled as any;
}

/**
 * Gets the value of a prop after handling the default value.
 *
 * @param props
 *          The props.
 * @param key
 *          The key of the prop to get.
 * @param handlers
 *          The default handlers for props.
 * @return
 *          The default-handled value of the prop.
 */
export function handleDefault<P extends {}, K extends PropsDefaultHandlersKeys<P>>(
    handlers: PropsDefaultHandlers<P>,
    props: PropsRequiringDefaultHandling<P>,
    key: K
): WithoutDefault<P[K]> {
    const value = props[key];
    return handleSingleDefault(value, handlers[key]);
}

export function handleSingleDefault<T>(
    value: WithDefault<T>,
    defaultValue: () => WithoutDefault<T>
): WithoutDefault<T> {
    if (isSpecified(value))
        return value
    else
        return defaultValue()
}
