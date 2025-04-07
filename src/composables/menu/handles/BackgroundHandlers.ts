import type { HandlerContext, HandlerParams } from './types';
import { EventBus, EventTypes } from '../../../utils/EventBus';

export class BackgroundHandlers {
  private context: HandlerContext;

  constructor(context: HandlerContext) {
    this.context = context;
  }

  
  public handleChangeBackground(params: HandlerParams) {
    
    EventBus.emit(EventTypes.CONTROL_PANEL.OPEN, {
      type: EventTypes.PANEL_TYPE.BACKGROUND_IMAGE,
      canvas: this.context.canvas,
      target: params.target,
      position: params.position
    });
  }

  
  public handleChangeColorScheme(params: HandlerParams) {
    
    
    EventBus.emit(EventTypes.CONTROL_PANEL.OPEN, {
      type: EventTypes.PANEL_TYPE.BACKGROUND_COLOR,
      canvas: this.context.canvas,
      target: params.target,
      position: params.position
    });
    
    
    
    
    
    
    
    
  }
}