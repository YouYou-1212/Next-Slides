import { Frame } from "./Frame";
import * as fabric from "fabric";
import type { FrameOptions, FrameNumberStyle } from "../../types/canvas";
import { ColorUtils } from "../../utils/ColorUtils";
import { COLORS } from "../../constants/theme";
import { FrameEventHandler } from "./events/FrameEventHandler";
import { EventBus, EventTypes } from "../../utils/EventBus";
import type { CustomCanvas } from "../canvas/CustomCanvas";

export class FrameManager {
  private frames: Map<string, Frame> = new Map();
  private canvas: CustomCanvas;
  private frameEventHandler: FrameEventHandler;
  private currentFrame: Frame | null = null;

  constructor(canvas: CustomCanvas) {
    this.canvas = canvas;
    this.frameEventHandler = new FrameEventHandler(canvas, this);
  }

  
  createFrame(options: FrameOptions): Frame {
    
    const order = this.frames.size + 1;
    
    

    const frame = new Frame({
      ...options,
      
      
      order: order,
    });
    
    this.frameEventHandler.setupFrameEvents(frame);

    this.frames.set(frame.id, frame);
    this.canvas.add(frame);

    
    

    this.canvas.requestRenderAll();

    
    EventBus.emit(EventTypes.FRAME.FRAME_ADDED, {
      frameId: frame.id,
      frame: frame,
      framesCount: this.frames.size,
      frames: this.getAllFrames()
    });

    
    
    
    
    

    return frame;
  }

  
  public updateNumberPositionForFrame(frame: Frame) {
    
  }

  
  deleteFrame(frameId: string) {
    const frame = this.frames.get(frameId);
    if (frame) {
      frame.clearContents();
      this.canvas.remove(frame);
      this.frames.delete(frameId);

      
      EventBus.emit(EventTypes.FRAME.FRAME_REMOVED, {
        frameId: frameId,
        framesCount: this.frames.size,
        frames: this.getAllFrames()
      });
    }

    
    this.updateFrameOrder();

    
    
    
    
    
  }

  
  getFrame(frameId: string): Frame | undefined {
    return this.frames.get(frameId);
  }

  
  getAllFrames(): Frame[] {
    return Array.from(this.frames.values()).sort((a, b) => a.order - b.order);
  }

  
  setCurrentFrame(frame: Frame | null) {
    this.currentFrame = frame;

    
    if (frame) {
      EventBus.emit(EventTypes.FRAME.FRAME_UPDATED, {
        frameId: frame.id,
        frame: frame,
        isCurrent: true
      });
    }
  }

  
  getCurrentFrame(): Frame | null {
    return this.currentFrame;
  }

  
  private updateFrameOrder() {
    const frames = Array.from(this.frames.values());
    frames.sort((a, b) => a.order - b.order);

    frames.forEach((frame, index) => {
      const newOrder = index + 1;
      frame.order = newOrder;

      
    });
    

    
    EventBus.emit(EventTypes.FRAME.FRAMES_REORDERED, {
      frames: this.getAllFrames()
    });
  }



  public addContentToFrame(frame: Frame, object: fabric.FabricObject) {
    frame.addContent(object);
  }


  public removeContent(object: fabric.FabricObject , frame:Frame){
    frame.removeContent(object);
  }
  


public updateReferences() {
  
  const canvas = this.canvas;
  const objects = canvas.getObjects();
  
  
  const frames = objects.filter(obj => obj.type === Frame.type) as Frame[];
  
  
  this.frames.clear();
  
  
  frames.forEach(frame => {
    this.frames.set(frame.id, frame);
    
    EventBus.emit(EventTypes.CANVAS.CANVAS_UPDATE, { type: EventTypes.CANVAS.CANVAS_UPDATE, target: frame });
  });
  
  
  
  if (!this.currentFrame && frames.length > 0) {
    this.currentFrame = frames[0];
  }
}


  
  moveFrameUp(frameId: string) {
    const frame = this.frames.get(frameId);
    if (frame && frame.order > 1) {
      const prevFrame = this.findFrameByOrder(frame.order - 1);
      if (prevFrame) {
        const tempOrder = frame.order;
        frame.order = prevFrame.order;
        prevFrame.order = tempOrder;
        this.canvas.requestRenderAll();

        
        this.updateFrameOrder();
      }
    }
  }

  moveFrameDown(frameId: string) {
    const frame = this.frames.get(frameId);
    if (frame && frame.order < this.frames.size) {
      const nextFrame = this.findFrameByOrder(frame.order + 1);
      if (nextFrame) {
        const tempOrder = frame.order;
        frame.order = nextFrame.order;
        nextFrame.order = tempOrder;
        this.canvas.requestRenderAll();

        
        this.updateFrameOrder();
      }
    }
  }

  private findFrameByOrder(order: number): Frame | undefined {
    return Array.from(this.frames.values()).find(
      (frame) => frame.order === order
    );
  }

  
  public findParentFrame(object: fabric.Object): Frame | null {
    return (
      (this.getAllFrames()
        .find((frame) => (frame as Frame).contents.has(object)) as Frame) ||
      null
    );
  }

  
  clear() {
    this.frames.forEach((frame) => {
      this.canvas.remove(frame);
    });
    this.frames.clear();
    this.currentFrame = null;

    
    EventBus.emit(EventTypes.FRAME.FRAMES_CLEARED, {
      framesCount: 0
    });
  }
}
