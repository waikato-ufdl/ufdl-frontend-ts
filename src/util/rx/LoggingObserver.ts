import {Observable, Observer} from "rxjs";
import doAsync from "../typescript/async/doAsync";

export default class LoggingObserver implements Observer<any> {

    constructor(private title: any, private source: Observable<any>) {
        doAsync(() => source.subscribe(this));
    }

    complete(): void {
        console.log(this.title, this.source, "COMPLETED");
    }

    error(err: any): void {
        console.error(this.title, this.source, "ERROR", err);
    }

    next(value: any): void {
        console.log(this.title, this.source, "NEXT", value);
    }

}
