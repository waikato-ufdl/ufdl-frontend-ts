import {IsTuple, LastN, NTuple} from "./types/tuple";
import {Subtract} from "./types/numeric/Subtract";
import {If} from "./types/conditional/If";
import {And} from "./types/conditional/And";
import {IsNumeric} from "./types/numeric/IsNumeric";

export default function ignoreFirstNArgs<F extends (...args: any) => any, N extends number>(
    n: N,
    f: F
): If<And<IsNumeric<N>, IsTuple<Parameters<F>>>, (...args: [...NTuple<any, N>, ...Parameters<F>]) => ReturnType<F>> {
    return ((...args: any) => f(...args.slice(n) as any)) as any;
}

type PS<F extends (...args: any) => any> = F extends (...args: infer P) => any ? P : never;

function test(a?: string, b?: number) : boolean {
    return a !== undefined && b !== undefined && a.length + b < 45;
}

//const y: PS<typeof test> = [1,2]