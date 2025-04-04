import * as fabric from "fabric";
import { COLORS, SIZES } from "../../../constants/theme";
import { EventBus, EventTypes } from "../../../utils/EventBus";
import { getCanvasManager } from "../../../utils/CanvasUtils";

export class TextControl extends fabric.IText {
  static type = "TextControl";
  private _showBorder: boolean = false;
  private _hoverBorderColor: string = COLORS.BORDER.HOVER;
  private lineWidth: number = 1;

  // 添加缩放相关属性
  public preventDistortion: boolean = true;
  private _originalWidth: number = 0;
  private _originalHeight: number = 0;
  private _skipDimension: boolean = false;
  // 最小字体大小
  private _minFontSize: number = 1;
  private _originalFontSize: number = this.fontSize;
  //拖动状态标记
  private _isMoving: boolean = false;

  // 列表样式属性
  public listStyle: 'none' | 'ordered' | 'unordered' = 'none';
  private _listItemPrefix: string = '';

  constructor(text: string, options: any) {
    const defaultOptions = {
      fill: "#333333",
      cornerSize: SIZES.CORNER_SIZE,
      cornerColor: COLORS.PRIMARY,
      cornerStyle: "circle",
      transparentCorners: false,
      lockRotation: true,
      hasRotatingPoint: false,
      splitByGrapheme: true,
      editable: true,
      padding: 8, // 添加内边距，使边框与文本有一定距离
      textAlign: 'left', // 固定左对齐
      lockScalingFlip: true,   // 防止翻转
      // backgroundColor: 'red',  // 文本框背景色
      // minHeight: 100,          // 最小高度
      // fixedHeight: true,       // 固定高度
      // maxWidth: 200,          // 最大宽度
      ...options,
    };

    super(text, defaultOptions);

    // 如果选项中包含列表样式，则应用它
    if (options && options.listStyle) {
      this.listStyle = options.listStyle;
      this._applyListStyle();
    }

    this._hoverBorderColor = options.hoverBorderColor || COLORS.BORDER.HOVER;
    this.lineWidth = options.lineWidth || 1;

    // 设置对象类型
    Object.defineProperty(this, "type", {
      value: TextControl.type,
      configurable: false,
      writable: false,
    });

    // 隐藏旋转控制点
    this.setControlsVisibility({
      mtr: false,
    });
    // 初始化鼠标事件
    // this.initHoverEvents();

    // 保存初始尺寸
    this._originalWidth = this.width;
    this._originalHeight = this.height;
    this._originalFontSize = this.fontSize || 40;
    this._minFontSize = this._minFontSize;
    this.on('scaling', this.handleScaling.bind(this));
    this.on('editing:entered', this.handleEditingEntered.bind(this));
    this.on('editing:exited', this.handleEditingExited.bind(this));
    this.on('moving', this.handleMoving.bind(this));
    this.on('mouseup', this.handleMoveEnd.bind(this));
    this.on('deselected', this.handleMoveEnd.bind(this));
    this.on('removed', this.handleRemoved.bind(this));
  }


  // 处理进入编辑状态
  private handleEditingEntered(): void {
    document.addEventListener('keydown', this.handleEditingKeyDown);
  }

  // 处理退出编辑状态
  private handleEditingExited(): void {
    document.removeEventListener('keydown', this.handleEditingKeyDown);
  }

  // 处理编辑状态下的键盘事件
  private handleEditingKeyDown = (e: KeyboardEvent): void => {
    // 只处理编辑状态下的事件
    if (!this.isEditing) return;
    // 处理复制事件 (Ctrl+C)
    if (e.ctrlKey && e.code === 'KeyC') {
      this.handleCopy(e);
    }
    // 处理粘贴事件 (Ctrl+V)
    if (e.ctrlKey && e.code === 'KeyV') {
      this.handlePaste(e);
    }
    // 处理回车键
    if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.key === 'Enter' || e.keyCode === 13) {
      this.handleEnterKey(e);
    }
  }



  // 应用列表样式
  private _applyListStyle(): void {
    if (this.listStyle === 'none') {
      // 移除列表前缀
      this._removeListPrefix();
    } else {
      // 添加列表前缀
      this._addListPrefix();
    }
  }

  // 添加列表前缀
  private _addListPrefix(keepCursor = false): void {
    const cursorPos = this.selectionStart;
    const lines = this.text.split('\n');
    let newCursorOffset = 0;

    const prefixedLines = lines.map((line, index) => {
      // 移除旧前缀
      const cleanedLine = line.replace(/^(\d+\.\s|\•\s)/, '');
      // 添加新前缀
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

    // 保持光标位置
    if (keepCursor) {
      this.selectionStart = cursorPos + newCursorOffset;
      this.selectionEnd = cursorPos + newCursorOffset;
    }

    this.updateTextDimensions();
  }

  // 移除列表前缀
  private _removeListPrefix(): void {
    // 分割文本行
    const lines = this.text.split('\n');
    // 移除每行的前缀
    const cleanLines = lines.map(line => {
      return line.replace(/^(\d+\.\s|\•\s)/, '');
    });
    // 更新文本
    this.text = cleanLines.join('\n');
  }


  // 重写渲染方法，添加自定义边框
  _render(ctx: CanvasRenderingContext2D) {
    // 如果有背景色，先绘制背景（包括内边距区域）
    if (this.backgroundColor) {
      ctx.save();
      ctx.fillStyle = this.backgroundColor;
      const width = this.width + this.padding * 2;
      const height = this.height + this.padding * 2;
      ctx.fillRect(-width / 2, -height / 2, width, height);
      ctx.restore();
    }
    // 调用父类的渲染方法渲染文本
    super._render(ctx);

    if (this.selected) return
    // 如果需要显示边框，绘制自定义边框
    ctx.save();
    if (this._showBorder) {
      // 设置边框样式
      ctx.strokeStyle = this._hoverBorderColor;
    } else {
      ctx.strokeStyle = COLORS.BORDER.DEFAULT;
    }

    ctx.lineWidth = this.lineWidth;
    ctx.setLineDash([]);
    // 计算边框位置（考虑padding）
    const width = this.width + this.padding * 2;
    const height = this.height + this.padding * 2;

    // 绘制边框（从中心点偏移）
    ctx.strokeRect(-width / 2, -height / 2, width, height);
    ctx.restore();
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
      // 保存原始宽度，避免闪烁
      const originalWidth = this.width;
      const fontWidth = this.calcTextWidth();
      // 只有当计算的宽度大于当前宽度时才更新宽度
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
    // 确保文本渲染
    this.dirty = true;
    if (this.canvas) {
      this.canvas.requestRenderAll();
    }
  }

  /**
   * 处理粘贴事件
   * @param e 
   */
  private handlePaste(e: KeyboardEvent): void {
    e.preventDefault();
    // 从剪贴板获取文本
    navigator.clipboard.readText()
      .then(text => {
        if (!text) {
          console.error('剪贴板中没有文本内容');
          return;
        }
        // 插入文本并更新光标位置
        this.insertTextAtCursor(text);
        // 清除所有样式
        this.styles = {};
        this.updateTextDimensions();
      })
      .catch(err => {
        console.error('读取剪贴板失败:', err);
      });
  }

  // 处理复制事件
  private handleCopy(e: KeyboardEvent): void {
    // 获取选中的文本
    const selectedText = this.getSelectedText();
    if (selectedText) {
      navigator.clipboard.writeText(selectedText)
        .then(() => {
          console.log('文本已成功复制到剪贴板:', selectedText);
        })
        .catch(err => {
          console.error('复制到剪贴板失败:', err);
        });
    }
  }

  // 处理回车键
  private handleEnterKey(e: KeyboardEvent): void {
    e.preventDefault();
    // 获取当前光标位置
    const cursorPosition = this.selectionStart || 0;

    // 获取当前行号
    const lines = this.text.split('\n');
    let currentLineIndex = 0;
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      charCount += lines[i].length + 1; // +1 for the newline character
      if (charCount > cursorPosition) {
        currentLineIndex = i;
        break;
      }
    }

    // 插入换行符
    this.insertTextAtCursor('\n');

    // 如果是列表项，自动添加前缀
    if (this.listStyle !== 'none') {
      const prefix = this.listStyle === 'ordered' ? `${currentLineIndex + 2}. ` : '• ';
      this.insertTextAtCursor(prefix);
    }

    // 更新文本尺寸
    this.updateTextDimensions();
  }


  private insertTextAtCursor(text: string): void {
    // 获取当前选中的文本范围
    const selectionStart = this.selectionStart || 0;
    const selectionEnd = this.selectionEnd || 0;
    // 插入文本
    const newText = this.text.slice(0, selectionStart) + text + this.text.slice(selectionEnd);
    this.text = newText;

    // 更新光标位置
    this.selectionStart = selectionStart + text.length;
    this.selectionEnd = selectionStart + text.length;


    // 确保hiddenTextarea同步更新
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



  // 更新文本框尺寸和渲染
  private updateTextDimensions(): void {
    // 重新计算尺寸
    this._skipDimension = false;
    this.initDimensions();
    this.setCoords();

    // 确保文本渲染
    this.dirty = true;
    this.canvas?.requestRenderAll();
  }


  // 显示或隐藏边框
  showBorder(show: boolean) {
    if (this._showBorder === show) return;
    this._showBorder = show;
    // 强制重绘
    this.dirty = true;
    this.canvas?.requestRenderAll();
  }


  // 增加字体大小
  increaseFontSize(increment: number = 0.5): void {
    const newSize = Math.min((this.fontSize || 16) + increment, 720);
    this.setFontSize(newSize, true);
  }

  // 减小字体大小
  decreaseFontSize(decrement: number = 0.5): void {
    const newSize = Math.max((this.fontSize || 16) - decrement, this._minFontSize);
    this.setFontSize(newSize, true);
  }

  // 设置字体大小
  setFontSize(size: number, isSyncOriginalFontSize: boolean = false): void {
    const newSize = Math.max(Math.min(size, 720), this._minFontSize);

    // 先保存当前宽高
    const oldWidth = this.width;
    const oldHeight = this.height;

    // 设置新的字体大小
    this.set('fontSize', newSize);

    if (isSyncOriginalFontSize) {
      // 更新原始字体大小
      this._originalFontSize = newSize;
    }

    // 强制跳过维度计算的标志设为false，确保重新计算
    this._skipDimension = false;

    // 重新计算文本宽度和高度
    const newWidth = this.calcTextWidth();
    const newHeight = this.calcTextHeight();

    if (newWidth > oldWidth || newSize > this.fontSize) {
      this.set('width', newWidth);
    }

    // 更新高度
    this.set('height', newHeight);

    // 重新计算尺寸和边框
    this.initDimensions();
    this.setCoords();

    // 确保文本渲染
    this.dirty = true;
    this.canvas?.requestRenderAll();
  }


  // 设置悬停时的边框颜色
  setHoverBorderColor(color: string) {
    this._hoverBorderColor = color;
    if (this._showBorder) {
      this.showBorder(true);
    }
  }



  // 调整文字大小以适应容器
  private adjustTextSize(props?: Partial<fabric.Textbox>, oldWidth?: number, oldHeight?: number): void {
    if (!this.canvas) return;

    // 计算文本与容器的比例
    const textWidth = this.calcTextWidth();
    const textHeight = this.calcTextHeight();
    const containerWidth = this.width;
    const containerHeight = this.height;

    if (textWidth > containerWidth || textHeight > containerHeight) {

    }

    const containerWidthRatio = containerWidth / textWidth;
    const containerHeightRatio = containerHeight / textHeight;
    // console.log('容器宽度比例:', containerWidthRatio, '容器高度比例:', containerHeightRatio);

    // 如果文本超出容器，需要缩小
    if (containerWidthRatio < 1 || containerHeightRatio < 1) {
      const ratio = Math.min(containerWidthRatio, containerHeightRatio);
      const newFontSize = Math.max(Number((this.fontSize * ratio).toFixed(3)), this._minFontSize);
      // console.log('文本超出容器，缩小字体到:', newFontSize);
      this.set('fontSize', newFontSize);
      // this.syncTextStyles();
    } else if (props && oldWidth && oldHeight) {
      // 直接使用缩放因子来调整字体大小
      const scaleX = props.width ? props.width / oldWidth : 1;
      const scaleY = props.height ? props.height / oldHeight : 1;
      const scaleFactor = Math.max(scaleX, scaleY);

      // console.log('缩放因子:', scaleFactor, '当前字号:', this.fontSize);

      if (scaleFactor > 1) {
        // 放大文字
        const newFontSize = Math.min(Number((this.fontSize * scaleFactor).toFixed(3)), this._originalFontSize);
        // console.log('放大字体到:', newFontSize);
        this.set('fontSize', newFontSize);
        // this.syncTextStyles();
      } else if (scaleFactor < 1 && (containerWidthRatio < 1 || containerHeightRatio < 1)) {
        // 缩小文字
        const newFontSize = Math.max(Number((this.fontSize * scaleFactor).toFixed(3)), this._minFontSize);
        // console.log('缩小字体到:', newFontSize);
        this.set('fontSize', newFontSize);
        // this.syncTextStyles();
      }
    }
  }

  // 处理缩放事件
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
      // 确保高度不小于最小字体高度
      const minFontHeight = this.calcTextHeight() * (this._minFontSize / this.fontSize);
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

  // 处理移动开始事件
  private handleMoving(): void {
    this._isMoving = true;
    EventBus.emit(EventTypes.CONTROL_PANEL.HIDE_TEXT_SETTING_TOOLBAR);
  }

  // 处理移动结束事件
  private handleMoveEnd(): void {
    this._isMoving = false;
    EventBus.emit(EventTypes.CONTROL_PANEL.SHOW_TEXT_SETTING_TOOLBAR, {
      target: this,
      canvas: this.canvas,
      canvasManager: getCanvasManager()
    });
  }

  //获取当前是否正在移动
  public isObjMoving(): boolean {
    return this._isMoving;
  }

  public handleRemoved() {
    EventBus.emit(EventTypes.CONTROL_PANEL.HIDE_TEXT_SETTING_TOOLBAR);
  }


  setText(text: string): this {
    this.set('text', text);
    // 如果有列表样式，应用列表样式
    if (this.listStyle !== 'none') {
      this._applyListStyle();
    }
    this.updateTextDimensions();
    return this;
  }

  // 设置列表样式
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
      _isMoving: this._isMoving,
    };
  }

  toObject(propertiesToInclude: any[] = []): any {
    return super.toObject([...propertiesToInclude, '_showBorder', '_hoverBorderColor', 'lineWidth', 'preventDistortion',
      '_originalWidth', '_originalHeight', '_skipDimension', '_minFontSize', '_originalFontSize', '_isMoving']);
  }


  // 用于从JSON创建对象
  fromObject(object: any, callback: Function): void {
    const textObj = new TextControl(object.text, object);
    Object.setPrototypeOf(textObj, TextControl.prototype);
    callback && callback(textObj);
  }

}

fabric.classRegistry.setClass(TextControl, TextControl.type);
fabric.classRegistry.setSVGClass(TextControl, TextControl.type);
