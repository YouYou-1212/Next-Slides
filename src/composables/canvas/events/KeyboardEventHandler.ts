import * as fabric from "fabric";
import { Slides } from "../../slides/Slides";
import { ImageControl } from "../../subassembly/controls/ImageControl";
import type { CanvasManager } from "../CanvasManager";
import type { CustomCanvas } from "../CustomCanvas";

export class KeyboardEventHandler {
  private canvas: CustomCanvas;
  private canvasManager: CanvasManager;
  
  private clipboardObject: fabric.Object | null = null; 

  constructor(canvas: CustomCanvas, canvasManager: CanvasManager) {
    this.canvas = canvas;
    this.canvasManager = canvasManager;
    this.initSpaceDragMode();
    this.initCopyPasteHandlers(); 
  }

  
  private initSpaceDragMode() {
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  
  private initCopyPasteHandlers() {
    window.addEventListener("keydown", this.handleCopyPaste.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.code === "Space" && this.canvasManager.getDragMode() !== 'pan') {
      
      this.canvasManager.setDragMode('pan', true);
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    if (e.code === "Space") {
      
      this.canvasManager.setDragMode('default', false);
    }
  }


  
  private pasteImageFromUrl(url: string) {
    
    let centerPoint: fabric.Point = this.canvas.getVpCenter();
    
    const controlsManager = this.canvasManager.getControlsManager();
    if (!controlsManager) {
      console.error("ControlsManager 不可用");
      return;
    }

    
    controlsManager
      .addImage(url, "", {
        left: centerPoint.x,
        top: centerPoint.y,
        originX: "center",
        originY: "center",
      })
      .then((imageControl) => {
        if (imageControl) {
          
          
        }
      })
      .catch((err) => {
        console.error("粘贴剪贴板图片失败:", err);
        
        URL.revokeObjectURL(url);
      });
  }

  
  private handleCopyPaste(e: KeyboardEvent) {
    
    if (e.ctrlKey) {
      
      const activeObject = this.canvas.getActiveObject();
      const isTextEditing = activeObject && 'isEditing' in activeObject && (activeObject as any).isEditing;

      
      if (isTextEditing) {
        return;
      }

      
      if (e.code === "KeyC") {
        e.preventDefault();
        e.stopPropagation();
        this.handleCopy();
      }
      
      else if (e.code === "KeyV") {
        e.preventDefault();
        e.stopPropagation();
        this.checkClipboardAndPaste();
      }
    }
  }

  
  private handleCopy() {
    const activeObject = this.canvas.getActiveObject();
    
    if (activeObject && !(activeObject instanceof Slides)) {
      
      activeObject
        .clone()
        .then((cloned: fabric.Object) => {
          this.clipboardObject = cloned;

          
          
          const textArea = document.createElement("textarea");
          textArea.value = "next-slide-object"; 
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          
          const successful = document.execCommand("copy");

          
          document.body.removeChild(textArea);

          if (successful) {
            
          } else {
            console.warn("execCommand 复制失败");
          }

          
        })
        .catch((err) => {
          console.error("复制对象失败:", err);
        });
    }
  }

  
  private async checkClipboardAndPaste() {
    try {
      
      const clipboardItems = await navigator.clipboard.read();
      let hasProcessed = false;

      for (const item of clipboardItems) {
        
        if (
          item.types.includes("image/png") ||
          item.types.includes("image/jpeg") ||
          item.types.includes("image/gif")
        ) {
          
          const blob = await item.getType(
            item.types.find((type) => type.startsWith("image/")) || "image/png"
          );
          
          const imageUrl = URL.createObjectURL(blob);
          
          this.pasteImageFromUrl(imageUrl);
          hasProcessed = true;
          break;
        }
      }

      
      if (!hasProcessed && this.clipboardObject) {
        this.handleInternalPaste();
      }
    } catch (err) {
      console.warn("无法读取系统剪贴板:", err);
      
      if (this.clipboardObject) {
        this.handleInternalPaste();
      }
    }
  }

  
  private async handleInternalPaste() {
    
    
    if (!this.clipboardObject) {
      
      return;
    }

    
    const activeObject = this.canvas.getActiveObject();
    let centerPoint = {
      x: this.canvas.width! / 2,
      y: this.canvas.height! / 2,
    };
    
    if (activeObject) {
      const activeCenter = activeObject.getCenterPoint();
      centerPoint = { x: activeCenter.x, y: activeCenter.y };
    }

    
    const controlsManager = this.canvasManager.getControlsManager();
    if (!controlsManager) {
      console.error("ControlsManager 不可用");
      return;
    }

    try {
      
      const clonedObject = await controlsManager.addClonedObject(
        this.clipboardObject,
        {
          left: centerPoint.x,
          top: centerPoint.y,
          originX: "center",
          originY: "center",
        }
      );

      if (clonedObject) {
        
        this.canvas.setActiveObject(clonedObject);
        this.canvas.requestRenderAll();
        
      } else {
        console.error("粘贴对象失败: 无法创建克隆对象");
      }
    } catch (error) {
      console.error("粘贴对象失败:", error);
    }
  }

  public isInSpaceDragMode(): boolean {
    return this.canvasManager.getDragMode() === 'pan';
  }

  public destroy() {
    window.removeEventListener("keydown", this.handleKeyDown.bind(this));
    window.removeEventListener("keyup", this.handleKeyUp.bind(this));
    window.removeEventListener("keydown", this.handleCopyPaste.bind(this));
  }
}
