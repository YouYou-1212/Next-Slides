import { EventBus, EventTypes } from "../../../utils/EventBus";
import { getCanvasManager } from "../../../utils/CanvasUtils";
import { COLORS, SIZES } from "../../../constants/theme";
import * as fabric from "fabric";
import { ImageControl } from "./ImageControl";

export class GroupControl extends fabric.Group {
    static type = "GroupControl";
    // 边框属性
    private _borderWidth: number = 1;
    private _borderColor: string = COLORS.PRIMARY;
    private _borderStyle: 'solid' | 'dashed' | 'dotted' = 'solid';
    private _borderRadius: {
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
    // 拖动状态标记
    private _isMoving: boolean = false;

    static async create(objects: fabric.Object[], options: any = {}) {
        return new Promise((resolve, reject) => {
            try {
                // 设置默认以中心点为基准
                const defaultOptions = {
                    originX: 'center',
                    originY: 'center',
                    padding: 0,
                    ...options
                };

                // 创建Group实例
                const group = new GroupControl(objects, defaultOptions);

                // 设置边框属性
                if (options.borderWidth !== undefined) {
                    group._borderWidth = options.borderWidth;
                }
                if (options.borderColor !== undefined) {
                    group._borderColor = options.borderColor;
                }
                if (options.borderStyle !== undefined) {
                    group._borderStyle = options.borderStyle;
                }
                if (options.borderRadius) {
                    group._borderRadius = {
                        ...group._borderRadius,
                        ...options.borderRadius
                    };
                } else if (options.rx !== undefined) {
                    const radius = options.rx;
                    group._borderRadius = {
                        topLeft: radius,
                        topRight: radius,
                        bottomRight: radius,
                        bottomLeft: radius
                    };
                }

                resolve(group);
            } catch (error) {
                reject(error);
            }
        });
    }

    constructor(objects: fabric.Object[], options: any = {}) {
        const defaultOptions = {
            cornerSize: SIZES.CORNER_SIZE,
            cornerColor: COLORS.PRIMARY,
            cornerStyle: "circle",
            transparentCorners: false,
            hasRotatingPoint: true,
            padding: 0,
            borderColor: COLORS.PRIMARY,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false,
            lockUniScaling: false,
            ...options,
        };

        super(objects, defaultOptions);

        // 初始化边框属性
        if (options && options.borderWidth !== undefined) {
            this._borderWidth = options.borderWidth;
        }
        if (options && options.borderColor) {
            this._borderColor = options.borderColor;
        }
        if (options && options.borderStyle) {
            this._borderStyle = options.borderStyle;
        }
        // 初始化圆角属性
        if (options && options.borderRadius) {
            this._borderRadius = {
                ...this._borderRadius,
                ...options.borderRadius
            };
        } else if (options && options.rx !== undefined) {
            const radius = options.rx;
            this._borderRadius = {
                topLeft: radius,
                topRight: radius,
                bottomRight: radius,
                bottomLeft: radius
            };
        }

        // 设置对象类型
        Object.defineProperty(this, 'type', {
            value: GroupControl.type,
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
        // EventBus.emit(EventTypes.CONTROL_PANEL.HIDE_GROUP_SETTING_TOOLBAR);
    }

    // 处理移动结束事件
    private handleMoveEnd(): void {
        this._isMoving = false;
        // EventBus.emit(EventTypes.CONTROL_PANEL.SHOW_GROUP_SETTING_TOOLBAR, {
        //     target: this,
        //     canvas: this.canvas,
        //     canvasManager: getCanvasManager()
        // });
    }

    // 设置边框宽度
    setBorderWidth(width: number): this {
        this._borderWidth = Math.max(0, width);
        
        // 标记需要重绘
        this.dirty = true;
        if (this.canvas) {
            this.canvas.requestRenderAll();
        }
        
        return this;
    }

    // 设置边框颜色
    setBorderColor(color: string): this {
        this._borderColor = color;
        
        // 标记需要重绘
        this.dirty = true;
        if (this.canvas) {
            this.canvas.requestRenderAll();
        }
        
        return this;
    }

    // 设置边框样式
    setBorderStyle(style: 'solid' | 'dashed' | 'dotted'): this {
        this._borderStyle = style;
        
        // 标记需要重绘
        this.dirty = true;
        if (this.canvas) {
            this.canvas.requestRenderAll();
        }
        
        return this;
    }

    // 设置边框圆角
    setBorderRadius(radius: number | {
        topLeft?: number;
        topRight?: number;
        bottomRight?: number;
        bottomLeft?: number;
    }): this {
        if (typeof radius === 'number') {
            this._borderRadius = {
                topLeft: radius,
                topRight: radius,
                bottomRight: radius,
                bottomLeft: radius
            };
        } else {
            this._borderRadius = {
                ...this._borderRadius,
                ...radius
            };
        }
        
        // 标记需要重绘
        this.dirty = true;
        if (this.canvas) {
            this.canvas.requestRenderAll();
        }
        
        return this;
    }

    // 获取边框属性
    getBorderProperties(): {
        width: number;
        color: string;
        style: 'solid' | 'dashed' | 'dotted';
        radius: {
            topLeft: number;
            topRight: number;
            bottomRight: number;
            bottomLeft: number;
        }
    } {
        return {
            width: this._borderWidth,
            color: this._borderColor,
            style: this._borderStyle,
            radius: { ...this._borderRadius }
        };
    }

    // 重写渲染方法，添加边框
    // _render(ctx: CanvasRenderingContext2D): void {
    //     // 先调用父类的渲染方法，绘制组内的所有对象
    //     super._render(ctx);
        
    //     // 如果边框宽度大于0，则绘制边框
    //     if (this._borderWidth > 0) {
    //         const width = this.width || 0;
    //         const height = this.height || 0;
            
    //         ctx.save();
            
    //         // 设置边框样式
    //         ctx.strokeStyle = this._borderColor;
    //         ctx.lineWidth = this._borderWidth;
            
    //         // 设置虚线样式
    //         if (this._borderStyle === 'dashed') {
    //             ctx.setLineDash([5, 5]);
    //         } else if (this._borderStyle === 'dotted') {
    //             ctx.setLineDash([2, 2]);
    //         }
            
    //         // 绘制带圆角的矩形
    //         this._renderRoundedRect(ctx, -width / 2, -height / 2, width, height);
    //         ctx.stroke();
            
    //         ctx.restore();
    //     }
    // }

    // 绘制带圆角的矩形路径
    private _renderRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
        const { topLeft, topRight, bottomRight, bottomLeft } = this._borderRadius;
        
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

    // 序列化对象
    toObject(propertiesToInclude: any[] = []): any {
        return super.toObject([
            ...propertiesToInclude,
            '_borderWidth',
            '_borderColor',
            '_borderStyle',
            '_borderRadius'
        ]);
    }

    // 转换为JSON
    toJSON(): any {
        return {
            ...super.toJSON(),
            _borderWidth: this._borderWidth,
            _borderColor: this._borderColor,
            _borderStyle: this._borderStyle,
            _borderRadius: this._borderRadius
        };
    }
}
fabric.classRegistry.setClass(GroupControl, GroupControl.type);
fabric.classRegistry.setSVGClass(GroupControl, GroupControl.type);