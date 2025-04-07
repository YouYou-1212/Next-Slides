import type { HandlerContext, HandlerParams } from './types';
import { EventBus, EventTypes } from '../../../utils/EventBus';
import { MyActiveSelection } from '../../../composables/subassembly/controls/MyActiveSelection';
import { GroupControl } from '../../../composables/subassembly/controls/GroupControl';
import { ActiveSelection } from 'fabric';

export class ContentHandlers {
  private context: HandlerContext;

  constructor(context: HandlerContext) {
    this.context = context;
  }

  
  public handleInsertText(params: HandlerParams) {
    if (!params.position) return;
    this.context.canvasManager?.getControlsManager()?.addText({
      left: params.position.x,
      top: params.position.y,
    });

    
    
    
    
    
    
    
    
  }

  
  public handleInsertImage(params: HandlerParams) {
    
    EventBus.emit(EventTypes.CONTROL_PANEL.OPEN, {
      type: EventTypes.PANEL_TYPE.INSERT_IMAGE,
      canvas: this.context.canvas,
      canvasManager: this.context.canvasManager,
      target: params.target,
      position: params.position
    });
    
    
    
    
    
    
    
    
  }

  
  public handleCopyObject(params: HandlerParams) {
    if (!params.target) return;
    
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'c',
      code: 'KeyC',
      ctrlKey: true,
      bubbles: true
    });
    document.dispatchEvent(keyEvent);
    
    
    
    
    
    
    
    
  }

  
  public handleCutObject(params: HandlerParams) {
    if (!params.target) return;

    
    
    
    
    
    
    
    
  }

  public handleCreateGroup(params: HandlerParams) {
    const activeObject = this.context.canvas.getActiveObject();
    if (!activeObject) {
      return;
    }
    if (activeObject.type !== 'activeSelection' && activeObject.type !== MyActiveSelection.type) {
      return;
    }
    const myActiveSelection = activeObject as MyActiveSelection;
    const group = new GroupControl(myActiveSelection.removeAll())
    this.context.canvasManager.getControlsManager().addGroup(group);
    this.context.canvas.setActiveObject(group);
    this.context.canvas.requestRenderAll();
    
  }


  public handleCancelGroup(params: HandlerParams) {
    const activeObject = this.context.canvas.getActiveObject();
    if (!activeObject || activeObject.type !== GroupControl.type) {
      return;
    }
    const groupControl = activeObject as GroupControl;
    this.context.canvas.remove(groupControl);
    const subObjs = groupControl.removeAll();
    
    
    

    var sel = new MyActiveSelection(subObjs, {
      canvas: this.context.canvas,
    });
    this.context.canvas.setActiveObject(sel);
    this.context.canvas.requestRenderAll();
  }

  
  public handlePaste(params: HandlerParams) {
    if (!params.position) return;
    
    
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'v',
      code: 'KeyV',
      ctrlKey: true,
      bubbles: true
    });
    document.dispatchEvent(keyEvent);
    
    
    
    
    
    
    
    
  }

  
  public handleDeleteObject(params: HandlerParams) {
    if (!params.target) return;
    this.context.canvasManager.removeObject(params.target);
    
    
    
    
    
    
    
    
  }


  public handleInsertShape(params: HandlerParams) {

  }
}