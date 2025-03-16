import { IText, Textbox, type CursorBoundaries } from 'fabric';
import * as fabric from "fabric";

// 定义类型扩展
declare module 'fabric' {
    namespace fabric {
        class PreventDistortionTextbox extends Textbox {
            preventDistortion: boolean;
        }
    }
}


export class CustomText extends fabric.IText {
    static type = 'preventDistortionTextbox';
    public preventDistortion: boolean = true;
    // public lockFontScaling: boolean = true;

    private _originalWidth: number = 0;
    private _originalHeight: number = 0;
    private _skipDimension: boolean = false;
    private _minFontSize: number = 11;  // 添加最小字体大小
    private _originalFontSize: number = 40;
    private _isMoving: boolean = false; // 添加拖动状态标记

    constructor(text: string, options?: any) {
        const defaults = {
            ...options,
            backgroundColor: 'red',  // 文本框背景色
            textBackgroundColor: 'blue',  // 文字背景色
            padding: 10,  // 文本内边距
            textAlign: 'left', // 固定左对齐
            width: 800, // 固定宽度
            height: 300, // 固定宽度
            originY: 'top',  // 固定原点在顶部
            splitByGrapheme: true, // 支持复杂字符
            // lockUniScaling: true,    // 锁定非等比缩放
            lockScalingFlip: true,   // 防止翻转
            minHeight: 100,          // 最小高度
            fixedHeight: true,       // 固定高度
            maxWidth: 800,          // 最大宽度
            fontSize: 40,       // 初始字体大小
        };

        super(text, { ...defaults });
        // 保存初始尺寸
        this._originalWidth = this.width;
        this._originalHeight = this.height;
        this._originalFontSize = this.fontSize || 40;
        this._minFontSize = defaults._minFontSize || 11;
        this.on('scaling', this.handleScaling.bind(this));
        // 添加移动事件监听
        this.on('moving', this.handleMoving.bind(this)); 
        // 使用 mouseup 事件代替不存在的 moved 事件
        this.on('mouseup', this.handleMoveEnd.bind(this));
        // 添加额外的事件以确保捕获所有可能的移动结束情况
        this.on('deselected', this.handleMoveEnd.bind(this));
    }


     // 处理移动开始事件
     private handleMoving(): void {
        this._isMoving = true;
        console.log('控件开始移动');
    }

    // 处理移动结束事件
    private handleMoveEnd(): void {
        this._isMoving = false;
        console.log('控件移动结束');
    }

    //获取当前是否正在移动
    public isObjMoving(): boolean {
        return this._isMoving;
    }

    initDimensions(): void {
        console.log('initDimensions');
        if (this.isEditing) {
            this.initDelayedCursor();
        }
        this.clearContextTop();
        if (this._skipDimension) {
            return;
        }
        this._splitText();
        this._clearCache();
        console.log('initDimensions this.path', this.path, new Date().getTime());
        if (this.path) {
            this.width = this.path.width;
            this.height = this.path.height;
        } else {
            // 保存原始宽度，避免闪烁
            const originalWidth = this.width;
            const fontWidth = this.calcTextWidth();
            console.log('initDimensions originalWidth', originalWidth, '  fontWidth', fontWidth, new Date().getTime());
            // 只有当计算的宽度大于当前宽度时才更新宽度
            // 这样可以避免在缩小时出现宽度闪烁
            if (fontWidth > originalWidth) {
                this.width = fontWidth;
            } else {
                this.width = originalWidth;
            }
            console.log("this.height", this.height, this.calcTextHeight());
            const calculatedHeight = this.calcTextHeight();
            // this.height = this.height || this.calcTextHeight();
            // 只在编辑模式或文本内容变化时调整高度
            if (this.isEditing && calculatedHeight > this.height) {
                this.height = calculatedHeight;
            }
        }
        if (this.textAlign && this.textAlign.indexOf('justify') !== -1) {
            this.enlargeSpaces();
        }
        console.log('--------------------------------------------------------------------');
        // 确保文本渲染
        this.dirty = true;
        if (this.canvas) {
            this.canvas.requestRenderAll();
        }
    }


    // 添加新方法：调整文字大小以适应容器
    private adjustTextSize(props?: Partial<fabric.IText>, oldWidth?: number, oldHeight?: number): void {
        if (!this.canvas) return;

        // 计算文本与容器的比例
        const textWidth = this.calcTextWidth();
        const textHeight = this.calcTextHeight();
        const containerWidth = this.width;
        const containerHeight = this.height;


        console.log('字体宽度:' + textWidth, '字体高度:' + textHeight, "容器宽度：" + containerWidth, "容器高度：" + containerHeight, new Date().getTime());

        const containerWidthRatio = containerWidth / textWidth;
        const containerHeightRatio = containerHeight / textHeight;
        console.log('容器宽度比例:', containerWidthRatio, '容器高度比例:', containerHeightRatio, new Date().getTime());

        // 如果文本超出容器，需要缩小
        if (containerWidthRatio < 1 || containerHeightRatio < 1) {
            const ratio = Math.min(containerWidthRatio, containerHeightRatio);
            const newFontSize = Math.max(Number((this.fontSize * ratio).toFixed(3)), this._minFontSize);
            console.log('文本超出容器，缩小字体到:', newFontSize);
            this.set('fontSize', newFontSize);       
            // 在设置新的字体大小后，确保同步所有文本片段的样式
            this.syncTextStyles();
        } else if (props && oldWidth && oldHeight) {
            // 直接使用缩放因子来调整字体大小
            const scaleX = props.width ? props.width / oldWidth : 1;
            const scaleY = props.height ? props.height / oldHeight : 1;
            const scaleFactor = Math.max(scaleX, scaleY);

            console.log('缩放因子:', scaleFactor, '当前字号:', this.fontSize);

            if (scaleFactor > 1 && (containerWidthRatio > 1 && containerHeightRatio > 1)) {
                // 放大文字
                const newFontSize = Math.min(Number((this.fontSize * scaleFactor).toFixed(3)), this._originalFontSize);
                console.log('放大字体到:', newFontSize);
                this.set('fontSize', newFontSize);       
                // 在设置新的字体大小后，确保同步所有文本片段的样式
                this.syncTextStyles();
            } else if (scaleFactor < 1 && (containerWidthRatio < 1 || containerHeightRatio < 1)) {
                // 缩小文字
                const newFontSize = Math.max(Number((this.fontSize * scaleFactor).toFixed(3)), this._minFontSize);
                console.log('缩小字体到:', newFontSize);
                this.set('fontSize', newFontSize);        
                // 在设置新的字体大小后，确保同步所有文本片段的样式
                this.syncTextStyles();
            }
        }
    }


    // 同步所有文本片段的样式
    private syncTextStyles(): void {
        // 检查是否有样式对象
        if (!this.styles) return;
        const currentFontSize = this.fontSize || 40;
        // 遍历所有行和字符的样式
        for (const lineIndex in this.styles) {
            for (const charIndex in this.styles[lineIndex]) {
                // 更新每个字符的字体大小
                if (this.styles[lineIndex][charIndex]) {
                    this.styles[lineIndex][charIndex].fontSize = currentFontSize;
                }
            }
        }
        console.log('已同步所有文本样式的字体大小:', currentFontSize);
    }


    // 处理缩放事件
    private handleScaling(): void {
        if (!this.preventDistortion || !this.canvas) return;

        let shouldUpdate = false;
        const props: Partial<fabric.IText> = {};
        const oldWidth = this.width;
        const oldHeight = this.height;

        console.log('缩放事件 当前文本组件宽高:', this.width, this.height);
        console.log('缩放事件 X:', this.scaleX, props.scaleX, '缩放事件 Y:', this.scaleY, props.scaleY);
        if (this.scaleX !== 1) {
            props.scaleX = 1;
            props.width = this.width * this.scaleX;
            shouldUpdate = true;
        }
        if (this.scaleY !== 1) {
            props.scaleY = 1;
            const minFontHeight = this.calcTextHeight() * (this._minFontSize / this.fontSize);
            // 确保高度不小于最小字体高度
            // if(this.scaleY < 1){
            //     if(this.fontSize <= this._minFontSize){
            //         props.height = minFontHeight;
            //     }
            // }
            props.height = Math.max(this.height * this.scaleY, minFontHeight);
            shouldUpdate = true;
        }
        if (shouldUpdate) {
            // 先更新尺寸
            this.set(props);
            this.setCoords();
            // 调用字体调整方法
            this.adjustTextSize(props, oldWidth, oldHeight);
        }
    }


}

