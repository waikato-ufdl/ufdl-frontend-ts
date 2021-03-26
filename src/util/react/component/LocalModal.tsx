import React, {PropsWithChildren} from "react";
import ReactModal from "react-modal";
import {FunctionComponentReturnType} from "../types";

export type LocalModalProps = {
    /** The position to display the modal, or undefined to hide it. */
    position: [number, number] | undefined

    /** What to do when the user clicks outside the modal. */
    onCancel: () => void
}

/**
 * Modal dialogue which only takes up enough of the screen to fit its content.
 *
 * @param props
 *          The properties of the modal.
 * @constructor
 */
export default function LocalModal(
    props: PropsWithChildren<LocalModalProps>
): FunctionComponentReturnType {

    const position = props.position === undefined ? [0, 0] : props.position;
    const isOpen = props.position !== undefined;

    const xPositionStyle = position[0] < window.innerWidth / 2 ?
        {left: position[0], right: "initial"} : {left: "initial", right: window.innerWidth - position[0]};
    const yPositionStyle = position[1] < window.innerHeight / 2 ?
        {top: position[1], bottom: "initial"} : {top: "initial", bottom: window.innerHeight - position[1]};

    return <ReactModal
        isOpen={isOpen}
        onRequestClose={props.onCancel}
        style={{
            overlay: { backgroundColor: "rgba(127, 127, 127, 0.35)" },
            content: {
                ...xPositionStyle,
                ...yPositionStyle
            }
        }}
    >
        {props.children}
    </ReactModal>
}
