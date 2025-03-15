import * as fabric from "fabric";
import { COLORS, SIZES } from "../../../constants/theme";
import { CanvasManager } from "../CanvasManager";
import { Frame } from "../../slides/Frame";
import { EventManager } from "../EventManager";
import { findObjectsByPosition, isPointInObject, isPointOnRectBorder } from "../../../utils/CanvasUtils";
import { Slides } from "../../slides/Slides";
import type { CustomCanvas } from "../CustomCanvas";

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
    const originalFindTarget = this.canvas.findTarget;
    this.canvas.findTarget = function (e: fabric.TPointerEvent) {
      const pointer = this.getPointer(e, true);
      const point = new fabric.Point(pointer.x, pointer.y);
      const targets = findObjectsByPosition(this, point);
      const nonFrameTarget = targets.find(
        (obj) => obj.type !== Slides.type && !(obj instanceof Slides)
      );
      if (nonFrameTarget) {
        return nonFrameTarget;
      }
      const slidesTarget = targets.find((obj) => {
        return obj instanceof Slides && isPointOnRectBorder(point, obj, 5);
      });
      if (slidesTarget) {
        return slidesTarget;
      }
      return targets.length > 0 ? targets[0] : originalFindTarget.call(this, e);
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
        console.log("mouse:down 鼠标点击位置：", pointer);
        const point = new fabric.Point(pointer.x, pointer.y);

        // 查找点击位置下的所有对象
        const targets = findObjectsByPosition(this.canvas, point);
        // 查找第一个非Frame和PageFrame的对象
        const nonFrameTarget = targets.find(
          (obj) => obj.type !== Slides.type && !(obj instanceof Slides)
        );

        // 如果找到了非Frame对象，则选中它
        if (nonFrameTarget) {
          this.canvas.setActiveObject(nonFrameTarget);
          this.canvas.requestRenderAll();
          // 关键修改：设置事件目标为非Frame对象，确保后续事件能正确传递
          opt.target = nonFrameTarget;
          // // 阻止事件继续传播，防止选中Frame
          // opt.e.stopPropagation();
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
      // const point = new fabric.Point(pointer.x, pointer.y);
      // const targets = findObjectsByPosition(this.canvas, point);

      // console.log("mouse:move 鼠标当前位置：", targets);


      if (this.eventManager.getKeyboardHandler().isInSpaceDragMode()) return;
      // 如果正在拖动对象，则不执行悬停检测
      if (this.canvas.isDraggingObject) return;

      // console.log("mouse:move 鼠标当前位置：", pointer);
      // 处理对象的悬停效果
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
    const targets = findObjectsByPosition(this.canvas, point);
    // console.log("发现鼠标下所有对象targets", targets);

    // 从targets中找出第一个非Frame和PageFrame的元素
    const nonFrameTarget = targets.find(
      (obj) => obj.type !== Slides.type && !(obj instanceof Slides)
    );

    const target = nonFrameTarget || (targets.length > 0 ? targets[0] : null);

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
      console.log("鼠标滚轮事件：", opt);
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
    if (target.type === "text" && typeof target.showBorder === "function") {
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
      borderColor: COLORS.BORDER.HOVER,
      strokeWidth: SIZES.STROKE_WIDTH / zoom,
      borderScaleFactor: SIZES.BORDER_SCALE_FACTOR,
    };

    if (target.type !== "text" && target.type !== "textbox") {
      highlightProps.customBorderColor = COLORS.BORDER.HOVER;
    }

    target.set(highlightProps);
    // this.canvas.requestRenderAll();
  }

  /**
   * 鼠标移出
   * @param target
   * @returns
   */
  private handleHoverOut(target: any) {
    if (target.type === "text" && typeof target.showBorder === "function") {
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

      if (target.type !== "text" && target.type !== "textbox") {
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
