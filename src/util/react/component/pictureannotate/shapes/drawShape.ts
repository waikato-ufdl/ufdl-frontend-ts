import {LinearTransformDispatch} from "../useLinearTransform";
import {ShapeStyle} from "./style";
import Shape from "./Shape";
import drawHandle from "../handles/drawHandle";
import {HandleStyle} from "../handles/style";
import {Point} from "../util/Point";

export default function drawShape(
    shape: Shape,
    canvas2D: CanvasRenderingContext2D,
    transform: Omit<LinearTransformDispatch, "update">,
    shapeStyle: ShapeStyle,
    handleStyle: HandleStyle,
    annotation: string | undefined,
    selected: boolean
) {
    drawPath(
        shape.getPath(transform),
        canvas2D,
        shapeStyle,
        selected
    )

    if (selected) {
        drawHandles(shape, canvas2D, transform, handleStyle)
    } else if (annotation !== undefined) {
        drawAnnotation(annotation, shape.labelPosition(), canvas2D, transform, shapeStyle)
    }
}

export function drawPath(
    path: Path2D,
    canvas2D: CanvasRenderingContext2D,
    shapeStyle: ShapeStyle,
    fill: boolean
) {
    const {
        lineWidth,
        shadowBlur,
        background,
        strokeStyle,
        shadowStyle,
    } = shapeStyle;

    canvas2D.save();

    canvas2D.shadowBlur = shadowBlur;
    canvas2D.shadowColor = shadowStyle;
    canvas2D.strokeStyle = strokeStyle;
    canvas2D.lineWidth = lineWidth;

    canvas2D.stroke(path)

    canvas2D.restore();

    if (fill) {
        canvas2D.save()
        canvas2D.fillStyle = background;
        canvas2D.fill(path)
        canvas2D.restore()
    }
}

export function drawHandles(
    shape: Shape,
    canvas2D: CanvasRenderingContext2D,
    transform: Omit<LinearTransformDispatch, "update">,
    handleStyle: HandleStyle,
) {
    for (const handle of shape.handles()) {
        drawHandle(handle, canvas2D, transform, handleStyle)
    }
}

export function drawAnnotation(
    annotation: string,
    position: Point,
    canvas2D: CanvasRenderingContext2D,
    transform: Omit<LinearTransformDispatch, "update">,
    shapeStyle: ShapeStyle
) {
    const {
        padding,
        fontSize,
        fontColor,
        fontBackground,
        fontFamily
    } = shapeStyle;

    const { x, y } = transform.transformPoint(position.x, position.y)

    canvas2D.save()
    canvas2D.font = `${fontSize}px ${fontFamily}`;
    const metrics = canvas2D.measureText(annotation);
    canvas2D.fillStyle = fontBackground;
    canvas2D.fillRect(
        x,
        y,
        metrics.width + padding * 2,
        fontSize + padding * 2
    );
    canvas2D.textBaseline = "top";
    canvas2D.fillStyle = fontColor;
    canvas2D.fillText(annotation, x + padding, y + padding);
    canvas2D.restore();
}