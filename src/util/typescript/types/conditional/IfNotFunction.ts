import {Extends} from "./Extends";
import {Not} from "./Not";
import {If} from "./If";

export type IfNotFunction<T> = If<Not<Extends<T, Function>>, T>
