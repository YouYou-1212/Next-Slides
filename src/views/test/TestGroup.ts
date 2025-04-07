import * as fabric from "fabric";
import { CustomText } from "./CustomText";
import { ImageControl } from "../../composables/subassembly/controls/ImageControl";
import { SvgControl } from "../../composables/subassembly/controls/SvgControl";
import { COLORS, SIZES } from "../../constants/theme";
import { GroupControl } from "../../composables/subassembly/controls/GroupControl";

export class TestGroup extends fabric.Group {
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

    static async create(url: string, options: any = {}): Promise<TestGroup> {
        try {
            
            const isSvg = TestGroup.isSvgUrl(url);
            

            
            let innerControl: SvgControl | ImageControl;
            if (isSvg) {
                innerControl = await SvgControl.create(url, {
                    left: 0,
                    top: 0,
                    originX: 'center',
                    originY: 'center',
                    ...options
                }) as SvgControl;
            } else {
                
                innerControl = await ImageControl.create(url, {
                    left: 0,
                    top: 0,
                    originX: 'center',
                    originY: 'center',
                    ...options
                }) as ImageControl;
            }

            
            
            const testGroup = new TestGroup([innerControl as fabric.FabricObject], {
                originX: 'center',
                originY: 'center',
                left: options.left || 300,
                top: options.top || 300,
                width: options.width || 300,
                height: options.height || 300,
                scaleX: options.scaleX || 1,
                scaleY: options.scaleY || 1,
                angle: options.angle || 0,
                _innerControl: innerControl,
                ...options
            });
            
            
            return testGroup;
        } catch (error) {
            console.error('创建图片控件失败:', error);
            throw error;
        }
    }

    static isSvgUrl(url: string): boolean {
        
        if (url.toLowerCase().endsWith('.svg')) {
            return true;
        }

        
        if (url.startsWith('data:image/svg+xml')) {
            return true;
        }

        return false;
    }

    /**
     * 判断当前内部控件是否为SVG组件
     * @returns boolean
     */
    isSvg(): boolean {
        if (!this._innerControl) {
            return false;
        }

        return this._innerControl.type === SvgControl.type;
    }


    constructor(objects: fabric.FabricObject[], options: any = {}) {
        const defaultOptions = {
            cornerSize: SIZES.CORNER_SIZE,
            cornerColor: COLORS.PRIMARY,
            cornerStyle: "circle",
            transparentCorners: false,
            hasRotatingPoint: false,
            padding: 0,
            borderColor: COLORS.PRIMARY,
            lockRotation: true,
            lockScalingX: false,
            lockScalingY: false,
            lockUniScaling: false,
            
            hasBorders: true,
            hasControls: true,
            selectable: true,
            originX: 'center',
            originY: 'center',
            ...options,
        };

        super(objects, defaultOptions);

        
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
    }



    
    _render(ctx: CanvasRenderingContext2D): void {
        super._render(ctx);

        
        const hasCorners = Object.values(this._cornerRadius).some(value => value > 0);
        if (hasCorners && this.canvas && this.canvas.getActiveObject() === this) {
            ctx.save();

            
            ctx.strokeStyle = this.borderColor as string;
            ctx.lineWidth = this.borderScaleFactor || 1;

            
            const width = this.width || 0;
            const height = this.height || 0;

            
            this._renderRoundedRectWithDifferentCorners(ctx, -width / 2, -height / 2, width, height);
            ctx.stroke();

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


    /**
 * 应用滤镜
 * @param filterType 滤镜类型
 */
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

    /**
 * 获取当前应用的滤镜类型
 * @returns string 滤镜类型
 */
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
            _cornerRadius: this._cornerRadius
        };
    }

}


fabric.classRegistry.setClass(GroupControl, GroupControl.type);
fabric.classRegistry.setSVGClass(GroupControl, GroupControl.type);