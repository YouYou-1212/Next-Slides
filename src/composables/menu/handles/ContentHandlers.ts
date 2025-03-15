import type { HandlerContext, HandlerParams } from './types';
import { EventBus, EventTypes } from '../../../utils/EventBus';

export class ContentHandlers {
  private context: HandlerContext;

  constructor(context: HandlerContext) {
    this.context = context;
  }

  /**
   * 处理插入文本
   * @param params 处理器参数
   */
  public handleInsertText(params: HandlerParams) {
    if (!params.position) return;
    this.context.canvasManager?.getControlsManager()?.addText({
      left:params.position.x,
      top:params.position.y,
    });
    
    // const event = new CustomEvent(EventNames.CONTENT.INSERT_TEXT, {
    //   detail: {
    //     canvas: this.context.canvas,
    //     target: params.target,
    //     position: params.position
    //   }
    // });
    // document.dispatchEvent(event);
  }

  /**
   * 处理插入图片
   * @param params 处理器参数
   */
  public handleInsertImage(params: HandlerParams) {
    //转发消息交给 ContorlPanel处理
    EventBus.emit(EventTypes.CONTROL_PANEL.OPEN, {
      type: EventTypes.PANEL_TYPE.INSERT_IMAGE,
      canvas: this.context.canvas,
      canvasManager:this.context.canvasManager,
      target: params.target,
      position: params.position
    });
    // const event = new CustomEvent(EventNames.CONTENT.INSERT_IMAGE, {
    //   detail: {
    //     canvas: this.context.canvas,
    //     target: params.target,
    //     position: params.position
    //   }
    // });
    // document.dispatchEvent(event);
  }

  /**
   * 处理复制对象
   * @param params 处理器参数
   */
  public handleCopyObject(params: HandlerParams) {
    if (!params.target) return;
    // 模拟触发 Ctrl+C 键盘事件
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'c',
      code: 'KeyC',
      ctrlKey: true,
      bubbles: true
    });
    document.dispatchEvent(keyEvent);
    // const event = new CustomEvent(EventNames.CONTENT.COPY, {
    //   detail: {
    //     canvas: this.context.canvas,
    //     target: params.target,
    //     position: params.position
    //   }
    // });
    // document.dispatchEvent(event);
  }

  /**
   * 处理剪切对象
   * @param params 处理器参数
   */
  public handleCutObject(params: HandlerParams) {
    if (!params.target) return;
    
    // const event = new CustomEvent(EventNames.CONTENT.CUT, {
    //   detail: {
    //     canvas: this.context.canvas,
    //     target: params.target,
    //     position: params.position
    //   }
    // });
    // document.dispatchEvent(event);
  }

  /**
   * 处理粘贴操作
   * @param params 处理器参数
   */
  public handlePaste(params: HandlerParams) {
    if (!params.position) return;
    console.log('鼠标右键 粘贴事件触发');
    // 模拟触发 Ctrl+V 键盘事件
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'v',
      code: 'KeyV',
      ctrlKey: true,
      bubbles: true
    });
    document.dispatchEvent(keyEvent);
    // const event = new CustomEvent(EventNames.CONTENT.PASTE, {
    //   detail: {
    //     canvas: this.context.canvas,
    //     target: params.target,
    //     position: params.position
    //   }
    // });
    // document.dispatchEvent(event);
  }

  /**
   * 处理删除对象
   * @param params 处理器参数
   */
  public handleDeleteObject(params: HandlerParams) {
    if (!params.target) return;
    this.context.canvasManager.removeObject(params.target);
    // const event = new CustomEvent(EventNames.CONTENT.DELETE, {
    //   detail: {
    //     canvas: this.context.canvas,
    //     target: params.target,
    //     position: params.position
    //   }
    // });
    // document.dispatchEvent(event);
  }


  public handleInsertShape(params: HandlerParams){

  }
}