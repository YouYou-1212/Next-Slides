import * as fabric from "fabric";
import { CanvasManager } from "./CanvasManager";
import { KeyboardEventHandler } from "./events/KeyboardEventHandler";
import { MouseEventHandler } from "./events/MouseEventHandler";
import { ObjectEventHandler } from "./events/ObjectEventHandler";
import { SelectionEventHandler } from "./events/SelectionEventHandler";
import type { CustomCanvas } from "./CustomCanvas";

export class EventManager {
  private keyboardHandler: KeyboardEventHandler;
  private mouseHandler: MouseEventHandler;
  private objectEventHandler: ObjectEventHandler;
  private selectionEventHandler: SelectionEventHandler;

  constructor(canvas: CustomCanvas, canvasManager: CanvasManager) {
    
    this.keyboardHandler = new KeyboardEventHandler(canvas , canvasManager);
    this.mouseHandler = new MouseEventHandler(canvas, canvasManager, this);
    this.objectEventHandler = new ObjectEventHandler(canvas, canvasManager);
    this.selectionEventHandler = new SelectionEventHandler(canvas, canvasManager);
  }

  
  public getKeyboardHandler(): KeyboardEventHandler {
    return this.keyboardHandler;
  }

  public getMouseHandler(): MouseEventHandler {
    return this.mouseHandler;
  }

  
  public destroy() {
    this.keyboardHandler.destroy();
    this.mouseHandler.destroy();
  }
}