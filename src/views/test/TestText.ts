import { IText, Textbox, Canvas, Control, util, controlsUtils, Object as FabricObject, type TPointerEvent, type Transform } from 'fabric';
import * as fabric from "fabric";

// 定义类型扩展
declare module 'fabric' {
    namespace fabric {
        class TestText extends Textbox {
            preventDistortion: boolean;
        }
    }
}

const SCALING_CONTROLS = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne', 'e'] as const;
const SKEWING_CONTROLS = ['ns', 'nesw', 'ew', 'nwse'] as const;
const POSITIONS = {
    LEFT: 'left',
    TOP: 'top',
    RIGHT: 'right',
    BOTTOM: 'bottom',
    CENTER: 'center'
} as const;

const OPPOSITE_POSITIONS = {
    [POSITIONS.TOP]: POSITIONS.BOTTOM,
    [POSITIONS.BOTTOM]: POSITIONS.TOP,
    [POSITIONS.LEFT]: POSITIONS.RIGHT,
    [POSITIONS.RIGHT]: POSITIONS.LEFT,
    [POSITIONS.CENTER]: POSITIONS.CENTER,
} as const;

function isTransformCentered(transform: any): boolean {
    return transform.originX === POSITIONS.CENTER && transform.originY === POSITIONS.CENTER;
}

function changeWidthHeight(eventData: TPointerEvent, transform: Transform, x: number, y: number, shiftKey?: boolean, altKey?: boolean): boolean {
    const target = transform.target;
    const localPoint = controlsUtils.getLocalPoint(transform, transform.originX, transform.originY, x, y);
    const strokePadding = target.strokeWidth / (target.strokeUniform ? target.scaleX : 1);
    const multiplier = isTransformCentered(transform) ? 2 : 1;
    const oldWidth = target.width;

    const newWidth = Math.abs(localPoint.x * multiplier / target.scaleX) - strokePadding;
    const newHeight = Math.abs(localPoint.y * multiplier / target.scaleY) - strokePadding;

    target.set('width', Math.max(newWidth, 0));
    target.set('height', Math.max(newHeight, 0));

    return oldWidth !== newWidth;
}

export class TestText extends fabric.Textbox {
    static type = 'preventDistortionTextbox';
    public preventDistortion: boolean = true;
    public lockFontScaling: boolean = true;
    public originalWidth: number = 0;
    public originalHeight: number = 0;

    private _lastFontSize: number = 0;  // 添加属性记录上一次的字体大小
    private _originalFontSize: number = 0;  // 添加属性记录初始字体大小

    constructor(text: string, options?: any) {
        const defaults = {
            textAlign: 'left',
            width: 500,
            height: 200,
            originY: 'top',
            splitByGrapheme: true,
            lockUniScaling: true,
            lockScalingFlip: true,
            minHeight: 100,
            fixedHeight: true,
        };

        super(text, { ...defaults, ...options });
        this.originalWidth = this.width;
        this.originalHeight = this.height;

        this._originalFontSize = this.fontSize || 16;  // 保存初始字体大小
        this._lastFontSize = this._originalFontSize;
        this.on('scaling', this.handleScaling.bind(this));
        this.on('modified', this.adjustTextSize.bind(this));  // 添加修改事件监听
    }

    static initialize(): void {
        const tempInstance = new TestText('');
        const changeWidthEvent = controlsUtils.wrapWithFireEvent('resizing',
            controlsUtils.wrapWithFixedAnchor(changeWidthHeight));

        // 直接设置到实例的控件上
        tempInstance.controls.br = new Control({
            x: 0.5,
            y: 0.5,
            cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
            actionHandler: changeWidthEvent,
        });

        // 将控件设置复制到原型上
        TestText.prototype.controls = tempInstance.controls;

        const originalCalcTextHeight = Textbox.prototype.calcTextHeight;
        Textbox.prototype.calcTextHeight = function (this: Textbox): number {
            const parentHeight = originalCalcTextHeight.call(this);
            return Math.max(this.height || 0, parentHeight);
        };
    }

    _renderText(ctx: CanvasRenderingContext2D) {
        if (this.isEmptyStyles(0)) {  // 添加参数 0 表示检查第一行
            ctx.save();
            this._renderTextFill(ctx);
            this._renderTextStroke(ctx);
            ctx.restore();
            return;
        }

        const transform = ctx.getTransform();

        if (this.scaleX !== 1 || this.scaleY !== 1) {
            ctx.scale(1 / this.scaleX, 1 / this.scaleY);
        }

        this._renderTextLinesBackground(ctx);
        this._renderTextDecoration(ctx, 'underline');
        this._renderTextFill(ctx);
        this._renderTextStroke(ctx);
        this._renderTextDecoration(ctx, 'overline');
        this._renderTextDecoration(ctx, 'linethrough');

        ctx.setTransform(transform);
    }

    private handleScaling(): void {
        if (!this.preventDistortion || !this.canvas) return;

        let shouldUpdate = false;
        const props: Partial<fabric.Textbox> = {};

        if (this.scaleX !== 1) {
            props.scaleX = 1;
            props.width = this.width * this.scaleX;
            shouldUpdate = true;
        }

        if (this.scaleY !== 1) {
            props.scaleY = 1;
            props.height = this.height * this.scaleY;
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            this.canvas.fire('object:modified');
            this.set(props);
            this.setCoords();
            this.adjustTextSize();  // 在缩放后调整文字大小
            this.canvas.requestRenderAll();
        }
    }



    // 添加新方法：调整文字大小
    private adjustTextSize(): void {
        if (!this.canvas) return;

        const maxWidth = this.width;
        const maxHeight = this.height;
        const currentWidth = this.calcTextWidth();
        const currentHeight = this.calcTextHeight();

        // 计算宽度和高度的缩放比例
        const widthRatio = maxWidth / currentWidth;
        const heightRatio = maxHeight / currentHeight;

        // 使用较小的比例，确保文字既不超出宽度也不超出高度
        const ratio = Math.min(widthRatio, heightRatio);

        if (ratio < 1) {
            // 需要缩小文字
            const newFontSize = Math.max(Math.floor(this.fontSize * ratio), 8);
            this.set('fontSize', newFontSize);
            this._lastFontSize = newFontSize;
            this.canvas.requestRenderAll();
        } else if (ratio > 1 && this.fontSize < this._originalFontSize) {
            // 可以放大文字，但不超过原始大小
            const newFontSize = Math.min(
                Math.floor(this.fontSize * ratio),
                this._originalFontSize
            );

            this.set('fontSize', newFontSize);
            this._lastFontSize = newFontSize;
            this.canvas.requestRenderAll();
        }
    }


}

TestText.initialize();