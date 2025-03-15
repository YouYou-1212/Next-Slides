// src/lib/canvas/Frame.ts
import * as fabric from "fabric";
import { Slides } from "./Slides";
import type { FrameOptions } from "../../types/canvas";
import { COLORS } from "../../constants/theme";

export class Frame extends Slides {
  static type = "frame";
  declare parentPage: any;
  declare contents: Set<any>;
  declare _originalLeft: number;
  declare _originalTop: number;
  declare order: number;

  // 添加控制显示的属性
  // declare showFrameNumberControl: boolean;
  // declare isHoveringControl: boolean;
  declare isCurrentSelected: boolean;

  constructor(options: any) {
    console.log("Frame options", options);
    const frameOptions = {
      ...options,
    };

    super(frameOptions);
    this.parentPage = options.parentPage;
    this.contents = new Set();
    this._originalLeft = options.left;
    this._originalTop = options.top;
    this.order = options.order || 0;

    // this.showFrameNumberControl = false; // 默认隐藏
    // this.isHoveringControl = false;

    console.log("初始化Frame当前Frame Order:", this.order);
    this.initFrameNumberControl();
  }

  initFrameNumberControl() {
    // 保存原始的 tl 控件引用
    const originalTlControl = this.controls.tl;
    this.controls.frameNumberCorner = new fabric.Control({
      x: -0.5,
      y: -0.5,
      offsetX: 3,
      offsetY: 3,
      cursorStyle: "nwse-resize",
      render: this.renderCustomCorner,
      // 透传鼠标事件到 tl 控件
      mouseDownHandler: function (eventData, transformData, x, y) {
        transformData.originX = "right";
        transformData.originY = "bottom";
        // 强制设置操作点为tl
        transformData.corner = "tl";
        // 使用原始tl控件的处理逻辑
        return originalTlControl.mouseDownHandler?.call(
          originalTlControl,
          eventData,
          transformData,
          x,
          y
        );
      },
      // 透传缩放操作到 tl 控件
      actionHandler: function (eventData, transformData, x, y) {
        return fabric.controlsUtils.scalingEqually(
          eventData,
          transformData,
          x,
          y
        );
      },
    });
  }

  public setNumberControlVisibility(isShow: boolean): void {
    this.setControlVisibility("frameNumberCorner", isShow);
    // this.requestRender();
  }

  // // 判断鼠标是否在控件区域内
  // isMouseOverControl(e: any) {
  //   if (!e.absolutePointer) return false;
  //   // 获取控件位置
  //   const control = this.controls.frameNumberCorner;
  //   if (!control) return false;
  //   const zoom = this.canvas ? this.canvas.getZoom() : 1;
  //   // const { x, y } = control;
  //   const size = 24; // 控件大小

  //   // 计算控件中心点在画布上的绝对位置
  //   const centerX = this.left;
  //   const centerY = this.top;
  //   // 检查鼠标是否在控件区域内
  //   const mouseX = e.absolutePointer.x;
  //   const mouseY = e.absolutePointer.y;
  //   return (
  //     mouseX >= centerX - size / 2 / zoom &&
  //     mouseX <= centerX + size / 2 / zoom &&
  //     mouseY >= centerY - size / 2 / zoom &&
  //     mouseY <= centerY + size / 2 / zoom
  //   );
  // }

  /**
   * 渲染自定义控件
   * @param ctx
   * @param left
   * @param top
   * @param styleOverride
   * @param fabricObject
   */
  renderCustomCorner = (
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    _styleOverride: any,
    fabricObject: { angle: fabric.TDegree }
  ) => {
    // console.log(
    //   "renderCustomCorner",
    //   this.showFrameNumberControl,
    //   this.isHoveringControl
    // );
    const zoom = this.canvas ? this.canvas.getZoom() : 1;
    const size = 18;
    ctx.save();
    ctx.translate(left, top);
    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));

    // 绘制一个圆形背景
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
    // ctx.fillStyle = COLORS.BORDER.HOVER;
    // console.log("renderCustomCorner isCurrentSelected", this.isCurrentSelected);
    ctx.fillStyle = this.isCurrentSelected
      ? COLORS.BORDER.HOVER
      : COLORS.BORDER.UNSELECTED;
    ctx.fill();

    // 绘制编号
    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.order.toString(), 0, 0);
    ctx.restore();
  };

  /**
   * 覆盖父类方法，决定非活动状态下是否显示自定义控件
   */
  protected shouldRenderCustomControlsWhenInactive(): boolean {
    return true; // Frame总是在非活动状态下显示自定义控件
  }

  /**
   * 覆盖父类方法，决定显示哪些自定义控件
   */
  protected getCustomControlsToShow(): string[] {
    return ["frameNumberCorner"]; // 只显示frameNumberCorner控件
  }

  /**
   * 更新Frame内容
   * @param options
   */
  updateContents() {
    if (this.contents.size > 0) {
      console.log("updateContents", this.contents);
      // 预先计算变换矩阵
      // const { sin, cos } = this.getRotationMatrix();
      const { scaleX, scaleY, left, top, angle } = this;

      this.contents.forEach((obj) => {
        if (obj && obj.set) {
          // 为子对象启用缓存和 GPU 加速
          if (!obj.objectCaching) {
            obj.objectCaching = true;
            obj.statefull = false;
            obj.noScaleCache = false;
            obj.set("willReadFrequently", false);
            obj.set("cacheProperties", ["fill", "stroke", "strokeWidth"]);
          }

          // console.log("updateContents" , obj);
          // 使用预计算的矩阵值进行位置计算
          // 计算子元素相对于 Frame 的当前位置
          const relativeX = obj.left - left;
          const relativeY = obj.top - top;
          // 保存当前相对位置
          obj._originalLeft = relativeX;
          obj._originalTop = relativeY;

          obj.set(
            {
              left: obj.left + (this.left - obj._prevFrameLeft || 0),
              top: obj.top + (this.top - obj._prevFrameTop || 0),
              angle: angle + (obj.angle || 0),
              // scaleX: obj.scaleX * scaleX,
              // scaleY: obj.scaleY * scaleY,
            },
            {
              statefull: false,
              skipRender: true, // 避免中间状态的渲染
            }
          );

          // 记录 Frame 当前位置用于下次计算
          obj._prevFrameLeft = this.left;
          obj._prevFrameTop = this.top;
          // 更新对象的边界和可交互区域
          obj.setCoords();
        }
      });
      if (this.canvas) {
        requestAnimationFrame(() => {
          this.canvas!.requestRenderAll();
        });
      }
    }
  }

  /**
   * 添加对象
   * @param object
   */
  addContent(object: any) {
    console.log("Frame addContent", object);
    // 保存对象的原始位置和角度
    object._originalLeft = object.left - this.left;
    object._originalTop = object.top - this.top;
    object._originalAngle = object.angle || 0;

    // 为新添加的对象启用性能优化
    object.objectCaching = true;
    object.statefull = false;
    object.noScaleCache = false;
    object.set("willReadFrequently", false);
    object.set("cacheProperties", ["fill", "stroke", "strokeWidth"]);

    this.contents.add(object);
  }

  /**
   * 移除对象
   * @param object
   */
  removeContent(object: any) {
    this.contents.delete(object);
  }

  /**
   * 清空Frame内的所有组件
   */
  clearContents() {
    // 从画布中移除所有内容
    if (this.canvas) {
      this.contents.forEach(obj => {
        this.canvas!.remove(obj);
      });
    }
    // 清空contents集合
    this.contents.clear();
  }

  toggleContentSelectable(selectable: boolean) {
    this.contents.forEach((obj) => {
      if (obj && obj.set) {
        obj.set({
          selectable: selectable,
          evented: selectable,
        });
      }
    });
  }


  toJSON() {
    return {
     ...super.toJSON(),
      id: this.id,
      parentPage: this.parentPage,
      contents: Array.from(this.contents),
      order: this.order,
    };
  }

toObject(propertiesToInclude: any[] = []): any{
  return super.toObject([...propertiesToInclude, 'parentPage', 'contents', 'order', 'isCurrentSelected']);
}
  

}

// to make possible restoring from serialization
fabric.classRegistry.setClass(Frame, Frame.type);
// to make PathPlus connected to svg Path element
fabric.classRegistry.setSVGClass(Frame, Frame.type);
