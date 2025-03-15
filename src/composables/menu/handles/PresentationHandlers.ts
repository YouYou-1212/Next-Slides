import type { HandlerContext, HandlerParams } from './types';

export class PresentationHandlers {
  private context: HandlerContext;

  constructor(context: HandlerContext) {
    this.context = context;
  }

  /**
   * 处理开始演示
   * @param params 处理器参数
   */
  public handleStartPresentation(params: HandlerParams) {
    // const event = new CustomEvent(EventNames.PRESENTATION.START, {
    //   detail: {
    //     canvas: this.context.canvas,
    //     target: params.target,
    //     position: params.position
    //   }
    // });
    // document.dispatchEvent(event);
  }
}