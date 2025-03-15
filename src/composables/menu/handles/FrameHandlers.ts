import type { HandlerContext, HandlerParams } from "./types";
import type { Frame } from "../../slides/Frame";

export class FrameHandlers {
  private context: HandlerContext;

  constructor(context: HandlerContext) {
    this.context = context;
  }

  /**
   * 处理插入Frame
   * @param params 处理器参数
   */
  public handleInsertFrame(params: HandlerParams) {
    if (!params.position) return;

    // const event = new CustomEvent(EventNames.FRAME.INSERT, {
    //   detail: {
    //     canvas: this.context.canvas,
    //     target: params.target,
    //     position: params.position,
    //   },
    // });
    // document.dispatchEvent(event);
  }

  /**
   * 处理删除Frame
   * @param params 处理器参数
   */
  public handleDeleteFrame(params: HandlerParams) {
    if (!params.target) return;
    // const canvas = this.context.canvas;
    const frame = params.target as Frame;
    this.context.canvasManager.getFrameManager().deleteFrame(frame.id)
    // frame.contents.forEach((content) => {
    //   canvas.remove(content);
    // });

    // canvas.remove(params.target);
    // canvas.renderAll();

    // const event = new CustomEvent(EventNames.FRAME.DELETE, {
    //   detail: {
    //     canvas: this.context.canvas,
    //     target: params.target,
    //     position: params.position,
    //   },
    // });
    // document.dispatchEvent(event);
  }
}
