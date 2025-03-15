import type * as fabric from 'fabric';
import type { CanvasManager } from '../../canvas/CanvasManager';
import type { ContextMenuManager } from '../ContextMenuManager';

export interface Position {
  x: number;
  y: number;
}

export interface HandlerContext {
  canvas: fabric.Canvas;
  canvasManager:CanvasManager;
  contextMenuManager: ContextMenuManager;
}

export interface HandlerParams {
  // canvas: fabric.Canvas;
  target?: fabric.Object | null;
  position?: Position;
}