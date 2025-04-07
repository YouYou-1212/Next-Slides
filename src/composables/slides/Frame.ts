
import * as fabric from "fabric";
import { Slides } from "./Slides";
import type { FrameOptions } from "../../types/canvas";
import { COLORS } from "../../constants/theme";

export class Frame extends Slides {
  static type = "frame";
  declare parentPage: any;
  declare contents: Set<any>;
  declare _originalLeft: number;
  declare _originalTop: number;
  declare order: number;

  
  
  
  declare isCurrentSelected: boolean;

  constructor(options: any) {
    const frameOptions = {
      ...options,
    };

    super(frameOptions);
    this.parentPage = options.parentPage;
    this.contents = new Set();
    this._originalLeft = options.left;
    this._originalTop = options.top;
    this.order = options.order || 0;

    
    

    
    this.initFrameNumberControl();
  }

  initFrameNumberControl() {
    
    const originalTlControl = this.controls.tl;
    this.controls.frameNumberCorner = new fabric.Control({
      x: -0.5,
      y: -0.5,
      offsetX: 3,
      offsetY: 3,
      cursorStyle: "nwse-resize",
      render: this.renderCustomCorner,
      
      mouseDownHandler: function (eventData, transformData, x, y) {
        transformData.originX = "right";
        transformData.originY = "bottom";
        
        transformData.corner = "tl";
        
        return originalTlControl.mouseDownHandler?.call(
          originalTlControl,
          eventData,
          transformData,
          x,
          y
        );
      },
      
      actionHandler: function (eventData, transformData, x, y) {
        return fabric.controlsUtils.scalingEqually(
          eventData,
          transformData,
          x,
          y
        );
      },
    });
  }

  public setNumberControlVisibility(isShow: boolean): void {
    this.setControlVisibility("frameNumberCorner", isShow);
    
  }

  
  renderCustomCorner = (
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    _styleOverride: any,
    fabricObject: { angle: fabric.TDegree }
  ) => {
    
    
    
    
    
    const zoom = this.canvas ? this.canvas.getZoom() : 1;
    const size = 18;
    ctx.save();
    ctx.translate(left, top);
    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));

    
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
    
    
    ctx.fillStyle = this.isCurrentSelected
      ? COLORS.BORDER.SLIDES_HOVER
      : COLORS.BORDER.UNSELECTED;
    ctx.fill();

    
    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.order.toString(), 0, 0);
    ctx.restore();
  };

  
  protected shouldRenderCustomControlsWhenInactive(): boolean {
    
    return true;
  }

  
  protected getCustomControlsToShow(): string[] {
    
    return ["frameNumberCorner"];
  }

  
  updateContents() {
    if (this.contents.size > 0) {
      const { scaleX, scaleY, left, top, angle } = this;
      this.contents.forEach((obj) => {
        if (obj && obj.set) {
          
          if (!obj.objectCaching) {
            obj.objectCaching = true;
            obj.statefull = false;
            obj.noScaleCache = false;
            obj.set("willReadFrequently", false);
            obj.set("cacheProperties", ["fill", "stroke", "strokeWidth"]);
          }
          const isNewToFrame = obj._prevFrameLeft === undefined ||
            obj._prevFrameTop === undefined ||
            obj._prevFrameId !== this.id;

          if (isNewToFrame) {
            obj._originalLeft = obj.left - left;
            obj._originalTop = obj.top - top;
            obj._originalAngle = obj.angle || 0;
          } else {
            obj.set(
              {
                left: obj.left + (this.left - obj._prevFrameLeft || 0),
                top: obj.top + (this.top - obj._prevFrameTop || 0),
                angle: angle + (obj._originalAngle || 0),
              },
              {
                statefull: false,
                skipRender: true,
              }
            );
          }
          obj._prevFrameLeft = this.left;
          obj._prevFrameTop = this.top;
          obj._prevFrameId = this.id;
          obj.setCoords();
        }
      });

      this.canvas!.requestRenderAll();
    }
  }

  
  addContent(object: fabric.FabricObject) {
    
    
    
    
    

    
    
    
    
    
    

    this.contents.add(object);
  }


  
  getContents() {
    return Array.from(this.contents);
  }


  
  removeContent(object: any) {
    this.contents.delete(object);
  }

  
  clearContents() {
    
    if (this.canvas) {
      this.contents.forEach(obj => {
        this.canvas!.remove(obj);
      });
    }
    
    this.contents.clear();
  }

  toggleContentSelectable(selectable: boolean) {
    this.contents.forEach((obj) => {
      if (obj && obj.set) {
        obj.set({
          selectable: selectable,
          evented: selectable,
        });
      }
    });
  }


  toJSON() {
    return {
      ...super.toJSON(),
      id: this.id,
      parentPage: this.parentPage,
      contents: Array.from(this.contents),
      order: this.order,
    };
  }

  toObject(propertiesToInclude: any[] = []): any {
    return super.toObject([...propertiesToInclude, 'parentPage', 'contents', 'order', 'isCurrentSelected']);
  }


}


fabric.classRegistry.setClass(Frame, Frame.type);

fabric.classRegistry.setSVGClass(Frame, Frame.type);
