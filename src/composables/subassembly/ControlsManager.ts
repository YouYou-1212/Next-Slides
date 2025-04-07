import * as fabric from "fabric";
import { CanvasManager } from "../canvas/CanvasManager";
import { Frame } from "../slides/Frame";
import { PageFrame } from "../slides/PageFrame";
import { TextControl } from "./controls/TextControl";
import { ImageControl } from "./controls/ImageControl";
import { ShapeControl } from "./controls/ShapeControl";
import { SIZES } from "../../constants/theme";
import { CustomCanvas } from "../canvas/CustomCanvas";
import { markRaw } from "vue";
import { PictureControl } from "./controls/PictureControl";
import type { GroupControl } from "./controls/GroupControl";
import type { FabricObject } from "fabric";

export class ControlsManager {
  private canvas: CustomCanvas;
  private canvasManager: CanvasManager;

  constructor(canvas: CustomCanvas, canvasManager: CanvasManager) {
    this.canvas = canvas;
    this.canvasManager = canvasManager;
    this.initPageFrame();
  }

  private initPageFrame() {
    console.warn(
      "initPageFrame",
      this.canvasManager.getPageFrameManager()
    );
  }


  private getTargetFrame() {
    
    const vp = this.canvas.getVpCenter();
    const centerPoint = { x: vp.x, y: vp.y };
    
    return this.getFrameContainingPoint(centerPoint);
  }

  
  private getFrameContainingPoint(point: {
    x: number;
    y: number;
  }): fabric.FabricObject | null {
    const frames = this.canvasManager.getAllFrames();

    
    for (const frame of frames) {
      
      const frameBounds = frame.getBoundingRect();
      
      if (
        point.x >= frameBounds.left &&
        point.x <= frameBounds.left + frameBounds.width &&
        point.y >= frameBounds.top &&
        point.y <= frameBounds.top + frameBounds.height
      ) {
        return frame;
      }
    }

    const currentPageFrame = this.canvasManager.getPageFrame();
    
    return currentPageFrame;
  }

  
  private getVisibleCenter() {
    const vp = this.canvas.getVpCenter();
    return {
      x: vp.x,
      y: vp.y,
    };
  }

  
  private async addControl<T extends fabric.FabricObject>(
    createControlFn: (options: any) => Promise<T> | T,
    options: any = {}
  ) {
    const targetFrame = this.getTargetFrame();
    if (!targetFrame) {
      console.warn("No active frame and no page frame found");
      return null;
    }
    try {
      
      const control = await createControlFn(options);
      
      control.set("_originalLeft", control.left - targetFrame.left);
      control.set("_originalTop", control.top - targetFrame.top);
      control.set("_originalAngle", control.angle || 0);

      
      if (targetFrame instanceof Frame) {
        (targetFrame as Frame).addContent(control);
      }
      this.canvas.add(markRaw(control));
      this.canvas.setActiveObject(control);
      return control;
    } catch (error) {
      console.error("Failed to add control:", error);
      return null;
    }
  }


  
  addObject(...object: FabricObject[]) {
    
    object.forEach(element => {
      this.canvas.add(markRaw(element));
    });
  }


  
  
  addText(options: any = {}) {
    const center = this.getVisibleCenter();
    const defaultFontSize = 40; 
    const zoom = this.canvas.getZoom();

    const createTextControl = (opts: any) => {
      return new TextControl("双击编辑文本", {
        left: opts.left !== undefined ? opts.left : center.x,
        top: opts.top !== undefined ? opts.top : center.y,
        borderWidth: 1 / zoom, 
        lineWidth: SIZES.BORDER_LINE_WIDTH_TEXT / zoom,
        fontSize: Math.round(defaultFontSize / zoom),
        ...opts,
      });
    };

    return this.addControl(createTextControl, options);
  }

  
  addImage(url: string, type?: string, options: any = {}) {
    const center = this.getVisibleCenter();
    const zoom = this.canvas.getZoom();

    const createImageControl = async (opts: any): Promise<PictureControl> => {
      const image = await PictureControl.create(url, {
        left: opts.left !== undefined ? opts.left : center.x,
        top: opts.top !== undefined ? opts.top : center.y,
        scaleX: PictureControl.isSvgUrl(url, type) ? 1 : 0.5 / zoom,
        scaleY: PictureControl.isSvgUrl(url, type) ? 1 : 0.5 / zoom,
        type: type,
        ...opts,
      });
      return image as PictureControl;
    };

    return this.addControl<PictureControl>(createImageControl, options);
  }


  
  addShape(type: string, options: any = {}) {
    const center = this.getVisibleCenter();
    const zoom = this.canvas.getZoom();
    const createShapeControl = (opts: any): fabric.Object => {
      const baseOptions = {
        left: opts.left !== undefined ? opts.left : center.x,
        top: opts.top !== undefined ? opts.top : center.y,
        ...opts,
      };
      console.warn("addShape active frame", ShapeControl);
      const shape = ShapeControl.create(type, baseOptions);
      
      if (!shape) {
        throw new Error(`Failed to create shape of type: ${type}`);
      }
      return shape;
    };
    return this.addControl<fabric.Object>(createShapeControl, options);
  }


  addGroup(groupControl: GroupControl, options: any = {}) {
    

    const createGroupControl = (opts: any): GroupControl => {
      
      
      
      
      
      

      return groupControl;
    };
    return this.addControl<GroupControl>(createGroupControl, options);
  }


  
  async addClonedObject(originalObject: fabric.Object, options: any = {}) {
    const center = this.getVisibleCenter();
    const objectType = originalObject.type;

    const createGenericClone = async (opts: any): Promise<fabric.Object> => {
      try {
        const cloned = await originalObject.clone();
        cloned.set({
          left: opts.left !== undefined ? opts.left : center.x,
          top: opts.top !== undefined ? opts.top : center.y,
          ...opts,
        });
        return cloned;
      } catch (error) {
        console.error("克隆对象失败:", error);
        throw error;
      }
    };
    return this.addControl(createGenericClone, options);

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

    
    
  }

}
