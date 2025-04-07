import * as fabric from "fabric";
import { Frame } from "../composables/slides/Frame";
import type { CustomCanvas } from "../composables/canvas/CustomCanvas";


export function findParentFrame(canvas: fabric.Canvas, object: fabric.Object): Frame | null {
  return (
    (canvas
      .getObjects()
      .filter((obj) => obj instanceof Frame)
      .find((frame) => (frame as Frame).contents.has(object)) as Frame) ||
    null
  );
}


export function findFramesToPoint(canvas: CustomCanvas, isExcludedFrame: Frame[] = [], pointer: fabric.TPointerEvent) {
  
  const objects = canvas.getObjects();
  const point = canvas.getViewportPoint(pointer);
  const allFrames = objects.filter(obj => obj instanceof Frame && canvas._checkTarget(obj, point) && !isExcludedFrame.includes(obj as Frame));
  
  return allFrames;
}

export function isObjectFullyContained(canvas: CustomCanvas, object: fabric.FabricObject | undefined, frame: Frame): boolean {
  
  const activeObjectBounds = object!.getBoundingRect();
  
  const frameBounds = frame.getBoundingRect();

  
  return (
    activeObjectBounds.left >= frameBounds.left &&
    activeObjectBounds.top >= frameBounds.top &&
    activeObjectBounds.left + activeObjectBounds.width <= frameBounds.left + frameBounds.width &&
    activeObjectBounds.top + activeObjectBounds.height <= frameBounds.top + frameBounds.height
  );
}