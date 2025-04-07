import type { HandlerContext, HandlerParams } from "./types";

export class LayerHandlers {
  private context: HandlerContext;

  constructor(context: HandlerContext) {
    this.context = context;
  }

  
  public handleMoveLayer(
    params: HandlerParams,
    direction: "up" | "down" | "top" | "bottom"
  ) {
    if (!params.target) return;
    this.moveActiveObject(direction, params.target);
  }

  
  private moveActiveObject(
    direction: "up" | "down" | "top" | "bottom",
    target: any
  ) {
    const activeObject = target;
    if (!activeObject) return;
    
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
