import {NO_ANNOTATION} from "../../NO_ANNOTATION";

/** Type representing either annotations or no annotations. */
export type OptionalAnnotations<A> = A | typeof NO_ANNOTATION