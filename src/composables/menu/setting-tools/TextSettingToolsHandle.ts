import { ref, type Ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { EventBus, EventTypes } from '../../../utils/EventBus';
import { getSystemFonts, defaultFonts } from '../../../utils/FontsUtils';
import * as fabric from 'fabric';
import { BaseSettingToolsHandle, useBaseSettingToolsHandle } from './BaseSettingToolsHandle';
import { TextControl } from '../../../composables/subassembly/controls/TextControl';
import { GroupControl } from '../../../composables/subassembly/controls/GroupControl';


export class TextSettingToolsHandle extends BaseSettingToolsHandle {
  
  private isBold = false;
  private isItalic = false;
  private isUnderline = false;
  private fontSize: number | string = 16;
  private textColor = '#000000';
  private textBgColor = 'transparent';
  private boxBgColor = 'transparent';
  private textAlign = 'left';
  private fontFamily = 'Arial';
  private textStyle = 'normal';
  private isUnorderedList = false;
  private isOrderedList = false;

  
  private fontFamilies = [...defaultFonts];

  
  private textStyles = [
    { label: '普通', value: 'normal' },
    { label: '标题1', value: 'heading1' },
    { label: '标题2', value: 'heading2' },
    { label: '标题3', value: 'heading3' },
    { label: '标题4', value: 'heading4' },
    { label: '引用', value: 'quote' },
    { label: '代码', value: 'code' },
  ];

  
  constructor(canvasManager: any) {
    super(canvasManager);
  }

  
  protected override init(): void {
    super.init();
  }

  public syncDataAndVisible(data: any, visible: boolean): void {
    super.syncDataAndVisible(data, visible);
    if (visible) {
      this.initFontList();
    }
  }

  
  private async initFontList(): Promise<void> {
    try {
      const fonts = await getSystemFonts();
      this.fontFamilies = fonts;
    } catch (err) {
      console.error('获取系统字体失败:', err);
    }
  }


  protected getToolbarSelector() {
    return '.setting-toolbar';
  }

  
  protected override updateStyleState(): void {
    if (!this.targetObject) return;
    const textObjs = this.targetObject instanceof GroupControl
    ? (this.targetObject.getObjects() as TextControl[])
    : [this.targetObject as TextControl];

  if (textObjs.length === 0) return;

  
  const firstObj = textObjs[0];
  let allBold = firstObj.fontWeight === 'bold';
  let allItalic = firstObj.fontStyle === 'italic';
  let allUnderline = firstObj.underline === true;
  let allSameFontSize = true;
  let allSameColor = true;
  let allSameTextBgColor = true;
  let allSameBoxBgColor = true;
  let allSameTextAlign = true;
  let allSameFontFamily = true;
  let allSameListStyle = true;

  
  for (let i = 1; i < textObjs.length; i++) {
    const obj = textObjs[i];
    allBold = allBold && obj.fontWeight === 'bold';
    allItalic = allItalic && obj.fontStyle === 'italic';
    allUnderline = allUnderline && obj.underline === true;
    allSameFontSize = allSameFontSize && obj.fontSize === firstObj.fontSize;
    allSameColor = allSameColor && obj.fill === firstObj.fill;
    allSameTextBgColor = allSameTextBgColor && obj.textBackgroundColor === firstObj.textBackgroundColor;
    allSameBoxBgColor = allSameBoxBgColor && obj.backgroundColor === firstObj.backgroundColor;
    allSameTextAlign = allSameTextAlign && obj.textAlign === firstObj.textAlign;
    allSameFontFamily = allSameFontFamily && obj.fontFamily === firstObj.fontFamily;
    allSameListStyle = allSameListStyle && obj.listStyle === firstObj.listStyle;
  }

  
  this.isBold = allBold;
  this.isItalic = allItalic;
  this.isUnderline = allUnderline;
  this.fontSize = allSameFontSize ? (firstObj.fontSize || 16) : '-';
  this.textColor = allSameColor ? (typeof firstObj.fill === 'string' ? firstObj.fill : '#000000') : '#000000';
  this.textBgColor = allSameTextBgColor ? (firstObj.textBackgroundColor || 'transparent') : 'transparent';
  this.boxBgColor = allSameBoxBgColor ? (firstObj.backgroundColor || 'transparent') : 'transparent';
  this.textAlign = allSameTextAlign ? (firstObj.textAlign || 'left') : 'left';
  this.fontFamily = allSameFontFamily ? (firstObj.fontFamily || 'Arial') : 'Arial';
  this.isUnorderedList = allSameListStyle && firstObj.listStyle === 'unordered';
  this.isOrderedList = allSameListStyle && firstObj.listStyle === 'ordered';

  
  if (allSameFontSize) {
    const fontSize = firstObj.fontSize || 16;
    if (fontSize >= 40) {
      this.textStyle = 'heading1';
    } else if (fontSize >= 32) {
      this.textStyle = 'heading2';
    } else if (fontSize >= 24) {
      this.textStyle = 'heading3';
    } else if (fontSize >= 18) {
      this.textStyle = 'heading4';
    } else {
      this.textStyle = 'normal';
    }
  } else {
    this.textStyle = 'normal';
  }
  }


  
  public destroy(): void {
    
  }


  
  public toggleBold(): void {
    if (!this.targetObject) return;
    const textObjs = this.targetObject instanceof GroupControl
      ? (this.targetObject.getObjects() as TextControl[])
      : [this.targetObject as TextControl];

    const newWeight = textObjs[0].fontWeight === 'bold' ? 'normal' : 'bold';

    textObjs.forEach(textObj => {
      textObj.set('fontWeight', newWeight);
    });

    this.isBold = newWeight === 'bold';
    this.canvasManager?.getMainCanvas().requestRenderAll();
  }

  
  public toggleItalic(): void {
    if (!this.targetObject) return;

    const textObjs = this.targetObject instanceof GroupControl
      ? (this.targetObject.getObjects() as TextControl[])
      : [this.targetObject as TextControl];

    const newStyle = textObjs[0].fontStyle === 'italic' ? 'normal' : 'italic';

    textObjs.forEach(textObj => {
      textObj.set('fontStyle', newStyle);
    });

    this.isItalic = newStyle === 'italic';
    this.canvasManager?.getMainCanvas().requestRenderAll();
  }

  
  public toggleUnderline(): void {
    if (!this.targetObject) return;

    const textObjs = this.targetObject instanceof GroupControl
      ? (this.targetObject.getObjects() as TextControl[])
      : [this.targetObject as TextControl];

    const newUnderline = !textObjs[0].underline;

    textObjs.forEach(textObj => {
      textObj.set('underline', newUnderline);
    });

    this.isUnderline = newUnderline;
    this.canvasManager?.getMainCanvas().requestRenderAll();
  }

  
  public increaseFontSize(): void {
    if (!this.targetObject) return;
    const textObjs = this.targetObject instanceof GroupControl
      ? (this.targetObject.getObjects() as TextControl[])
      : [this.targetObject as TextControl];

    const newSize = Math.min((textObjs[0].fontSize || 16) + 1, 1000);

    textObjs.forEach(textObj => {
      textObj.setFontSize(newSize, true);
    });

    this.fontSize = newSize;
  }

  
  public decreaseFontSize(): void {
    if (!this.targetObject) return;

    const textObjs = this.targetObject instanceof GroupControl
      ? (this.targetObject.getObjects() as TextControl[])
      : [this.targetObject as TextControl];

    const newSize = Math.max((textObjs[0].fontSize || 16) - 1, 1);

    textObjs.forEach(textObj => {
      textObj.setFontSize(newSize, true);
    });

    this.fontSize = newSize;
  }

  
  public updateFontSize(size: number): void {
    if (!this.targetObject) return;

    const textObjs = this.targetObject instanceof GroupControl
      ? (this.targetObject.getObjects() as TextControl[])
      : [this.targetObject as TextControl];

    const newSize = Math.max(0.5, Math.min(parseInt(size.toString()), 1000));

    textObjs.forEach(textObj => {
      textObj.setFontSize(newSize, true);
    });

    this.fontSize = newSize;
    this.canvasManager?.getMainCanvas().requestRenderAll();
  }

  
  public setTextColor(color: string): void {
    if (!this.targetObject) return;

    const textObjs = this.targetObject instanceof GroupControl
      ? (this.targetObject.getObjects() as TextControl[])
      : [this.targetObject as TextControl];

    textObjs.forEach(textObj => {
      textObj.set('fill', color);
    });

    this.textColor = color;
    this.canvasManager?.getMainCanvas().requestRenderAll();
  }

  
  public setTextBgColor(color: string): void {
    if (!this.targetObject) return;

    const textObjs = this.targetObject instanceof GroupControl
      ? (this.targetObject.getObjects() as TextControl[])
      : [this.targetObject as TextControl];

    textObjs.forEach(textObj => {
      textObj.set('textBackgroundColor', color);
    });

    this.textBgColor = color;
    this.canvasManager?.getMainCanvas().requestRenderAll();
  }

  
  public setBoxBgColor(color: string): void {
    if (!this.targetObject) return;

    const textObjs = this.targetObject instanceof GroupControl
      ? (this.targetObject.getObjects() as TextControl[])
      : [this.targetObject as TextControl];

    textObjs.forEach(textObj => {
      textObj.set('backgroundColor', color);
    });

    this.boxBgColor = color;
    this.canvasManager?.getMainCanvas().requestRenderAll();
  }

  
  public setTextAlign(align: string): void {
    if (!this.targetObject) return;
    const textObjs = this.targetObject instanceof GroupControl
      ? (this.targetObject.getObjects() as TextControl[])
      : [this.targetObject as TextControl];

    textObjs.forEach(textObj => {
      textObj.set('textAlign', align);
    });

    this.textAlign = align;
    this.canvasManager?.getMainCanvas().requestRenderAll();
  }

  
  public toggleUnorderedList(): void {
    if (!this.targetObject) return;

    const textObjs = this.targetObject instanceof GroupControl
      ? (this.targetObject.getObjects() as TextControl[])
      : [this.targetObject as TextControl];

    this.isUnorderedList = !this.isUnorderedList;

    textObjs.forEach(textObj => {
      if (typeof textObj.setListStyle === 'function') {
        if (this.isUnorderedList) {
          this.isOrderedList = false;
          textObj.setListStyle('unordered');
        } else {
          textObj.setListStyle('none');
        }
      }
    });
    this.canvasManager?.getMainCanvas().requestRenderAll();
  }

  
  public toggleOrderedList(): void {
    if (!this.targetObject) return;
    const textObjs = this.targetObject instanceof GroupControl
      ? (this.targetObject.getObjects() as TextControl[])
      : [this.targetObject as TextControl];

    this.isOrderedList = !this.isOrderedList;

    textObjs.forEach(textObj => {
      if (typeof textObj.setListStyle === 'function') {
        if (this.isOrderedList) {
          this.isUnorderedList = false;
          textObj.setListStyle('ordered');
        } else {
          textObj.setListStyle('none');
        }
      }
    });

    this.canvasManager?.getMainCanvas().requestRenderAll();
  }

  
  public changeFontFamily(family: string): void {
    if (!this.targetObject) return;

    const textObjs = this.targetObject instanceof GroupControl
      ? (this.targetObject.getObjects() as TextControl[])
      : [this.targetObject as TextControl];

    textObjs.forEach(textObj => {
      textObj.set('fontFamily', family);
    });

    this.fontFamily = family;
    this.canvasManager?.getMainCanvas().requestRenderAll();
  }

  
  public changeTextStyle(style: string): void {
    if (!this.targetObject) return;
    const textObjs = this.targetObject instanceof GroupControl
      ? (this.targetObject.getObjects() as TextControl[])
      : [this.targetObject as TextControl];

    this.textStyle = style;

    
    switch (style) {
      case 'heading1': {
        const styleProps = {
          fontSize: 40,
          fontWeight: 'bold'
        };
        textObjs.forEach(textObj => textObj.applyTextStyle(styleProps));
        this.fontSize = 40;
        this.isBold = true;
        break;
      }
      case 'heading2': {
        const styleProps = {
          fontSize: 32,
          fontWeight: 'bold'
        };
        textObjs.forEach(textObj => textObj.applyTextStyle(styleProps));
        this.fontSize = 32;
        this.isBold = true;
        break;
      }
      case 'heading3': {
        const styleProps = {
          fontSize: 24,
          fontWeight: 'bold'
        };
        textObjs.forEach(textObj => textObj.applyTextStyle(styleProps));
        this.fontSize = 24;
        this.isBold = true;
        break;
      }
      case 'heading4': {
        const styleProps = {
          fontSize: 18,
          fontWeight: 'bold'
        };
        textObjs.forEach(textObj => textObj.applyTextStyle(styleProps));
        this.fontSize = 18;
        this.isBold = true;
        break;
      }
      case 'quote': {
        const styleProps = {
          fontStyle: 'italic',
          textBackgroundColor: '#f0f0f0'
        };
        textObjs.forEach(textObj => textObj.applyTextStyle(styleProps));
        this.isItalic = true;
        this.textBgColor = '#f0f0f0';
        break;
      }
      case 'code': {
        const styleProps = {
          fontFamily: 'Courier New',
          textBackgroundColor: '#f5f5f5'
        };
        textObjs.forEach(textObj => textObj.applyTextStyle(styleProps));
        this.fontFamily = 'Courier New';
        this.textBgColor = '#f5f5f5';
        break;
      }
      case 'normal':
      default: {
        const styleProps = {
          fontSize: 16,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textBackgroundColor: 'transparent'
        };
        textObjs.forEach(textObj => textObj.applyTextStyle(styleProps));
        this.fontSize = 16;
        this.isBold = false;
        this.isItalic = false;
        this.textBgColor = 'transparent';
        break;
      }
    }

    this.canvasManager?.getMainCanvas().requestRenderAll();
  }


  
  public getIsBold(): boolean {
    return this.isBold;
  }

  
  public getIsItalic(): boolean {
    return this.isItalic;
  }

  
  public getIsUnderline(): boolean {
    return this.isUnderline;
  }

  
  public getFontSize(): number|string {
    return this.fontSize;
  }

  
  public getTextColor(): string {
    return this.textColor;
  }

  
  public getTextBgColor(): string {
    return this.textBgColor;
  }

  
  public getBoxBgColor(): string {
    return this.boxBgColor;
  }

  
  public getTextAlign(): string {
    return this.textAlign;
  }

  
  public getFontFamily(): string {
    return this.fontFamily;
  }

  
  public getTextStyle(): string {
    return this.textStyle;
  }

  
  public getIsUnorderedList(): boolean {
    return this.isUnorderedList;
  }

  
  public getIsOrderedList(): boolean {
    return this.isOrderedList;
  }

  
  public getFontFamilies(): any[] {
    return this.fontFamilies;
  }

  
  public getTextStyles(): any[] {
    return this.textStyles;
  }
}


export function useTextSettingToolsHandle(canvasManager: any) {
  const {
    toolsHandle: textSettingToolsHandle,
    toolbarVisible: textSettingToolbarVisible,
    toolbarData: textSettingToolbarData,
    toolbarPosition,
    targetObject,
    visible
  } = useBaseSettingToolsHandle<TextSettingToolsHandle>(
    canvasManager,
    EventTypes.CONTROL_PANEL.SHOW_TEXT_SETTING_TOOLBAR,
    EventTypes.CONTROL_PANEL.HIDE_TEXT_SETTING_TOOLBAR,
    TextSettingToolsHandle
  );


  
  const isBold = computed(() => {
    return textSettingToolsHandle.value?.getIsBold() || false;
  });

  
  const isItalic = computed(() => {
    return textSettingToolsHandle.value?.getIsItalic() || false;
  });

  
  const isUnderline = computed(() => {
    return textSettingToolsHandle.value?.getIsUnderline() || false;
  });

  
  const fontSize = computed({
    get: () => textSettingToolsHandle.value?.getFontSize() || 16,
    set: (value) => {
      if (textSettingToolsHandle.value && typeof value === 'number') {
        textSettingToolsHandle.value.updateFontSize(value);
      }
    }
  });

  
  const textColor = computed({
    get: () => textSettingToolsHandle.value?.getTextColor() || '#000000',
    set: (value) => {
      if (textSettingToolsHandle.value) {
        textSettingToolsHandle.value.setTextColor(value);
      }
    }
  });

  
  const textBgColor = computed({
    get: () => textSettingToolsHandle.value?.getTextBgColor() || 'transparent',
    set: (value) => {
      if (textSettingToolsHandle.value) {
        textSettingToolsHandle.value.setTextBgColor(value);
      }
    }
  });

  
  const boxBgColor = computed({
    get: () => textSettingToolsHandle.value?.getBoxBgColor() || 'transparent',
    set: (value) => {
      if (textSettingToolsHandle.value) {
        textSettingToolsHandle.value.setBoxBgColor(value);
      }
    }
  });

  
  const textAlign = computed({
    get: () => textSettingToolsHandle.value?.getTextAlign() || 'left',
    set: (value) => {
      if (textSettingToolsHandle.value) {
        textSettingToolsHandle.value.setTextAlign(value);
      }
    }
  });

  
  const fontFamily = computed({
    get: () => textSettingToolsHandle.value?.getFontFamily() || 'Arial',
    set: (value) => {
      if (textSettingToolsHandle.value) {
        textSettingToolsHandle.value.changeFontFamily(value);
      }
    }
  });

  
  const textStyle = computed({
    get: () => textSettingToolsHandle.value?.getTextStyle() || 'normal',
    set: (value) => {
      if (textSettingToolsHandle.value) {
        textSettingToolsHandle.value.changeTextStyle(value);
      }
    }
  });

  
  const isUnorderedList = computed(() => {
    return textSettingToolsHandle.value?.getIsUnorderedList() || false;
  });

  
  const isOrderedList = computed(() => {
    return textSettingToolsHandle.value?.getIsOrderedList() || false;
  });

  
  const fontFamilies = computed(() => {
    return textSettingToolsHandle.value?.getFontFamilies() || [];
  });

  
  const textStyles = computed(() => {
    return textSettingToolsHandle.value?.getTextStyles() || [];
  });

  return {
    textSettingToolsHandle,
    textSettingToolbarVisible,
    textSettingToolbarData,
    toolbarPosition,
    isBold,
    isItalic,
    isUnderline,
    fontSize,
    textColor,
    textBgColor,
    boxBgColor,
    textAlign,
    fontFamily,
    textStyle,
    isUnorderedList,
    isOrderedList,
    fontFamilies,
    textStyles,
    targetObject,
    visible
  };
}