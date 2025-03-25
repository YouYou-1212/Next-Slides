import * as fabric from "fabric";
import { Slides } from "../../slides/Slides";
import { ImageControl } from "../../subassembly/controls/ImageControl";
import type { CanvasManager } from "../CanvasManager";

export class KeyboardEventHandler {
  private canvas: fabric.Canvas;
  private canvasManager: CanvasManager;
  // private isSpaceDragging = false;
  private clipboardObject: fabric.Object | null = null; // 存储复制的对象

  constructor(canvas: fabric.Canvas, canvasManager: CanvasManager) {
    this.canvas = canvas;
    this.canvasManager = canvasManager;
    this.initSpaceDragMode();
    this.initCopyPasteHandlers(); // 初始化复制粘贴处理
  }

  // 初始化空格拖动模式
  private initSpaceDragMode() {
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  // 初始化复制粘贴处理
  private initCopyPasteHandlers() {
    window.addEventListener("keydown", this.handleCopyPaste.bind(this));
  }


  private handleKeyDown(e: KeyboardEvent) {
    if (e.code === "Space" && this.canvasManager.getDragMode() !== 'pan') {
      // 使用 CanvasManager 的 setDragMode 方法设置为拖动模式
      this.canvasManager.setDragMode('pan' , true);
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    if (e.code === "Space") {
      // 使用 CanvasManager 的 setDragMode 方法恢复默认模式
      this.canvasManager.setDragMode('default' , false);
    }
  }

  // // 处理系统剪贴板粘贴
  // private handleClipboardPaste(e: ClipboardEvent) {
  //   console.log("handleClipboardPaste 粘贴事件触发");
  //   // 检查剪贴板中是否有图片数据
  //   if (e.clipboardData && e.clipboardData.items) {
  //     const items = e.clipboardData.items;
  //     let hasProcessed = false;

  //     for (let i = 0; i < items.length; i++) {
  //       // 检查是否为图片类型
  //       if (items[i].type.indexOf("image") !== -1) {
  //         const blob = items[i].getAsFile();
  //         if (blob) {
  //           // 阻止默认行为
  //           e.preventDefault();
  //           // 将Blob转换为URL
  //           const imageUrl = URL.createObjectURL(blob);
  //           // 粘贴图片到画布
  //           this.pasteImageFromUrl(imageUrl);
  //           hasProcessed = true;
  //           break; // 只处理第一个图片
  //         }
  //       }
  //     }
  //   }
  // }


  // 从URL粘贴图片到画布
  private pasteImageFromUrl(url: string) {
    console.log("从URL粘贴图片到画布", url);
    // 获取当前选中对象的位置或画布中心点
    let centerPoint: fabric.Point = this.canvas.getVpCenter();
    // 获取 ControlsManager 实例
    const controlsManager = this.canvasManager.getControlsManager();
    if (!controlsManager) {
      console.error("ControlsManager 不可用");
      return;
    }

    // 使用 ControlsManager 添加图片
    controlsManager
      .addImage(url, "" , {
        left: centerPoint.x,
        top: centerPoint.y,
        originX: "center",
        originY: "center",
      })
      .then((imageControl) => {
        if (imageControl) {
          // 设置为活动对象
          console.log("已粘贴剪贴板图片", imageControl);
        }
      })
      .catch((err) => {
        console.error("粘贴剪贴板图片失败:", err);
        // 释放创建的URL对象
        URL.revokeObjectURL(url);
      });
  }

  // 处理复制粘贴快捷键
  private handleCopyPaste(e: KeyboardEvent) {
    // 检查是否按下了Ctrl键
    if (e.ctrlKey) {
      // 检查是否有文本框在编辑状态
      const activeObject = this.canvas.getActiveObject();
      const isTextEditing = activeObject && 'isEditing' in activeObject && (activeObject as any).isEditing;
      
      // 如果文本框在编辑状态，不干扰默认行为
      if (isTextEditing) {
        return;
      }
      
      // 复制操作 (Ctrl+C)
      if (e.code === "KeyC") {
        e.preventDefault();
        e.stopPropagation();
        this.handleCopy();
      }
      //粘贴操作 (Ctrl+V)
      else if (e.code === "KeyV") {
        e.preventDefault();
        e.stopPropagation();
        this.checkClipboardAndPaste();
      }
    }
  }

  // 处理复制操作
  private handleCopy() {
    const activeObject = this.canvas.getActiveObject();
    // 确保有选中的对象且不是Slides类型
    if (activeObject && !(activeObject instanceof Slides)) {
      // 克隆对象以便后续粘贴
      activeObject
        .clone()
        .then((cloned: fabric.Object) => {
          this.clipboardObject = cloned;

          // 尝试使用 document.execCommand 进行复制
          // 创建一个隐藏的文本区域
          const textArea = document.createElement("textarea");
          textArea.value = "next-slide-object"; // 使用标记文本
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          // 执行复制命令
          const successful = document.execCommand("copy");

          // 移除临时元素
          document.body.removeChild(textArea);

          if (successful) {
            console.log("成功使用 execCommand 复制到剪贴板");
          } else {
            console.warn("execCommand 复制失败");
          }

          console.log("已复制对象", cloned);
        })
        .catch((err) => {
          console.error("复制对象失败:", err);
        });
    }
  }

  // 检查剪贴板并执行粘贴
  private async checkClipboardAndPaste() {
    try {
      // 尝试从剪贴板获取内容
      const clipboardItems = await navigator.clipboard.read();
      let hasProcessed = false;

      for (const item of clipboardItems) {
        // 检查是否有图片类型
        if (
          item.types.includes("image/png") ||
          item.types.includes("image/jpeg") ||
          item.types.includes("image/gif")
        ) {
          // 获取图片blob
          const blob = await item.getType(
            item.types.find((type) => type.startsWith("image/")) || "image/png"
          );
          // 将Blob转换为URL
          const imageUrl = URL.createObjectURL(blob);
          // 粘贴图片到画布
          this.pasteImageFromUrl(imageUrl);
          hasProcessed = true;
          break;
        }
      }

      // 如果没有处理任何图片，但有内部剪贴板对象，则使用它
      if (!hasProcessed && this.clipboardObject) {
        this.handleInternalPaste();
      }
    } catch (err) {
      console.warn("无法读取系统剪贴板:", err);
      // 如果读取系统剪贴板失败，但有内部剪贴板对象，则使用它
      if (this.clipboardObject) {
        this.handleInternalPaste();
      }
    }
  }

  // 处理内部粘贴操作
  private async handleInternalPaste() {
    console.log("handleInternalPaste 粘贴事件触发");
    // 检查是否有可粘贴的对象
    if (!this.clipboardObject) {
      console.log("剪贴板为空，没有可粘贴的对象");
      return;
    }

    // 获取当前选中对象的位置或画布中心点
    const activeObject = this.canvas.getActiveObject();
    let centerPoint = {
      x: this.canvas.width! / 2,
      y: this.canvas.height! / 2,
    };
    // 如果有选中对象，使用其位置
    if (activeObject) {
      const activeCenter = activeObject.getCenterPoint();
      centerPoint = { x: activeCenter.x, y: activeCenter.y };
    }

    // 获取 ControlsManager 实例
    const controlsManager = this.canvasManager.getControlsManager();
    if (!controlsManager) {
      console.error("ControlsManager 不可用");
      return;
    }

    try {
      // 使用 ControlsManager 的统一方法添加克隆对象
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
        // 设置为活动对象
        this.canvas.setActiveObject(clonedObject);
        this.canvas.requestRenderAll();
        console.log("已粘贴对象", clonedObject);
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
