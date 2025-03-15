import type { HandlerContext } from "./handles/types";
import { FrameHandlers } from "./handles/FrameHandlers";
import { BackgroundHandlers } from "./handles/BackgroundHandlers";
import { ContentHandlers } from "./handles/ContentHandlers";
import { LayerHandlers } from "./handles/LayerHandlers";
import { PresentationHandlers } from "./handles/PresentationHandlers";

export class HandlerManager {
  public readonly frame: FrameHandlers;
  public readonly background: BackgroundHandlers;
  public readonly content: ContentHandlers;
  public readonly layer: LayerHandlers;
  public readonly presentation: PresentationHandlers;

  constructor(context: HandlerContext) {
    this.frame = new FrameHandlers(context);
    this.background = new BackgroundHandlers(context);
    this.content = new ContentHandlers(context);
    this.layer = new LayerHandlers(context);
    this.presentation = new PresentationHandlers(context);
  }
}
