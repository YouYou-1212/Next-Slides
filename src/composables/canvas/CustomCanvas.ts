import * as fabric from "fabric";
import { Slides } from "../slides/Slides";
import { Frame } from "../slides/Frame";
import { PageFrame } from "../slides/PageFrame";
import { FabricObject, type ModifierKey, type TPointerEvent } from "fabric";
import "../subassembly/controls/MyActiveSelection";
import { isPointOnRectBorder } from "../../utils/CanvasUtils";
import { isTouchEvent } from "../../../node_modules/fabric/src/util/dom_event";
import { TextControl } from "../subassembly/controls/TextControl";
import { COLORS, SIZES } from "../../constants/theme";

export class CustomCanvas extends fabric.Canvas {
    static type = "CustomCanvas";
    
    declare isDraggingObject: boolean;
    
    private pageFrameIndex: number = -1;
    
    private currentHoverObject: fabric.Object | null = null;

    constructor(el?: string | HTMLCanvasElement, options?: any) {
        const webglOptions = {
            enableRetinaScaling: true,
            renderOnAddRemove: true,
            webgl: true,  
            webglPrecision: 'highp'  
        };
        super(el, { ...options, ...webglOptions });
        this.isDraggingObject = false;
        if ((this as any).contextContainer instanceof WebGLRenderingContext) {
            
        } else {
            
        }
        
        
    }

    protected handleMultiSelection(e: TPointerEvent, target?: FabricObject) {
        const activeObject = this.getActiveObject();
        if (activeObject instanceof PageFrame && activeObject !== target) {
            
            this.discardActiveObject();
            
            if (target && !(target instanceof PageFrame)) {
                this.setActiveObject(target);
            }
            return true;
        }
        
        if (target && target instanceof PageFrame && this._isSelectionKeyPressed(e)) {
            return true;
        }
        return super.handleMultiSelection(e, target);
    }

    
    findTarget(e: fabric.TPointerEvent): fabric.Object | undefined {
        if (this.skipTargetFind) {
            return undefined;
        }

        const pointer = this.getViewportPoint(e),
            activeObject = this._activeObject,
            aObjects = this.getActiveObjects();

        this.targets = [];

        if (activeObject && aObjects.length >= 1) {

            if (activeObject.findControl(pointer, isTouchEvent(e))) {
                
                return activeObject;
            } else if (
                aObjects.length > 1 &&
                this.searchPossibleTargets([activeObject], pointer)
            ) {
                
                return activeObject;
            } else if (
                activeObject === this.searchPossibleTargets([activeObject], pointer)
            ) {
                
                
                if (activeObject instanceof Slides) {
                    
                    const subTargets = this.targets;
                    
                    this.targets = [];

                    
                    const otherObjects = this._objects.filter(obj => obj !== activeObject);
                    
                    const allTargetsUnderPointer: fabric.Object[] = [];

                    
                    for (const obj of otherObjects) {
                        if (this._checkTarget(obj, pointer)) {
                            allTargetsUnderPointer.push(obj);
                        }
                    }

                    

                    
                    if (allTargetsUnderPointer.length > 0) {
                        
                        const slidesOnBorder = allTargetsUnderPointer.find(obj => {
                            return obj instanceof Slides && isPointOnRectBorder(this, pointer, obj, 10);
                        });
                        if (slidesOnBorder) {
                            
                            return slidesOnBorder;
                        }
                        
                        const nonSlidesTargets = allTargetsUnderPointer.filter(obj => !(obj instanceof Slides));

                        if (nonSlidesTargets.length > 0) {
                            
                            const targetIndices = nonSlidesTargets.map(obj => this._objects.indexOf(obj));
                            
                            const maxIndex = Math.max(...targetIndices);
                            const topMostTarget = this._objects[maxIndex];

                            
                            return topMostTarget;
                        } else {
                            const objectOnBorder = allTargetsUnderPointer.find(obj =>
                                isPointOnRectBorder(this, pointer, obj, 10)
                            );

                            if (objectOnBorder) {
                                
                                
                                return objectOnBorder;
                            } else {
                                if (activeObject instanceof PageFrame) {
                                    allTargetsUnderPointer.push(activeObject);
                                    const nonPageFrameTargets = allTargetsUnderPointer.filter(obj => !(obj instanceof PageFrame));
                                    const targetIndices = nonPageFrameTargets.map(obj => this._objects.indexOf(obj));
                                    
                                    const maxIndex = Math.max(...targetIndices);
                                    const topMostTarget = this._objects[maxIndex];
                                    return topMostTarget;
                                }
                                
                            }
                        }
                    }

                    
                    this.targets = subTargets;
                    
                    return activeObject;
                }

                
                
                return activeObject;
            }
        }

        
        const nonSlidesTargets = this._objects.filter(obj => !(obj instanceof Slides));
        const nonSlidesTarget = this.searchPossibleTargets(nonSlidesTargets, pointer);

        if (nonSlidesTarget) {
            
            const slidesOnBorder = this._objects.find(obj => {
                return obj instanceof Slides && isPointOnRectBorder(this, pointer, obj, 10);
            });
            
            
            return slidesOnBorder || nonSlidesTarget;
        }

        
        
        const slidesOnBorder = this._objects.find(obj => {
            return obj instanceof Slides && isPointOnRectBorder(this, pointer, obj, 10);
        });
        if (slidesOnBorder) {
            
            return slidesOnBorder;
        }

        
        const frameInRange = this._objects.find(obj => {
            if (obj instanceof Frame) {
                return this._checkTarget(obj, pointer);
            }
            return false;
        });

        if (frameInRange) {
            
            return frameInRange;
        }

        
        const pageFrameInRange = this._objects.find(obj => {
            if (obj instanceof PageFrame) {
                return isPointOnRectBorder(this, pointer, obj, 10);
            }
            return false;
        });

        if (pageFrameInRange) {
            
            return pageFrameInRange;
        }

        
        
        
        
        
        
        

        
        return undefined;
    }



    
    private handleMouseMove(opt: any): void {
        
        if (this.isDraggingObject) return;

        const pointer = this.getViewportPoint(opt);
        this.handleObjectHover(pointer);
    }

    
    private handleObjectHover(pointer: { x: number; y: number }): void {
        
        const target = this.findTargetForHover(pointer);

        
        if (this.currentHoverObject !== target) {
            
            if (this.currentHoverObject) {
                const isSelected = this.getActiveObjects().includes(this.currentHoverObject);
                if (!isSelected) {
                    this.handleHoverOut(this.currentHoverObject);
                }
            }

            
            if (target) {
                const isSelected = this.getActiveObjects().includes(target);
                if (!isSelected) {
                    this.handleHoverIn(target);
                }
            }

            
            this.currentHoverObject = target;
            
        }
    }

    
    private findTargetForHover(pointer: { x: number; y: number }): fabric.Object | null {
        const point = new fabric.Point(pointer.x, pointer.y);

        
        const slidesOnBorder = this._objects.find(obj => {
            return obj instanceof Slides && isPointOnRectBorder(this, point, obj, 10);
        });

        if (slidesOnBorder) {
            return slidesOnBorder;
        }

        
        for (let i = this._objects.length - 1; i >= 0; i--) {
            const obj = this._objects[i];
            if (!(obj instanceof Slides) && this._checkTarget(obj, point)) {
                return obj;
            }
        }

        
        for (let i = this._objects.length - 1; i >= 0; i--) {
            const obj = this._objects[i];
            if (obj instanceof Slides && this._checkTarget(obj, point)) {
                return obj;
            }
        }

        return null;
    }

    
    private handleHoverIn(target: fabric.Object): void {
        if ((target as any).type === TextControl.type && typeof (target as any).showBorder === "function") {
            (target as any).showBorder(true);
            return;
        }

        if (!(target as any)._originalCustomBorderColor) {
            this.saveOriginalState(target);
        }

        
        if (!(target as any)._originalHoverCursor) {
            (target as any)._originalHoverCursor = target.hoverCursor;
            target.hoverCursor = "default";
        }

        const zoom = this.getZoom();
        const highlightProps: any = {
            borderColor: target instanceof Slides ? COLORS.BORDER.SLIDES_HOVER : COLORS.BORDER.HOVER,
            strokeWidth: SIZES.STROKE_WIDTH / zoom,
            borderScaleFactor: SIZES.BORDER_SCALE_FACTOR,
        };

        if ((target as any).type !== TextControl.type) {
            highlightProps.customBorderColor = target instanceof Slides ? COLORS.BORDER.SLIDES_HOVER : COLORS.BORDER.HOVER;
        }

        target.set(highlightProps);
    }

    
    private handleHoverOut(target: fabric.Object): void {
        if ((target as any).type === TextControl.type && typeof (target as any).showBorder === "function") {
            (target as any).showBorder(false);
            return;
        }

        
        if ((target as any)._originalHoverCursor !== undefined) {
            target.hoverCursor = (target as any)._originalHoverCursor;
            delete (target as any)._originalHoverCursor;
        }

        this.restoreOriginalState(target);
    }

    
    private saveOriginalState(target: fabric.Object): void {
        (target as any)._originalBorderColor = (target as any).borderColor;
        (target as any)._originalStroke = target.stroke;
        (target as any)._originalCustomBorderColor = (target as any).customBorderColor;
        (target as any)._originalStrokeWidth = target.strokeWidth;
        (target as any)._originalBorderScaleFactor = (target as any).borderScaleFactor;
        (target as any)._originalHoverCursor = target.hoverCursor;
    }

    
    private restoreOriginalState(target: fabric.Object): void {
        target.set({
            borderColor: (target as any)._originalBorderColor,
            stroke: (target as any)._originalStroke,
            customBorderColor: (target as any)._originalCustomBorderColor,
            strokeWidth: (target as any)._originalStrokeWidth,
            borderScaleFactor: (target as any)._originalBorderScaleFactor
        });

        delete (target as any)._originalBorderColor;
        delete (target as any)._originalStroke;
        delete (target as any)._originalCustomBorderColor;
        delete (target as any)._originalStrokeWidth;
        delete (target as any)._originalBorderScaleFactor;
    }



    
    add(...objects: fabric.FabricObject[]): number {
        let addedCount = 0;
        
        for (const object of objects) {
            if (object instanceof PageFrame) {
                
                super.insertAt(0, object);
                this.pageFrameIndex = 0;
                addedCount++;
            }
            if (object instanceof Frame) {
                
                if (this.pageFrameIndex >= 0) {
                    super.insertAt(this.pageFrameIndex + 1, object);
                    addedCount++;
                } else {
                    
                    super.add(object);
                    addedCount++;
                }
            }
            if (!(object instanceof Slides)) {
                
                if (this.pageFrameIndex >= 0) {
                    super.insertAt(this.pageFrameIndex, object);
                    addedCount++;
                } else {
                    super.add(object);
                    addedCount++;
                }
            }
        }

        
        this.updatePageFrameIndex();

        return addedCount;
    }

    
    private updatePageFrameIndex(): void {
        const allObjects = this.getObjects();
        this.pageFrameIndex = allObjects.findIndex(obj => obj instanceof PageFrame);
    }

    
    remove(...objects: FabricObject[]) {
        const removed = super.remove(...objects);
        return removed;
    }


    
    bringObjectToFront(object: fabric.Object): boolean {
        if (object instanceof Slides) {
            
            return false;
        } else {
            
            if (this.pageFrameIndex > 0) {
                super.moveObjectTo(object, this.pageFrameIndex - 1);
            }
            
            return true;
        }
    }

    
    sendObjectToBack(object: fabric.Object): boolean {
        if (object instanceof Slides) {
            return false;
        } else {
            super.sendObjectToBack(object);
            
            return true;
        }
    }

    
    bringObjectForward(object: fabric.Object, intersecting?: boolean): boolean {
        if (object instanceof Slides) {
            console.warn("Slides元素不支持移动！");
            return false;
        }
        const objectIndex = this._objects.indexOf(object);
        const upObject = this.item(objectIndex + 1);
        if (upObject instanceof Slides) {
            console.warn("上一层已经是Slides元素不能再移动！");
            return false;
        }
        
        
        return super.bringObjectForward(object, false);
    }

    
    sendObjectBackwards(object: fabric.Object, intersecting?: boolean): boolean {
        if (object instanceof Slides) {
            console.warn("Slides元素不支持移动！");
            return false;
        }
        
        return super.sendObjectBackwards(object, intersecting);
    }

}