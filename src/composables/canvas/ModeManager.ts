/**
 * 模式管理器
 * */
import { ref } from "vue";
import * as fabric from "fabric";
import { PresentPlayManager } from "../present/PresentPlayManager";
import type { PlayAction } from "../present/Present";
import { PageFrame } from "../slides/PageFrame";
import { Frame } from "../slides/Frame";

export enum EditorMode {
  EDIT = "edit",
  PRESENT = "present",
}

export class ModeManager {
  private currentMode = ref<EditorMode>(EditorMode.EDIT);
  private canvas: any;
  private presentationCanvas: any;
  // private frames: any[] = [];
  private presentPlayManager: PresentPlayManager | null = null;
  private lastPosX = 0;
  private lastPosY = 0;
  private isDragging = false;

  constructor(canvas: any, presentationCanvas: any) {
    this.canvas = canvas;
    this.presentationCanvas = presentationCanvas;
    this.initPresentationMode();

    // 初始化演示画布事件
    this.initPresentationEvents();
    // 添加全屏变化事件监听
    document.addEventListener(
      "fullscreenchange",
      this.handleFullscreenChange.bind(this)
    );

    // 监听键盘事件
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  private initPresentationMode() {
    // // 设置初始视口变换
    // this.presentationCanvas.viewportTransform = [1, 0, 0, 1, 0, 0];
  }

  private handleFullscreenChange() {
    // 当退出全屏时，同时退出演示模式
    if (
      !document.fullscreenElement &&
      this.currentMode.value === EditorMode.PRESENT
    ) {
      this.exitPresentMode();
    }
  }

  // 初始化演示画布的事件处理
  private initPresentationEvents() {
    // 设置演示画布的拖动和缩放事件
    this.presentationCanvas.on("mouse:down", (opt: any) => {
      this.isDragging = true;
      this.lastPosX = opt.e.clientX;
      this.lastPosY = opt.e.clientY;
      this.presentationCanvas.defaultCursor = "grabbing";
    });

    this.presentationCanvas.on("mouse:move", (opt: any) => {
      if (this.isDragging) {
        const deltaX = opt.e.clientX - this.lastPosX;
        const deltaY = opt.e.clientY - this.lastPosY;

        const vpt = this.presentationCanvas.viewportTransform!;
        vpt[4] += deltaX;
        vpt[5] += deltaY;

        this.presentationCanvas.setViewportTransform(vpt);
        this.lastPosX = opt.e.clientX;
        this.lastPosY = opt.e.clientY;
      }
    });

    this.presentationCanvas.on("mouse:up", () => {
      this.isDragging = false;
      this.presentationCanvas.defaultCursor = "default";
    });

    // 缩放功能
    this.presentationCanvas.on("mouse:wheel", (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = this.presentationCanvas.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.min(Math.max(0.1, zoom), 20);

      const point = {
        x: opt.e.offsetX,
        y: opt.e.offsetY,
      };

      this.presentationCanvas.zoomToPoint(
        new fabric.Point(point.x, point.y),
        zoom
      );
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  }

  public async enterPresentMode() {
    this.currentMode.value = EditorMode.PRESENT;
    //已经实时同步画布，在这里就不用克隆了
    // await this.cloneCanvasContent();
    this.showPresentationCanvas();
    // 创建并初始化 PresentPlayManager
    this.presentPlayManager = new PresentPlayManager(this.presentationCanvas);

    // 构建播放队列
    const playActions: PlayAction[] = [];

    // 设置对象可选但不可移动
    this.presentationCanvas.forEachObject((obj: any) => {
      obj.selectable = true;
      obj.lockMovementX = true;
      obj.lockMovementY = true;
      obj.lockRotation = true;
      obj.lockScalingX = true;
      obj.lockScalingY = true;
      obj.hasControls = false;
      obj.hasBorders = true;

      // if (obj.type === PageFrame.type) {
      //   playActions.push({
      //     type: "pageframe",
      //     target: obj,
      //   });
      // }
      // if (obj.type === Frame.type) {
      //   playActions.push({
      //     type: "frame",
      //     target: obj,
      //   });
      // }
    });

    console.log("enterPresentMode:", this.presentationCanvas.getObjects());
    const pageFrame = this.presentationCanvas
      .getObjects()
      .find((obj: any) => obj.type === PageFrame.type);

    if (pageFrame) {
      playActions.push({
        type: "pageframe",
        target: pageFrame,
      });
    }
    const frames = this.presentationCanvas
      .getObjects()
      .filter((obj: any) => obj.type === Frame.type);
    //将frames按照order进行排序
    frames.sort((a: any, b: any) => {
      return (a.order || 0) - (b.order || 0);
    });
    // 添加所有 Frame 作为后续动作
    frames.forEach((frame: any) => {
      playActions.push({
        type: "frame",
        target: frame,
      });
    });
    console.log("playActions:", playActions);
    this.presentPlayManager.play(playActions);
  }

  public exitPresentMode() {
    this.currentMode.value = EditorMode.EDIT;
    // 销毁 PresentPlayManager
    if (this.presentPlayManager) {
      this.presentPlayManager.destroy();
      this.presentPlayManager = null;
    }
    this.hidePresentationCanvas();
  }

  public async cloneCanvasContent() {
    console.log("开始克隆内容到演示画布");
    // 清空演示画布
    this.presentationCanvas.clear();
    this.presentationCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    // 获取所有对象
    const objects = this.canvas.getObjects();

    // 克隆对象并移除边框和阴影
    for (const obj of objects) {
      console.log(`正在克隆对象: ${obj.type}, id: ${obj.id}`);
      try {
        await obj.clone("type", "name").then((clonedObj: any) => {
          // 如果是 pageFrame 或 frame，移除边框和阴影
          if (obj.type === "pageframe" || obj.type === "frame") {
            clonedObj.set({
              stroke: "transparent",
              shadow: null,
              strokeWidth: 0,
            });
          }

          // 保持原始位置和变换属性
          clonedObj.set({
            left: obj.left,
            top: obj.top,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
            angle: obj.angle,
            // 设置对象可选但不可移动
            selectable: true,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            hasControls: true,
            hasBorders: true,
          });

          console.log(`添加克隆对象到演示画布: ${obj.type}, id: ${obj.id}`);
          // 添加到演示画布
          this.presentationCanvas.add(clonedObj);
        });
      } catch (error) {
        console.error(`克隆对象失败: ${obj.type}, id: ${obj.id}`, error);
      }
    }

    console.log(
      `演示画布现在有 ${this.presentationCanvas.getObjects().length} 个对象`
    );
    // 渲染画布
    this.presentationCanvas.requestRenderAll();
  }

  private showPresentationCanvas() {
    // 隐藏编辑画布
    if (this.canvas.wrapperEl) {
      this.canvas.wrapperEl.style.display = "none";
    }

    // 显示演示画布
    if (this.presentationCanvas.wrapperEl) {
      const wrapper = this.presentationCanvas.wrapperEl;
      // 设置包装器样式
      Object.assign(wrapper.style, {
        display: "block",
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        zIndex: "9999",
        backgroundColor: "#fff",
      });
      // 确保画布的所有层都可见
      this.ensureCanvasLayersVisible();
    }

    // 进入全屏模式
    this.enterFullscreen();

    // 调整画布大小以适应屏幕
    this.adjustPresentationSize(); // 强制重新渲染

    this.presentationCanvas.requestRenderAll();
  }

  // 新增方法：确保画布所有层可见
  private ensureCanvasLayersVisible() {
    // 确保底层画布可见
    const lowerCanvas = this.presentationCanvas.lowerCanvasEl;
    if (lowerCanvas) {
      lowerCanvas.style.display = "block";
      lowerCanvas.style.visibility = "visible";
    }

    // 确保上层画布可见
    const upperCanvas = this.presentationCanvas.upperCanvasEl;
    if (upperCanvas) {
      upperCanvas.style.display = "block";
      upperCanvas.style.visibility = "visible";
    }

    // 确保缓存画布可见（如果存在）
    const cacheCanvas = this.presentationCanvas.cacheCanvasEl;
    if (cacheCanvas) {
      cacheCanvas.style.display = "block";
      cacheCanvas.style.visibility = "visible";
    }
  }

  /**
   * 隐藏演示画布
   * */
  private hidePresentationCanvas() {
    // 退出全屏模式
    this.exitFullscreen();
    // 隐藏演示画布
    if (this.presentationCanvas.wrapperEl) {
      this.presentationCanvas.wrapperEl.style.display = "none";
    }

    // 显示编辑画布
    if (this.canvas.wrapperEl) {
      this.canvas.wrapperEl.style.display = "block";
    }
  }

  /**
   * 计算画布内容的边界
   * */
  // private calcContentBounds() {
  //   const objects = this.canvas.getObjects();
  //   if (!objects.length) return { left: 0, top: 0, right: 0, bottom: 0 };

  //   let minX = Infinity;
  //   let minY = Infinity;
  //   let maxX = -Infinity;
  //   let maxY = -Infinity;

  //   objects.forEach((obj: any) => {
  //     const bounds = obj.getBoundingRect();
  //     minX = Math.min(minX, bounds.left);
  //     minY = Math.min(minY, bounds.top);
  //     maxX = Math.max(maxX, bounds.left + bounds.width);
  //     maxY = Math.max(maxY, bounds.top + bounds.height);
  //   });

  //   return {
  //     left: minX,
  //     top: minY,
  //     right: maxX,
  //     bottom: maxY,
  //   };
  // }

  /**
   * 键盘事件处理
   * */
  private handleKeyDown(e: KeyboardEvent) {
    if (this.currentMode.value !== EditorMode.PRESENT) return;
    switch (e.key) {
      case "Escape":
        this.exitPresentMode();
        break;
    }
  }

  /**
   * 窗口大小变化处理
   * */
  private handleResize() {
    if (this.currentMode.value === EditorMode.PRESENT) {
      this.adjustPresentationSize();
    }
  }

  private adjustPresentationSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    console.log(`调整演示画布尺寸: ${width}x${height}`);
    this.presentationCanvas.setDimensions({ width, height });
    // 确保渲染
    this.presentationCanvas.requestRenderAll();
    // 确保画布层可见
    this.ensureCanvasLayersVisible();

    // 打印当前画布状态
    console.log("演示画布状态:", {
      对象数量: this.presentationCanvas.getObjects().length,
      背景色: this.presentationCanvas.backgroundColor,
      尺寸: {
        width: this.presentationCanvas.width,
        height: this.presentationCanvas.height,
      },
      视口变换: this.presentationCanvas.viewportTransform,
    });
  }

  private async enterFullscreen() {
    try {
      if (this.presentationCanvas.wrapperEl) {
        if (this.presentationCanvas.wrapperEl.requestFullscreen) {
          await this.presentationCanvas.wrapperEl.requestFullscreen();
        }
      }
    } catch (error) {
      console.error("Failed to enter fullscreen:", error);
    }
  }

  private async exitFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Failed to exit fullscreen:", error);
    }
  }
}
