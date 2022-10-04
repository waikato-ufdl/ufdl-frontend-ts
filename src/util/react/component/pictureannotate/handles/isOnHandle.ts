import Handle from "./Handle";

export default function isOnHandle(
    handle: Handle,
    size: number,
    x:  number,
    y: number
): boolean {
    const handlePosition = handle.position()
    const handleRelativeLocationX = x - handlePosition.x
    const handleRelativeLocationY = y - handlePosition.y
    const inXBounds = handleRelativeLocationX < size / 2 && handleRelativeLocationX > -size / 2
    const inYBounds = handleRelativeLocationY < size / 2 && handleRelativeLocationY > -size / 2
    return inXBounds && inYBounds
}
