import * as fabric from "fabric";
import { COLORS, SIZES } from "../../../constants/theme";
import { CanvasManager } from "../CanvasManager";
import { Frame } from "../../slides/Frame";
import { PageFrame } from "../../slides/PageFrame";
import  { EventBus, EventTypes } from "../../../utils/EventBus";

export class SelectionEventHandler {
  private canvas: fabric.Canvas;
  private canvasManager: CanvasManager;

  constructor(canvas: fabric.Canvas, canvasManager: CanvasManager) {
    this.canvas = canvas;
    this.canvasManager = canvasManager;
    this.setupSelectionEvents();
  }

  /**
   * 设置选择事件
   */
  private setupSelectionEvents() {
    this.canvas.on("selection:created", this.handleSelection.bind(this));
    this.canvas.on("selection:updated", this.handleSelection.bind(this));
    this.canvas.on("selection:cleared", this.handleSelectionCleared.bind(this));
  }

  private handleSelection(event: any) {
    const target = event.selected?.[0];
    if (!target) return;

    this.handleSelectionEventBorderStatus(event);

    // 处理文本组件选中，显示文本设置工具栏
    if (target.type === "text" || target.type === "textbox") {
      this.showTextSettingToolbar(target);
    } else {
      // 非文本组件选中时，隐藏文本设置工具栏
      this.hideTextSettingToolbar();
    }

    if (target.type === Frame.type) {
      this.canvasManager.getFrameManager().setCurrentFrame(target);
    } else if (target.type === PageFrame.type) {
      this.canvasManager.getFrameManager().setCurrentFrame(null);
    }
    // 显示所有Frame的编号控件
    this.toggleFrameNumberControls(target);
  }

  private handleSelectionCleared(event: any) {
    // console.log("handleSelectionCleared", event);
    this.canvasManager.getFrameManager().setCurrentFrame(null);
    this.handleSelectionEventBorderStatus(event);
    // 显示所有Frame的编号控件
    this.toggleFrameNumberControls(null);
    // 隐藏文本设置工具栏
    this.hideTextSettingToolbar();
  }

  private handleSelectionEventBorderStatus(event: any) {
    // console.log("handleSelectionEventBorderStatus", event);
    const deselectedObjects = event.deselected;
    // console.log(
    //   "handleSelectionEventBorderStatus deselectedObjects",
    //   deselectedObjects
    // );
    if (deselectedObjects?.length > 0) {
      deselectedObjects.forEach((target: any) => {
        if (target.type === "text" && typeof target.showBorder === "function") {
          target.showBorder(false);
          return;
        }
        this.restoreOriginalState(target);
      });
    } else {
      //首次选中
      const selectedObjects = event.selected;
      // console.log(
      //   "handleSelectionEventBorderStatus selectedObjects"
      //   // target , target._originalCustomBorderColor
      // );
      if (selectedObjects?.length > 0) {
        selectedObjects.forEach((target: any) => {
          if (target.type === "frame") {
            if (target._originalCustomBorderColor === undefined) {
              target._originalBorderColor = target.borderColor;
              target._originalCustomBorderColor = target.customBorderColor;
              target._originalStrokeWidth = target.strokeWidth;
              target._originalBorderScaleFactor = target.borderScaleFactor;

              target.set({
                borderColor: COLORS.BORDER.HOVER,
                customBorderColor: COLORS.BORDER.HOVER,
                strokeWidth: SIZES.STROKE_WIDTH,
                // borderScaleFactor: 1,
              });
              this.canvas.requestRenderAll();
            }
            return;
          }
        });
      }
    }
  }

  private restoreOriginalState(target: any) {
    if (target._originalCustomBorderColor !== undefined) {
      const restoreProps: any = {
        borderColor: target._originalBorderColor,
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

      this.canvas.requestRenderAll();
    }
  }

  /**
   * 切换显示数字标签
   * @param target
   */
  private toggleFrameNumberControls(target: any) {
    // 如果target为空，则隐藏所有数字标签
    if (!target) {
      console.log("隐藏所有Frame的控件");
      this.hideAllFrameNumberControls();
      return;
    }
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length > 0 && this.hasFrameSelected()) {
      this.showAllFrameNumberControls(target);
    } else {
      this.hideAllFrameNumberControls();
    }
  }

  /**
   * 检查选中的组件中是否有Frame
   * 
   */
  private hasFrameSelected(): boolean {
    const activeObjects = this.canvas.getActiveObjects();
    return activeObjects.some((obj: any) => obj instanceof Frame);
  }

  // 显示所有Frame的编号控件
  private showAllFrameNumberControls(target: Frame) {
    // console.log("showAllFrameNumberControls");
    const allObjects = this.canvas.getObjects();
    allObjects.forEach((obj: any) => {
      if (obj instanceof Frame) {
        obj.setNumberControlVisibility(true);
        obj.isCurrentSelected = obj === target;
      }
    });
    this.canvas.requestRenderAll();
  }

  // 隐藏所有Frame的编号控件
  private hideAllFrameNumberControls() {
    const allObjects = this.canvas.getObjects();
    allObjects.forEach((obj: any) => {
      if (obj instanceof Frame) {
        obj.setNumberControlVisibility(false);
        obj.isCurrentSelected = false;
      }
    });
    this.canvas.requestRenderAll();
  }

  // 显示文本设置工具栏
  private showTextSettingToolbar(target: fabric.Object) {
    if (!target || (target.type !== "text" && target.type !== "textbox")) return;
    
    EventBus.emit(EventTypes.CONTROL_PANEL.SHOW_TEXT_SETTING_TOOLBAR, {
      target,
      canvas: this.canvas,
      canvasManager: this.canvasManager
    });
  }

  // 隐藏文本设置工具栏
  private hideTextSettingToolbar() {
    EventBus.emit(EventTypes.CONTROL_PANEL.HIDE_TEXT_SETTING_TOOLBAR);
  }

  public destroy() {
    this.canvas.off("selection:created");
    this.canvas.off("selection:updated");
    this.canvas.off("selection:cleared");
  }
}
