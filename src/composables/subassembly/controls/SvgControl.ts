import { EventBus, EventTypes } from "../../../utils/EventBus";
import { getCanvasManager } from "../../../utils/CanvasUtils";
import { COLORS, SIZES } from "../../../constants/theme";
import * as fabric from "fabric";

export class SvgControl extends fabric.Group {
    static type = "SvgControl";
    // 填充颜色属性
    private _fillColor: string | null = null;
    private _fillOpacity: number = 1;
    //拖动状态标记
    private _isMoving: boolean = false;
    // 原始SVG元素
    private _originalSvg: fabric.Object[] = [];
    private _svgOptions: any = {};

    static async create(url: string, options: any = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                // 设置默认以中心点为基准
                const defaultOptions = {
                    originX: 'center',
                    originY: 'center',
                    padding: 0,
                    ...options
                };

                // 加载SVG (使用Promise方式)
                const result = await fabric.loadSVGFromURL(url);
                const objects = result.objects;
                const svgOptions = result.options;

                if (!objects || objects.length === 0) {
                    reject(new Error('加载SVG资源失败'));
                    return;
                }

                const validObjects = objects.filter(obj => obj !== null) as fabric.Object[];

                // 创建SvgControl实例
                const svgControl = new SvgControl(validObjects, {
                    ...defaultOptions,
                    _originalSvg: [...validObjects],
                    _svgOptions: svgOptions
                });

                // 设置属性
                if (options.fillColor !== undefined) {
                    svgControl._fillColor = options.fillColor;
                    svgControl.setFill(options.fillColor);
                }
                if (options.fillOpacity !== undefined) {
                    svgControl._fillOpacity = options.fillOpacity;
                }
                resolve(svgControl);
            } catch (error) {
                reject(error);
            }
        });
    }

    constructor(objects: fabric.Object[], options: any = {}) {
        const defaultOptions = {
            // cornerSize: SIZES.CORNER_SIZE,
            // cornerColor: COLORS.PRIMARY,
            // cornerStyle: "circle",
            // transparentCorners: false,
            // hasRotatingPoint: false,
            // padding: 0,
            // borderColor: COLORS.PRIMARY,
            // lockRotation: false,
            // lockScalingX: false,
            // lockScalingY: false,
            // lockUniScaling: false,
            ...options,
        };

        super(objects, defaultOptions);

        // 保存原始SVG对象
        if (options._originalSvg) {
            this._originalSvg = options._originalSvg;
        }
        if (options._svgOptions) {
            this._svgOptions = options._svgOptions;
        }

        // 初始化填充颜色和透明度
        if (options && options.fillColor) {
            this._fillColor = options.fillColor;
        }
        if (options && options.fillOpacity !== undefined) {
            this._fillOpacity = options.fillOpacity;
        }

        // 设置对象类型
        Object.defineProperty(this, 'type', {
            value: SvgControl.type,
            configurable: false,
            writable: false
        });

        // this.on('moving', this.handleMoving.bind(this));
        // this.on('mouseup', this.handleMoveEnd.bind(this));
        // this.on('deselected', this.handleMoveEnd.bind(this));
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

    // 设置SVG的填充颜色
    setFill(color: string | null): this {
        if (!color) {
            color = 'none';
        }
        // 遍历所有子对象设置填充颜色
        this.forEachObject((obj: any) => {
            if (obj.fill && obj.fill !== 'none') {
                obj.set('fill', color);
            }
            if (obj.stroke && obj.stroke !== 'none') {
                obj.set('stroke', color);
            }
            if (obj.type === 'path' || obj._objects) {
                // 如果是组或路径，递归处理
                if (obj._objects) {
                    obj._objects.forEach((childObj: any) => {
                        if (childObj.fill !== undefined && childObj.fill !== 'none') {
                            childObj.set('fill', color);
                        }
                        if (childObj.stroke !== undefined && childObj.stroke !== 'none') {
                            childObj.set('stroke', color);
                        }
                    });
                }
            }
        });

        this._fillColor = color;
        return this;
    }

    // 设置填充颜色和透明度
    setFillColor(color: string | null, opacity?: number): this {
        this.setFill(color);
        if (opacity !== undefined) {
            this._fillOpacity = Math.max(0, Math.min(1, opacity));

            // 设置所有对象的透明度
            this.forEachObject((obj: any) => {
                obj.set('opacity', this._fillOpacity);
            });
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

    // 替换SVG资源
    async replaceSVG(url: string): Promise<this> {
        try {
            // 保存当前的位置、缩放和旋转信息
            const left = this.left;
            const top = this.top;
            const scaleX = this.scaleX;
            const scaleY = this.scaleY;
            const angle = this.angle;
            const width = this.width;
            const height = this.height;
            // 使用Promise方式加载SVG
            const result = await fabric.loadSVGFromURL(url);
            const objects = result.objects;
            const svgOptions = result.options;

            if (!objects || objects.length === 0) {
                throw new Error('加载SVG资源失败');
            }

            // 过滤掉null值
            const validObjects = objects.filter(obj => obj !== null) as fabric.Object[];

            // 清除当前的对象 - 使用更可靠的方法
            while (this.size() > 0) {
                const obj = this.item(0);
                if (obj) {
                    this.remove(obj);
                }
            }

            // 添加新的SVG对象
            validObjects.forEach(obj => {
                this.add(obj);
            });

            // 保存新的原始SVG对象
            this._originalSvg = [...validObjects];
            this._svgOptions = svgOptions;


            // 恢复位置、缩放和旋转
            this.set({
                left,
                top,
                scaleX,
                scaleY,
                angle
            });

            // 如果有填充颜色，应用到新的SVG
            if (this._fillColor) {
                this.setFill(this._fillColor);
            }

            // 应用透明度
            if (this._fillOpacity !== 1) {
                this.forEachObject((obj: any) => {
                    obj.set('opacity', this._fillOpacity);
                });
            }

            // 标记需要重绘
            this.dirty = true;
            // 重新计算边界并设置尺寸
            this.setCoords();
            if (this.canvas) {
                this.canvas.requestRenderAll();
            }

            return this;
        } catch (error) {
            console.error('替换SVG时出错:', error);
            throw error;
        }
    }

    toObject(propertiesToInclude: any[] = []): any {
        return super.toObject([...propertiesToInclude, '_fillColor', '_fillOpacity']);
    }

    toJSON(): any {
        return {
            ...super.toJSON(),
            _fillColor: this._fillColor,
            _fillOpacity: this._fillOpacity
        };
    }
}

fabric.classRegistry.setClass(SvgControl, SvgControl.type);
fabric.classRegistry.setSVGClass(SvgControl, SvgControl.type);