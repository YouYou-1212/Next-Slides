
import * as fabric from "fabric";
import { Slides } from "./Slides";
import type { PageFrameOptions } from "../../types/canvas";

export class PageFrame extends Slides {
  static type = "pageframe";
  initialLeft: number;
  initialTop: number;

  constructor(options: any) {
    
    const pageFrameOptions = {
      ...options,
    };

    super(pageFrameOptions);
    this.initialLeft = options.left;
    this.initialTop = options.top;
  }

  
  initializeControls() {
    super.initializeControls();

    
    this.setControlsVisibility({
      
      mtr: false, 
      bl: true, 
      br: true, 
      tl: true, 
      tr: true, 
      mb: false, 
      ml: false, 
      mr: false, 
      mt: false, 
    });
  }

  toJSON() {
    return {
      ...super.toJSON(),
      initialLeft: this.initialLeft,
      initialTop: this.initialTop,
    };
  }

}


fabric.classRegistry.setClass(PageFrame, PageFrame.type);

fabric.classRegistry.setSVGClass(PageFrame, PageFrame.type);