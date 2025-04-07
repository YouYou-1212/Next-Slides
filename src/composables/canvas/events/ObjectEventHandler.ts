import * as fabric from "fabric";
import { CanvasManager } from "../CanvasManager";
import { Frame } from "../../slides/Frame";
import { PageFrame } from "../../slides/PageFrame";
import { EventBus, EventTypes } from "../../../utils/EventBus";
import type { CustomCanvas } from "../CustomCanvas";
import { findFramesToPoint, isObjectFullyContained } from "../../../utils/FrameUtils";
import { setObjectHover, clearObjectHover } from "../../../utils/ObjectUtils";

export class ObjectEventHandler {
  private canvas: CustomCanvas;
  private canvasManager: CanvasManager;

  
  private currentHighlightedFrame: Frame | null = null;


  constructor(canvas: CustomCanvas, canvasManager: CanvasManager) {
    this.canvas = canvas;
    this.canvasManager = canvasManager;

    
    this.setupObjectEvents();
  }

  
  private setupObjectEvents() {
    
    this.canvas.on("object:added", (e: any) => {
      const obj = e.target;
      if (!obj) return;

      EventBus.emit(EventTypes.CANVAS.CANVAS_UPDATE, { type: EventTypes.CANVAS.CANVAS_UPDATE, target: obj });
    });

    
    this.canvas.on('object:moving', (opt: any) => {
      const target = opt.target;
      if (target && typeof target.fire === 'function') {
        target.fire('moving', opt);
      }
      this.canvas.isDraggingObject = true;
      this.setHoverFrame(opt);
    });


    
    this.canvas.on('object:scaling', (opt: any) => {
      const target = opt.target;

    });

    
    this.canvas.on('object:rotating', (opt: any) => {
      const target = opt.target;

    });

    
    this.canvas.on("object:modified", (e: any) => {
      this.canvas.isDraggingObject = false;
      
      const target = e.target;
      if (!target) return;

      
      this.handleObjectFrameTransfer(target);

      EventBus.emit(EventTypes.CANVAS.CANVAS_UPDATE, { type: EventTypes.CANVAS.CANVAS_UPDATE, target: target });
    });

    
    this.canvas.on("object:removed", (e: any) => {
      
      const obj = e.target;
      if (!obj) return;

      EventBus.emit(EventTypes.CANVAS.CANVAS_UPDATE, { type: EventTypes.CANVAS.CANVAS_UPDATE, target: obj });
    });
  }


  
  private handleObjectFrameTransfer(target: fabric.Object): void {
    const frameManager = this.canvasManager.getFrameManager();
    const parentFrame = frameManager.findParentFrame(target);

    if (this.currentHighlightedFrame) {
      if (parentFrame && parentFrame !== this.currentHighlightedFrame) {
        frameManager.removeContent(target, parentFrame);
        frameManager.addContentToFrame(this.currentHighlightedFrame, target);
      } else if (!parentFrame) {
        frameManager.addContentToFrame(this.currentHighlightedFrame, target);
      }
    } else if (parentFrame) {
      frameManager.removeContent(target, parentFrame);
    }
  }


  
  public setHoverFrame(pointer: fabric.TPointerEvent) {
    const activeObject = this.canvas.getActiveObject();
    const isExcludedFrameArray = activeObject instanceof Frame ? [activeObject] : []
    const allFrames = findFramesToPoint(this.canvas, isExcludedFrameArray, pointer);

    
    if (allFrames.length === 0) {
      if (this.currentHighlightedFrame) {
        clearObjectHover(this.canvas, this.currentHighlightedFrame);
        this.currentHighlightedFrame = null;
      }
      return;
    }

    
    let targetFrame = null;

    
    if (this.currentHighlightedFrame &&
      allFrames.includes(this.currentHighlightedFrame) &&
      isObjectFullyContained(this.canvas, activeObject, this.currentHighlightedFrame)) {
      targetFrame = this.currentHighlightedFrame;
    } else {
      
      for (const frame of allFrames) {
        if (isObjectFullyContained(this.canvas, activeObject, frame as Frame)) {
          targetFrame = frame;
          break;
        }
      }

      
      if (!targetFrame && allFrames.length > 0) {
        targetFrame = allFrames[0];
      }
    }

    
    if (targetFrame !== this.currentHighlightedFrame) {
      
      if (this.currentHighlightedFrame) {
        clearObjectHover(this.canvas, this.currentHighlightedFrame);
      }

      
      if (targetFrame) {
        setObjectHover(this.canvas, targetFrame);
      }

      
      this.currentHighlightedFrame = targetFrame as Frame;
    }
  }



  public destroy() {
    this.canvas.off("object:added");
    this.canvas.off("object:modified");
    this.canvas.off("object:removed");
    this.canvas.off("object:moving");
    this.canvas.off("object:scaling");
    this.canvas.off("object:rotating");
  }

}
