
import * as fabric from "fabric";
import { Frame } from "../slides/Frame";
import { PageFrameManager } from "../slides/PageFrameManager";
import { FrameManager } from "../slides/FrameManager";
import { ControlsManager } from "../subassembly/ControlsManager";
import { ContextMenuManager } from "../menu/ContextMenuManager";

import { initAligningGuidelines } from '../../../node_modules/fabric/extensions';
import { ModeManager } from "./ModeManager";
import { COLORS, SIZES, STYLES } from "../../constants/theme";
import { EventManager } from "./EventManager";
import { calculateViewportInfo, setCanvasManager } from "../../utils/CanvasUtils";
import { CanvasSyncManager } from "./CanvasSyncManager";
import { CustomCanvas } from "./CustomCanvas";
import type { Slides } from "../slides/Slides";


import defaultTemplate from '../../../public/res/NextSlide_Export_20250318_1151.json';


export interface CanvasOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  selection?: boolean;
  preserveObjectStacking?: boolean;
}

export class CanvasManager {
  
  private controlsManager: ControlsManager;
  
  private canvas: CustomCanvas;
  
  private presentationCanvas: fabric.Canvas;
  
  private canvasSyncManager: CanvasSyncManager;

  private pageFrameManager: PageFrameManager;
  private frameManager: FrameManager;
  private modeManager: ModeManager;
  
  private eventManager: EventManager;
  
  private isDragging = false;
  private lastPosX = 0;
  private lastPosY = 0;
  private contextMenuManager: ContextMenuManager;
  
  private isSpaceDragging = false;
  private currentDragMode: 'default' | 'pan' | 'select' = 'default';

  constructor(
    canvasElement: HTMLCanvasElement,
    presentationCanvasElement: HTMLCanvasElement,
    containerElement: HTMLElement,
    options: CanvasOptions = {}
  ) {
    
    const defaultOptions = {
      width: containerElement.clientWidth,
      height: containerElement.clientHeight,
      backgroundColor: "#00000000",
      selection: true,
      preserveObjectStacking: true,
      allowTouchScrolling: false,
      stopContextMenu: true,
      skipOffscreen: true, 
      fireRightClick: false, 
      fireMiddleClick: false, 
      enableRetinaScaling: true, 
      renderOnAddRemove: true, 
      stateful: false, 
      
      ...options,
    };

    this.canvas = new CustomCanvas(canvasElement, defaultOptions);
    this.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    
    this.presentationCanvas = new fabric.Canvas(presentationCanvasElement, {
      ...defaultOptions,
      selection: false,
      
    });
    this.presentationCanvas.viewportTransform = [1, 0, 0, 1, 0, 0];

    
    this.canvasSyncManager = new CanvasSyncManager(
      this.canvas,
      this.presentationCanvas
    );

    
    
    
    

    
    this.canvas.wrapperEl.style.transform = "translateZ(0)";
    this.canvas.wrapperEl.style.backfaceVisibility = "hidden";
    this.canvas.wrapperEl.style.perspective = "1000px";
    this.canvas.wrapperEl.style.willChange = "transform";

    
    this.presentationCanvas.wrapperEl.style.transform = "translateZ(0)";
    this.presentationCanvas.wrapperEl.style.backfaceVisibility = "hidden";
    this.presentationCanvas.wrapperEl.style.perspective = "1000px";
    this.presentationCanvas.wrapperEl.style.willChange = "transform";

    
    this.canvas.selection = true;
    this.canvas.skipTargetFind = false;
    this.canvas.perPixelTargetFind = false;
    this.canvas.targetFindTolerance = 4;
    this.canvas.selection = true; 


    
    this.canvas.selectionKey = "ctrlKey";
    this.canvas.selectionFullyContained = true; 
    this.canvas.selectionColor = 'rgba(100, 100, 255, 0.3)'; 
    this.canvas.selectionBorderColor = COLORS.BORDER.SELECTED; 
    this.canvas.selectionLineWidth = 1.5; 

    fabric.InteractiveFabricObject.createControls = function () {
      
      const controls = fabric.controlsUtils.createObjectDefaultControls();
      
      delete (controls as any).mtr;
      return { controls };
    };

    
    fabric.InteractiveFabricObject.ownDefaults = {
      ...fabric.InteractiveFabricObject.ownDefaults,
      cornerColor: STYLES.CORNER.COLOR,
      cornerStyle: STYLES.CORNER.STYLE,
      padding: SIZES.PADDING_0,
      cornerSize: STYLES.CORNER.SIZE,
      borderScaleFactor: 2,
      transparentCorners: STYLES.CORNER.TRANSPARENT,
      lockRotation: false,
    };

    
    this.initAligningGuidelines();

    
    this.pageFrameManager = new PageFrameManager(this.canvas);
    this.frameManager = this.pageFrameManager.getFrameManager();
    this.controlsManager = new ControlsManager(this.canvas, this);
    
    this.modeManager = new ModeManager(this.canvas, this.presentationCanvas);
    
    this.eventManager = new EventManager(this.canvas, this);
    
    this.contextMenuManager = new ContextMenuManager(this.canvas, this);

    this.initPageFramge();
    this.initResizeListener();

    setCanvasManager(this);

    
    this.importCanvasFromJSON(defaultTemplate);
  }


  
  initAligningGuidelines() {
    const config = {
      margin: 4,
      width: 1,
      color: 'rgb(255,0,0,0.9)',
    };

    const deactivate = initAligningGuidelines(this.canvas, config);
  }

  
  initPageFramge() {
    const page = this.createPageFrame();
    this.canvas.add(page);
    this.canvas.centerObject(page);
    this.canvas.bringObjectToFront(page);
  }

  initResizeListener() {
    
    window.addEventListener("resize", () => {
      
      const container = this.canvas.wrapperEl?.parentElement;
      if (!container) return;

      
      this.canvas.setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });

      
      this.canvas.requestRenderAll();
    });

    
    window.dispatchEvent(new Event("resize"));
  }

  
  public getControlsManager() {
    return this.controlsManager;
  }

  public getModeManager(): ModeManager {
    return this.modeManager;
  }

  
  public createPageFrame() {
    return this.pageFrameManager.createDefaultPage();
  }

  public getPageFrame() {
    return this.pageFrameManager.getPageFrame();
  }

  
  public addNewFrame() {
    return this.pageFrameManager.addNewFrame();
  }

  
  public getCurrentFrame() {
    return this.frameManager.getCurrentFrame();
  }

  public getAllFrames() {
    const frames = this.frameManager.getAllFrames();
    return frames;
  }


  
  public getAllSlides() {
    const pageFrame = this.getPageFrame();
    const frames = this.frameManager.getAllFrames();

    
    return pageFrame ? [pageFrame, ...frames] : frames;
  }


  public deleteFrame(frameId: string) {
    this.pageFrameManager.deleteFrame(frameId);
  }

  public moveFrameUp(frameId: string) {
    this.frameManager.moveFrameUp(frameId);
  }

  public moveFrameDown(frameId: string) {
    this.frameManager.moveFrameDown(frameId);
  }

  
  public handleResize(width: number, height: number) {
    this.canvas.setDimensions({ width, height });
    this.presentationCanvas.setDimensions({ width, height });
  }

  public destroy() {
    
    this.disablePanMode();
    this.canvas.dispose();
    this.presentationCanvas.dispose();

    
    this.canvasSyncManager.destroy();
    if (this.canvasSyncManager) {
      this.canvasSyncManager.destroy();
    }
  }

  
  public navigateToFrame(frame: Slides) {
    
    const canvas = this.getMainCanvas();
    const viewportInfo: any = calculateViewportInfo(canvas, frame)
    
    canvas.setViewportTransform(viewportInfo.transform);
  };

  public setZoom(zoom: number) {
    const centerPoint:fabric.Point = this.canvas.getVpCenter();
    this.canvas.zoomToPoint(centerPoint , zoom);
  }

  public getZoom() {
    return this.canvas.getZoom();
  }

  public setBackgroundColor(color: string) {
    this.canvas.backgroundColor = color;
    this.canvas.requestRenderAll();
  }

  
  public getPageFrameManager() {
    return this.pageFrameManager;
  }

  public getFrameManager() {
    return this.frameManager;
  }

  public getAllObjects() {
    return this.canvas.getObjects();
  }

  public getMainCanvas() {
    return this.canvas;
  }

  public getPresentationCanvas() {
    return this.presentationCanvas;
  }

  public clear() {
    this.pageFrameManager.clear();
    this.canvas.clear();
  }


  
  public removeObject(object: fabric.Object) {
    const parentFrame = this.getFrameManager().findParentFrame(object);
    if (parentFrame) {
      parentFrame.removeContent(object);
    }
    this.canvas.remove(object);
  }

  
  public setDragMode(mode: 'default' | 'pan' | 'select'  , isSpaceDragging = false) {
    
    if (this.currentDragMode === mode) return;
    this.isSpaceDragging = isSpaceDragging;

    
    this.currentDragMode = mode;

    
    const canvas = this.getMainCanvas();

    
    switch (mode) {
      case 'pan':
        canvas.selection = false;
        canvas.skipTargetFind = true;
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';
        canvas.moveCursor = 'grabbing';
        this.enablePanMode();
        break;

      case 'select':
        canvas.selection = true;
        canvas.skipTargetFind = false;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
        canvas.moveCursor = 'move';
        this.disablePanMode();
        break;

      case 'default':
      default:
        
        canvas.selection = true;
        canvas.skipTargetFind = false;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
        canvas.moveCursor = 'move';

        
        this.disablePanMode();
        break;
    }

    
    canvas.requestRenderAll();
  }


  
  private enablePanMode() {
    const canvas = this.getMainCanvas();

    
    this.disablePanMode();

    
    canvas.on('mouse:down', this.handlePanMouseDown);
    
    canvas.on('mouse:move', this.handlePanMouseMove);
    
    canvas.on('mouse:up', this.handlePanMouseUp);
  }

  
  private disablePanMode() {
    const canvas = this.getMainCanvas();

    
    canvas.off('mouse:down', this.handlePanMouseDown);
    canvas.off('mouse:move', this.handlePanMouseMove);
    canvas.off('mouse:up', this.handlePanMouseUp);

    
    this.isDragging = false;
  }

  
  private handlePanMouseDown = (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
    if (!opt) return;

    
    this.isDragging = true;

    
    this.lastPosX = opt.viewportPoint.x;
    this.lastPosY = opt.viewportPoint.y;

    
    this.canvas.defaultCursor = 'grabbing';
  };

  
  private handlePanMouseMove = (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
    if (!this.isDragging) return;

    if (!opt) return;

   
   const deltaX = opt.viewportPoint.x - this.lastPosX;
   const deltaY = opt.viewportPoint.y - this.lastPosY;

    
    this.lastPosX = opt.viewportPoint.x;
    this.lastPosY = opt.viewportPoint.y;

    
    const vpt = this.canvas.viewportTransform;
    if (!vpt) return;

    
    vpt[4] += deltaX;
    vpt[5] += deltaY;

    
    this.canvas.setViewportTransform(vpt);

    
    const evt = opt.e;
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }
  };

  
  private handlePanMouseUp = () => {
    
    this.isDragging = false;

    
    this.canvas.defaultCursor = 'grab';
  };

  
  public getDragMode() {
    return this.currentDragMode;
  }


  
  public isDragMode() {
    return this.currentDragMode === 'pan' ? true : false; 
  }



  
  public exportCanvasToJSON() {
    try {
      
      this.canvas.discardActiveObject();
      const currentTransform: any = [...this.canvas.viewportTransform!];
      
      this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      
      const canvasJSON = this.canvas.toJSON();
      
      this.canvas.setViewportTransform(currentTransform);

      
      const blob = new Blob([JSON.stringify(canvasJSON, null, 2)], { type: 'application/json' });

      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      
      const date = new Date();
      const fileName = `NextSlide_Export_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}.json`;
      link.download = fileName;

      
      document.body.appendChild(link);
      link.click();

      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      
    } catch (error) {
      console.error('导出画布失败:', error);
    }
  }

  
  public importCanvasFromJSON(jsonData: string | object) {
    
    try {
      
      this.clear();

      
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      
      this.canvas.loadFromJSON(data).then(() => {
        
        
        
        this.canvas.requestRenderAll();

        
        this.pageFrameManager.updateReferences();
      });
    } catch (error) {
      console.error('导入画布失败:', error);
    }
  }

}
