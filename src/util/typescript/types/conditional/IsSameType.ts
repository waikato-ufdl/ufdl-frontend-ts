import {Extends} from "./Extends";
import {And} from "./And";
import {If} from "./If";

export type IsSameType<A, B> = If<And<Extends<A, B>, Extends<B, A>>, A & B>
