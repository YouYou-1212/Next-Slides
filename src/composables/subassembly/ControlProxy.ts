import { EventBus, EventTypes } from "../../utils/EventBus";
import { COLORS, SIZES } from "../../constants/theme";
import * as fabric from "fabric";
import { getCanvasManager } from "../../utils/CanvasUtils";
import { GroupControl } from "./controls/GroupControl";
import { TextControl } from "./controls/TextControl";
import { ImageControl } from "./controls/ImageControl";
import { SvgControl } from "./controls/SvgControl";
import { ShapeControl } from "./controls/ShapeControl";
import { PictureControl } from "./controls/PictureControl";
import { MyActiveSelection } from "./controls/MyActiveSelection";

export class ControlProxy {
    private target: fabric.FabricObject;
    private _isMoving: boolean = false;

    constructor(target: fabric.FabricObject) {
        this.target = target;
        this.initializeControl();
    }

    private initializeControl() {
        
        const defaultOptions = {
            cornerSize: SIZES.CORNER_SIZE,
            cornerColor: COLORS.PRIMARY,
            cornerStyle: "circle",
            transparentCorners: false,
            hasRotatingPoint: false,
            padding: 0,
            borderColor: COLORS.PRIMARY,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false,
            lockUniScaling: false,
            lockScalingFlip: true,
            selectable: true,
            evented: true,
            subTargetCheck: true,
            interactive: true,
        };

        Object.assign(this.target, defaultOptions);

        
        this.target.setControlsVisibility({
            mtr: false,
        });

        
        this.target.on("selected", this.handleSelection.bind(this));
        this.target.on("deselected", this.handleDeselected.bind(this));
        this.target.on("moving", this.handleMoving.bind(this));
        this.target.on("mouseup", this.handleMoveEnd.bind(this));
        this.target.on("removed", this.handleRemoved.bind(this));
    }

    private handleSelection(): void {
        
        this.showToolbar();
    }

    private handleMoving(): void {
        this._isMoving = true;
        this.hideToolbar();
    }

    private handleMoveEnd(): void {
        this._isMoving = false;
        this.showToolbar();
    }

    private handleDeselected(): void {
        
        this.hideToolbar();
    }

    private handleRemoved(): void {
        this.hideToolbar();
    }

    public isMoving(): boolean {
        return this._isMoving;
    }

    public showToolbar(): void {
        if (this._isMoving) return;
        const eventData = {
            target: this.target,
            canvas: this.target.canvas,
            canvasManager: getCanvasManager()
        };

        const activeObject = this.target.canvas?.getActiveObject();
        
        
        
        
        
        if (activeObject && activeObject.type === MyActiveSelection.type) {
            eventData.target = activeObject;
            this.target = activeObject;
        }else{
            if(activeObject){
                this.target = activeObject;
            }
            eventData.target = activeObject as any;
        }

        
        switch (this.target.type) {
            case GroupControl.type:
            case MyActiveSelection.type:
                
                EventBus.emit(EventTypes.CONTROL_PANEL.SHOW_GROUP_SETTING_TOOLBAR, eventData);
                break;
            case TextControl.type:
                
                EventBus.emit(EventTypes.CONTROL_PANEL.SHOW_TEXT_SETTING_TOOLBAR, eventData);
                break;
            
            
            case PictureControl.type:
                
                EventBus.emit(EventTypes.CONTROL_PANEL.SHOW_IMAGE_SETTING_TOOLBAR, eventData);
                break;
            case ShapeControl.type:
                EventBus.emit(EventTypes.CONTROL_PANEL.SHOW_SHAPE_SETTING_TOOLBAR, eventData);
                break;
        }
    }

    public hideToolbar(): void {
        switch (this.target.type) {
            case GroupControl.type:
            case MyActiveSelection.type:
                EventBus.emit(EventTypes.CONTROL_PANEL.HIDE_GROUP_SETTING_TOOLBAR);
                break;
            case TextControl.type:
                EventBus.emit(EventTypes.CONTROL_PANEL.HIDE_TEXT_SETTING_TOOLBAR);
                break;
            case PictureControl.type:
                EventBus.emit(EventTypes.CONTROL_PANEL.HIDE_IMAGE_SETTING_TOOLBAR);
                break;
            case ShapeControl.type:
                EventBus.emit(EventTypes.CONTROL_PANEL.HIDE_SHAPE_SETTING_TOOLBAR);
                break;
        }
    }
}