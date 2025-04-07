import { EventBus, EventTypes } from "../../../utils/EventBus";
import { COLORS, SIZES } from "../../../constants/theme";
import * as fabric from "fabric";
import { getCanvasManager } from "../../../utils/CanvasUtils";
import { FabricObject } from "fabric";
import { ControlProxy } from "../ControlProxy";
import { MyActiveSelection } from "./MyActiveSelection";

export class GroupControl extends fabric.Group {
    static type = "GroupControl";
    private controlProxy: ControlProxy;

    static async create(objects: fabric.Object[], options: any = {}): Promise<GroupControl> {
        return new Promise((resolve, reject) => {
            try {
                
                const defaultOptions = {
                    originX: 'center',
                    originY: 'center',
                    lockScalingFlip: true,
                    padding: 0,
                    ...options
                };

                
                const group = new GroupControl(objects, defaultOptions);

                resolve(group);
            } catch (error) {
                reject(error);
            }
        });
    }

    constructor(objects: fabric.Object[], options: any = {}) {
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        super(objects, options);
        this.controlProxy = new ControlProxy(this);

        
        Object.defineProperty(this, 'type', {
            value: GroupControl.type,
            configurable: false,
            writable: false
        });

        this.setControlsVisibility({
            
            mtr: false,
            bl: true,
            br: true,
            tl: true,
            tr: true,
            mb: false,
            ml: false,
            mr: false,
            mt: false,
        });

        
        this.on('scaling', this.handleScaling.bind(this));

    }

    
    private handleScaling(e: fabric.TEvent): void {
        
        this._objects.forEach(obj => {
            
            const originalScaleX = obj.scaleX;
            const originalScaleY = obj.scaleY;

            
            obj.set({
                scaleX: originalScaleX * this.scaleX,
                scaleY: originalScaleY * this.scaleY
            });

            
            const scalingEvent = {
                ...e,
                target: obj,
                groupScaleX: this.scaleX,
                groupScaleY: this.scaleY,
                transform: {
                    ...(e as any).transform,
                    target: obj,
                    original: {
                        scaleX: originalScaleX,
                        scaleY: originalScaleY
                    }
                }
            };

            
            if (typeof obj.fire === 'function') {
                obj.fire('scaling', {
                    ...scalingEvent,
                    pointer: (e as any).pointer || { x: 0, y: 0 }
                });
            }

            
            obj.set({
                scaleX: originalScaleX,
                scaleY: originalScaleY
            });

            
            obj.setCoords();
        });
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    


    drawControls(
        ctx: CanvasRenderingContext2D,
        styleOverride: any = {},
    ) {
        this.setCoords();
        super.drawControls(ctx, styleOverride);
    }


    _renderControls(
        ctx: CanvasRenderingContext2D,
        styleOverride?: any,
        childrenOverride?: any
    ) {
        this._objects.forEach(obj => {
            obj.padding > this.padding ? this.padding = obj.padding : null;
        });
        super._renderControls(ctx, styleOverride);
    }

    add(...objects: FabricObject[]) {
        return super.add(...objects);
    }

    
    toObject(propertiesToInclude: any[] = []): any {
        return super.toObject([
            ...propertiesToInclude,
        ]);
    }

    
    toJSON(): any {
        return {
            ...super.toJSON(),
        };
    }
}
fabric.classRegistry.setClass(GroupControl, GroupControl.type);
fabric.classRegistry.setSVGClass(GroupControl, GroupControl.type);