import * as fabric from "fabric";
import { CanvasManager } from "../CanvasManager";
import { Frame } from "../../slides/Frame";
import { PageFrame } from "../../slides/PageFrame";
import { EventBus, EventTypes } from "../../../utils/EventBus";
import type { CustomCanvas } from "../CustomCanvas";

export class ObjectEventHandler {
  private canvas: CustomCanvas;
  private canvasManager: CanvasManager;

  constructor(canvas: CustomCanvas, canvasManager: CanvasManager) {
    this.canvas = canvas;
    this.canvasManager = canvasManager;

    /**
     * 画布对象操作事件
     * object:modified
     * object:moving
     * object:removed
     * object:resizing
     * object:rotating
     * object:scaling
     */
    this.setupObjectEvents();
  }

  /**
   * 设置对象事件
   */
  private setupObjectEvents() {
    // 监听对象添加事件，为Frame和PageFrame添加事件处理
    this.canvas.on("object:added", (e: any) => {
      const obj = e.target;
      if (!obj) return;

      EventBus.emit(EventTypes.CANVAS.CANVAS_UPDATE, { type: EventTypes.CANVAS.CANVAS_UPDATE, target: obj });
    });

    // 监听对象移动中事件，实时更新坐标
    this.canvas.on('object:moving', (opt: any) => {
      const target = opt.target;
      this.canvas.isDraggingObject = true;
      // console.log("object:moving 对象被拖动事件", opt);
    });

     // 监听对象缩放事件
     this.canvas.on('object:scaling', (opt: any) => {
      const target = opt.target;

    });
    
    // 监听对象旋转事件
    this.canvas.on('object:rotating', (opt: any) => {
      const target = opt.target;

    });

    // 监听对象修改事件
    this.canvas.on("object:modified", (e: any) => {
      this.canvas.isDraggingObject = false;
      // console.log("object:modified", e);
      const target = e.target;
      if (!target) return;

      EventBus.emit(EventTypes.CANVAS.CANVAS_UPDATE, { type: EventTypes.CANVAS.CANVAS_UPDATE, target: target });
    });

    // 监听对象删除事件
    this.canvas.on("object:removed", (e: any) => {
      console.log("object:removed", e);
      const obj = e.target;
      if (!obj) return;

      EventBus.emit(EventTypes.CANVAS.CANVAS_UPDATE, { type: EventTypes.CANVAS.CANVAS_UPDATE, target: obj });
    });
  }

  public destroy() {
    this.canvas.off("object:added");
    this.canvas.off("object:modified");
    this.canvas.off("object:removed");
    this.canvas.off("object:moving");
    this.canvas.off("object:scaling");
    this.canvas.off("object:rotating");
  }
}
