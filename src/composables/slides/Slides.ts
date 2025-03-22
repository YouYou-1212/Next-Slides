import * as fabric from "fabric";
import { classRegistry, type SerializedPathProps } from 'fabric';
import { STYLES } from "../../constants/theme";
import { glassEffect } from "./slideStyles";
import { v4 as uuidv4 } from "uuid";
import { getCanvasManager , generateReliableThumbnail, calculateViewportInfo } from "../../utils/CanvasUtils";

export class Slides extends fabric.Rect {
  static type = "slides";
  declare id: string;
  declare canvas: fabric.Canvas;
  declare customBorderColor: string;

  // 添加控件相关属性
  declare customControls: string[]; // 子类可以设置要显示的自定义控件列表  // 添加控件可见性映射
  declare controlsVisibilityMap: Record<string, boolean>;

  constructor(options: any) {
    options = {
      ...glassEffect,
      ...options,
      strokeUniform: true,
    };
    super(options);
    this.id = options.id || uuidv4();
    this.initializeControls();
    this.initEventHandlers();

    // 自定义边框颜色
    this.customBorderColor = options.customBorderColor;
    // 初始化自定义控件列表
    this.customControls = options.customControls || [];
    // 初始化控件可见性映射
    this.controlsVisibilityMap = options.controlsVisibilityMap || {};

    // 启用对象缓存以提高性能
    this.objectCaching = true;
    this.noScaleCache = false;

    // 启用 GPU 加速
    this.set("willReadFrequently", false);
    this.set("cacheProperties", ["fill", "stroke", "strokeWidth"]);
    // 设置边框宽度不随缩放变化
    this.strokeUniform = true;
  }

  // 初始化控制点
  protected initializeControls() {
    // 设置控制点样式
    this.cornerSize = STYLES.CORNER.SIZE;
    this.cornerColor = STYLES.CORNER.SLIDES_COLOR;
    this.cornerStyle = STYLES.CORNER.STYLE;
    this.transparentCorners = STYLES.CORNER.TRANSPARENT;

    // 锁定旋转
    this.setControlsVisibility({
      mtr: false,
    });
    this.lockRotation = true;
  }

  containsPoint(point: fabric.Point): boolean {
    const borderWidth = 10; // 边框宽度
    const rect = this.getBoundingRect();
    const isOnBorder =
      (point.x >= rect.left && point.x <= rect.left + borderWidth) ||
      (point.x <= rect.left + rect.width &&
        point.x >= rect.left + rect.width - borderWidth) ||
      (point.y >= rect.top && point.y <= rect.top + borderWidth) ||
      (point.y <= rect.top + rect.height &&
        point.y >= rect.top + rect.height - borderWidth);

    return isOnBorder;
  }


  /**
   * 获取当前对象的缩略图
   * @param thumbnailCanvas 可选的目标缩略图Canvas
   * @returns 返回缩略图数据对象
   */
  thumbnail = async (thumbnailCanvas?: HTMLCanvasElement) => {
    // console.log("【Slides】生成缩略图 thumbnailCanvas" , thumbnailCanvas);
    const ctx = thumbnailCanvas!.getContext('2d');
    if (!ctx) return null;
    const canvasManager = getCanvasManager();
    await generateReliableThumbnail(canvasManager!.getPresentationCanvas(), thumbnailCanvas! , this);
  };

  protected initEventHandlers() {
    // 子类实现具体的事件处理逻辑
  }

  // 通用的渲染请求方法
  protected requestRender() {
    if (this.canvas) {
      requestAnimationFrame(() => {
        this.canvas.requestRenderAll();
      });
    }
  }

  public setCu1stomBorderColor(color: string) {
    this.customBorderColor = color;
    this.requestRender();
  }

  /**
   * 设置特定控件的可见性
   * @param controlKey 控件的键名
   * @param visible 是否可见
   */
  public setControlVisibility(controlKey: string, visible: boolean): void {
    // 同时更新 Fabric.js 原生的控件可见性
    const visibilityMap = { [controlKey]: visible };
    super.setControlsVisibility(visibilityMap);
    // 更新控件可见性映射
    this.controlsVisibilityMap[controlKey] = visible;

    // 如果控件不在customControls列表中且需要显示，则添加到列表中
    if (visible) {
      // 显示控件：如果不在列表中则添加
      if (!this.customControls.includes(controlKey)) {
        this.customControls.push(controlKey);
      }
    } else {
      // 隐藏控件：从列表中移除
      this.customControls = this.customControls.filter(
        (key) => key !== controlKey
      );
    }

    // 请求重新渲染
    this.requestRender();
  }

  /**
   * 批量设置多个控件的可见性
   * @param controlsMap 控件可见性映射对象
   */
  public setControlsVisibilityBatch(
    controlsMap: Record<string, boolean>
  ): void {
    // 更新控件可见性映射
    Object.entries(controlsMap).forEach(([key, visible]) => {
      this.setControlVisibility(key, visible);
    });
  }

  /**
   * 重写渲染方法，绘制自定义边框
   */
  render(ctx: CanvasRenderingContext2D) {
    super.render(ctx);
    // 绘制自定义边框
    this.drawCustomBorder(ctx);
    // 获取当前对象是否处于活动状态
    const isActive = this.canvas && this.canvas.getActiveObject() === this;
    if (isActive) {
      // 活动状态下直接调用drawCustomControls
      this.drawCustomControls(ctx);
    } else if (this.shouldRenderCustomControlsWhenInactive()) {
      // 非活动状态且需要显示控件时，调用renderCustomControlsWhenInactive
      this.renderCustomControlsWhenInactive(ctx);
    }
  }

  /**
   * 判断非活动状态下是否应该渲染自定义控件
   * 子类可以覆盖此方法来决定是否显示控件
   */
  protected shouldRenderCustomControlsWhenInactive(): boolean {
    return false; // 默认不显示
  }

  /**
   * 非活动状态下渲染自定义控件
   * @param ctx 渲染上下文
   */
  protected renderCustomControlsWhenInactive(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const vpt = this.getViewportTransform();
    const matrix = fabric.util.multiplyTransformMatrices(
      vpt,
      this.calcTransformMatrix()
    );
    const options = fabric.util.qrDecompose(matrix);
    // ctx.translate(options.translateX, options.translateY);
    // ctx.lineWidth = this.borderScaleFactor;
    // 获取左上角坐标
    const { tl } = this.oCoords || {};
    if (tl) {
      // 使用oCoords中的tl点作为控件位置
      ctx.translate(tl.x, tl.y);
    } else {
      // 如果没有oCoords，使用计算的位置
      ctx.translate(options.translateX, options.translateY);
    }
    ctx.rotate(fabric.util.degreesToRadians(options.angle));

    // 调用自定义的drawControls方法
    this.drawCustomControls(ctx);

    ctx.restore();
  }

  /**
   * 获取要显示的自定义控件列表
   * 子类可以覆盖此方法来决定显示哪些控件
   */
  protected getCustomControlsToShow(): string[] {
    // 过滤出在controlsVisibilityMap中标记为可见的控件
    return this.customControls.filter(
      (key) => this.controlsVisibilityMap[key] !== false
    );
  }

  /**
   * 绘制自定义控件
   * 子类可以覆盖此方法来自定义控件的渲染
   * @param ctx 渲染上下文
   * @param styleOverride 样式覆盖
   */
  protected drawCustomControls(
    ctx: CanvasRenderingContext2D,
    styleOverride = {}
  ) {
    ctx.save();
    const retinaScaling = this.getCanvasRetinaScaling();
    const { cornerStrokeColor, cornerDashArray, cornerColor } = this;
    const options = {
      cornerStrokeColor,
      cornerDashArray,
      cornerColor,
      ...styleOverride,
    };
    ctx.setTransform(retinaScaling, 0, 0, retinaScaling, 0, 0);
    ctx.strokeStyle = ctx.fillStyle = options.cornerColor;
    if (!this.transparentCorners) {
      ctx.strokeStyle = options.cornerStrokeColor;
    }
    this._setLineDash(ctx, options.cornerDashArray);

    // 获取要显示的控件列表
    const controlsToShow = this.getCustomControlsToShow();
    // console.log("渲染控件方法：" , controlsToShow);

    this.forEachControl((control, key) => {
      // 检查控件是否应该显示
      const isVisible =
        controlsToShow.includes(key) &&
        control.getVisibility(this, key) &&
        // 检查原生的可见性设置
        this.controls[key].visible !== false;
      if (isVisible) {
        const p = this.oCoords[key];
        control.render(ctx, p.x, p.y, options, this);
      }
    });

    ctx.restore();
  }

  // 绘制自定义边框
  protected drawCustomBorder(ctx: CanvasRenderingContext2D) {
    // console.log("【Slides】绘制自定义边框");
    if (!this.canvas) return;
    // 保存当前上下文状态
    ctx.save();

    // 获取缩放信息
    const zoom = this.canvas.getZoom();

    // 设置线条样式 - 固定线宽，不受缩放影响
    ctx.lineWidth = 1 / zoom;
    ctx.strokeStyle = this.customBorderColor;

    // 获取对象的变换信息
    const matrix = this.calcTransformMatrix();

    // 应用对象的变换矩阵
    ctx.transform(
      matrix[0],
      matrix[1],
      matrix[2],
      matrix[3],
      matrix[4],
      matrix[5]
    );

    // 获取对象的尺寸
    const width = this.width;
    const height = this.height;
    // 使用与对象相同的圆角参数
    const rx = this.rx ? Math.min(this.rx, width / 2) : 0;
    const ry = this.ry ? Math.min(this.ry, height / 2) : 0;

    // 绘制圆角矩形路径
    ctx.beginPath();
    ctx.moveTo(-width / 2 + rx, -height / 2);
    ctx.lineTo(width / 2 - rx, -height / 2);
    ctx.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + ry);
    ctx.lineTo(width / 2, height / 2 - ry);
    ctx.quadraticCurveTo(width / 2, height / 2, width / 2 - rx, height / 2);
    ctx.lineTo(-width / 2 + rx, height / 2);
    ctx.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - ry);
    ctx.lineTo(-width / 2, -height / 2 + ry);
    ctx.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + rx, -height / 2);
    ctx.stroke();
    // 恢复上下文状态
    ctx.restore();
  }

  toJSON() {
    return {
      ...super.toJSON(),
      type: Slides.type,
      id: this.id,
      customBorderColor: this.customBorderColor,
      customControls: this.customControls,
      controlsVisibilityMap: this.controlsVisibilityMap,
    };
  }

  toObject(propertiesToInclude: any[] = []): any{
    return super.toObject([...propertiesToInclude, 'type', 'id', 'customBorderColor', 'customControls', 'controlsVisibilityMap']);
  }

}

// to make possible restoring from serialization
classRegistry.setClass(Slides, Slides.type);
// to make PathPlus connected to svg Path element
classRegistry.setSVGClass(Slides, Slides.type);
