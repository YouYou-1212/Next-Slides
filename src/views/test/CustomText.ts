import { IText, Textbox, type CursorBoundaries } from 'fabric';
import * as fabric from "fabric";


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
    

    private _originalWidth: number = 0;
    private _originalHeight: number = 0;
    private _skipDimension: boolean = false;
    private _minFontSize: number = 11;  
    private _originalFontSize: number = 40;
    private _isMoving: boolean = false; 

    constructor(text: string, options?: any) {
        const defaults = {
            ...options,
            backgroundColor: 'red',  
            textBackgroundColor: 'blue',  
            padding: 10,  
            textAlign: 'justify', 
            width: 200, 
            height: 300, 
            originY: 'top',  
            splitByGrapheme: true, 
            
            lockScalingFlip: true,   
            minHeight: 100,          
            fixedHeight: true,       
            maxWidth: 800,          
            fontSize: 40,       
        };

        super(text, { ...defaults });

        
        this.set('listStyle' ,  'none')

        
        this._originalWidth = this.width;
        this._originalHeight = this.height;
        this._originalFontSize = this.fontSize || 40;
        this._minFontSize = defaults._minFontSize || 11;
        this.on('scaling', this.handleScaling.bind(this));
        
        this.on('moving', this.handleMoving.bind(this));
        
        this.on('mouseup', this.handleMoveEnd.bind(this));
        
        this.on('deselected', this.handleMoveEnd.bind(this));
        this.on('editing:entered', this.handleEditingEntered.bind(this));
        this.on('editing:exited', this.handleEditingExited.bind(this));
        
    }



    
    private handleEditingEntered(): void {
        document.addEventListener('keydown', this.handleEditingKeyDown);
    }

    
    private handleEditingExited(): void {
        document.removeEventListener('keydown', this.handleEditingKeyDown);
    }


    
    private handleEditingKeyDown = (e: KeyboardEvent): void => {
        
        if (!this.isEditing) return;
        
        if (e.ctrlKey && e.code === 'KeyC') {
            
        }
        
        if (e.ctrlKey && e.code === 'KeyV') {
            
        }
        
        if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.key === 'Enter' || e.keyCode === 13) {
            this.handleEnterKey(e);
        }
    }



    
    private handleEnterKey(e: KeyboardEvent): void {
        
        
        
        this.updateTextDimensions();
        
    }


    private insertTextAtCursor(text: string): void {
        
        const selectionStart = this.selectionStart || 0;
        const selectionEnd = this.selectionEnd || 0;
        
        const newText = this.text.slice(0, selectionStart) + text + this.text.slice(selectionEnd);
        this.text = newText;

        
        this.selectionStart = selectionStart + text.length;
        this.selectionEnd = selectionStart + text.length;
    }

    
    private updateTextDimensions(): void {
        
        this._skipDimension = false;
        this.initDimensions();
        this.setCoords();

        
        this.dirty = true;
        this.canvas?.requestRenderAll();
        
    }


    
    private handleMoving(): void {
        this._isMoving = true;
        
    }

    
    private handleMoveEnd(): void {
        this._isMoving = false;
        
    }

    
    public isObjMoving(): boolean {
        return this._isMoving;
    }

    initDimensions(): void {
        
        if (this.isEditing) {
            this.initDelayedCursor();
        }
        this.clearContextTop();
        if (this._skipDimension) {
            return;
        }
        this._splitText();
        this._clearCache();
        
        if (this.path) {
            this.width = this.path.width;
            this.height = this.path.height;
        } else {
            
            const originalWidth = this.width;
            const fontWidth = this.calcTextWidth();
            
            
            
            if (fontWidth > originalWidth) {
                this.width = fontWidth;
            } else {
                this.width = originalWidth;
            }
            
            const calculatedHeight = this.calcTextHeight();
            
            
            if (this.isEditing && calculatedHeight > this.height) {
                this.height = calculatedHeight;
            }
        }
        if (this.textAlign && this.textAlign.indexOf('justify') !== -1) {
            this.enlargeSpaces();
        }
        
        
        this.dirty = true;
        if (this.canvas) {
            this.canvas.requestRenderAll();
        }
    }


    
    private adjustTextSize(props?: Partial<fabric.IText>, oldWidth?: number, oldHeight?: number): void {
        if (!this.canvas) return;

        
        const textWidth = this.calcTextWidth();
        const textHeight = this.calcTextHeight();
        const containerWidth = this.width;
        const containerHeight = this.height;


        

        const containerWidthRatio = containerWidth / textWidth;
        const containerHeightRatio = containerHeight / textHeight;
        

        
        if (containerWidthRatio < 1 || containerHeightRatio < 1) {
            const ratio = Math.min(containerWidthRatio, containerHeightRatio);
            const newFontSize = Math.max(Number((this.fontSize * ratio).toFixed(3)), this._minFontSize);
            
            this.set('fontSize', newFontSize);
            
            this.syncTextStyles();
        } else if (props && oldWidth && oldHeight) {
            
            const scaleX = props.width ? props.width / oldWidth : 1;
            const scaleY = props.height ? props.height / oldHeight : 1;
            const scaleFactor = Math.max(scaleX, scaleY);

            

            if (scaleFactor > 1 && (containerWidthRatio > 1 && containerHeightRatio > 1)) {
                
                const newFontSize = Math.min(Number((this.fontSize * scaleFactor).toFixed(3)), this._originalFontSize);
                
                this.set('fontSize', newFontSize);
                
                this.syncTextStyles();
            } else if (scaleFactor < 1 && (containerWidthRatio < 1 || containerHeightRatio < 1)) {
                
                const newFontSize = Math.max(Number((this.fontSize * scaleFactor).toFixed(3)), this._minFontSize);
                
                this.set('fontSize', newFontSize);
                
                this.syncTextStyles();
            }
        }
    }


    
    private syncTextStyles(): void {
        
        if (!this.styles) return;
        const currentFontSize = this.fontSize || 40;
        
        for (const lineIndex in this.styles) {
            for (const charIndex in this.styles[lineIndex]) {
                
                if (this.styles[lineIndex][charIndex]) {
                    this.styles[lineIndex][charIndex].fontSize = currentFontSize;
                }
            }
        }
        
    }


    
    private handleScaling(): void {
        if (!this.preventDistortion || !this.canvas) return;

        let shouldUpdate = false;
        const props: Partial<fabric.IText> = {};
        const oldWidth = this.width;
        const oldHeight = this.height;

        
        
        if (this.scaleX !== 1) {
            props.scaleX = 1;
            props.width = this.width * this.scaleX;
            shouldUpdate = true;
        }
        if (this.scaleY !== 1) {
            props.scaleY = 1;
            const minFontHeight = this.calcTextHeight() * (this._minFontSize / this.fontSize);
            
            
            
            
            
            
            props.height = Math.max(this.height * this.scaleY, minFontHeight);
            shouldUpdate = true;
        }
        if (shouldUpdate) {
            
            this.set(props);
            this.setCoords();
            
            this.adjustTextSize(props, oldWidth, oldHeight);
        }
    }


}

