import { EventBus, EventTypes } from "../../../utils/EventBus";
import { getCanvasManager } from "../../../utils/CanvasUtils";
import { COLORS, SIZES } from "../../../constants/theme";
import * as fabric from "fabric";

export class ImageControl extends fabric.FabricImage {
  static type = "ImageControl";
  
  private _fillColor: string | null = null;
  private _fillOpacity: number = 0.5;
  
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
  
  private _isMoving: boolean = false;

  static async create(url: string, options: any) {
    return new Promise((resolve, reject) => {
      
      const defaultOptions = {
        originX: 'center',
        originY: 'center',
        
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
      
      
      
      
      
      
      
      
      
      
      
      
      ...options,
    };

    super(element, defaultOptions);


    
    if (options && options.fillColor) {
      this._fillColor = options.fillColor;
    }
    if (options && options.fillOpacity !== undefined) {
      this._fillOpacity = options.fillOpacity;
    }
    
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

    
    this.setControlsVisibility({
      mtr: false,
    });

    
    Object.defineProperty(this, 'type', {
      value: ImageControl.type,
      configurable: false,
      writable: false
    });
    
    
    
  }


  
  private handleMoving(): void {
    this._isMoving = true;
    EventBus.emit(EventTypes.CONTROL_PANEL.HIDE_IMAGE_SETTING_TOOLBAR);
  }

  
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
      
      super._render(ctx);
    } else {
      ctx.save();
      const width = this.width || 0;
      const height = this.height || 0;

      
      this._renderRoundedRectWithDifferentCorners(ctx, -width / 2, -height / 2, width, height);
      ctx.clip();
      super._render(ctx);
      ctx.restore();
    }

    
    if (this._fillColor) {
      ctx.save();
      ctx.fillStyle = this._fillColor;
      ctx.globalAlpha = this._fillOpacity;

      
      const width = this.width || 0;
      const height = this.height || 0;

      if (hasCorners) {
        
        this._renderRoundedRectWithDifferentCorners(ctx, -width / 2, -height / 2, width, height);
        ctx.fill();
      } else {
        
        ctx.fillRect(-width / 2, -height / 2, width, height);
      }

      ctx.restore();
    }
  }

  
  private _renderRoundedRectWithDifferentCorners(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    const { topLeft, topRight, bottomRight, bottomLeft } = this._cornerRadius;

    
    const maxWidth = width / 2;
    const maxHeight = height / 2;

    const tl = Math.min(topLeft, maxWidth, maxHeight);
    const tr = Math.min(topRight, maxWidth, maxHeight);
    const br = Math.min(bottomRight, maxWidth, maxHeight);
    const bl = Math.min(bottomLeft, maxWidth, maxHeight);

    ctx.beginPath();

    
    if (tl > 0) {
      ctx.moveTo(x + tl, y);
      ctx.arcTo(x, y, x, y + tl, tl);
    } else {
      ctx.moveTo(x, y);
    }

    
    if (bl > 0) {
      ctx.lineTo(x, y + height - bl);
      ctx.arcTo(x, y + height, x + bl, y + height, bl);
    } else {
      ctx.lineTo(x, y + height);
    }

    
    if (br > 0) {
      ctx.lineTo(x + width - br, y + height);
      ctx.arcTo(x + width, y + height, x + width, y + height - br, br);
    } else {
      ctx.lineTo(x + width, y + height);
    }

    
    if (tr > 0) {
      ctx.lineTo(x + width, y + tr);
      ctx.arcTo(x + width, y, x + width - tr, y, tr);
    } else {
      ctx.lineTo(x + width, y);
    }

    
    ctx.lineTo(x + tl, y);

    ctx.closePath();
  }

  
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

  
  setCornerRadius(radius: number): this {
    this._cornerRadius = {
      topLeft: Math.max(0, radius),
      topRight: Math.max(0, radius),
      bottomRight: Math.max(0, radius),
      bottomLeft: Math.max(0, radius)
    };

    
    this.dirty = true;
    if (this.canvas) {
      this.canvas.requestRenderAll();
    }

    return this;
  }

  
  setCornerRadiusForCorner(corner: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft', radius: number): this {
    this._cornerRadius[corner] = Math.max(0, radius);

    
    this.dirty = true;
    if (this.canvas) {
      this.canvas.requestRenderAll();
    }

    return this;
  }

  
  setCornerRadii(cornerRadii: Partial<typeof this._cornerRadius>): this {
    this._cornerRadius = {
      ...this._cornerRadius,
      ...cornerRadii
    };

    
    this.dirty = true;
    if (this.canvas) {
      this.canvas.requestRenderAll();
    }
    return this;
  }

  
  getCornerRadius(): typeof this._cornerRadius {
    return { ...this._cornerRadius };
  }

  
  setFillColor(color: string | null, opacity?: number): this {
    if (this._element && this._element.tagName === 'svg') {
      this._element.setAttribute('fill', color || 'none');
    } else {
      
      this._fillColor = color;
    }

    if (opacity !== undefined) {
      this._fillOpacity = Math.max(0, Math.min(1, opacity)); 
    }

    
    this.dirty = true;
    if (this.canvas) {
      this.canvas.requestRenderAll();
    }

    return this;
  }

  
  getFillColor(): { color: string | null, opacity: number } {
    return {
      color: this._fillColor,
      opacity: this._fillOpacity
    };
  }


  
  replaceImage(url: string): Promise<this> {
    return new Promise((resolve, reject) => {
      this.setSrc(url, { crossOrigin: 'anonymous' })
        .then(() => {
          this.dirty = true;
          if (this.canvas) {
            this.canvas.requestRenderAll();
          }

          
          resolve(this);
        })
        .catch((error) => {
          console.error('[ImageControl] 图片替换失败:', error);
          reject(error);
        });
    });
  }


  static fromObject(object: any, options?: any) {
    return fabric.FabricImage.fromObject(object, options)
      .then((img: any) => {
        const imageControl = new ImageControl(img._element, {
          ...object,
          filters: img.filters,
          resizeFilter: img.resizeFilter,
          crossOrigin: img.crossOrigin,
          src: img.src
        });
        
        
        if (object._fillColor !== undefined) {
          imageControl._fillColor = object._fillColor;
        }
        
        if (object._fillOpacity !== undefined) {
          imageControl._fillOpacity = object._fillOpacity;
        }
        
        if (object._cornerRadius) {
          imageControl._cornerRadius = {
            topLeft: object._cornerRadius.topLeft || 0,
            topRight: object._cornerRadius.topRight || 0,
            bottomRight: object._cornerRadius.bottomRight || 0,
            bottomLeft: object._cornerRadius.bottomLeft || 0
          };
        }
        
        
        imageControl.set({
          left: object.left,
          top: object.top,
          width: object.width,
          height: object.height,
          scaleX: object.scaleX,
          scaleY: object.scaleY,
          angle: object.angle,
          flipX: object.flipX,
          flipY: object.flipY,
          opacity: object.opacity,
          originX: object.originX,
          originY: object.originY,
          cropX: object.cropX,
          cropY: object.cropY
        });
        
        
        
        return imageControl;
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
fabric.classRegistry.setClass(ImageControl, ImageControl.type);
fabric.classRegistry.setSVGClass(ImageControl, ImageControl.type);
