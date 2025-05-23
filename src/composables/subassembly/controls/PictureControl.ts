import { EventBus, EventTypes } from "../../../utils/EventBus";
import { getCanvasManager } from "../../../utils/CanvasUtils";
import { COLORS, SIZES } from "../../../constants/theme";
import * as fabric from "fabric";
import { SvgControl } from "./SvgControl";
import { ImageControl } from "./ImageControl";
import { ControlProxy } from "../ControlProxy";

export class PictureControl extends fabric.Group {
    static type = "PictureControl";
    private _innerControl: SvgControl | ImageControl | null = null;
    private _fillColor: string | null = null;
    private _fillOpacity: number = 0.3;
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
    private controlProxy: ControlProxy;

    
    static async create(url: string, options: any = {}): Promise<PictureControl> {
        try {
            
            const isSvg = PictureControl.isSvgUrl(url, options.type);

            
            let innerControl: SvgControl | ImageControl;
            if (isSvg) {
                innerControl = await SvgControl.create(url, {
                    originX: 'center',
                    originY: 'center',
                    scaleX: options.scaleX || 1,
                    scaleY: options.scaleY || 1,
                    angle: options.angle || 0,
                    ...options
                }) as SvgControl;
            } else {
                innerControl = await ImageControl.create(url, {
                    originX: 'center',
                    originY: 'center',
                    ...options
                }) as ImageControl;
            }

            
            const pictureControl = new PictureControl([innerControl as fabric.FabricObject], {
                originX: 'center',
                originY: 'center',
                scaleX: options.scaleX || 1,
                scaleY: options.scaleY || 1,
                angle: options.angle || 0,
                _innerControl: innerControl,
                ...options
            });

            
            if (options.fillColor !== undefined) {
                pictureControl._fillColor = options.fillColor;
                innerControl.setFillColor(options.fillColor, options.fillOpacity);
            }

            
            if (options.cornerRadius) {
                pictureControl._cornerRadius = {
                    ...pictureControl._cornerRadius,
                    ...options.cornerRadius
                };
                if ('setCornerRadii' in innerControl) {
                    (innerControl as ImageControl).setCornerRadii(options.cornerRadius);
                }
            } else if (options.rx !== undefined) {
                const radius = options.rx;
                pictureControl._cornerRadius = {
                    topLeft: radius,
                    topRight: radius,
                    bottomRight: radius,
                    bottomLeft: radius
                };
                if ('setCornerRadius' in innerControl) {
                    (innerControl as ImageControl).setCornerRadius(radius);
                }
            }
            return pictureControl;
        } catch (error) {
            console.error('创建图片控件失败:', error);
            throw error;
        }
    }


    constructor(objects: fabric.FabricObject[], options: any = {}) {
        super(objects, options);
        this.controlProxy = new ControlProxy(this);
        Object.assign(this, {
            subTargetCheck: false,
            interactive: false,
        });
        
        if (options._innerControl) {
            this._innerControl = options._innerControl;
        } else if (objects.length > 0) {
            this._innerControl = objects[0] as any;
        }

        
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

        
        Object.defineProperty(this, 'type', {
            value: PictureControl.type,
            configurable: false,
            writable: false
        });

        
        
        
    }

    
    
    
    
    

    
    
    
    
    
    
    
    
    


    
    static isSvgUrl(url: string, type?: string): boolean {
        if (type && type === 'image/svg+xml') {
            return true;
        }
        if (url.toLowerCase().endsWith('.svg')) {
            return true;
        }

        
        if (url.startsWith('data:image/svg+xml')) {
            return true;
        }

        return false;
    }

    
    isSvg(): boolean {
        if (!this._innerControl) {
            return false;
        }

        return this._innerControl.type === SvgControl.type;
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

    
    async replacePicture(newUrl: string): Promise<this> {
        try {
            const isSvg = PictureControl.isSvgUrl(newUrl);
            const currentIsSvg = this._innerControl?.type === SvgControl.type;

            const left = this.left;
            const top = this.top;
            const scaleX = this.scaleX;
            const scaleY = this.scaleY;
            const angle = this.angle;
            const width = this.width;
            const height = this.height;
            
            if (isSvg === currentIsSvg && this._innerControl) {
                if (isSvg) {
                    await (this._innerControl as SvgControl).replaceSVG(newUrl);
                } else {
                    await (this._innerControl as ImageControl).replaceImage(newUrl);
                }
                this.set({
                    left,
                    top,
                    scaleX,
                    scaleY,
                    angle
                });
                this.dirty = true;
                
                this.setCoords();
                if (this.canvas) {
                    this.canvas.requestRenderAll();
                }
                return this;
            }
            
            else {
                const options = {
                    originX: 'center',
                    originY: 'center',
                    
                    
                    
                    scaleX: 1,
                    scaleY: 1,
                };

                this._fillColor = null;
                
                let newInnerControl: SvgControl | ImageControl;
                if (isSvg) {
                    this._fillOpacity = 1;
                    newInnerControl = await SvgControl.create(newUrl, options) as SvgControl;
                } else {
                    this._fillOpacity = 0.3;
                    const zoom = this.canvas!.getZoom();
                    options.scaleX = PictureControl.isSvgUrl(newUrl) ? 1 : 0.5 / zoom,
                        options.scaleY = PictureControl.isSvgUrl(newUrl) ? 1 : 0.5 / zoom,
                        newInnerControl = await ImageControl.create(newUrl, options) as ImageControl;
                }
                if (this._innerControl) {
                    this.remove(this._innerControl);
                }
                this.add(newInnerControl);
                this._innerControl = newInnerControl;
                this.set({
                    left,
                    top,
                    scaleX,
                    scaleY,
                    angle
                });
                this.setCoords();
                if (this.canvas) {
                    this.canvas.requestRenderAll();
                }

                
                EventBus.emit(EventTypes.CONTROL_PANEL.UPDATE_IMAGE_SETTING_TOOLBAR, {
                    target: this,
                    canvas: this.canvas,
                    canvasManager: getCanvasManager()
                });
                return this;
            }
        } catch (error) {
            console.error('替换图片资源失败:', error);
            throw error;
        }
    }

    
    setFillColor(color: string | null, opacity?: number): this {
        
        this._fillColor = color;

        if (opacity !== undefined) {
            this._fillOpacity = Math.max(0, Math.min(1, opacity));
        }

        
        if (this._innerControl) {
            this._innerControl.setFillColor(color, this._fillOpacity);
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

    
    setCornerRadius(radius: number): this {
        this._cornerRadius = {
            topLeft: Math.max(0, radius),
            topRight: Math.max(0, radius),
            bottomRight: Math.max(0, radius),
            bottomLeft: Math.max(0, radius)
        };

        
        if (this._innerControl && 'setCornerRadius' in this._innerControl) {
            (this._innerControl as ImageControl).setCornerRadius(radius);
        }

        
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

        
        if (this._innerControl && 'setCornerRadii' in this._innerControl) {
            (this._innerControl as ImageControl).setCornerRadii(cornerRadii);
        }

        
        this.dirty = true;
        if (this.canvas) {
            this.canvas.requestRenderAll();
        }

        return this;
    }

    
    getCornerRadius(): typeof this._cornerRadius {
        return { ...this._cornerRadius };
    }


    getInnerControl(): ImageControl | SvgControl | null {
        return this._innerControl;
    }

    
    applyFilter(filterType: string): void {
        if (this.isSvg() || !this._innerControl) {
            return;
        }

        const imgObj = this._innerControl as ImageControl;
        const filters: any[] = [];

        
        switch (filterType) {
            case 'grayscale':
                filters.push(new fabric.filters.Grayscale());
                break;
            case 'sepia':
                filters.push(new fabric.filters.Sepia());
                break;
            case 'invert':
                filters.push(new fabric.filters.Invert());
                break;
            case 'blur':
                filters.push(new fabric.filters.Blur({ blur: 0.25 }));
                break;
            case 'sharpen':
                filters.push(new fabric.filters.Convolute({
                    matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0]
                }));
                break;
            default:
                
                break;
        }

        
        imgObj.filters = filters;
        imgObj.applyFilters();

        if (this.canvas) {
            this.canvas.requestRenderAll();
        }
    }

    
    getAppliedFilterType(): string {
        if (this.isSvg() || !this._innerControl) {
            return 'none';
        }

        const imgObj = this._innerControl as ImageControl;
        if (!imgObj.filters || imgObj.filters.length === 0) {
            return 'none';
        }

        
        const filter = imgObj.filters[0];
        if (!filter) return 'none';

        if (filter instanceof fabric.filters.Grayscale) return 'grayscale';
        if (filter instanceof fabric.filters.Sepia) return 'sepia';
        if (filter instanceof fabric.filters.Invert) return 'invert';
        if (filter instanceof fabric.filters.Blur) return 'blur';
        if (filter instanceof fabric.filters.Convolute && filter.matrix) return 'sharpen';

        return 'none';
    }

    toObject(propertiesToInclude: any[] = []): any {
        return super.toObject([...propertiesToInclude, '_fillColor', '_fillOpacity', '_cornerRadius']);
    }

    toJSON(): any {
        return {
            ...super.toJSON(),
            _fillColor: this._fillColor,
            _fillOpacity: this._fillOpacity,
            _cornerRadius: this._cornerRadius,
            
        };
    }
}

fabric.classRegistry.setClass(PictureControl, PictureControl.type);
fabric.classRegistry.setSVGClass(PictureControl, PictureControl.type);