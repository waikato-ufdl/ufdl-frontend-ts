export function cleanCanvas(
    canvas: CanvasRenderingContext2D
) {
        canvas.clearRect(
            0,
            0,
            canvas.canvas.width,
            canvas.canvas.height
        );
}

export function setCanvasDPI(
    canvas: CanvasRenderingContext2D
) {
    canvas.scale(2, 2);
}
