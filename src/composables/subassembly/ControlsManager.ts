import * as fabric from "fabric";
import { CanvasManager } from "../canvas/CanvasManager";
import { Frame } from "../slides/Frame";
import { PageFrame } from "../slides/PageFrame";
import { TextControl } from "./controls/TextControl";
import { ImageControl } from "./controls/ImageControl";
import { ShapeControl } from "./controls/ShapeControl";
import { SIZES } from "../../constants/theme";
import type { CustomCanvas } from "../canvas/CustomCanvas";
import { markRaw } from "vue";

export class ControlsManager {
  private canvas: CustomCanvas;
  private canvasManager: CanvasManager;

  constructor(canvas: CustomCanvas, canvasManager: CanvasManager) {
    this.canvas = canvas;
    this.canvasManager = canvasManager;
    this.initPageFrame();
  }

  private initPageFrame() {
    console.warn(
      "initPageFrame",
      this.canvasManager.getPageFrameManager()
    );
  }


  private getTargetFrame() {
    // 获取可视区域中心点
    const vp = this.canvas.getVpCenter();
    const centerPoint = { x: vp.x, y: vp.y };
    // 根据中心点获取对应的Frame
    return this.getFrameContainingPoint(centerPoint);
  }

  // 根据点获取包含该点的Frame
  private getFrameContainingPoint(point: {
    x: number;
    y: number;
  }): fabric.FabricObject | null {
    const frames = this.canvasManager.getAllFrames();

    // 查找包含该点的Frame
    for (const frame of frames) {
      // 获取Frame的边界
      const frameBounds = frame.getBoundingRect();
      // 检查点是否在Frame内
      if (
        point.x >= frameBounds.left &&
        point.x <= frameBounds.left + frameBounds.width &&
        point.y >= frameBounds.top &&
        point.y <= frameBounds.top + frameBounds.height
      ) {
        return frame;
      }
    }

    const currentPageFrame = this.canvasManager.getPageFrame();
    // 如果没有找到包含该点的Frame，返回页面Frame
    return currentPageFrame;
  }

  // 获取可视区域中心点
  private getVisibleCenter() {
    const vp = this.canvas.getVpCenter();
    return {
      x: vp.x,
      y: vp.y,
    };
  }

  // 添加控件的通用方法
  private async addControl<T extends fabric.Object>(
    createControlFn: (options: any) => Promise<T> | T,
    options: any = {}
  ) {
    const targetFrame = this.getTargetFrame();
    if (!targetFrame) {
      console.warn("No active frame and no page frame found");
      return null;
    }
    console.log("addControl targetFrame:", targetFrame);

    try {
      // 创建控件
      const control = await createControlFn(options);
      console.log("addControl control:", control);

      // 保存相对位置
      control.set("_originalLeft", control.left - targetFrame.left);
      control.set("_originalTop", control.top - targetFrame.top);
      control.set("_originalAngle", control.angle || 0);

      // 添加到Frame和Canvas
      if (targetFrame instanceof Frame) {
        (targetFrame as Frame).addContent(control);
      }
      this.canvas.add(markRaw(control));
      this.canvas.setActiveObject(control);
      // this.canvas.renderAll();
      return control;
    } catch (error) {
      console.error("Failed to add control:", error);
      return null;
    }
  }

  // 添加文本
  addText(options: any = {}) {
    const center = this.getVisibleCenter();
    const defaultFontSize = 40; // 设置默认字体大小
    const zoom = this.canvas.getZoom();

    const createTextControl = (opts: any) => {
      return new TextControl("双击编辑文本", {
        left: opts.left !== undefined ? opts.left : center.x,
        top: opts.top !== undefined ? opts.top : center.y,
        borderWidth: 1 / zoom, // 边框宽度
        lineWidth: SIZES.BORDER_LINE_WIDTH_TEXT / zoom,
        fontSize: Math.round(defaultFontSize / zoom),
        ...opts,
      });
    };

    return this.addControl(createTextControl, options);
  }

  // 添加图片
  addImage(url: string, options: any = {}) {
    const center = this.getVisibleCenter();
    const zoom = this.canvas.getZoom();

    const createImageControl = async (opts: any): Promise<ImageControl> => {
      const image = await ImageControl.create(url, {
        left: opts.left !== undefined ? opts.left : center.x,
        top: opts.top !== undefined ? opts.top : center.y,
        scaleX: 0.5 / zoom,
        scaleY: 0.5 / zoom,
        ...opts,
      });
      return image as ImageControl;
    };

    return this.addControl<ImageControl>(createImageControl, options);
  }

  // 添加形状
  addShape(type: string, options: any = {}) {
    const center = this.getVisibleCenter();
    const zoom = this.canvas.getZoom();
    const createShapeControl = (opts: any): fabric.Object => {
      const baseOptions = {
        left: opts.left !== undefined ? opts.left : center.x,
        top: opts.top !== undefined ? opts.top : center.y,
        ...opts,
      };
      console.warn("addShape active frame", ShapeControl);
      const shape = ShapeControl.create(type, baseOptions);
      // 确保返回的是有效的 fabric.Object
      if (!shape) {
        throw new Error(`Failed to create shape of type: ${type}`);
      }
      return shape;
    };
    return this.addControl<fabric.Object>(createShapeControl, options);
  }

  // 添加克隆对象
  async addClonedObject(originalObject: fabric.Object, options: any = {}) {
    const center = this.getVisibleCenter();
    const objectType = originalObject.type;

    // 根据对象类型选择不同的添加方法
    if (originalObject instanceof ImageControl) {
      // 处理图片对象
      const element = originalObject.getElement() as HTMLImageElement;
      const src = element.src;
      return this.addImage(src, {
        left: options.left !== undefined ? options.left : center.x,
        top: options.top !== undefined ? options.top : center.y,
        scaleX: originalObject.scaleX,
        scaleY: originalObject.scaleY,
        angle: originalObject.angle,
        flipX: originalObject.flipX,
        flipY: originalObject.flipY,
        opacity: originalObject.opacity,
        ...options,
      });
    } else if (objectType === TextControl.type || originalObject instanceof TextControl) {
      // 处理文本对象
      const textObj = originalObject as fabric.Text;
      return this.addText({
        left: options.left !== undefined ? options.left : center.x,
        top: options.top !== undefined ? options.top : center.y,
        text: textObj.text,
        fontSize: textObj.fontSize,
        fontFamily: textObj.fontFamily,
        fontWeight: textObj.fontWeight,
        fontStyle: textObj.fontStyle,
        textAlign: textObj.textAlign,
        fill: textObj.fill,
        ...options,
      });
    } else if (["rect", "circle", "triangle"].includes(objectType)) {
      // 处理形状对象
      return this.addShape(objectType, {
        left: options.left !== undefined ? options.left : center.x,
        top: options.top !== undefined ? options.top : center.y,
        width: (originalObject as any).width,
        height: (originalObject as any).height,
        fill: (originalObject as any).fill,
        stroke: (originalObject as any).stroke,
        strokeWidth: (originalObject as any).strokeWidth,
        rx: (originalObject as any).rx,
        ry: (originalObject as any).ry,
        ...options,
      });
    } else {
      // 处理其他类型的对象
      console.warn(`未知对象类型: ${objectType}，使用通用克隆方法`);

      // 使用通用的克隆方法
      const createGenericClone = async (opts: any): Promise<fabric.Object> => {
        try {
          const cloned = await originalObject.clone();
          cloned.set({
            left: opts.left !== undefined ? opts.left : center.x,
            top: opts.top !== undefined ? opts.top : center.y,
            ...opts,
          });
          return cloned;
        } catch (error) {
          console.error("克隆对象失败:", error);
          throw error;
        }
      };

      return this.addControl(createGenericClone, options);
    }
  }

}
