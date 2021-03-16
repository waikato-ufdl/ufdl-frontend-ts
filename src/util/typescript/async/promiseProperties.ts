import {PromiseProperties} from "../types/PromiseProperties";


export default function promiseProperties<A extends {}>(
    promise: Promise<A>
): Readonly<PromiseProperties<A>> {
    return new Proxy(
        {},
        {
            get(_: any, p: PropertyKey): any {
                return promise.then(
                    (arr) => {
                        return (arr as any)[p];
                    }
                )
            }
        }
    ) as any;
}
