import * as fabric from "fabric";
import { CanvasManager } from "../../../composables/canvas/CanvasManager";
import { PageFrame } from "../PageFrame";
import { PageFrameManager } from "../PageFrameManager";

export class PageFrameEventHandler {
  private canvas: fabric.Canvas;
  private pageFrameManager: PageFrameManager;

  constructor(canvas: fabric.Canvas, pageFrameManager: PageFrameManager) {
    this.canvas = canvas;
    this.pageFrameManager = pageFrameManager;
  }

  
  public setupPageFrameEvents(pageFrame: PageFrame) {
    
    pageFrame.off("moving");
    pageFrame.off("scaling");

    
    pageFrame.on("moving", (e) => this.handlePageFrameMoving(pageFrame, e));
    pageFrame.on("scaling", (e) => this.handlePageFrameScaling(pageFrame, e));
  }

  
  private handlePageFrameMoving(pageFrame: PageFrame, event: any) {
    if (!event || !event.target) return;
    const target = event.target;

    const deltaX = target.left - target.initialLeft;
    const deltaY = target.top - target.initialTop;

    target.initialLeft = target.left;
    target.initialTop = target.top;

    this.canvas.requestRenderAll();
  }

  
  private handlePageFrameScaling(pageFrame: PageFrame, event: any) {
    
  }
}