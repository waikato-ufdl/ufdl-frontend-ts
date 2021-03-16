import React from "react";
import "./Overlay.css";

export type OverlayProps = {
    onCancel: () => void
}

export type OverlayState = {

}

export class Overlay extends React.Component<OverlayProps, OverlayState> {

    constructor(props: OverlayProps) {
        super(props);
        this.state = {

        }
    }

    onClick(event: React.MouseEvent<HTMLDivElement>) {
        event.stopPropagation();
        this.props.onCancel();
    }

    render() {
        return <div className={"Overlay"}>
            <div className={"OverlayCancelArea"} onClick={this.onClick.bind(this)} />
            <div className={"OverlayContentBounds"} onClick={this.onClick.bind(this)} >
                <div className={"OverlayContentArea"}>
                    {this.props.children}
                </div>
            </div>
        </div>
    }

}