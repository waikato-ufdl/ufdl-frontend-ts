
export type Head<Tuple extends readonly any[]> = Tuple extends [] ?
    never :
    (Tuple extends [infer Head, ...readonly any[]] ?
        Head :
        never)

export type Tail<Tuple extends readonly any[]> = Tuple extends [any, ...infer Tail] ? Tail : never

export type Lead<Tuple extends readonly any[]> = Tuple extends [...infer Lead, any] ? Lead : never

export type End<Tuple extends readonly any[]> = Tuple extends [...infer _, infer End] ? End : never

export function head<Head, Tail extends readonly any[]>(head: Head, ..._: Tail): Head {
    return head;
}

export function tail<Head, Tail extends readonly any[]>(_: Head, ...tail: Tail): Tail {
    return tail;
}

export function lead<Head, Tail extends readonly any[]>(head: Head, ...tail: Tail): Lead<[Head, ...Tail]> {
    const combined = [head, ...tail];
    return combined.slice(0, -1) as Lead<[Head, ...Tail]>;
}

export function end<Head, Tail extends readonly any[]>(head: Head, ...tail: Tail): End<[Head, ...Tail]> {
    if (tail.length === 0)
        return head as End<[Head, ...Tail]>;
    else
        return tail[tail.length - 1];
}
