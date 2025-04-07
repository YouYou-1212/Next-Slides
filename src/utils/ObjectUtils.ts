import * as fabric from "fabric";
import type { CustomCanvas } from "../composables/canvas/CustomCanvas";
import { COLORS, STYLES } from "../constants/theme";
import { Slides } from "../composables/slides/Slides";

export function setObjectHover(canvas: CustomCanvas, target: fabric.FabricObject) {
    if (target) {
        if (target === canvas.getActiveObject()) return;

        if (target instanceof Slides) {
            target.setCu1stomBorderColor(COLORS.BORDER.SLIDES_HOVER);
        } else {
            
            
            
            
            
            if (canvas.contextTop) {
                canvas.clearContext(canvas.contextTop);
            }
            canvas.contextTop.save();
            
            
            
            
            
          
            canvas.contextTop.strokeStyle = STYLES.CORNER.COLOR;
            target._renderControls(canvas.contextTop, {
                hasControls: false
            });
            canvas.contextTop.restore();
        }
    }
}

export function clearObjectHover(canvas: CustomCanvas, target: fabric.FabricObject) {
    if (target) {
        if (target === canvas.getActiveObject()) return;
        if (target instanceof Slides) {
            target.setCu1stomBorderColor(COLORS.BORDER.SLIDES_DEFAULT);
        }
        if (canvas.contextTop) {
            canvas.clearContext(canvas.contextTop);
        }
    }

}
