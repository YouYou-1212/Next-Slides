import * as fabric from "fabric";
import { Frame } from "../Frame";
import { FrameManager } from "../FrameManager";

export class FrameEventHandler {
  private canvas: fabric.Canvas;
  private frameManager: FrameManager;

  constructor(canvas: fabric.Canvas, frameManager: FrameManager) {
    this.canvas = canvas;
    this.frameManager = frameManager;
  }

  /**
   * 为Frame设置事件处理
   * @param frame Frame对象
   */
  public setupFrameEvents(frame: Frame) {
    // 移除可能已存在的事件处理器
    frame.off("moving");
    frame.off("rotating");
    frame.off("scaling");

    // 添加新的事件处理器
    frame.on("moving", () => this.handleFrameMoving(frame));
    frame.on("rotating", () => this.handleFrameRotating(frame));
    frame.on("scaling", () => this.handleFrameScaling(frame));

    // 更新Frame序号位置
    // const frameManager = this.canvasManager.getFrameManager();
    if (this.frameManager) {
      frame.on("moving", () => this.updateFrameNumberPosition(frame));
      frame.on("rotating", () => this.updateFrameNumberPosition(frame));
      frame.on("scaling", () => this.updateFrameNumberPosition(frame));
    }
  }

  /**
   * 处理Frame移动事件
   * @param frame 被移动的Frame
   */
  private handleFrameMoving(frame: Frame) {
    frame.updateContents();
  }

  /**
   * 处理Frame旋转事件
   * @param frame 被旋转的Frame
   */
  private handleFrameRotating(frame: Frame) {
    frame.updateContents();
  }

  /**
   * 处理Frame缩放事件
   * @param frame 被缩放的Frame
   */
  private handleFrameScaling(frame: Frame) {
    frame.updateContents();
  }

  /**
   * 更新Frame序号位置
   * @param frame Frame对象
   */
  private updateFrameNumberPosition(frame: Frame) {
    // const frameManager = this.canvasManager.getFrameManager();
    if (this.frameManager) {
      // 调用FrameManager中的方法更新序号位置
      this.frameManager.updateNumberPositionForFrame(frame);
    }
  }

  /**
   * 将Frame移到最顶层
   * @param frame Frame对象
   */
  public bringFrameToFront(frame: Frame) {
    // 保存当前所有对象的顺序
    const objects = this.canvas.getObjects();
    const frameIndex = objects.indexOf(frame);

    // 如果Frame已经在最顶层，则不需要操作
    if (frameIndex === objects.length - 1) return;

    // 将Frame移到最顶层
    this.canvas.bringObjectToFront(frame);

    // 确保Frame内的内容仍然在Frame之上
    frame.contents.forEach((content) => {
      this.canvas.bringObjectToFront(content);
    });

    this.canvas.requestRenderAll();
  }
}
