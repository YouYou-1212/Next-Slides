import * as fabric from "fabric";
import { ColorUtils } from "../../utils/ColorUtils";

export const glassEffect = {
  fill: "rgba(255, 255, 255, 0)",
  // fill: ColorUtils.generateSoftRandomColor(),
  // stroke: "rgba(0, 0, 0, 0.4)",
  // strokeWidth: 1,
  customBorderColor: "rgba(0, 0, 0, 0.4)",
  rx: 3,
  ry: 3,
  shadow: new fabric.Shadow({
    color: "rgba(0, 0, 0, 0.1)",
    blur: 15,
    offsetX: 0,
    offsetY: 0,
  }),
  opacity: 0.8,
  backgroundColor: "rgba(255, 255, 255, 0)",
};