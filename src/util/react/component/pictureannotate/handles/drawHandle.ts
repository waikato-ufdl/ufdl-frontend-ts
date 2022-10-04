import {LinearTransformDispatch} from "../useLinearTransform";
import {HandleStyle} from "./style";
import Handle from "./Handle";

export default function drawHandle(
    handle: Handle,
    canvas2D: CanvasRenderingContext2D,
    transform: Omit<LinearTransformDispatch, "update">,
    style: HandleStyle
) {
    const { x, y, width, height } = transformHandle(handle, transform, style.size)

    canvas2D.save()
    canvas2D.fillStyle = style.background
    canvas2D.fillRect(x, y, width, height)
    canvas2D.restore()
}


function transformHandle(
    handle: Handle,
    transform: Omit<LinearTransformDispatch, "update">,
    size: number
): {x: number, y: number, width: number, height: number} {
    const { x: centreX, y: centreY } = handle.position()
    const { x, y } = transform.transformPoint(centreX - size / 2, centreY - size / 2)
    const { x: width, y: height } = transform.transformVector(size, size)
    return { x, y, width, height }
}
