import {FunctionComponentReturnType} from "../../types";
import useLinearTransform, {LinearTransformDispatch, Transform} from "./useLinearTransform";
import useDerivedState from "../../hooks/useDerivedState";
import useAnnotatingStateMachine from "./states/useAnnotatingStateMachine";
import {Controllable, useControllableState} from "../../hooks/useControllableState";
import {Annotated} from "./annotated";
import Shape from "./shapes/Shape";
import {ShapeStyle} from "./shapes/style";
import {HandleStyle} from "./handles/style";
import AnnotationInput, {AnnotationInputComponent} from "./AnnotationInput";
import {DEFAULT_HANDLE_STYLE, DEFAULT_SHAPE_STYLE} from "./defaults";
import React, {MouseEventHandler, useEffect} from "react";
import {cleanCanvas} from "./util/canvas";
import drawShape, {drawPath} from "./shapes/drawShape";
import usePromise from "../../hooks/usePromise";
import loadedAwaitable from "../../../loadedAwaitable";
import UNREACHABLE from "../../../typescript/UNREACHABLE";
import Polygon from "./shapes/Polygon";
import Box from "./shapes/Box";
import isOnHandle from "./handles/isOnHandle";
import assert from "assert";
import "./PictureAnnotator.css"
import useStateSafe from "../../hooks/useStateSafe";
import {constantInitialiser} from "../../../typescript/initialisers";

export type PictureAnnotatorProps = {
    annotatedShapes: Controllable<readonly Annotated<Shape>[]>
    selected: Controllable<number | undefined>
    onChange: (annotatedShapes: readonly Annotated<Shape>[]) => void
    onSelected: (index: number | undefined) => void
    width: number
    height: number
    image: string
    scrollSpeed?: number
    shapeStyle?: ShapeStyle
    handleStyle?: HandleStyle
    inputComponent?: AnnotationInputComponent
    minimumBoxSize?: { readonly width: number, readonly height: number }
    inputMargin?: number
    options?: string[]
}

export default function PictureAnnotator(
    props: PictureAnnotatorProps
): FunctionComponentReturnType {

    // Extract required props
    const {
        onChange,
        onSelected,
        width,
        height,
        image
    } = props

    // Handle defaults
    const scrollSpeed = props.scrollSpeed ?? 0.0005
    const shapeStyle = props.shapeStyle ?? DEFAULT_SHAPE_STYLE
    const handleStyle = props.handleStyle ?? DEFAULT_HANDLE_STYLE
    const InputComponent = props.inputComponent ?? AnnotationInput
    const minimumBoxSize = props.minimumBoxSize ?? { width: 20, height: 20 }
    const inputMargin = props.inputMargin ?? 5
    const options = props.options ?? []

    const [annotatedShapes, setAnnotatedShapes] = useControllableState(props.annotatedShapes, () => [])
    const [selected, setSelected] = useControllableState(props.selected, constantInitialiser(undefined))

    const stateMachine = useAnnotatingStateMachine()
    const transform = useLinearTransform(scrollSpeed)

    const [shapeCanvas, setShapeCanvas] = useStateSafe<CanvasRenderingContext2D | undefined>(constantInitialiser(undefined));
    const [imageCanvas, setImageCanvas] = useStateSafe<CanvasRenderingContext2D | undefined>(constantInitialiser(undefined));

    useEffect(
        () => {
            if (shapeCanvas !== undefined) shapeCanvas.scale(2, 2)
        },
        [shapeCanvas]
    )

    useEffect(
        () => {
            if (imageCanvas !== undefined) imageCanvas.scale(2, 2)
        },
        [imageCanvas]
    )

    const setAnnotatedShapesNotify = useDerivedState(
        ([setAnnotatedShapes, onChange]) =>
            (annotatedShapes: readonly Annotated<Shape>[]) => {
                setAnnotatedShapes(annotatedShapes)
                onChange(annotatedShapes)
            },
        [setAnnotatedShapes, onChange] as const
    )

    const setSelectedNotify = useDerivedState(
        ([setSelected, onSelected]) =>
            (selected: number | undefined) => {
                setSelected(selected)
                onSelected(selected)
            },
        [setSelected, onSelected] as const
    )

    const addUnlabelledShape = useDerivedState(
        ([annotatedShapes, setAnnotatedShapes, setSelected]) =>
            (shape: Shape) => {
                const newShapes = [...annotatedShapes, { shape }]

                setAnnotatedShapes(newShapes)
                setSelected(newShapes.length - 1)
            },
        [annotatedShapes, setAnnotatedShapesNotify, setSelectedNotify] as const
    )

    const onDelete = useDerivedState(
        ([stateMachine, annotatedShapes, setAnnotatedShapes, selected, setSelected]) =>
            () => {
                assert(stateMachine.state === "Idle")
                const newAnnotatedShapes = [
                    ...annotatedShapes.slice(0, selected!),
                    ...annotatedShapes.slice(selected! + 1)
                ]
                setAnnotatedShapes(newAnnotatedShapes)
                setSelected(undefined)
            },
        [stateMachine, annotatedShapes, setAnnotatedShapesNotify, selected, setSelectedNotify] as const
    )

    const imageElementResolution = usePromise(
        useDerivedState(
            ([image]) =>
                (async () => {
                    const element = document.createElement("img")
                    const loadPromise = loadedAwaitable(element)
                    element.alt = ""
                    element.src = image
                    await loadPromise
                    return element
                })(),
            [image] as const
        )
    )
    const imageElement = imageElementResolution.status === "resolved"
        ? imageElementResolution.value
        : undefined

    useEffect(
        () => {
            if (imageElement === undefined) return
            const { width: imageWidth, height: imageHeight } = imageElement;
            const imageNodeRatio = imageHeight / imageWidth;
            const { width: canvasWidth, height: canvasHeight } = { width, height };
            const canvasNodeRatio = canvasHeight / canvasWidth;
            if (!isNaN(imageNodeRatio) && !isNaN(canvasNodeRatio)) {
                if (imageNodeRatio < canvasNodeRatio) {
                    const scale = canvasWidth / imageWidth;
                    transform.update(
                        {
                            type: "set",
                            scale: scale,
                            translateX: 0,
                            translateY: (canvasHeight - scale * imageHeight) / 2
                        }
                    )
                } else {
                    const scale = canvasHeight / imageHeight;
                    transform.update(
                        {
                            type: "set",
                            scale: scale,
                            translateX: (canvasWidth - scale * imageWidth) / 2,
                            translateY: 0
                        }
                    )
                }
            }
        },
        [imageElement]
    )

    useEffect(
        () => {
            if (imageElement === undefined || imageCanvas === undefined) return
            requestAnimationFrame(
                () => {
                    cleanCanvas(imageCanvas)
                    drawImage(imageCanvas, imageElement, transform)
                }
            )
        },
        [imageCanvas, imageElement, transform]
    )

    useEffect(
        () => {
            if (shapeCanvas === undefined) return
            requestAnimationFrame(
                () => {
                    cleanCanvas(shapeCanvas)
                    drawShapes(shapeCanvas, annotatedShapes, transform, shapeStyle, handleStyle, selected)
                    if (stateMachine.state === "Adding Box") {
                        drawShape(
                            new Box(stateMachine.data.y, stateMachine.data.x, stateMachine.data.width, stateMachine.data.height),
                            shapeCanvas,
                            transform,
                            shapeStyle,
                            handleStyle,
                            undefined,
                            false
                        )
                    } else if (stateMachine.state === "Adding Polygon") {
                        drawPath(
                            Polygon.getPolygonPath(
                                [{ x: stateMachine.data.x, y: stateMachine.data.y }, ...stateMachine.data.points] as const,
                                transform
                            ),
                            shapeCanvas,
                            shapeStyle,
                            false
                        )
                    }
                }
            )
        },
        [shapeCanvas, annotatedShapes, transform, shapeStyle, handleStyle, stateMachine, selected]
    )

    const onWheel = useDerivedState(
        ([updateLinearTransform]) =>
            (event: React.WheelEvent<HTMLCanvasElement>) => {
                const { clientHeight, scrollTop, scrollHeight } = event.currentTarget;
                if (clientHeight + scrollTop + event.deltaY > scrollHeight) {
                    // event.preventDefault();
                    event.currentTarget.scrollTop = scrollHeight;
                } else if (scrollTop + event.deltaY < 0) {
                    // event.preventDefault();
                    event.currentTarget.scrollTop = 0;
                }

                updateLinearTransform(
                    {
                        type: "scale",
                        factor: event.deltaY,
                        offsetX: event.nativeEvent.offsetX,
                        offsetY: event.nativeEvent.offsetY
                    }
                )
            },
        [transform.update] as const
    )

    const onMouseDown: MouseEventHandler<HTMLCanvasElement> = useDerivedState(
        (
            [
                transform,
                stateMachine,
                addUnlabelledShape,
                onChange,
                annotatedShapes,
                handleStyle,
                selected,
                setSelected
            ]
        ) =>
            (event) => {
                const { x, y } = transform.inverseTransformPoint(event.nativeEvent.offsetX, event.nativeEvent.offsetY)
                switch (stateMachine.state) {
                    case "Idle":
                        if (selected !== undefined) {
                            const selectedShape = annotatedShapes[selected].shape
                            for (const [handleIndex, handle] of selectedShape.handles().entries()) {
                                if (isOnHandle(handle, handleStyle.size, x, y)) {
                                    if (selectedShape instanceof Polygon && event.ctrlKey) {
                                        if (selectedShape.deletePoint(handleIndex)) {
                                            onChange(annotatedShapes)
                                            stateMachine.transitions.refresh()
                                        }
                                    } else {
                                        stateMachine.transitions.moveHandle(handleIndex, x, y)
                                    }
                                    return
                                }
                            }
                        }

                        for (const [shapeIndex, { shape }] of annotatedShapes.entries()) {
                            if (event.ctrlKey && shape instanceof Polygon) {
                                const borderIndex = shape.onBorder(x, y)
                                if (borderIndex !== undefined) {
                                    shape.insertPoint(borderIndex, x, y)
                                    onChange(annotatedShapes)
                                    stateMachine.transitions.refresh()
                                    return
                                }
                            }

                            if (shape.contains(x, y)) {
                                stateMachine.transitions.moveShape(x, y)
                                setSelected(shapeIndex)
                                return
                            }
                        }

                        if (event.ctrlKey) {
                            stateMachine.transitions.addPolygon(x, y)
                        } else {
                            stateMachine.transitions.addBox(x, y)
                        }
                        return;
                    case "Adding Polygon":
                        if (event.ctrlKey) {
                            stateMachine.transitions.newPoint(x, y)
                        } else {
                            const points = [...stateMachine.data.points, { x, y }] as const

                            if (points.length >= 3) {
                                addUnlabelledShape(new Polygon(points[0], points[1], points[2], ...points.slice(3)))
                            }

                            stateMachine.transitions.finish()
                        }
                        return;
                    case "Adding Box":
                    case "Moving Shape":
                    case "Moving Handle":
                        UNREACHABLE("Mouse is already down")
                    default:
                        UNREACHABLE("Unexpected state")
                }
            },
        [transform, stateMachine, addUnlabelledShape, onChange, annotatedShapes, handleStyle, selected, setSelectedNotify] as const
    )

    const onMouseMove: MouseEventHandler<HTMLCanvasElement> = useDerivedState(
        ([transform, stateMachine, annotatedShapes, selected]) =>
            (event) => {
                const { x, y } = transform.inverseTransformPoint(event.nativeEvent.offsetX, event.nativeEvent.offsetY)
                switch (stateMachine.state) {
                    case "Idle":
                        // No need to track mouse movements when idle
                        return
                    case "Adding Polygon":
                    case "Adding Box":
                        stateMachine.transitions.update(x, y)
                        return
                    case "Moving Shape":
                        const shape = annotatedShapes[selected!].shape
                        shape.move(x - stateMachine.data.x, y - stateMachine.data.y)
                        stateMachine.transitions.update(x, y)
                        return
                    case "Moving Handle":
                        const handle = annotatedShapes[selected!]
                            .shape
                            .handles()[stateMachine.data.handleIndex]
                        handle.move(x - stateMachine.data.x, y - stateMachine.data.y)
                        stateMachine.transitions.update(x, y)
                        return
                    default:
                        UNREACHABLE("Unexpected state")
                }
            },
        [transform, stateMachine, annotatedShapes, selected] as const
    )

    const onMouseUp: MouseEventHandler<HTMLCanvasElement> = useDerivedState(
        ([transform, stateMachine, addUnlabelledShape, minimumBoxSize]) =>
            (event) => {
                const { x, y } = transform.inverseTransformPoint(event.nativeEvent.offsetX, event.nativeEvent.offsetY)
                switch (stateMachine.state) {
                    case "Adding Polygon":
                        // Ignore mouse-up when creating polygons (points are added on mouse-down)
                        return
                    case "Adding Box":
                        const box = new Box(
                            stateMachine.data.y,
                            stateMachine.data.x,
                            x - stateMachine.data.x + 1,
                            y - stateMachine.data.y + 1
                        )

                        if (
                            Math.abs(box.width()) < minimumBoxSize.width
                            || Math.abs(box.height()) < minimumBoxSize.height
                        ) {
                            stateMachine.transitions.finish()
                            return
                        }

                        addUnlabelledShape(box)
                        stateMachine.transitions.finish()
                        return
                    case "Moving Shape":
                    case "Moving Handle":
                        stateMachine.transitions.finish()
                        return
                    case "Idle":
                        // Mouse-up events can occur when leaving the canvas, so just ignore these
                        return
                    default:
                        UNREACHABLE("Unexpected state")
                }
            },
        [transform, stateMachine, addUnlabelledShape, minimumBoxSize] as const
    )

    const onLabelChange = useDerivedState(
        ([stateMachine, selectedShapeIndex, annotatedShapes, onChange]) =>
            (value: string | undefined) => {
                assert(stateMachine.state === "Idle")
                value = value === "" ? undefined: value
                annotatedShapes[selectedShapeIndex!].annotation = value
                onChange(annotatedShapes)
                stateMachine.transitions.refresh()
            },
        [stateMachine, selected, annotatedShapes, onChange] as const
    )

    const selectedShape = selected !== undefined
        ? annotatedShapes[selected]
        : undefined

    const selectedShapeLabelPosition = selectedShape !== undefined
        ? transform.transformPoint(selectedShape.shape.left(), selectedShape.shape.bottom())
        : undefined

    const inputPosition = selectedShapeLabelPosition !== undefined
        ? {
            left: selectedShapeLabelPosition.x,
            top: selectedShapeLabelPosition.y + inputMargin
        }
        : undefined

    const label = selectedShape?.annotation ?? ""

    return <div className="rp-stage">
        <canvas
            style={{ width, height }}
            className="rp-image"
            ref={value => setImageCanvas(value?.getContext("2d") ?? undefined)}
            width={width * 2}
            height={height * 2}
        />
        <canvas
            className="rp-shapes"
            style={{ width, height }}
            ref={value => setShapeCanvas(value?.getContext("2d") ?? undefined)}
            width={width * 2}
            height={height * 2}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
        />
        {(inputPosition !== undefined) && (
            <div className="rp-selected-input" style={inputPosition}>
                <InputComponent
                    value={label}
                    onChange={onLabelChange}
                    onDelete={onDelete}
                    options={
                        [
                            ...options,
                            ...annotatedShapes.map(it => it.annotation ?? "").filter(it => it !== "")
                        ]
                    }
                />
            </div>
        )}
    </div>

}

function drawImage(
    imageCanvas: CanvasRenderingContext2D,
    imageElement: HTMLImageElement,
    transform: Transform
) {
    const {translateX: originX, translateY: originY, scale} = transform;
    imageCanvas.drawImage(
        imageElement,
        originX,
        originY,
        imageElement.width * scale,
        imageElement.height * scale
    );
}

function drawShapes(
    shapeCanvas: CanvasRenderingContext2D,
    shapes: readonly Annotated<Shape>[],
    transform: Omit<LinearTransformDispatch, "update">,
    shapeStyle: ShapeStyle,
    handleStyle: HandleStyle,
    selected: number | undefined
) {
    for (const [index, { shape, annotation }] of shapes.entries()) {
        drawShape(
            shape,
            shapeCanvas,
            transform,
            shapeStyle,
            handleStyle,
            annotation,
            index === selected
        );
    }

}