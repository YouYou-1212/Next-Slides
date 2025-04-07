import * as fabric from "fabric";
import { COLORS, SIZES } from "../../../constants/theme";
import { EventBus, EventTypes } from "../../../utils/EventBus";
import { getCanvasManager } from "../../../utils/CanvasUtils";
import { ControlProxy } from "../ControlProxy";

export class TextControl extends fabric.IText {
  static type = "TextControl";
  private _showBorder: boolean = false;
  private _hoverBorderColor: string = COLORS.BORDER.HOVER;
  private lineWidth: number = 1;

  
  public preventDistortion: boolean = true;
  private _originalWidth: number = 0;
  private _originalHeight: number = 0;
  private _skipDimension: boolean = false;
  
  private _minFontSize: number = 1;
  private _originalFontSize: number = this.fontSize;

  private controlProxy: ControlProxy;

  
  public listStyle: 'none' | 'ordered' | 'unordered' = 'none';
  private _listItemPrefix: string = '';

  constructor(text: string, options: any) {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

    super(text, options);
    this.controlProxy = new ControlProxy(this);

    Object.assign(this, {
      padding: 8,
      splitByGrapheme: true,
    });

    
    if (options && options.listStyle) {
      this.listStyle = options.listStyle;
      this._applyListStyle();
    }

    this._hoverBorderColor = options.hoverBorderColor || COLORS.BORDER.HOVER;
    this.lineWidth = options.lineWidth || 1;

    
    Object.defineProperty(this, "type", {
      value: TextControl.type,
      configurable: false,
      writable: false,
    });

    
    this.setControlsVisibility({
      mtr: false,
    });

    
    this._originalWidth = this.width;
    this._originalHeight = this.height;
    this._originalFontSize = this.fontSize || 40;
    this._minFontSize = this._minFontSize;
    this.on('scaling', this.handleScaling.bind(this));
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
      this.handleCopy(e);
    }
    
    if (e.ctrlKey && e.code === 'KeyV') {
      this.handlePaste(e);
    }
    
    if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.key === 'Enter' || e.keyCode === 13) {
      this.handleEnterKey(e);
    }
  }



  
  private _applyListStyle(): void {
    if (this.listStyle === 'none') {
      
      this._removeListPrefix();
    } else {
      
      this._addListPrefix();
    }
  }

  
  private _addListPrefix(keepCursor = false): void {
    const cursorPos = this.selectionStart;
    const lines = this.text.split('\n');
    let newCursorOffset = 0;

    const prefixedLines = lines.map((line, index) => {
      
      const cleanedLine = line.replace(/^(\d+\.\s|\•\s)/, '');
      
      if (this.listStyle === 'ordered') {
        newCursorOffset += `${index + 1}. `.length;
        return `${index + 1}. ${cleanedLine}`;
      } else if (this.listStyle === 'unordered') {
        newCursorOffset += 2;
        return `• ${cleanedLine}`;
      }
      return cleanedLine;
    });

    this.text = prefixedLines.join('\n');

    
    if (keepCursor) {
      this.selectionStart = cursorPos + newCursorOffset;
      this.selectionEnd = cursorPos + newCursorOffset;
    }

    this.updateTextDimensions();
  }

  
  private _removeListPrefix(): void {
    
    const lines = this.text.split('\n');
    
    const cleanLines = lines.map(line => {
      return line.replace(/^(\d+\.\s|\•\s)/, '');
    });
    
    this.text = cleanLines.join('\n');
  }

  applyTextStyle(style: any): void {
    const oldWidth = this.width;
    const oldHeight = this.height;
    if (typeof style === 'object') {
      for (const prop in style) {
        if (prop === "fontSize") {
          this.setFontSize(style[prop], true);
        }
        this._set(prop, style[prop]);
      }
    }
    this._skipDimension = false;

    
    const newWidth = this.calcTextWidth();
    const newHeight = this.calcTextHeight();
    if (newWidth > oldWidth) {
      this.set('width', newWidth);
    }
    
    this.set('height', newHeight);
    
    this.initDimensions();
    this.setCoords();

    
    this.dirty = true;
    this.canvas?.requestRenderAll();
  }


  
  _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
  }


  _renderBackground(ctx: CanvasRenderingContext2D): void {
    if (!this.backgroundColor) {
      return;
    }
    const dim = this._getNonTransformedDimensions();
    ctx.fillStyle = this.backgroundColor;

    ctx.fillRect(
      -dim.x / 2 - this.padding,
      -dim.y / 2 - this.padding,
      dim.x + this.padding * 2,
      dim.y + this.padding * 2
    );
    this._removeShadow(ctx);
  }


  _renderText(ctx: CanvasRenderingContext2D): void {
    super._renderText(ctx)
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
      this.height = this.height || this.calcTextHeight();
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

  
  private handlePaste(e: KeyboardEvent): void {
    e.preventDefault();
    
    navigator.clipboard.readText()
      .then(text => {
        if (!text) {
          console.error('剪贴板中没有文本内容');
          return;
        }
        
        this.insertTextAtCursor(text);
        
        this.styles = {};
        this.updateTextDimensions();
      })
      .catch(err => {
        console.error('读取剪贴板失败:', err);
      });
  }

  
  private handleCopy(e: KeyboardEvent): void {
    
    const selectedText = this.getSelectedText();
    if (selectedText) {
      navigator.clipboard.writeText(selectedText)
        .then(() => {
          
        })
        .catch(err => {
          console.error('复制到剪贴板失败:', err);
        });
    }
  }

  
  private handleEnterKey(e: KeyboardEvent): void {
    e.preventDefault();
    
    const cursorPosition = this.selectionStart || 0;

    
    const lines = this.text.split('\n');
    let currentLineIndex = 0;
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      charCount += lines[i].length + 1; 
      if (charCount > cursorPosition) {
        currentLineIndex = i;
        break;
      }
    }

    
    this.insertTextAtCursor('\n');

    
    if (this.listStyle !== 'none') {
      const prefix = this.listStyle === 'ordered' ? `${currentLineIndex + 2}. ` : '• ';
      this.insertTextAtCursor(prefix);
    }

    
    this.updateTextDimensions();
  }


  private insertTextAtCursor(text: string): void {
    
    const selectionStart = this.selectionStart || 0;
    const selectionEnd = this.selectionEnd || 0;
    
    const newText = this.text.slice(0, selectionStart) + text + this.text.slice(selectionEnd);
    this.text = newText;

    
    this.selectionStart = selectionStart + text.length;
    this.selectionEnd = selectionStart + text.length;


    
    if (this.hiddenTextarea) {
      this.hiddenTextarea.value = this.text;
      this.hiddenTextarea.selectionStart = this.selectionStart;
      this.hiddenTextarea.selectionEnd = this.selectionEnd;
    }

    this.updateTextDimensions();
  }

  updateFromTextArea(): void {
    super.updateFromTextArea();
  }



  
  private updateTextDimensions(): void {
    
    this._skipDimension = false;
    this.initDimensions();
    this.setCoords();

    
    this.dirty = true;
    this.canvas?.requestRenderAll();
  }


  
  showBorder(show: boolean) {
    if (this._showBorder === show) return;
    this._showBorder = show;
    
    this.dirty = true;
    this.canvas?.requestRenderAll();
  }


  
  increaseFontSize(increment: number = 0.5): void {
    const newSize = Math.min((this.fontSize || 16) + increment, 720);
    this.setFontSize(newSize, true);
  }

  
  decreaseFontSize(decrement: number = 0.5): void {
    const newSize = Math.max((this.fontSize || 16) - decrement, this._minFontSize);
    this.setFontSize(newSize, true);
  }

  
  setFontSize(size: number, isSyncOriginalFontSize: boolean = false): void {
    const newSize = Math.max(Math.min(size, 720), this._minFontSize);

    
    const oldWidth = this.width;
    const oldHeight = this.height;

    
    this.set('fontSize', newSize);

    if (isSyncOriginalFontSize) {
      
      this._originalFontSize = newSize;
    }

    
    this._skipDimension = false;

    
    const newWidth = this.calcTextWidth();
    const newHeight = this.calcTextHeight();

    if (newWidth > oldWidth || newSize > this.fontSize) {
      this.set('width', newWidth);
    }

    
    this.set('height', newHeight);

    
    this.initDimensions();
    this.setCoords();

    
    this.dirty = true;
    this.canvas?.requestRenderAll();
  }


  
  setHoverBorderColor(color: string) {
    this._hoverBorderColor = color;
    if (this._showBorder) {
      this.showBorder(true);
    }
  }



  
  private adjustTextSize(props?: Partial<fabric.Textbox>, oldWidth?: number, oldHeight?: number): void {
    if (!this.canvas) return;

    
    const textWidth = this.calcTextWidth();
    const textHeight = this.calcTextHeight();
    const containerWidth = this.width;
    const containerHeight = this.height;

    if (textWidth > containerWidth || textHeight > containerHeight) {

    }

    const containerWidthRatio = containerWidth / textWidth;
    const containerHeightRatio = containerHeight / textHeight;
    

    
    if (containerWidthRatio < 1 || containerHeightRatio < 1) {
      const ratio = Math.min(containerWidthRatio, containerHeightRatio);
      const newFontSize = Math.max(Number((this.fontSize * ratio).toFixed(3)), this._minFontSize);
      
      this.set('fontSize', newFontSize);
      
    } else if (props && oldWidth && oldHeight) {
      
      const scaleX = props.width ? props.width / oldWidth : 1;
      const scaleY = props.height ? props.height / oldHeight : 1;
      const scaleFactor = Math.max(scaleX, scaleY);

      

      if (scaleFactor > 1) {
        
        const newFontSize = Math.min(Number((this.fontSize * scaleFactor).toFixed(3)), this._originalFontSize);
        
        this.set('fontSize', newFontSize);
        
      } else if (scaleFactor < 1 && (containerWidthRatio < 1 || containerHeightRatio < 1)) {
        
        const newFontSize = Math.max(Number((this.fontSize * scaleFactor).toFixed(3)), this._minFontSize);
        
        this.set('fontSize', newFontSize);
        
      }
    }
  }

  
  private handleScaling(): void {
    if (!this.preventDistortion || !this.canvas) return;

    let shouldUpdate = false;
    const props: Partial<fabric.Textbox> = {};
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


  setText(text: string): this {
    this.set('text', text);
    
    if (this.listStyle !== 'none') {
      this._applyListStyle();
    }
    this.updateTextDimensions();
    return this;
  }

  
  setListStyle(style: 'none' | 'ordered' | 'unordered'): void {
    if (this.listStyle !== style) {
      this.listStyle = style;
      this._applyListStyle();
    }
  }


  toJSON() {
    return {
      ...super.toJSON(),
      type: TextControl.type,
      _showBorder: this._showBorder,
      _hoverBorderColor: this._hoverBorderColor,
      lineWidth: this.lineWidth,
      preventDistortion: this.preventDistortion,
      _originalWidth: this._originalWidth,
      _originalHeight: this._originalHeight,
      _skipDimension: this._skipDimension,
      _minFontSize: this._minFontSize,
      _originalFontSize: this._originalFontSize,
      
    };
  }

  toObject(propertiesToInclude: any[] = []): any {
    return super.toObject([...propertiesToInclude, '_showBorder', '_hoverBorderColor', 'lineWidth', 'preventDistortion',
      '_originalWidth', '_originalHeight', '_skipDimension', '_minFontSize', '_originalFontSize']);
  }


  
  fromObject(object: any, callback: Function): void {
    const textObj = new TextControl(object.text, object);
    Object.setPrototypeOf(textObj, TextControl.prototype);
    callback && callback(textObj);
  }

}

fabric.classRegistry.setClass(TextControl, TextControl.type);
fabric.classRegistry.setSVGClass(TextControl, TextControl.type);
