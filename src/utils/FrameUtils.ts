import * as fabric from "fabric";
import { Frame } from "../composables/slides/Frame";

/**
 * 查找对象所属的Frame
 * @param canvas 画布对象
 * @param object 目标对象
 * @returns 父Frame对象或null
 */
export function findParentFrame(canvas: fabric.Canvas, object: fabric.Object): Frame | null {
  return (
    (canvas
      .getObjects()
      .filter((obj) => obj instanceof Frame)
      .find((frame) => (frame as Frame).contents.has(object)) as Frame) ||
    null
  );
}