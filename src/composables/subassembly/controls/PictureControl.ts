import { EventBus, EventTypes } from "../../../utils/EventBus";
import { getCanvasManager } from "../../../utils/CanvasUtils";
import { COLORS, SIZES } from "../../../constants/theme";
import * as fabric from "fabric";
import { SvgControl } from "./SvgControl";
import { ImageControl } from "./ImageControl";

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
    private _isMoving: boolean = false;

    /**
     * 创建图片控件，自动判断是SVG还是普通图片
     * @param url 图片URL
     * @param options 配置选项
     * @returns Promise<PictureControl>
     */
    static async create(url: string, options: any = {}): Promise<PictureControl> {
        try {
            // 判断是否为SVG
            const isSvg = PictureControl.isSvgUrl(url , options.type);
            console.log('[PictureControl] isSvg', url, isSvg , options);

            // 创建内部控件
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
                console.log('[PictureControl] Create ImageControl', url);
                innerControl = await ImageControl.create(url, {
                    originX: 'center',
                    originY: 'center',
                    ...options
                }) as ImageControl;
            }

            // 创建PictureControl实例
            const pictureControl = new PictureControl([innerControl as fabric.FabricObject], {
                originX: 'center',
                originY: 'center',
                scaleX: options.scaleX || 1,
                scaleY: options.scaleY || 1,
                angle: options.angle || 0,
                _innerControl: innerControl,
                ...options
            });

            // 设置填充颜色和透明度
            if (options.fillColor !== undefined) {
                pictureControl._fillColor = options.fillColor;
                innerControl.setFillColor(options.fillColor, options.fillOpacity);
            }

            // 设置圆角
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
            ownCaching: false,
            // 确保控制点可见
            hasBorders: true,
            hasControls: true,
            selectable: true,
            originX: 'center',
            originY: 'center',
            ...options,
        };

        super(objects, defaultOptions);

        // 保存内部控件引用
        if (options._innerControl) {
            this._innerControl = options._innerControl;
        } else if (objects.length > 0) {
            this._innerControl = objects[0] as any;
        }

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

        // 设置对象类型
        Object.defineProperty(this, 'type', {
            value: PictureControl.type,
            configurable: false,
            writable: false
        });


        console.log('[PictureControl] 构造函数 ', options);

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


    /**
     * 判断URL是否为SVG资源
     * @param url 图片URL
     * @returns boolean
     */
    static isSvgUrl(url: string , type?:string): boolean {
        if(type && type === 'image/svg+xml'){
            return true;
        }
        if (url.toLowerCase().endsWith('.svg')) {
            return true;
        }

        // 检查是否为data:image/svg+xml格式的内联SVG
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


    // 自定义渲染方法，实现自定义边框
    _render(ctx: CanvasRenderingContext2D): void {
        super._render(ctx);

        // 如果有圆角，绘制自定义边框
        const hasCorners = Object.values(this._cornerRadius).some(value => value > 0);
        if (hasCorners && this.canvas && this.canvas.getActiveObject() === this) {
            ctx.save();

            // 设置边框样式
            ctx.strokeStyle = this.borderColor as string;
            ctx.lineWidth = this.borderScaleFactor || 1;

            // 获取尺寸
            const width = this.width || 0;
            const height = this.height || 0;

            // 绘制圆角边框
            this._renderRoundedRectWithDifferentCorners(ctx, -width / 2, -height / 2, width, height);
            ctx.stroke();

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

    /**
     * 替换图片资源，支持SVG和普通图片之间的相互转换
     * @param newUrl 新的图片URL
     * @returns Promise<PictureControl>
     */
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
            // 如果类型相同，直接替换资源
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
                // 更新Group尺寸
                this.setCoords();
                if (this.canvas) {
                    this.canvas.requestRenderAll();
                }
                return this;
            }
            // 类型不同，需要创建新控件并替换
            else {
                const options = {
                    originX: 'center',
                    originY: 'center',
                    // fillColor: this._fillColor,
                    // fillOpacity: this._fillOpacity,
                    // cornerRadius: this._cornerRadius,
                    scaleX:1,
                    scaleY:1,
                };

                this._fillColor = null;
                // 创建新的内部控件
                let newInnerControl: SvgControl | ImageControl;
                if (isSvg) {
                    this._fillOpacity = 1;
                    newInnerControl = await SvgControl.create(newUrl, options) as SvgControl;
                } else {
                    this._fillOpacity = 0.3;
                    const zoom = this.canvas!.getZoom();
                    options.scaleX = PictureControl.isSvgUrl(newUrl) ? 1 :0.5 / zoom,
                    options.scaleY = PictureControl.isSvgUrl(newUrl) ? 1 :0.5 / zoom,
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

                // 触发控件更新事件
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

    // 设置填充颜色
    setFillColor(color: string | null, opacity?: number): this {
        console.log('[PictureControl] setFillColor', color, opacity , this);
        this._fillColor = color;

        if (opacity !== undefined) {
            this._fillOpacity = Math.max(0, Math.min(1, opacity));
        }

        // 设置内部控件的填充颜色
        if (this._innerControl) {
            this._innerControl.setFillColor(color, this._fillOpacity);
        }

        // 标记需要重绘
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

    // 设置所有角的圆角半径
    setCornerRadius(radius: number): this {
        this._cornerRadius = {
            topLeft: Math.max(0, radius),
            topRight: Math.max(0, radius),
            bottomRight: Math.max(0, radius),
            bottomLeft: Math.max(0, radius)
        };

        // 设置内部控件的圆角
        if (this._innerControl && 'setCornerRadius' in this._innerControl) {
            (this._innerControl as ImageControl).setCornerRadius(radius);
        }

        // 标记需要重绘
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

        // 设置内部控件的圆角
        if (this._innerControl && 'setCornerRadii' in this._innerControl) {
            (this._innerControl as ImageControl).setCornerRadii(cornerRadii);
        }

        // 标记需要重绘
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

        // 根据选择的滤镜类型添加对应的滤镜
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
                // 无滤镜
                break;
        }

        // 应用滤镜
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

        // 根据滤镜类型返回对应的值
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
            // _innerControl: this._innerControl?.toJSON()
        };
    }
}

fabric.classRegistry.setClass(PictureControl, PictureControl.type);
fabric.classRegistry.setSVGClass(PictureControl, PictureControl.type);