import * as fabric from "fabric";
import { COLORS, SIZES } from "../../../constants/theme";
import { CanvasManager } from "../CanvasManager";
import { Frame } from "../../slides/Frame";
import { PageFrame } from "../../slides/PageFrame";
import { EventBus, EventTypes } from "../../../utils/EventBus";
import { TextControl } from "../../../composables/subassembly/controls/TextControl";
import { Slides } from "../../../composables/slides/Slides";
import { ImageControl } from "../../../composables/subassembly/controls/ImageControl";
import { PictureControl } from "../../../composables/subassembly/controls/PictureControl";
import type { CustomCanvas } from "../CustomCanvas";
import { clearObjectHover, setObjectHover } from "../../../utils/ObjectUtils";
import { MyActiveSelection } from "../../../composables/subassembly/controls/MyActiveSelection";

export class SelectionEventHandler {
  private canvas: CustomCanvas;
  private canvasManager: CanvasManager;

  constructor(canvas: CustomCanvas, canvasManager: CanvasManager) {
    this.canvas = canvas;
    this.canvasManager = canvasManager;
    this.setupSelectionEvents();
  }

  
  private setupSelectionEvents() {
    this.canvas.on("selection:created", this.handleSelection.bind(this));
    this.canvas.on("selection:updated", this.handleSelection.bind(this));
    this.canvas.on("selection:cleared", this.handleSelectionCleared.bind(this));
  }

  private handleSelection(event: any) {
    let activeSelection = this.canvas.getActiveObject();
    
    const target = event.selected;
    
    if (!target) return;
    this.handleSelectionEventBorderStatus(event);


    
    
    
    
    
    
    
    

    
    
    
    
    
    


    
    
    
    
    


    
    
    
    
    
    
    this.toggleFrameNumberControls(target);
  }

  private handleSelectionCleared(event: any) {
    
    this.canvasManager.getFrameManager().setCurrentFrame(null);
    this.handleSelectionEventBorderStatus(event);
    
    this.toggleFrameNumberControls(null);
    
    
    

    const deselectedObjects = event.deselected;
    
    
    
    
    
    
    
    
  }

  private handleSelectionEventBorderStatus(event: any) {
    const deselectedObjects = event.deselected;
    if (deselectedObjects?.length > 0) {
      deselectedObjects.forEach((target: any) => {
        if (target instanceof Slides) {
          clearObjectHover(this.canvas, target);
          return;
        }
        
        
        
        
        
      });
    }


    
    const selectedObjects = event.selected;
    if (selectedObjects?.length > 0) {
      selectedObjects.forEach((target: any) => {
        if (target.type === PageFrame.type || target.type === Frame.type) {
          
          if (target._originalCustomBorderColor === undefined) {
            target._originalBorderColor = target.borderColor;
            target._originalCustomBorderColor = target.customBorderColor;
            target._originalStrokeWidth = target.strokeWidth;
            target._originalBorderScaleFactor = target.borderScaleFactor;
            
            target.set({
              borderColor: COLORS.BORDER.SLIDES_HOVER,
              customBorderColor: COLORS.BORDER.SLIDES_HOVER,
              strokeWidth: SIZES.STROKE_WIDTH,
              
            });
            this.canvas.requestRenderAll();
          }
          return;
        }
      });
    }

  }

  private restoreOriginalState(target: any) {
    
    if (target._originalCustomBorderColor !== undefined) {
      const restoreProps: any = {
        borderColor: target._originalBorderColor,
      };

      if (target.type !== TextControl.type) {
        restoreProps.customBorderColor = target._originalCustomBorderColor;
      }

      target.set(restoreProps);

      delete target._originalBorderColor;
      delete target._originalStroke;
      delete target._originalStrokeWidth;
      delete target._originalBorderScaleFactor;
      delete target._originalCustomBorderColor;

      this.canvas.requestRenderAll();
    }
  }

  
  private toggleFrameNumberControls(target: any) {
    
    if (!target) {
      
      this.hideAllFrameNumberControls();
      return;
    }
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length > 0 && this.hasFrameSelected()) {
      this.showAllFrameNumberControls(target);
    } else {
      this.hideAllFrameNumberControls();
    }
  }

  
  private hasFrameSelected(): boolean {
    const activeObjects = this.canvas.getActiveObjects();
    return activeObjects.some((obj: any) => obj instanceof Frame);
  }

  
  private showAllFrameNumberControls(target: Frame) {
    
    const allObjects = this.canvas.getObjects();
    allObjects.forEach((obj: any) => {
      if (obj instanceof Frame) {
        obj.setNumberControlVisibility(true);
        obj.isCurrentSelected = obj === target;
      }
    });
    this.canvas.requestRenderAll();
  }

  
  private hideAllFrameNumberControls() {
    const allObjects = this.canvas.getObjects();
    allObjects.forEach((obj: any) => {
      if (obj instanceof Frame) {
        obj.setNumberControlVisibility(false);
        obj.isCurrentSelected = false;
      }
    });
    this.canvas.requestRenderAll();
  }

  
  private showTextSettingToolbar(target: fabric.Object) {
    if (!target || (target.type !== TextControl.type)) return;
    EventBus.emit(EventTypes.CONTROL_PANEL.SHOW_TEXT_SETTING_TOOLBAR, {
      target,
      canvas: this.canvas,
      canvasManager: this.canvasManager
    });
  }

  
  private hideTextSettingToolbar() {
    EventBus.emit(EventTypes.CONTROL_PANEL.HIDE_TEXT_SETTING_TOOLBAR);
  }


  
  private showImageSettingToolbar(target: fabric.Object) {
    if (!target) return;
    EventBus.emit(EventTypes.CONTROL_PANEL.SHOW_IMAGE_SETTING_TOOLBAR, {
      target,
      canvas: this.canvas,
      canvasManager: this.canvasManager
    });
  }

  
  private hideImageSettingToolbar() {
    EventBus.emit(EventTypes.CONTROL_PANEL.HIDE_IMAGE_SETTING_TOOLBAR);
  }


  private updateFrameLayerIndex(frame: Frame) {
    this.canvas.bringObjectToFront
  }

  public destroy() {
    this.canvas.off("selection:created");
    this.canvas.off("selection:updated");
    this.canvas.off("selection:cleared");
  }
}
