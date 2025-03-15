import * as fabric from "fabric";
import { CanvasManager } from "../../../composables/canvas/CanvasManager";
import { PageFrame } from "../PageFrame";
import { PageFrameManager } from "../PageFrameManager";

export class PageFrameEventHandler {
  private canvas: fabric.Canvas;
  private pageFrameManager: PageFrameManager;

  constructor(canvas: fabric.Canvas, pageFrameManager: PageFrameManager) {
    this.canvas = canvas;
    this.pageFrameManager = pageFrameManager;
  }

  /**
   * 为PageFrame设置事件处理
   * @param pageFrame PageFrame对象
   */
  public setupPageFrameEvents(pageFrame: PageFrame) {
    // 移除可能已存在的事件处理器
    pageFrame.off("moving");
    pageFrame.off("scaling");

    // 添加新的事件处理器
    pageFrame.on("moving", (e) => this.handlePageFrameMoving(pageFrame, e));
    pageFrame.on("scaling", (e) => this.handlePageFrameScaling(pageFrame, e));
  }

  /**
   * 处理PageFrame移动事件
   * @param pageFrame 被移动的PageFrame
   * @param event 事件对象
   */
  private handlePageFrameMoving(pageFrame: PageFrame, event: any) {
    if (!event || !event.target) return;
    const target = event.target;

    const deltaX = target.left - target.initialLeft;
    const deltaY = target.top - target.initialTop;

    target.initialLeft = target.left;
    target.initialTop = target.top;

    this.canvas.requestRenderAll();
  }

  /**
   * 处理PageFrame缩放事件
   * @param pageFrame 被缩放的PageFrame
   * @param event 事件对象
   */
  private handlePageFrameScaling(pageFrame: PageFrame, event: any) {
    // pageFrame.handleScaling(event);
  }
}