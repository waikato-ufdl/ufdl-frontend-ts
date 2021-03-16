import {OmitNever} from "./types/OmitNever";
import forEachOwnProperty from "./forEachOwnProperty";

export const DEFAULT = Symbol("Specifies a parameter should take its default value");

export type WithDefault<T> = T | typeof DEFAULT;

export type WithoutDefault<T> = Exclude<T, typeof DEFAULT>

export type DefaultHandler<T> = () => WithoutDefault<T>

export type DefaultHandlers<P extends {}> = OmitNever<{
    [K in keyof P]: typeof DEFAULT extends P[K] ? DefaultHandler<P[K]> : never
}>

export type DefaultHandled<P extends {}> = {
    [K in keyof P]: Exclude<P[K], typeof DEFAULT>
}

export function isDefault<T>(
    value: WithDefault<T>
): value is typeof DEFAULT {
    return value !== DEFAULT;
}

export function hasHandler<P extends {}>(
    handlers: DefaultHandlers<P>,
    key: keyof P
): key is keyof DefaultHandlers<P> {
    return (handlers as any)[key] !== undefined
}

export function handleDefaults<P extends {}>(
    props: P,
    handlers: DefaultHandlers<P>
): DefaultHandled<P> {
    const handled: Partial<DefaultHandled<P>> = {};

    forEachOwnProperty(
        props,
        (property, value) => {
            handled[property] = isDefault(value) && hasHandler(handlers, property) ?
                handlers[property]() :
                value as any;
        }
    );

    return handled as any;
}
