import React, {ImgHTMLAttributes} from "react";
import {BehaviorSubject, Subscription} from "rxjs";

export type SourcelessHTMLImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>

export type DataImageProps = SourcelessHTMLImgProps & {
    src: BehaviorSubject<Blob>
}

export type DataImageState = {
    data?: Blob,
    url?: string
}

export class DataImage extends React.Component<DataImageProps, DataImageState> {
    private subscription?: Subscription;

    constructor(props: DataImageProps) {
        super(props);
        this.state = this.stateFromBlob(props.src.value);
    }

    stateFromBlob(blob: Blob): DataImageState {
        return {
            data: blob,
            url: URL.createObjectURL(blob)
        };
    }

    componentDidMount(): void {
        this.subscription = this.props.src.subscribe(
            (value) => this.setState(this.stateFromBlob(value))
        );
    }

    componentWillUnmount(): void {
        if (this.subscription !== undefined) {
            this.subscription.unsubscribe();
            delete this.subscription;
        }
    }

    render() {
        const imgProps: ImgHTMLAttributes<HTMLImageElement> = {
            ...this.props,
            src: this.state.url !== undefined ? this.state.url : undefined,
            className: this.props.className === undefined ? "DataImage" : "DataImage " + this.props.className
        };
        return <img alt={"test"} {...imgProps} />
    }

}
