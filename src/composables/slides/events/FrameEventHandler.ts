import * as fabric from "fabric";
import { Frame } from "../Frame";
import { FrameManager } from "../FrameManager";

export class FrameEventHandler {
  private canvas: fabric.Canvas;
  private frameManager: FrameManager;

  constructor(canvas: fabric.Canvas, frameManager: FrameManager) {
    this.canvas = canvas;
    this.frameManager = frameManager;
  }

  
  public setupFrameEvents(frame: Frame) {
    
    frame.off("moving");
    frame.off("rotating");
    frame.off("scaling");

    
    frame.on("moving", () => this.handleFrameMoving(frame));
    frame.on("rotating", () => this.handleFrameRotating(frame));
    frame.on("scaling", () => this.handleFrameScaling(frame));

    
    
    if (this.frameManager) {
      frame.on("moving", () => this.updateFrameNumberPosition(frame));
      frame.on("rotating", () => this.updateFrameNumberPosition(frame));
      frame.on("scaling", () => this.updateFrameNumberPosition(frame));
    }
  }

  
  private handleFrameMoving(frame: Frame) {
    frame.updateContents();
  }

  
  private handleFrameRotating(frame: Frame) {
    frame.updateContents();
  }

  
  private handleFrameScaling(frame: Frame) {
    frame.updateContents();
  }

  
  private updateFrameNumberPosition(frame: Frame) {
    
    if (this.frameManager) {
      
      this.frameManager.updateNumberPositionForFrame(frame);
    }
  }

  
  public bringFrameToFront(frame: Frame) {
    
    const objects = this.canvas.getObjects();
    const frameIndex = objects.indexOf(frame);

    
    if (frameIndex === objects.length - 1) return;

    
    this.canvas.bringObjectToFront(frame);

    
    frame.contents.forEach((content) => {
      this.canvas.bringObjectToFront(content);
    });

    this.canvas.requestRenderAll();
  }
}
