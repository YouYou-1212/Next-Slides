import { COLORS } from "../../../constants/theme";
import * as fabric from "fabric";
import { ActiveSelection, FabricObject } from "fabric";
import { ControlProxy } from "../ControlProxy";


export class MyActiveSelection extends ActiveSelection {
    static type = "ActiveSelection";

    
    borderColor: string = COLORS.BORDER.SELECTED;
    
    borderWidth: number = 2;
    
    selectionBackgroundColor: string = "rgba(117, 117, 255, 0.9)";
    
    selectionOpacity: number = 0.3;
    private controlProxy: ControlProxy;

    constructor(
        objects: FabricObject[] = [],
        options: any = {},
    ) {
        super(objects, options);
        this.controlProxy = new ControlProxy(this);
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
        Object.defineProperty(this, 'type', {
            value: MyActiveSelection.type,
            configurable: false,
            writable: false
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
        })
        ctx.save();
        
        ctx.globalAlpha = this.isMoving ? this.borderOpacityWhenMoving : 1;

        
        if (this.selectionBackgroundColor && this.selectionOpacity > 0) {
            ctx.fillStyle = this.selectionBackgroundColor;
            ctx.globalAlpha = this.selectionOpacity;

            const zoom = this.canvas?.getZoom() || 1;
            const vpt = this.canvas?.viewportTransform || [1, 0, 0, 1, 0, 0];
            const { left, top, width, height } = this.getBoundingRect();

            const displayLeft = (left * zoom) + vpt[4];
            const displayTop = (top * zoom) + vpt[5];

            const displayWidth = width * zoom;
            const displayHeight = height * zoom;
            const scaledPadding = this.padding / zoom;
            ctx.fillRect(displayLeft - scaledPadding,
                displayTop - scaledPadding,
                displayWidth + scaledPadding * 2,
                displayHeight + scaledPadding * 2);

            
            ctx.globalAlpha = this.isMoving ? this.borderOpacityWhenMoving : 1;
        }

        
        const options = {
            hasControls: false,
            ...childrenOverride,
            forActiveSelection: false,
        };
        
        const defaultBorderColor = this.borderColor;
        const defaultBorderWidth = this.borderWidth;

        
        const customStyleOverride = {
            ...styleOverride,
            borderColor: defaultBorderColor,
            borderWidth: defaultBorderWidth,
        };

        
        super._renderControls(ctx, customStyleOverride);

        ctx.restore();
    }


    multiSelectAdd(...targets: FabricObject[]) {
        super.multiSelectAdd(...targets);
    }


}


fabric.classRegistry.setClass(MyActiveSelection);