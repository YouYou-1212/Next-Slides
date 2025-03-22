import * as fabric from "fabric";
import { COLORS, SIZES } from "../../../constants/theme";
import { CanvasManager } from "../CanvasManager";
import { Frame } from "../../slides/Frame";
import { EventManager } from "../EventManager";
import { findObjectsByPosition, findTargetObject, isPointInObject, isPointOnRectBorder } from "../../../utils/CanvasUtils";
import { Slides } from "../../slides/Slides";
import type { CustomCanvas } from "../CustomCanvas";
import { TextControl } from "../../../composables/subassembly/controls/TextControl";

export class MouseEventHandler {
  private canvas: CustomCanvas;
  private canvasManager: CanvasManager;
  private eventManager: EventManager;
  private isDragging = false;
  private lastPosX = 0;
  private lastPosY = 0;
  // 添加变量跟踪当前悬停的对象
  private currentHoverObject: any = null;

  constructor(
    canvas: CustomCanvas,
    canvasManager: CanvasManager,
    eventManager: EventManager
  ) {
    this.canvas = canvas;
    this.canvasManager = canvasManager;
    this.eventManager = eventManager;
    // 修改 fabric.js 的事件处理逻辑，优先处理非Frame对象
    this.setupEventOverrides();
    this.initMouseEvents();
  }

  private initMouseEvents() {
    this.setupMouseDownEvents();
    this.setupMouseMoveEvents();
    this.setupMouseUpEvents();
    this.setupMouseWheelEvents();
  }

  /**
   * 覆盖事件处理
   */
  private setupEventOverrides() {
    const originalCanvas = this.canvas;
    const originalFindTarget = this.canvas.findTarget;
    this.canvas.findTarget = function (e: fabric.TPointerEvent) {
      const pointer = this.getPointer(e, true);
      const point = new fabric.Point(pointer.x, pointer.y);
      const {target ,targets } = findTargetObject(originalCanvas , point);
      return target || originalFindTarget.call(this, e);
    };
  }

  /**
   * 设置鼠标按下事件
   */
  private setupMouseDownEvents() {
    this.canvas.on("mouse:down", (opt: any) => {
      if (!this.eventManager.getKeyboardHandler().isInSpaceDragMode()) {
        this.isDragging = false;
        this.canvas.selection = true;

        // 获取鼠标点击位置
        const pointer = this.canvas.getViewportPoint(opt);
        console.log("[MouseEventHandler] mouse:down：", pointer);
        const point = new fabric.Point(pointer.x, pointer.y);
        const {target ,targets } = findTargetObject(this.canvas , point);
        if (target) {
          this.canvas.setActiveObject(target);
          this.canvas.requestRenderAll();
          opt.target = target;
          return;
        }
      } else {
        this.isDragging = true;
        this.canvas.selection = false;
        this.canvas.defaultCursor = "grabbing";
      }
      this.lastPosX = opt.e.clientX;
      this.lastPosY = opt.e.clientY;
    });
  }

  /**
   * 设置鼠标移动事件
   */
  private setupMouseMoveEvents() {
    let rafId: number | null = null;

    this.canvas.on("mouse:move", (opt: any) => {
      // 处理画布拖拽
      if (this.isDragging) {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          const deltaX = opt.e.clientX - this.lastPosX;
          const deltaY = opt.e.clientY - this.lastPosY;

          const vpt = this.canvas.viewportTransform!;
          vpt[4] += deltaX;
          vpt[5] += deltaY;

          this.canvas.setViewportTransform(vpt);
          this.lastPosX = opt.e.clientX;
          this.lastPosY = opt.e.clientY;

          rafId = null;
        });
        return;
      }
      const pointer = this.canvas.getViewportPoint(opt);
      if (this.eventManager.getKeyboardHandler().isInSpaceDragMode()) return;
      // 如果正在拖动对象，则不执行悬停检测
      if (this.canvas.isDraggingObject) return;
      this.handleObjectHover(pointer);
    });
  }


  /**
   * 处理对象悬停效果
   */
  private handleObjectHover(pointer: { x: number; y: number }) {
    // 设置默认光标样式
    this.canvas.defaultCursor = "default";
    const point = new fabric.Point(pointer.x, pointer.y);
    const {target ,targets } = findTargetObject(this.canvas , point);
    // 如果当前悬停对象与新对象不同
    if (this.currentHoverObject !== target) {
      // 处理鼠标移出旧对象
      if (this.currentHoverObject) {
        const isSelected = this.canvas
          .getActiveObjects()
          .includes(this.currentHoverObject);
        if (!isSelected) {
          this.handleHoverOut(this.currentHoverObject);
        }
      }

      // 处理鼠标移入新对象
      if (target) {
        const isSelected = this.canvas.getActiveObjects().includes(target);
        if (!isSelected) {
          this.handleHoverIn(target);
        }
      }

      // 更新当前悬停对象
      this.currentHoverObject = target;
      this.canvas.requestRenderAll();
    }
  }

  /**
   * 设置鼠标抬起事件
   */
  private setupMouseUpEvents() {
    this.canvas.on("mouse:up", () => {
      this.isDragging = false;
      if (!this.eventManager.getKeyboardHandler().isInSpaceDragMode()) {
        this.canvas.selection = true;
      } else {
        this.canvas.defaultCursor = "grab";
      }
    });
  }

  /**
   * 设置鼠标滚轮事件
   */
  private setupMouseWheelEvents() {
    this.canvas.on("mouse:wheel", (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = this.canvas.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.min(Math.max(SIZES.MIN_ZOOM, zoom), SIZES.MAX_ZOOM);

      const point = {
        x: opt.e.offsetX,
        y: opt.e.offsetY,
      };

      this.canvas.zoomToPoint(new fabric.Point(point.x, point.y), zoom);

      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  }


  /**
   * 鼠标移入
   * @param target
   * @returns
   */
  private handleHoverIn(target: any) {
    if (target.type === TextControl.type && typeof target.showBorder === "function") {
      target.showBorder(true);
      return;
    }
    if (!target._originalCustomBorderColor) {
      this.saveOriginalState(target);
    }
    // 保存原始光标样式并设置为默认
    if (!target._originalHoverCursor) {
      target._originalHoverCursor = target.hoverCursor;
      target.hoverCursor = "default";
    }

    const zoom = this.canvas.getZoom();
    const highlightProps: any = {
      borderColor: target instanceof Slides ? COLORS.BORDER.SLIDES_HOVER : COLORS.BORDER.HOVER,
      strokeWidth: SIZES.STROKE_WIDTH / zoom,
      borderScaleFactor: SIZES.BORDER_SCALE_FACTOR,
    };
    if (target.type !== TextControl.type) {
      highlightProps.customBorderColor = target instanceof Slides ? COLORS.BORDER.SLIDES_HOVER : COLORS.BORDER.HOVER;
    }
    target.set(highlightProps);
  }

  /**
   * 鼠标移出
   * @param target
   * @returns
   */
  private handleHoverOut(target: any) {
    if (target.type === TextControl.type && typeof target.showBorder === "function") {
      target.showBorder(false);
      return;
    }
    // 恢复原始光标样式
    if (target._originalHoverCursor !== undefined) {
      target.hoverCursor = target._originalHoverCursor;
      delete target._originalHoverCursor;
    }
    this.restoreOriginalState(target);
  }


  private saveOriginalState(target: any) {
    target._originalBorderColor = target.borderColor;
    target._originalStroke = target.stroke;
    target._originalCustomBorderColor = target.customBorderColor;
    target._originalStrokeWidth = target.strokeWidth;
    target._originalBorderScaleFactor = target.borderScaleFactor;
    target._originalHoverCursor = target.hoverCursor;
  }

  private restoreOriginalState(target: any) {
    if (target._originalCustomBorderColor !== undefined) {
      const restoreProps: any = {
        borderColor: target._originalBorderColor,
        strokeWidth: target._originalStrokeWidth,
        borderScaleFactor: target._originalBorderScaleFactor,
      };

      if (target.type !== TextControl.type) {
        restoreProps.customBorderColor = target._originalCustomBorderColor;
      }

      target.set(restoreProps);

      delete target._originalBorderColor;
      delete target._originalStroke;
      delete target._originalStrokeWidth;
      delete target._originalBorderScaleFactor;
      delete target._originalCustomBorderColor;
      // 恢复原始光标样式
      if (target._originalHoverCursor !== undefined) {
        target.hoverCursor = target._originalHoverCursor;
        delete target._originalHoverCursor;
      }
      this.canvas.requestRenderAll();
    }
  }

  public destroy() {
    // 移除所有事件监听器
    this.canvas.off("mouse:down");
    this.canvas.off("mouse:move");
    this.canvas.off("mouse:up");
    this.canvas.off("mouse:wheel");
    // this.canvas.off("mouse:over");
    // this.canvas.off("mouse:out");
    // this.canvas.off("selection:created");
    // this.canvas.off("selection:updated");
    // this.canvas.off("selection:cleared");
    // this.canvas.off("object:added");
  }
}
