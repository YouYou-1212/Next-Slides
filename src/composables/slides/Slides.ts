import * as fabric from "fabric";
import { classRegistry, type SerializedPathProps } from 'fabric';
import { STYLES } from "../../constants/theme";
import { glassEffect } from "./slideStyles";
import { v4 as uuidv4 } from "uuid";
import { getCanvasManager, generateReliableThumbnail, calculateViewportInfo } from "../../utils/CanvasUtils";

export class Slides extends fabric.Rect {
  static type = "slides";
  declare id: string;
  declare canvas: fabric.Canvas;
  declare customBorderColor: string;
  declare customInnerBorderColor: string;

  
  declare customControls: string[]; 
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

    
    this.customBorderColor = options.customBorderColor || glassEffect.customBorderColor;
    this.customInnerBorderColor = options.customInnerBorderColor || glassEffect.customInnerBorderColor;
    
    this.customControls = options.customControls || [];
    
    this.controlsVisibilityMap = options.controlsVisibilityMap || {};

    
    this.objectCaching = true;
    this.noScaleCache = false;

    
    this.set("willReadFrequently", false);
    this.set("cacheProperties", ["fill", "stroke", "strokeWidth"]);
    
    this.strokeUniform = true;
  }

  
  protected initializeControls() {
    
    this.cornerSize = STYLES.CORNER.SIZE;
    this.cornerColor = STYLES.CORNER.SLIDES_COLOR;
    this.cornerStyle = STYLES.CORNER.STYLE;
    this.transparentCorners = STYLES.CORNER.TRANSPARENT;

    
    this.setControlsVisibility({
      mtr: false,
    });
    this.lockRotation = true;
  }

  containsPoint(point: fabric.Point): boolean {
    const borderWidth = 10; 
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


  
  thumbnail = async (thumbnailCanvas?: HTMLCanvasElement) => {
    
    const ctx = thumbnailCanvas!.getContext('2d');
    if (!ctx) return null;
    const canvasManager = getCanvasManager();
    await generateReliableThumbnail(canvasManager!.getPresentationCanvas(), thumbnailCanvas!, this);
  };

  protected initEventHandlers() {
    
  }

  
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

  
  public setControlVisibility(controlKey: string, visible: boolean): void {
    
    const visibilityMap = { [controlKey]: visible };
    super.setControlsVisibility(visibilityMap);
    
    this.controlsVisibilityMap[controlKey] = visible;

    
    if (visible) {
      
      if (!this.customControls.includes(controlKey)) {
        this.customControls.push(controlKey);
      }
    } else {
      
      this.customControls = this.customControls.filter(
        (key) => key !== controlKey
      );
    }

    
    this.requestRender();
  }

  
  public setControlsVisibilityBatch(
    controlsMap: Record<string, boolean>
  ): void {
    
    Object.entries(controlsMap).forEach(([key, visible]) => {
      this.setControlVisibility(key, visible);
    });
  }

  
  render(ctx: CanvasRenderingContext2D) {
    super.render(ctx);
    
    this.drawCustomBorder(ctx);
    
    const isActive = this.canvas && this.canvas.getActiveObject() === this;
    if (isActive) {
      
      this.drawCustomControls(ctx);
    } else if (this.shouldRenderCustomControlsWhenInactive()) {
      
      this.renderCustomControlsWhenInactive(ctx);
    }
  }

  
  protected shouldRenderCustomControlsWhenInactive(): boolean {
    return false; 
  }

  
  protected renderCustomControlsWhenInactive(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const vpt = this.getViewportTransform();
    const matrix = fabric.util.multiplyTransformMatrices(
      vpt,
      this.calcTransformMatrix()
    );
    const options = fabric.util.qrDecompose(matrix);
    
    
    
    const { tl } = this.oCoords || {};
    if (tl) {
      
      ctx.translate(tl.x, tl.y);
    } else {
      
      ctx.translate(options.translateX, options.translateY);
    }
    ctx.rotate(fabric.util.degreesToRadians(options.angle));

    
    this.drawCustomControls(ctx);

    ctx.restore();
  }

  
  protected getCustomControlsToShow(): string[] {
    
    return this.customControls.filter(
      (key) => this.controlsVisibilityMap[key] !== false
    );
  }

  
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

    
    const controlsToShow = this.getCustomControlsToShow();
    

    this.forEachControl((control, key) => {
      
      const isVisible =
        controlsToShow.includes(key) &&
        control.getVisibility(this, key) &&
        
        this.controls[key].visible !== false;
      if (isVisible) {
        const p = this.oCoords[key];
        control.render(ctx, p.x, p.y, options, this);
      }
    });

    ctx.restore();
  }

  
  protected drawCustomBorder(ctx: CanvasRenderingContext2D) {
    if (!this.canvas) return;
    
    ctx.save();

    
    const zoom = this.canvas.getZoom();
    
    const matrix = this.calcTransformMatrix();
    const options = fabric.util.qrDecompose(matrix);

    const effectiveScaleX = options.scaleX;
    const effectiveScaleY = options.scaleY;
    const borderWidth = 2.5;
    ctx.lineWidth = borderWidth / zoom / Math.max(effectiveScaleX, effectiveScaleY);
    ctx.strokeStyle = this.customBorderColor;

    
    

    
    ctx.transform(
      matrix[0],
      matrix[1],
      matrix[2],
      matrix[3],
      matrix[4],
      matrix[5]
    );

    
    const width = this.width;
    const height = this.height;
    
    const rx = this.rx ? Math.min(this.rx, width / 2) : 0;
    const ry = this.ry ? Math.min(this.ry, height / 2) : 0;

    
    ctx.strokeStyle = this.customBorderColor;
    this.drawRoundedRectPath(ctx, width, height, rx, ry);
    ctx.stroke();

    
    const innerOffset = 0.8 / zoom / Math.max(effectiveScaleX, effectiveScaleY); 
    const innerWidth = width - innerOffset * 2;
    const innerHeight = height - innerOffset * 2;
    const innerRx = rx > 0 ? Math.max(0, rx - innerOffset) : 0;
    const innerRy = ry > 0 ? Math.max(0, ry - innerOffset) : 0;

    
    ctx.lineWidth = borderWidth / 2 / zoom / Math.max(effectiveScaleX, effectiveScaleY);;
    ctx.strokeStyle = this.customInnerBorderColor;
    this.drawRoundedRectPath(ctx, innerWidth, innerHeight, innerRx, innerRy);
    ctx.stroke();
    
    ctx.restore();
  }


  private drawRoundedRectPath(ctx: CanvasRenderingContext2D, width: number, height: number, rx: number, ry: number): void {
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
    ctx.closePath();
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

  toObject(propertiesToInclude: any[] = []): any {
    return super.toObject([...propertiesToInclude, 'type', 'id', 'customBorderColor', 'customControls', 'controlsVisibilityMap']);
  }

}


classRegistry.setClass(Slides, Slides.type);

classRegistry.setSVGClass(Slides, Slides.type);
