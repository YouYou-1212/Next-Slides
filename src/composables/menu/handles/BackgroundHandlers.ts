import type { HandlerContext, HandlerParams } from './types';
import { EventBus, EventTypes } from '../../../utils/EventBus';

export class BackgroundHandlers {
  private context: HandlerContext;

  constructor(context: HandlerContext) {
    this.context = context;
  }

  /**
   * 处理更换背景
   * @param params 处理器参数
   */
  public handleChangeBackground(params: HandlerParams) {
    // 通过事件总线打开控制面板并加载图片选择组件
    EventBus.emit(EventTypes.CONTROL_PANEL.OPEN, {
      type: EventTypes.PANEL_TYPE.BACKGROUND_IMAGE,
      canvas: this.context.canvas,
      target: params.target,
      position: params.position
    });
  }

  /**
   * 处理更换配色方案
   * @param params 处理器参数
   */
  public handleChangeColorScheme(params: HandlerParams) {
    console.log('更换配色方案' , params);
    // 通过事件总线打开控制面板并加载颜色选择组件
    EventBus.emit(EventTypes.CONTROL_PANEL.OPEN, {
      type: EventTypes.PANEL_TYPE.BACKGROUND_COLOR,
      canvas: this.context.canvas,
      target: params.target,
      position: params.position
    });
    // const event = new CustomEvent(EventNames.BACKGROUND.CHANGE_SCHEME, {
    //   detail: {
    //     canvas: this.context.canvas,
    //     target: params.target,
    //     position: params.position
    //   }
    // });
    // document.dispatchEvent(event);
  }
}