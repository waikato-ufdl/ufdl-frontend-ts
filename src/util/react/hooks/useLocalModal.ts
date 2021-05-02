import useStateSafe from "./useStateSafe";
import {constantInitialiser} from "../../typescript/initialisers";
import useDerivedState from "./useDerivedState";
import React from "react";

export type LocalModalDispatch =
    | {
        hidden: true
        position: undefined
        show(x: number, y: number): void
        onClick(event: React.MouseEvent): void
        hide(): void
    }
    | {
        hidden: false
        position: [number, number]
        show(x: number, y: number): void
        onClick(event: React.MouseEvent): void
        hide(): void
    }

export default function useLocalModal(
    // No parameters
): LocalModalDispatch {

    // The position of the modal on screen, or undefined if hidden
    const [position, setPosition] = useStateSafe<[number, number] | undefined>(
        constantInitialiser(undefined)
    );

    // Derive the dispatch mutations from the 'setPosition' function
    const [show, onClick, hide] = useDerivedState(
        () => [
            (x: number, y: number) => setPosition([x, y]),
            (event: React.MouseEvent) => setPosition([event.clientX, event.clientY]),
            () => setPosition(undefined)
        ],
        [setPosition]
    )

    return useDerivedState(
        () => {
            if (position === undefined)
                return {
                    hidden: true,
                    show: show,
                    onClick: onClick,
                    hide: hide
                }
            else
                return {
                    hidden: false,
                    position: position,
                    x: position[0],
                    y: position[1],
                    show: show,
                    onClick: onClick,
                    hide: hide
                }
        },
        [position, show, onClick, hide]
    )


}
