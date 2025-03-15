import * as fabric from "fabric";
import { COLORS, SIZES } from "../../../constants/theme";

export class TextControl extends fabric.IText {
  static type = "text";
  private _showBorder: boolean = false;
  private _hoverBorderColor: string = COLORS.BORDER.HOVER;
  private lineWidth: number = 1;

  // 添加缩放相关属性
  public preventDistortion: boolean = true;
  private _originalWidth: number = 0;
  private _originalHeight: number = 0;
  private _skipDimension: boolean = false;
  private _minFontSize: number = 1;  // 添加最小字体大小
  private _originalFontSize: number = this.fontSize;

  constructor(text: string, options: any) {
    const defaultOptions = {
      fill: "#333333",
      cornerSize: SIZES.CORNER_SIZE,
      cornerColor: COLORS.PRIMARY,
      cornerStyle: "circle",
      transparentCorners: false,
      lockRotation: true,
      hasRotatingPoint: false,
      splitByGrapheme: true,
      editable: true,
      padding: 0, // 添加内边距，使边框与文本有一定距离
      textAlign: 'left', // 固定左对齐
      lockScalingFlip: true,   // 防止翻转
      // minHeight: 100,          // 最小高度
      // fixedHeight: true,       // 固定高度
      // maxWidth: 200,          // 最大宽度
      ...options,
    };

    super(text, defaultOptions);

    this._hoverBorderColor = options.hoverBorderColor || COLORS.BORDER.HOVER;
    this.lineWidth = options.lineWidth || 1;

    // 设置对象类型
    Object.defineProperty(this, "type", {
      value: TextControl.type,
      configurable: false,
      writable: false,
    });

    // 隐藏旋转控制点
    this.setControlsVisibility({
      mtr: false,
    });
    // 初始化鼠标事件
    // this.initHoverEvents();

    // 保存初始尺寸
    this._originalWidth = this.width;
    this._originalHeight = this.height;
    this._originalFontSize = this.fontSize || 40;
    this._minFontSize = this._minFontSize;
    this.on('scaling', this.handleScaling.bind(this));
  }

  // 显示或隐藏边框
  showBorder(show: boolean) {
    if (this._showBorder === show) return;
    this._showBorder = show;
    // 强制重绘
    this.dirty = true;
    this.canvas?.requestRenderAll();
  }


  // 增加字体大小
  increaseFontSize(increment: number = 0.5): void {
    const newSize = Math.min((this.fontSize || 16) + increment, 720);
    this.setFontSize(newSize, true);
  }

  // 减小字体大小
  decreaseFontSize(decrement: number = 0.5): void {
    const newSize = Math.max((this.fontSize || 16) - decrement, this._minFontSize);
    this.setFontSize(newSize, true);
  }

  // 设置字体大小
  setFontSize(size: number, isSyncOriginalFontSize: boolean = false): void {
    const newSize = Math.max(Math.min(size, 720), this._minFontSize);

    // 先保存当前宽高
    const oldWidth = this.width;
    const oldHeight = this.height;

    // 设置新的字体大小
    this.set('fontSize', newSize);

    if (isSyncOriginalFontSize) {
      // 更新原始字体大小
      this._originalFontSize = newSize;
    }

    // 强制跳过维度计算的标志设为false，确保重新计算
    this._skipDimension = false;

    // 重新计算文本宽度和高度
    const newWidth = this.calcTextWidth();
    const newHeight = this.calcTextHeight();

    // 只有当新宽度大于当前宽度时才更新宽度，避免文本缩小时出现闪烁
    if (newWidth > oldWidth || newSize > this.fontSize) {
      this.set('width', newWidth);
    }

    // 更新高度
    this.set('height', newHeight);

    // 重新计算尺寸和边框
    this.initDimensions();
    this.setCoords();

    // 确保文本渲染
    this.dirty = true;
    this.canvas?.requestRenderAll();
  }

  applyTextStyle(style: any): void {
    const oldWidth = this.width;
    const oldHeight = this.height;
    if (typeof style === 'object') {
      for (const prop in style) {
        if(prop === "fontSize"){
          this.setFontSize(style[prop], true);
        }
        this._set(prop, style[prop]);
      }
    }
    
    // 强制跳过维度计算的标志设为false，确保重新计算
    this._skipDimension = false;

    // 重新计算文本宽度和高度
    const newWidth = this.calcTextWidth();
    const newHeight = this.calcTextHeight();
    if (newWidth > oldWidth) {
      this.set('width', newWidth);
    }
    // 更新高度
    this.set('height', newHeight);
    // 重新计算尺寸和边框
    this.initDimensions();
    this.setCoords();

    // 确保文本渲染
    this.dirty = true;
    this.canvas?.requestRenderAll();
  }

  // 设置悬停时的边框颜色
  setHoverBorderColor(color: string) {
    this._hoverBorderColor = color;
    if (this._showBorder) {
      this.showBorder(true);
    }
  }

  // 重写渲染方法，添加自定义边框
  _render(ctx: CanvasRenderingContext2D) {
    // 调用父类的渲染方法渲染文本
    super._render(ctx);

    if (this.selected) return
    // 如果需要显示边框，绘制自定义边框
    ctx.save();
    if (this._showBorder) {
      // 设置边框样式
      ctx.strokeStyle = this._hoverBorderColor;
    } else {
      ctx.strokeStyle = COLORS.BORDER.DEFAULT;
    }

    ctx.lineWidth = this.lineWidth;
    ctx.setLineDash([]); // 设置为实线（如需虚线可修改此处）
    // 计算边框位置（考虑padding）
    const width = this.width + this.padding * 2;
    const height = this.height + this.padding * 2;

    // 绘制边框（从中心点偏移）
    ctx.strokeRect(-width / 2, -height / 2, width, height);
    ctx.restore();
  }

  _renderText(ctx: CanvasRenderingContext2D): void {
    super._renderText(ctx)
  }

  initDimensions(): void {
    if (this.isEditing) {
      this.initDelayedCursor();
    }
    this.clearContextTop();
    if (this._skipDimension) {
      return;
    }
    this._splitText();
    this._clearCache();
    if (this.path) {
      this.width = this.path.width;
      this.height = this.path.height;
    } else {
      // 保存原始宽度，避免闪烁
      const originalWidth = this.width;
      const fontWidth = this.calcTextWidth();
      // 只有当计算的宽度大于当前宽度时才更新宽度
      // 这样可以避免在缩小时出现宽度闪烁
      if (fontWidth > originalWidth) {
        this.width = fontWidth;
      } else {
        this.width = originalWidth;
      }
      this.height = this.height || this.calcTextHeight();
      const calculatedHeight = this.calcTextHeight();
      if (this.isEditing && calculatedHeight > this.height) {
          this.height = calculatedHeight;
      } 
    }
    if (this.textAlign && this.textAlign.indexOf('justify') !== -1) {
      this.enlargeSpaces();
    }
    // 确保文本渲染
    this.dirty = true;
    if (this.canvas) {
      this.canvas.requestRenderAll();
    }
  }


  // 添加新方法：调整文字大小以适应容器
  private adjustTextSize(props?: Partial<fabric.Textbox>, oldWidth?: number, oldHeight?: number): void {
    if (!this.canvas) return;

    // 计算文本与容器的比例
    const textWidth = this.calcTextWidth();
    const textHeight = this.calcTextHeight();
    const containerWidth = this.width;
    const containerHeight = this.height;

    if (textWidth > containerWidth || textHeight > containerHeight) {

    }

    const containerWidthRatio = containerWidth / textWidth;
    const containerHeightRatio = containerHeight / textHeight;
    console.log('容器宽度比例:', containerWidthRatio, '容器高度比例:', containerHeightRatio);

    // 如果文本超出容器，需要缩小
    if (containerWidthRatio < 1 || containerHeightRatio < 1) {
      const ratio = Math.min(containerWidthRatio, containerHeightRatio);
      const newFontSize = Math.max(Number((this.fontSize * ratio).toFixed(3)), this._minFontSize);
      console.log('文本超出容器，缩小字体到:', newFontSize);
      this.set('fontSize', newFontSize);
    } else if (props && oldWidth && oldHeight) {
      // 直接使用缩放因子来调整字体大小
      const scaleX = props.width ? props.width / oldWidth : 1;
      const scaleY = props.height ? props.height / oldHeight : 1;
      const scaleFactor = Math.max(scaleX, scaleY);

      console.log('缩放因子:', scaleFactor, '当前字号:', this.fontSize);

      if (scaleFactor > 1) {
        // 放大文字
        const newFontSize = Math.min(Number((this.fontSize * scaleFactor).toFixed(3)), this._originalFontSize);
        console.log('放大字体到:', newFontSize);
        this.set('fontSize', newFontSize);
      } else if (scaleFactor < 1 && (containerWidthRatio < 1 || containerHeightRatio < 1)) {
        // 缩小文字
        const newFontSize = Math.max(Number((this.fontSize * scaleFactor).toFixed(3)), this._minFontSize);
        console.log('缩小字体到:', newFontSize);
        this.set('fontSize', newFontSize);
      }
    }
  }


  // 处理缩放事件
  private handleScaling(): void {
    if (!this.preventDistortion || !this.canvas) return;

    let shouldUpdate = false;
    const props: Partial<fabric.Textbox> = {};
    const oldWidth = this.width;
    const oldHeight = this.height;

    if (this.scaleX !== 1) {
      props.scaleX = 1;
      props.width = this.width * this.scaleX;
      shouldUpdate = true;
    }
    if (this.scaleY !== 1) {
      props.scaleY = 1;
      // 确保高度不小于最小字体高度
      const minFontHeight = this.calcTextHeight() * (this._minFontSize / this.fontSize);
      props.height = Math.max(this.height * this.scaleY, minFontHeight);
      shouldUpdate = true;
    }
    if (shouldUpdate) {
      // 先更新尺寸
      this.set(props);
      this.setCoords();
      // 调用字体调整方法
      this.adjustTextSize(props, oldWidth, oldHeight);
    }
  }

}

