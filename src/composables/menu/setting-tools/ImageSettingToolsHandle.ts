import { ref, type Ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { EventBus, EventTypes } from '../../../utils/EventBus';
import type { PictureControl } from '../../subassembly/controls/PictureControl';
import { BaseSettingToolsHandle, useBaseSettingToolsHandle } from './BaseSettingToolsHandle';
import { GroupControl } from '../../subassembly/controls/GroupControl';
import type { TextControl } from '../../subassembly/controls/TextControl';
import { MyActiveSelection } from '../../subassembly/controls/MyActiveSelection';


export class ImageSettingToolsHandle extends BaseSettingToolsHandle {
  
  private imageFilter = 'none';
  
  private hasFillColor = false;
  
  private fillColor = '#FFFFFF';
  
  private fillOpacity = 0.3;
  
  private hasRoundCorners = false;
  
  private cornerRadius = {
    topLeft: 0,
    topRight: 0,
    bottomLeft: 0,
    bottomRight: 0
  };
  
  private opacity = 1;
  
  private isSvgImage = false;

  
  constructor(canvasManager: any) {
    super(canvasManager);
  }


  
  public destroy(): void {
    
  }



  
  public override syncDataAndVisible(data: any, visible: boolean) {
    super.syncDataAndVisible(data, visible);

    if (data && data.target) {
      
      if (this.targetObject instanceof GroupControl) {
        const objects = this.targetObject.getObjects() as PictureControl[];
        this.isSvgImage = objects.some(obj => obj.isSvg());
      } else {
        this.isSvgImage = (this.targetObject as PictureControl)?.isSvg() || false;
      }
    }
  }


  
  protected updateStyleState(): void {
    if (!this.targetObject) return;

    const picObjs = this.targetObject instanceof GroupControl || this.targetObject instanceof MyActiveSelection
      ? (this.targetObject.getObjects() as PictureControl[])
      : [this.targetObject as PictureControl];

    if (picObjs.length === 0) return;

    const targetImgObj = picObjs.find(obj => {
      if (obj.isSvg()) {
        return !!obj.getFillColor()?.color;
      } else {
        return obj.getFillColor ? !!obj.getFillColor().color : !!obj.fill;
      }
    }) || picObjs[0];

    if (targetImgObj.isSvg()) {
      const imgObj = targetImgObj;
      this.hasFillColor = !!imgObj.getFillColor()?.color;
      this.fillColor = imgObj.getFillColor()?.color || '#FFFFFF';
    } else {
      const imgObj = targetImgObj as any;
      this.imageFilter = this.getAppliedFilter(imgObj) || 'none';

      if (imgObj.getFillColor) {
        const fillColorInfo = imgObj.getFillColor();
        this.hasFillColor = !!fillColorInfo.color;
        this.fillColor = fillColorInfo.color || '#FFFFFF';
        this.fillOpacity = fillColorInfo.opacity;
      } else {
        this.hasFillColor = !!imgObj.fill;
        this.fillColor = imgObj.fill || '#FFFFFF';
      }

      
      this.syncHasRoundCorners(imgObj.getInnerControl());

      
      this.opacity = imgObj.opacity !== undefined ? imgObj.opacity : 1;
    }
  }

  
  private syncHasRoundCorners(imgObj: any): void {
    const cornerRadiusValues = imgObj.getCornerRadius ? imgObj.getCornerRadius() : { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
    this.hasRoundCorners = Object.values(cornerRadiusValues).some((radius) => (radius as number) > 0);
    this.cornerRadius = cornerRadiusValues;
  }

  
  private getAppliedFilter(obj: PictureControl): string {
    if (!obj) return 'none';
    return obj.getAppliedFilterType();
  }

  
  public applyFilter(filterType: string): void {
    if (!this.targetObject) return;
    this.imageFilter = filterType;
    this.targetObject.applyFilter(filterType);
  }

  
  public setFillColor(color: string, opacity: number = 0.3): void {
    if (!this.targetObject) return;

    if (this.targetObject instanceof GroupControl) {
      const objects = this.targetObject.getObjects() as PictureControl[];
      objects.forEach(obj => {
        obj.setFillColor(color, opacity);
      });
    } else {
      this.targetObject.setFillColor(color, opacity);
    }

    this.fillColor = color;
    this.fillOpacity = opacity;
    this.hasFillColor = true;
  }

  
  public setCornerRadius(cornerRadii: { topLeft: number, topRight: number, bottomLeft: number, bottomRight: number }): void {
    if (!this.targetObject) return;

    this.cornerRadius = cornerRadii;

    if (this.targetObject instanceof GroupControl) {
      const objects = this.targetObject.getObjects() as PictureControl[];
      objects.forEach(obj => {
        obj.setCornerRadii(cornerRadii);
        this.syncHasRoundCorners(obj.getInnerControl());
      });
    } else {
      this.targetObject.setCornerRadii(cornerRadii);
      this.syncHasRoundCorners(this.targetObject.getInnerControl());
    }
  }

  
  public applyUniformRadius(): void {
    if (!this.targetObject) return;

    
    const maxRadius = Math.max(
      this.cornerRadius.topLeft,
      this.cornerRadius.topRight,
      this.cornerRadius.bottomLeft,
      this.cornerRadius.bottomRight
    );

    const uniformRadius = {
      topLeft: maxRadius,
      topRight: maxRadius,
      bottomLeft: maxRadius,
      bottomRight: maxRadius
    };
    this.setCornerRadius(uniformRadius);
  }

  
  public resetCornerRadius(): void {
    if (!this.targetObject) return;

    const zeroRadius = {
      topLeft: 0,
      topRight: 0,
      bottomLeft: 0,
      bottomRight: 0
    };

    this.setCornerRadius(zeroRadius);
  }

  
  public setOpacity(opacity: number): void {
    if (!this.targetObject) return;

    this.opacity = opacity;
    if (this.targetObject instanceof GroupControl || MyActiveSelection) {
      const objects = this.targetObject.getObjects() as PictureControl[];
      objects.forEach(obj => {
        obj.set('opacity', opacity);
      });
    } else {
      this.targetObject.set('opacity', opacity);
    }
    this.canvasManager?.getMainCanvas().renderAll();
  }

  
  public flipHorizontal(): void {
    if (!this.targetObject) return;

    if (this.targetObject instanceof GroupControl) {
      const objects = this.targetObject.getObjects() as PictureControl[];
      objects.forEach(obj => {
        obj.set('flipX', !obj.flipX);
      });
    } else {
      const imgObj = this.targetObject as PictureControl;
      imgObj.set('flipX', !imgObj.flipX);
    }
    this.canvasManager?.getMainCanvas().renderAll();
  }

  
  public flipVertical(): void {
    if (!this.targetObject) return;

    if (this.targetObject instanceof GroupControl) {
      const objects = this.targetObject.getObjects() as PictureControl[];
      objects.forEach(obj => {
        obj.set('flipY', !obj.flipY);
      });
    } else {
      const imgObj = this.targetObject as PictureControl;
      imgObj.set('flipY', !imgObj.flipY);
    }
    this.canvasManager?.getMainCanvas().renderAll();
  }

  
  public replaceImage(): void {
    EventBus.emit(EventTypes.CONTROL_PANEL.OPEN, {
      type: EventTypes.PANEL_TYPE.INSERT_IMAGE,
      action: EventTypes.PANEL_ACTION.REPLACE_IMAGE,
      canvas: this.canvasManager?.getMainCanvas(),
      canvasManager: this.canvasManager,
      target: this.targetObject,
      position: null
    });
  }

  
  public getImageFilter(): string {
    return this.imageFilter;
  }

  
  public getHasFillColor(): boolean {
    return this.hasFillColor;
  }

  
  public getFillColor(): string {
    return this.fillColor;
  }

  
  public getFillOpacity(): number {
    return this.fillOpacity;
  }

  
  public getHasRoundCorners(): boolean {
    return this.hasRoundCorners;
  }

  
  public getCornerRadius(): { topLeft: number, topRight: number, bottomLeft: number, bottomRight: number } {
    return this.cornerRadius;
  }

  
  public getOpacity(): number {
    return this.opacity;
  }

  
  public getIsSvgImage(): boolean {
    return this.isSvgImage;
  }

  
  public getTargetObject(): PictureControl | null {
    return this.targetObject;
  }

  
  protected getToolbarSelector(): string {
    return '.setting-toolbar';
  }

}


export function useImageSettingToolsHandle(canvasManager: any) {
  const {
    toolsHandle: imageSettingToolsHandle,
    toolbarVisible: imageSettingToolbarVisible,
    toolbarData: imageSettingToolbarData,
    toolbarPosition,
    targetObject,
    visible
  } = useBaseSettingToolsHandle<ImageSettingToolsHandle>(
    canvasManager,
    EventTypes.CONTROL_PANEL.SHOW_IMAGE_SETTING_TOOLBAR,
    EventTypes.CONTROL_PANEL.HIDE_IMAGE_SETTING_TOOLBAR,
    ImageSettingToolsHandle
  );

  
  const imageFilter = computed(() => {
    return imageSettingToolsHandle.value?.getImageFilter() || 'none';
  });

  
  const hasFillColor = computed(() => {
    return imageSettingToolsHandle.value?.getHasFillColor() || false;
  });

  
  const fillColor = computed(() => {
    return imageSettingToolsHandle.value?.getFillColor() || '#FFFFFF';
  });

  
  const fillOpacity = computed(() => {
    return imageSettingToolsHandle.value?.getFillOpacity() || 0.3;
  });

  
  const hasRoundCorners = computed(() => {
    return imageSettingToolsHandle.value?.getHasRoundCorners() || false;
  });

  
  const cornerRadius = computed(() => {
    return imageSettingToolsHandle.value?.getCornerRadius() || { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
  });

  
  const opacity = computed(() => {
    return imageSettingToolsHandle.value?.getOpacity() || 1;
  });

  
  const isSvgImage = computed(() => {
    return imageSettingToolsHandle.value?.getIsSvgImage() || false;
  });

  return {
    imageSettingToolsHandle,
    imageSettingToolbarVisible,
    imageSettingToolbarData,
    toolbarPosition,
    imageFilter,
    hasFillColor,
    fillColor,
    fillOpacity,
    hasRoundCorners,
    cornerRadius,
    opacity,
    isSvgImage,
    targetObject,
    visible
  };
}