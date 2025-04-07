import type { HandlerContext, HandlerParams } from "./types";
import type { Frame } from "../../slides/Frame";

export class FrameHandlers {
  private context: HandlerContext;

  constructor(context: HandlerContext) {
    this.context = context;
  }

  
  public handleInsertFrame(params: HandlerParams) {
    if (!params.position) return;

    
    
    
    
    
    
    
    
  }

  
  public handleDeleteFrame(params: HandlerParams) {
    if (!params.target) return;
    
    const frame = params.target as Frame;
    this.context.canvasManager.getFrameManager().deleteFrame(frame.id)
    
    
    

    
    

    
    
    
    
    
    
    
    
  }
}
