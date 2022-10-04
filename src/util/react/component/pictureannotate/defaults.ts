import {ShapeStyle} from "./shapes/style";
import {HandleStyle} from "./handles/style";

export const DEFAULT_SHAPE_STYLE: ShapeStyle = {
    padding: 5,
    lineWidth: 2,
    shadowBlur: 10,
    fontSize: 12,
    fontColor: "#212529",
    fontBackground: "#f8f9fa",
    fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', Helvetica, Arial, sans-serif",
    background: "hsla(210, 16%, 93%, 0.2)",
    strokeStyle: "#f8f9fa",
    shadowStyle: "hsla(210, 9%, 31%, 0.35)"
};

export const DEFAULT_HANDLE_STYLE: HandleStyle = {
    background: "#5c7cfa",
    size: 10
}
