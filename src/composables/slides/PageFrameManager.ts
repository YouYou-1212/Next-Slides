import * as fabric from "fabric";
import { PageFrame } from "./PageFrame";
import { FrameManager } from "./FrameManager";
import type { PageFrameOptions } from "../../types/canvas";
import { Frame } from "./Frame";
import { PAGE_SIZE, SIZES, SLIDE_STYLES } from "../../constants/theme";
import { PageFrameEventHandler } from "./events/PageFrameEventHandler";
import { ColorUtils } from "../../utils/ColorUtils";

export class PageFrameManager {
  private canvas: any;
  private pageFrame: any;
  private frameManager: FrameManager;
  private pageFrameEventHandler: PageFrameEventHandler;

  constructor(canvas: any) {
    this.canvas = canvas;
    this.frameManager = new FrameManager(canvas);
    this.pageFrameEventHandler = new PageFrameEventHandler(canvas, this);
    this.initializeCanvas();
  }

  private initializeCanvas() {
    this.createDefaultPage();
    
  }

  
  public createDefaultPage(): PageFrame {
    const { width, height } = this.calculatePageDimensions();
    const position = this.calculatePagePosition(width, height);
    

    this.pageFrame = new PageFrame({
      ...position,
      
      
      width,
      height,
    });
    
    this.pageFrameEventHandler.setupPageFrameEvents(this.pageFrame);
    


    
    

    

    
    
    
    return this.pageFrame;
  }

  
  private calculatePageDimensions(): { width: number; height: number } {
    const zoom = this.canvas.getZoom();
    return {
      width: PAGE_SIZE.PAGE_FRAME.WIDTH / zoom,
      height: PAGE_SIZE.PAGE_FRAME.HEIGHT / zoom,
    };
  }

  
  private calculatePagePosition(
    width: number,
    height: number
  ): { left: number; top: number } {
    const vp = this.canvas.getVpCenter();
    return {
      left: vp.x - width / 2,
      top: vp.y - height / 2,
    };
  }


  
  public addNewFrame(): Frame | null {
    if (!this.pageFrame) {
      console.error("No active page");
      return null;
    }

    const frame = this.createFrame();
    if (!frame) return null;

    this.arrangeFrameInCanvas(frame);
    return frame;
  }

  
  private createFrame(): Frame | null {
    const { width, height } = this.calculateFrameDimensions();
    const position = this.calculateFramePosition(width, height);
    

    return this.frameManager.createFrame({
      ...position,
      
      width,
      height,
      parentPage: this.pageFrame,
    });
  }

  
  private calculateFrameDimensions(): { width: number; height: number } {
    const zoom = this.canvas.getZoom();
    return {
      width: PAGE_SIZE.FRAME.WIDTH / zoom,
      height: PAGE_SIZE.FRAME.HEIGHT / zoom,
    };
  }

  
  private calculateFramePosition(
    width: number,
    height: number
  ): { left: number; top: number } {
    const vp = this.canvas.getVpCenter();
    return {
      left: vp.x - width / 2,
      top: vp.y - height / 2,
    };
  }


  
  private arrangeFrameInCanvas(frame: Frame): void {
    if (!this.pageFrame) return;

    
    this.canvas.sendObjectToBack(this.pageFrame);
    
    const allFrames = this.canvas
      .getObjects()
      .filter((obj: any) => obj instanceof Frame);
    allFrames.forEach((frameObj: Frame) => {
      if (frameObj !== frame) {
        this.canvas.bringObjectToFront(frameObj);
      }
    });
    this.canvas.bringObjectToFront(frame);
    this.canvas.setActiveObject(frame);
  }

  
  public updateReferences() {
    
    const canvas = this.canvas;
    const objects = canvas.getObjects();
    
    
    const pageFrame = objects.find((obj: { type: typeof PageFrame; }) => obj.type === PageFrame);
    if (pageFrame) {
      this.pageFrame = pageFrame;
    }
    
    
    this.frameManager.updateReferences();
  }

  
  public getPageFrame(): PageFrame | null {
    return this.pageFrame;
  }

  
  public deleteFrame(frameId: string) {
    const frame = this.frameManager.getFrame(frameId);
    if (frame && this.pageFrame) {
      this.pageFrame.removeFrame(frame);
      this.frameManager.deleteFrame(frameId);
    }
  }

  
  public getCurrentFrame(): Frame | null {
    return this.frameManager.getCurrentFrame();
  }

  
  public getFrameManager(): FrameManager {
    return this.frameManager;
  }

  
  public setPageSize(width: number, height: number) {
    if (this.pageFrame) {
      this.pageFrame.set({
        width: width,
        height: height,
      });
      this.canvas.requestRenderAll();
    }
  }

  
  public clear() {
    if (this.pageFrame) {
      this.canvas.remove(this.pageFrame);
    }
    this.frameManager.clear();
    
    this.canvas.requestRenderAll();
  }

  
  public destroy(): void {
    
    this.clear();
  }
}
