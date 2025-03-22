import { EventBus, EventTypes } from "../../../utils/EventBus";
import { getCanvasManager } from "../../../utils/CanvasUtils";
import { COLORS, SIZES } from "../../../constants/theme";
import * as fabric from "fabric";

export class ImageControl extends fabric.FabricImage {
  static type = "ImageControl";
  // 填充颜色属性
  private _fillColor: string | null = null;
  private _fillOpacity: number = 0.5;
  // 圆角属性
  private _cornerRadius: {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
  } = {
      topLeft: 0,
      topRight: 0,
      bottomRight: 0,
      bottomLeft: 0
    };
  //拖动状态标记
  private _isMoving: boolean = false;

  static async create(url: string, options: any) {
    return new Promise((resolve, reject) => {
      // 设置默认以中心点为基准
      const defaultOptions = {
        originX: 'center',
        originY: 'center',
        //内边距
        padding: 0,
        ...options
      };
      ImageControl.fromURL(url, { crossOrigin: 'anonymous' }, defaultOptions).then((fabricImage: any) => {
        if (options.fillColor !== undefined) {
          fabricImage._fillColor = options.fillColor;
        }
        if (options.fillOpacity !== undefined) {
          fabricImage._fillOpacity = options.fillOpacity;
        }
        if (options.cornerRadius) {
          fabricImage._cornerRadius = {
            ...fabricImage._cornerRadius,
            ...options.cornerRadius
          };
        } else if (options.rx !== undefined) {
          // 可以直接设置rx/ry，此时所有角同一个半径
          const radius = options.rx;
          fabricImage._cornerRadius = {
            topLeft: radius,
            topRight: radius,
            bottomRight: radius,
            bottomLeft: radius
          };
        }
        resolve(fabricImage);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  constructor(element: HTMLImageElement, options: any) {
    const defaultOptions = {
      cornerSize: SIZES.CORNER_SIZE,
      cornerColor: COLORS.PRIMARY,
      cornerStyle: "circle",
      transparentCorners: false,
      hasRotatingPoint: false,
      padding: 0,
      borderColor: COLORS.PRIMARY,
      lockRotation: true,
      // 添加缩放相关配置
      lockScalingX: false,
      lockScalingY: false,
      lockUniScaling: false,  // 允许非等比缩放
      ...options,
    };

    super(element, defaultOptions);


    // 初始化填充颜色和透明度
    if (options && options.fillColor) {
      this._fillColor = options.fillColor;
    }
    if (options && options.fillOpacity !== undefined) {
      this._fillOpacity = options.fillOpacity;
    }
    // 初始化圆角属性
    if (options && options.cornerRadius) {
      this._cornerRadius = {
        ...this._cornerRadius,
        ...options.cornerRadius
      };
    } else if (options && options.rx !== undefined) {
      const radius = options.rx;
      this._cornerRadius = {
        topLeft: radius,
        topRight: radius,
        bottomRight: radius,
        bottomLeft: radius
      };
    }

    // 隐藏旋转控制点
    this.setControlsVisibility({
      mtr: false,
    });

    // 设置对象类型
    Object.defineProperty(this, 'type', {
      value: ImageControl.type,
      configurable: false,
      writable: false
    });
    this.on('moving', this.handleMoving.bind(this));
    this.on('mouseup', this.handleMoveEnd.bind(this));
    this.on('deselected', this.handleMoveEnd.bind(this));
  }


  // 处理移动开始事件
  private handleMoving(): void {
    this._isMoving = true;
    EventBus.emit(EventTypes.CONTROL_PANEL.HIDE_IMAGE_SETTING_TOOLBAR);
  }

    // 处理移动结束事件
    private handleMoveEnd(): void {
      this._isMoving = false;
      EventBus.emit(EventTypes.CONTROL_PANEL.SHOW_IMAGE_SETTING_TOOLBAR, {
        target: this,
        canvas: this.canvas,
        canvasManager: getCanvasManager()
      });
    }

  _render(ctx: CanvasRenderingContext2D): void {
    const hasCorners = Object.values(this._cornerRadius).some(value => value > 0);
    if (!hasCorners) {
      // 如果没有圆角，直接调用父类的渲染方法
      super._render(ctx);
    } else {
      // 如果有圆角，需要自定义渲染
      ctx.save();

      // 获取图片的宽高
      const width = this.width || 0;
      const height = this.height || 0;

      // 计算实际的圆角半径（不能超过宽高的一半）
      this._renderRoundedRectWithDifferentCorners(ctx, -width / 2, -height / 2, width, height);

      // 裁剪上下文
      ctx.clip();

      // 绘制图片
      super._render(ctx);

      ctx.restore();
    }

    // 如果设置了填充颜色，则在图片上方绘制一个半透明的颜色层
    if (this._fillColor) {
      ctx.save();
      ctx.fillStyle = this._fillColor;
      ctx.globalAlpha = this._fillOpacity;

      // 获取图片的宽高
      const width = this.width || 0;
      const height = this.height || 0;

      if (hasCorners) {
        // 如果有圆角，需要绘制圆角矩形
        this._renderRoundedRectWithDifferentCorners(ctx, -width / 2, -height / 2, width, height);
        ctx.fill();
      } else {
        // 否则绘制普通矩形
        ctx.fillRect(-width / 2, -height / 2, width, height);
      }

      ctx.restore();
    }
  }

  // 绘制带有不同圆角的矩形路径
  private _renderRoundedRectWithDifferentCorners(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    const { topLeft, topRight, bottomRight, bottomLeft } = this._cornerRadius;

    // 确保圆角半径不超过宽高的一半
    const maxWidth = width / 2;
    const maxHeight = height / 2;

    const tl = Math.min(topLeft, maxWidth, maxHeight);
    const tr = Math.min(topRight, maxWidth, maxHeight);
    const br = Math.min(bottomRight, maxWidth, maxHeight);
    const bl = Math.min(bottomLeft, maxWidth, maxHeight);

    ctx.beginPath();

    // 从左上角开始，顺时针绘制
    if (tl > 0) {
      ctx.moveTo(x + tl, y);
      ctx.arcTo(x, y, x, y + tl, tl);
    } else {
      ctx.moveTo(x, y);
    }

    // 左边到左下角
    if (bl > 0) {
      ctx.lineTo(x, y + height - bl);
      ctx.arcTo(x, y + height, x + bl, y + height, bl);
    } else {
      ctx.lineTo(x, y + height);
    }

    // 底边到右下角
    if (br > 0) {
      ctx.lineTo(x + width - br, y + height);
      ctx.arcTo(x + width, y + height, x + width, y + height - br, br);
    } else {
      ctx.lineTo(x + width, y + height);
    }

    // 右边到右上角
    if (tr > 0) {
      ctx.lineTo(x + width, y + tr);
      ctx.arcTo(x + width, y, x + width - tr, y, tr);
    } else {
      ctx.lineTo(x + width, y);
    }

    // 顶边回到起点
    ctx.lineTo(x + tl, y);

    ctx.closePath();
  }

  // 绘制圆角矩形路径
  private _renderRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, rx: number, ry: number): void {
    ctx.beginPath();
    ctx.moveTo(x + rx, y);
    ctx.lineTo(x + width - rx, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + ry);
    ctx.lineTo(x + width, y + height - ry);
    ctx.quadraticCurveTo(x + width, y + height, x + width - rx, y + height);
    ctx.lineTo(x + rx, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - ry);
    ctx.lineTo(x, y + ry);
    ctx.quadraticCurveTo(x, y, x + rx, y);
    ctx.closePath();
  }

  // 设置所有角的圆角半径
  setCornerRadius(radius: number): this {
    this._cornerRadius = {
      topLeft: Math.max(0, radius),
      topRight: Math.max(0, radius),
      bottomRight: Math.max(0, radius),
      bottomLeft: Math.max(0, radius)
    };

    // 标记对象需要重绘
    this.dirty = true;
    if (this.canvas) {
      this.canvas.requestRenderAll();
    }

    return this;
  }

  // 设置单个角的圆角半径
  setCornerRadiusForCorner(corner: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft', radius: number): this {
    this._cornerRadius[corner] = Math.max(0, radius);

    // 标记对象需要重绘
    this.dirty = true;
    if (this.canvas) {
      this.canvas.requestRenderAll();
    }

    return this;
  }

  // 设置多个角的圆角半径
  setCornerRadii(cornerRadii: Partial<typeof this._cornerRadius>): this {
    this._cornerRadius = {
      ...this._cornerRadius,
      ...cornerRadii
    };

    // 标记对象需要重绘
    this.dirty = true;
    if (this.canvas) {
      this.canvas.requestRenderAll();
    }
    return this;
  }

  // 获取圆角值
  getCornerRadius(): typeof this._cornerRadius {
    return { ...this._cornerRadius };
  }

  // 设置填充颜色
  setFillColor(color: string | null, opacity?: number): this {
    this._fillColor = color;
    if (opacity !== undefined) {
      this._fillOpacity = Math.max(0, Math.min(1, opacity)); // 确保透明度在 0-1 之间
    }

    // 标记对象需要重绘
    this.dirty = true;
    if (this.canvas) {
      this.canvas.requestRenderAll();
    }

    return this;
  }

  // 获取填充颜色
  getFillColor(): { color: string | null, opacity: number } {
    return {
      color: this._fillColor,
      opacity: this._fillOpacity
    };
  }


  // 替换图片资源方法
  replaceImage(url: string): Promise<this> {
    return new Promise((resolve, reject) => {
      // 使用Promise方式加载图片
      fabric.util.loadImage(url, { crossOrigin: 'anonymous' })
        .then((img: HTMLImageElement) => {
          // 保存当前的宽高比例
          const originalWidth = this.width;
          const originalHeight = this.height;
          const originalScaleX = this.scaleX;
          const originalScaleY = this.scaleY;

          // 替换图片元素
          this.setElement(img);

          // 保持原有的宽高比例
          if (originalWidth && originalHeight) {
            // 计算新的缩放比例以保持显示大小一致
            this.scaleX = (originalWidth / this.width) * originalScaleX;
            this.scaleY = (originalHeight / this.height) * originalScaleY;
          }

          // 如果有滤镜，重新应用
          if (this.filters && this.filters.length > 0) {
            this.applyFilters();
          }

          // 标记需要重绘
          this.dirty = true;
          if (this.canvas) {
            this.canvas.requestRenderAll();
          }

          resolve(this);
        })
        .catch((error) => {
          reject(new Error(`加载图片失败: ${error.message}`));
        });
    });
  }


  toObject(propertiesToInclude: any[] = []): any {
    return super.toObject([...propertiesToInclude, '_fillColor', '_fillOpacity', '_cornerRadius']);
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      _fillColor: this._fillColor,
      _fillOpacity: this._fillOpacity,
      _cornerRadius: this._cornerRadius
    };
  }

}
