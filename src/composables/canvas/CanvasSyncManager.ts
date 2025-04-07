import * as fabric from "fabric";
import { EventBus, EventTypes } from "../../utils/EventBus";
import { Frame } from "../slides/Frame";
import { PageFrame } from "../slides/PageFrame";
import { Slides } from "../slides/Slides";


export class CanvasSyncManager {
  
  private syncEnabled: boolean = true;
  private syncDebounceTimer: number | null = null;
  private syncInProgress: boolean = false;
  private pendingSync: boolean = false;
  
  private backgroundColorListener: ((payload?: any) => void) | null = null;
  private backgroundImageListener: ((payload?: any) => void) | null = null;

  
  constructor(
    private sourceCanvas: fabric.Canvas,
    private targetCanvas: fabric.Canvas
  ) {
    this.initCanvasSyncEvents();
  }

  
  private initCanvasSyncEvents() {
    
    this.sourceCanvas.on("object:added", () => this.debounceSyncCanvases());

    
    this.sourceCanvas.on("object:removed", () => this.debounceSyncCanvases());

    
    this.sourceCanvas.on("object:modified", () => this.debounceSyncCanvases());

    
    this.sourceCanvas.on("after:render", () => {
      
      if (this.pendingSync && !this.syncInProgress) {
        this.syncCanvases();
      }
    });

    
    
    

    
    this.backgroundColorListener = (payload) => {
      console.log(
        "背景颜色变化:",
        payload,
        payload.canvas,
        this.sourceCanvas,
        payload.canvas === this.sourceCanvas
      );
      if (payload) {
        this.debounceSyncCanvases();
      }
    };
    EventBus.on(
      EventTypes.CANVAS.BACKGROUND_COLOR_CHANGE,
      this.backgroundColorListener
    );

    
    this.backgroundImageListener = (payload) => {
      if (payload) {
        this.debounceSyncCanvases();
      }
    };
    EventBus.on(
      EventTypes.CANVAS.BACKGROUND_IMAGE_CHANGE,
      this.backgroundImageListener
    );
  }

  
  private debounceSyncCanvases(delay: number = 500) {
    if (!this.syncEnabled) return;

    
    if (this.syncInProgress) {
      this.pendingSync = true;
      return;
    }

    
    if (this.syncDebounceTimer !== null) {
      window.clearTimeout(this.syncDebounceTimer);
    }

    
    this.syncDebounceTimer = window.setTimeout(() => {
      this.syncCanvases();
    }, delay);
  }

  
  private async syncCanvases() {
    if (!this.syncEnabled || this.syncInProgress) return;

    this.syncInProgress = true;
    this.pendingSync = false;

    try {
      
      this.targetCanvas.clear();

      
      if (this.sourceCanvas.backgroundColor) {
        this.targetCanvas.backgroundColor = this.sourceCanvas.backgroundColor;
      }

      
      if (this.sourceCanvas.backgroundImage) {
        try {
          const originalBgImage: any = this.sourceCanvas.backgroundImage;

          
          if (typeof originalBgImage.getSrc === "function") {
            
            const imgSrc = originalBgImage.getSrc();

            if (imgSrc) {
              
              fabric.FabricImage.fromURL(imgSrc, {
                crossOrigin: "anonymous",
              }).then((newImage: fabric.Image) => {
                if (newImage) {
                  newImage.scaleX = originalBgImage.scaleX || 1;
                  newImage.scaleY = originalBgImage.scaleY || 1;
                  newImage.left = originalBgImage.left || 0;
                  newImage.top = originalBgImage.top || 0;
                  newImage.originX = originalBgImage.originX || "left";
                  newImage.originY = originalBgImage.originY || "top";
                  newImage.width = originalBgImage.width;
                  newImage.height = originalBgImage.height;

                  
                  this.targetCanvas.backgroundImage = newImage;
                  this.targetCanvas.requestRenderAll();
                }
              });
            }
          } else {
            
            try {
              const clonedBgImage = await originalBgImage.clone();
              this.targetCanvas.backgroundImage = clonedBgImage;
              this.targetCanvas.requestRenderAll();
            } catch (cloneError) {
              console.error("背景图片克隆失败，尝试备选方法:", cloneError);
              
              const bgImageJSON = originalBgImage.toJSON();
              const objects = await fabric.util.enlivenObjects([bgImageJSON]);
              if (objects && objects[0]) {
                this.targetCanvas.backgroundImage = objects[0] as fabric.Image;
                this.targetCanvas.requestRenderAll();
              }
            }
          }
        } catch (error) {
          console.error("背景图片同步失败:", error);
        }
      }

      
      const objects = this.sourceCanvas.getObjects();

      
      const clonePromises = objects.map(obj =>
        new Promise<fabric.Object>(async (resolve) => {
          try {
            
            const clonedObj = await obj.clone();
            
            clonedObj.off();
            resolve(clonedObj);
          } catch (error) {
            console.error(`克隆对象失败: ${obj.type}`, error);
            
            const emptyObj = new fabric.FabricObject();
            resolve(emptyObj);
          }
        })
      );

      
      const clonedObjects = await Promise.all(clonePromises);

      
      clonedObjects.forEach((obj: any) => {
        if (!obj) return; 

        
        if (obj.hasOwnProperty("controls")) {
          obj.controls = {};
        }

        
        const originalType = obj.type;

        
        obj.selectable = false;
        obj.evented = false; 
        obj.hoverCursor = "default";

        
        if (
          originalType === Frame.type ||
          originalType === PageFrame.type ||
          originalType === Slides.type
        ) {
          obj.customBorderColor = "transparent";
          obj.customInnerBorderColor = "transparent";
          obj.fill = "transparent";
          obj.backgroundColor = "transparent";
          
          obj.stroke = "transparent";
          
          
          if (originalType === Frame.type) {
            if (typeof obj.setNumberControlVisibility === 'function') {
              obj.setNumberControlVisibility(false);
            }
          }
          
          obj.selectable = false;
          obj.hoverCursor = "default";
        }

        
        this.targetCanvas.add(obj);
      });

      
      this.targetCanvas.requestRenderAll();

      
      this.syncInProgress = false;

      
      if (this.pendingSync) {
        requestAnimationFrame(() => this.syncCanvases());
      }
    } catch (error) {
      console.error("同步画布失败:", error);
      this.syncInProgress = false;
    }
  }

  
  public enableSync(enabled: boolean = true) {
    this.syncEnabled = enabled;
    if (enabled && !this.syncInProgress) {
      this.syncCanvases();
    }
  }

  
  public forceSyncCanvases() {
    if (this.syncDebounceTimer !== null) {
      window.clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }
    this.syncCanvases();
  }

  
  public destroy() {
    
    if (this.syncDebounceTimer !== null) {
      window.clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }

    
    this.sourceCanvas.off("object:added");
    this.sourceCanvas.off("object:removed");
    this.sourceCanvas.off("object:modified");
    this.sourceCanvas.off("after:render");
    
    

    
    if (this.backgroundColorListener) {
      EventBus.off(
        EventTypes.CANVAS.BACKGROUND_COLOR_CHANGE,
        this.backgroundColorListener
      );
      this.backgroundColorListener = null;
    }

    if (this.backgroundImageListener) {
      EventBus.off(
        EventTypes.CANVAS.BACKGROUND_IMAGE_CHANGE,
        this.backgroundImageListener
      );
      this.backgroundImageListener = null;
    }
  }
}
