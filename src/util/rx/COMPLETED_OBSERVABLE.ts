import {Observable, of} from "rxjs";

/** An observable that is already completed. */
export const COMPLETED_OBSERVABLE: Observable<never> = of();
