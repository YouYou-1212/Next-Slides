import * as fabric from "fabric";
import { COLORS, SIZES } from "../../../constants/theme";
import { CanvasManager } from "../CanvasManager";
import { Frame } from "../../slides/Frame";
import { EventManager } from "../EventManager";
import { findObjectsByPosition, findTargetObject, isPointInObject, isPointOnRectBorder } from "../../../utils/CanvasUtils";
import { Slides } from "../../slides/Slides";
import { CustomCanvas } from "../CustomCanvas";
import { TextControl } from "../../../composables/subassembly/controls/TextControl";
import { EventBus, EventTypes } from "../../../utils/EventBus";
import { GroupControl } from "../../../composables/subassembly/controls/GroupControl";
import { clearObjectHover, setObjectHover } from "../../../utils/ObjectUtils";

export class MouseEventHandler {
  private canvas: CustomCanvas;
  private canvasManager: CanvasManager;
  private eventManager: EventManager;
  private lastPosX = 0;
  private lastPosY = 0;
  
  private currentHoverObject: any = null;

  constructor(
    canvas: CustomCanvas,
    canvasManager: CanvasManager,
    eventManager: EventManager
  ) {
    this.canvas = canvas;
    this.canvasManager = canvasManager;
    this.eventManager = eventManager;

    
    this.initMouseEvents();
  }

  private initMouseEvents() {
    this.setupMouseDownEvents();
    this.setupMouseMoveEvents();
    this.setupMouseUpEvents();
    this.setupMouseWheelEvents();
    this.setupMouseOverEvents();
    this.setupMouseOutEvents();
  }



  private setupMouseOverEvents() {
    this.canvas.on("mouse:over", (opt: any) => {
      const target = opt.target;
      
      setObjectHover(this.canvas, target);
    });
  }



  private setupMouseOutEvents() {
    this.canvas.on("mouse:out", (opt: any) => {
      const target = opt.target;
      clearObjectHover(this.canvas , target);
    });
  }

  
  
  
  
  
  
  
  
  
  
  
  
  

  
  private setupMouseDownEvents() {
    this.canvas.on("mouse:down", (opt: any) => {
      if (!this.canvasManager.isDragMode()) {
        this.canvas.selection = true;
      }
      this.lastPosX = opt.e.clientX;
      this.lastPosY = opt.e.clientY;
    });
  }

  
  private setupMouseMoveEvents() {
    
    this.canvas.on("mouse:move", (opt: any) => {
      const pointer = this.canvas.getViewportPoint(opt);
      if (this.canvasManager.isDragMode()) return;
      
      if (this.canvas.isDraggingObject) return;
      
    });
  }


  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  
  
  
  
  
  
  

  
  
  
  
  

  
  private setupMouseUpEvents() {
    this.canvas.on("mouse:up", () => {

    });
  }

  
  private setupMouseWheelEvents() {
    this.canvas.on("mouse:wheel", (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = this.canvas.getZoom();
      zoom *= 0.99985 ** delta;
      zoom = Math.min(Math.max(SIZES.MIN_ZOOM, zoom), SIZES.MAX_ZOOM);

      const point = {
        x: opt.e.offsetX,
        y: opt.e.offsetY,
      };

      this.canvas.zoomToPoint(new fabric.Point(point.x, point.y), zoom);
      
      EventBus.emit(EventTypes.CANVAS.ZOOM_CHANGE);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  }


  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  
  
  
  
  
  
  
  
  
  
  

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  


  
  
  
  
  
  
  
  

  
  
  
  
  
  
  

  
  
  

  

  
  
  
  
  
  
  
  
  
  
  
  
  

  public destroy() {
    
    this.canvas.off("mouse:down");
    this.canvas.off("mouse:move");
    this.canvas.off("mouse:up");
    this.canvas.off("mouse:wheel");
    
    
    
    
    
    
  }
}
