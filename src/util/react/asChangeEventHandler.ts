import {ChangeEventHandler} from "react";


export default function asChangeEventHandler<T extends {value: string}>(
    handler: ((value: string) => void)
): ChangeEventHandler<T>;

export default function asChangeEventHandler<T extends {value: string}, V>(
    handler: ((value: V) => void),
    converter: (eventValue: string) => V
): ChangeEventHandler<T>;

export default function asChangeEventHandler(
    handler: undefined
): undefined;

export default function asChangeEventHandler<V>(
    handler: undefined,
    converter: (eventValue: string) => V
): undefined;

export default function asChangeEventHandler<T extends {value: string}>(
    handler: ((value: string) => void) | undefined
): ChangeEventHandler<T> | undefined;

export default function asChangeEventHandler<T extends {value: string}, V>(
    handler: ((value: V) => void) | undefined,
    converter: (eventValue: string) => V
): ChangeEventHandler<T> | undefined;

export default function asChangeEventHandler(
    handler: ((value: any) => void) | undefined,
    converter?: (eventValue: string) => any,
): ChangeEventHandler<any> | undefined {
    if (handler === undefined) return undefined;
    return (event) => {
        const eventValue = event.target.value;
        const value = converter !== undefined ? converter(eventValue) : eventValue;
        handler(value);
    }
}
