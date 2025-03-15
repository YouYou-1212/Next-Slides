import type { HandlerContext, HandlerParams } from "./types";
import { Frame } from "../../slides/Frame";
import { PageFrame } from "../../slides/PageFrame";

export class LayerHandlers {
  private context: HandlerContext;

  constructor(context: HandlerContext) {
    this.context = context;
  }

  /**
   * 处理移动图层
   * @param params 处理器参数
   * @param direction 移动方向
   */
  public handleMoveLayer(
    params: HandlerParams,
    direction: "up" | "down" | "top" | "bottom"
  ) {
    if (!params.target) return;
    this.moveActiveObject(direction, params.target);
  }

  /**
   * 处理移动指定对象图层
   * @param params 处理器参数
   * @param direction 移动方向
   */
  private moveActiveObject(
    direction: "up" | "down" | "top" | "bottom",
    target: any
  ) {
    const activeObject = target;
    if (!activeObject) return;

    const isFrame = activeObject instanceof Frame;

    if (isFrame) {
      //被动移动模式：移动Frame内的所有内容，但不移动Frame本身
      const frame = activeObject as Frame;
      const objects = this.context.canvas.getObjects();
      // const currentIndex = objects.indexOf(frame);

      // 计算新的索引位置
      let offset = 0;
      switch (direction) {
        case "up":
          offset = 1;
          break;
        case "down":
          offset = -1;
          break;
        case "top":
          offset = objects.length;
          break;
        case "bottom":
          offset = -objects.length;
          break;
      }

      // 获取所有内容并按照当前层级排序
      const contents = Array.from(frame.contents).sort(
        (a, b) => objects.indexOf(a) - objects.indexOf(b)
      );

      // 移动所有内容，保持它们的相对顺序
      if (offset > 0) {
        // 从上到下移动（避免覆盖）
        for (let i = contents.length - 1; i >= 0; i--) {
          const content = contents[i];
          const contentIndex = objects.indexOf(content);
          const newContentIndex = Math.min(
            objects.length - 1,
            contentIndex + offset
          );

          // 确保内容不会超过任何Frame
          const maxAllowedIndex = this.getMaxAllowedIndex(objects, frame);
          const finalIndex = Math.min(newContentIndex, maxAllowedIndex);

          this.context.canvas.moveObjectTo(content, finalIndex);
        }
      } else {
        // 从下到上移动
        for (let i = 0; i < contents.length; i++) {
          const content = contents[i];
          const contentIndex = objects.indexOf(content);
          const newContentIndex = Math.max(0, contentIndex + offset);

          this.context.canvas.moveObjectTo(content, newContentIndex);
        }
      }
    } else {
      // 如果是普通对象，直接移动该对象，但确保不超过任何Frame
      const objects = this.context.canvas.getObjects();
      const currentIndex = objects.indexOf(activeObject);

      // 查找对象所属的Frame
      const parentFrame = this.context.canvasManager
        .getFrameManager()
        .findParentFrame(activeObject);

      let newIndex = currentIndex;
      switch (direction) {
        case "up":
          newIndex = Math.min(objects.length - 1, currentIndex + 1);
          break;
        case "down":
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case "top":
          // 如果有父Frame，则移到父Frame内容的最顶层
          if (parentFrame) {
            const frameContents = Array.from(parentFrame.contents).sort(
              (a, b) => objects.indexOf(b) - objects.indexOf(a)
            );
            const topContentIndex = objects.indexOf(frameContents[0]);
            newIndex = topContentIndex;
          } else {
            // 否则移到画布最顶层，但不超过任何Frame
            newIndex = this.getMaxAllowedIndex(objects, null);
          }
          break;
        case "bottom":
          // 如果有父Frame，则移到父Frame内容的最底层
          if (parentFrame) {
            const frameContents = Array.from(parentFrame.contents).sort(
              (a, b) => objects.indexOf(a) - objects.indexOf(b)
            );
            const bottomContentIndex = objects.indexOf(frameContents[0]);
            newIndex = bottomContentIndex;
          } else {
            newIndex = 0;
          }
          break;
      }

      if (newIndex !== currentIndex) {
        // 如果对象有父Frame，确保它不会超出父Frame的其他内容范围
        if (parentFrame) {
          const frameContents = Array.from(parentFrame.contents);
          const minContentIndex = Math.min(
            ...frameContents.map((c) => objects.indexOf(c))
          );
          const maxContentIndex = Math.max(
            ...frameContents.map((c) => objects.indexOf(c))
          );
          newIndex = Math.max(
            minContentIndex,
            Math.min(maxContentIndex, newIndex)
          );
        } else {
          // 如果没有父Frame，确保不会超过任何Frame
          const maxAllowedIndex = this.getMaxAllowedIndex(objects, null);
          newIndex = Math.min(newIndex, maxAllowedIndex);
        }

        this.context.canvas.moveObjectTo(activeObject, newIndex);
      }
    }

    // 重新渲染画布
    this.context.canvas.requestRenderAll();
  }

  /**
   * 获取对象可以移动的最大索引（确保不超过任何Frame）
   * @param objects 画布中的所有对象
   * @param currentFrame 当前操作的Frame（如果有）
   * @returns 最大允许的索引
   */
  private getMaxAllowedIndex(
    objects: any[],
    currentFrame: Frame | null
  ): number {
    // 获取所有Frame（除了当前操作的Frame）
    const frames = objects.filter(
      (obj) => obj instanceof Frame && obj !== currentFrame
    );

    // 如果没有其他Frame，可以移动到最顶层
    if (frames.length === 0) return objects.length - 1;

    // 找到最底层的Frame的索引
    const lowestFrameIndex = Math.min(
      ...frames.map((frame) => objects.indexOf(frame))
    );

    // 返回比最底层Frame低一层的索引
    return lowestFrameIndex - 1;
  }

  /**
   * 移动Frame层级
   * @param frame Frame对象
   * @param direction 移动方向
   */
  private moveFrameLayer(
    frame: Frame,
    direction: "up" | "down" | "top" | "bottom"
  ) {
    const objects = this.context.canvas.getObjects();
    const frames = objects.filter((obj) => obj instanceof Frame);
    const currentIndex = frames.indexOf(frame);

    // 找到PageFrame的索引，确保Frame不会低于PageFrame
    const pageFrameIndex = objects.findIndex((obj) => obj instanceof PageFrame);

    let newIndex = currentIndex;
    switch (direction) {
      case "up":
        // 向上一层，在canvas中索引增加
        newIndex = Math.min(frames.length - 1, currentIndex + 1);
        break;
      case "down":
        // 向下一层，但不能低于PageFrame
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case "top":
        // 置顶，移到frames数组的最后
        newIndex = frames.length - 1;
        break;
      case "bottom":
        // 置底，但不能低于PageFrame
        newIndex = 0;
        break;
    }

    if (newIndex !== currentIndex) {
      // 获取目标Frame在canvas中的实际索引
      const targetFrameCanvasIndex = objects.indexOf(frames[newIndex]);

      // 确保不会移到PageFrame下面
      const finalIndex = Math.max(pageFrameIndex + 1, targetFrameCanvasIndex);

      // 移动Frame及其所有内容
      this.context.canvas.moveObjectTo(frame, finalIndex);

      // 确保Frame的内容也随着Frame一起移动
      frame.contents.forEach((content) => {
        // 将内容移到Frame之上
        this.context.canvas.bringObjectToFront(content);
      });
    }
  }

  /**
   * 移动Frame内容的层级
   * @param content 内容对象
   * @param parentFrame 父Frame
   * @param direction 移动方向
   */
  private moveContentLayer(
    content: any,
    parentFrame: Frame,
    direction: "up" | "down" | "top" | "bottom"
  ) {
    // 获取Frame内所有内容的数组
    const contents = Array.from(parentFrame.contents);
    console.log("moveContentLayer contents:", contents);
    const currentIndex = contents.indexOf(content);

    let newIndex = currentIndex;
    switch (direction) {
      case "up":
        // 向上一层
        newIndex = Math.min(contents.length - 1, currentIndex + 1);
        break;
      case "down":
        // 向下一层
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case "top":
        // 置顶
        newIndex = contents.length - 1;
        break;
      case "bottom":
        // 置底
        newIndex = 0;
        break;
    }

    if (newIndex !== currentIndex) {
      // 获取canvas中的所有对象
      const objects = this.context.canvas.getObjects();

      // 计算目标对象在canvas中的索引
      const targetContentCanvasIndex = objects.indexOf(contents[newIndex]);

      // 移动对象到新位置
      this.context.canvas.moveObjectTo(content, targetContentCanvasIndex);
    }
  }
}
