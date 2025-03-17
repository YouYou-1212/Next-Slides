import type { HandlerContext, HandlerParams } from "./types";

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
    // 计算新的索引位置
    switch (direction) {
      case "up":
        this.context.canvas.bringObjectForward(activeObject, false);
        break;
      case "down":
        this.context.canvas.sendObjectBackwards(activeObject, false);
        break;
      case "top":
        this.context.canvas.bringObjectToFront(activeObject);
        break;
      case "bottom":
        this.context.canvas.sendObjectToBack(activeObject);
        break;
    }

  }

}
