import { EventBus, EventTypes } from "../../../utils/EventBus";
import { getCanvasManager } from "../../../utils/CanvasUtils";
import { COLORS, SIZES } from "../../../constants/theme";
import * as fabric from "fabric";

export class SvgControl extends fabric.Group {
    static type = "SvgControl";
    
    private _fillColor: string | null = null;
    private _fillOpacity: number = 1;
    
    private _isMoving: boolean = false;
    
    private _originalSvg: fabric.Object[] = [];
    private _svgOptions: any = {};

    static async create(url: string, options: any = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                
                const defaultOptions = {
                    originX: 'center',
                    originY: 'center',
                    padding: 0,
                    ...options
                };

                
                const result = await fabric.loadSVGFromURL(url);
                const objects = result.objects;
                const svgOptions = result.options;

                if (!objects || objects.length === 0) {
                    reject(new Error('加载SVG资源失败'));
                    return;
                }

                const validObjects = objects.filter(obj => obj !== null) as fabric.Object[];

                
                const svgControl = new SvgControl(validObjects, {
                    ...defaultOptions,
                    _originalSvg: [...validObjects],
                    _svgOptions: svgOptions
                });

                
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
            
            
            
            
            
            
            
            
            
            
            
            ...options,
        };

        super(objects, defaultOptions);

        
        if (options._originalSvg) {
            this._originalSvg = options._originalSvg;
        }
        if (options._svgOptions) {
            this._svgOptions = options._svgOptions;
        }

        
        if (options && options.fillColor) {
            this._fillColor = options.fillColor;
        }
        if (options && options.fillOpacity !== undefined) {
            this._fillOpacity = options.fillOpacity;
        }

        
        Object.defineProperty(this, 'type', {
            value: SvgControl.type,
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

    
    setFill(color: string | null): this {
        if (!color) {
            color = 'none';
        }
        
        this.forEachObject((obj: any) => {
            if (obj.fill && obj.fill !== 'none') {
                obj.set('fill', color);
            }
            if (obj.stroke && obj.stroke !== 'none') {
                obj.set('stroke', color);
            }
            if (obj.type === 'path' || obj._objects) {
                
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

    
    setFillColor(color: string | null, opacity?: number): this {
        this.setFill(color);
        if (opacity !== undefined) {
            this._fillOpacity = Math.max(0, Math.min(1, opacity));

            
            this.forEachObject((obj: any) => {
                obj.set('opacity', this._fillOpacity);
            });
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

    
    async replaceSVG(url: string): Promise<this> {
        try {
            
            const left = this.left;
            const top = this.top;
            const scaleX = this.scaleX;
            const scaleY = this.scaleY;
            const angle = this.angle;
            const width = this.width;
            const height = this.height;
            
            const result = await fabric.loadSVGFromURL(url);
            const objects = result.objects;
            const svgOptions = result.options;

            if (!objects || objects.length === 0) {
                throw new Error('加载SVG资源失败');
            }

            
            const validObjects = objects.filter(obj => obj !== null) as fabric.Object[];

            
            while (this.size() > 0) {
                const obj = this.item(0);
                if (obj) {
                    this.remove(obj);
                }
            }

            
            validObjects.forEach(obj => {
                this.add(obj);
            });

            
            this._originalSvg = [...validObjects];
            this._svgOptions = svgOptions;


            
            this.set({
                left,
                top,
                scaleX,
                scaleY,
                angle
            });

            
            if (this._fillColor) {
                this.setFill(this._fillColor);
            }

            
            if (this._fillOpacity !== 1) {
                this.forEachObject((obj: any) => {
                    obj.set('opacity', this._fillOpacity);
                });
            }

            
            this.dirty = true;
            
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