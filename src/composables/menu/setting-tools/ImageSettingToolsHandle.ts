import { ref, type Ref, onMounted, onUnmounted } from 'vue';
import { EventBus, EventTypes } from '../../../utils/EventBus';

/**
 * 图片设置工具处理类
 * 用于管理编辑器中图片设置工具的显示状态
 */
export class ImageSettingToolsHandle {
  // 图片设置工具栏显示状态
  private imageSettingToolbarVisible: Ref<boolean> = ref(false);
  // 图片设置工具栏数据
  private imageSettingToolbarData: Ref<any> = ref(null);
  
  /**
   * 构造函数
   * @param canvasManager Canvas管理器实例
   */
  constructor(private canvasManager: any) {
    this.init();
  }

  /**
   * 初始化图片设置工具处理器
   */
  private init(): void {
    console.log("ImageSettingToolsHandle 初始化完成");
  }

  /**
   * 销毁图片设置工具处理器
   */
  public destroy(): void {
  }

  /**
   * 获取图片设置工具栏显示状态
   */
  public getImageSettingToolbarVisible(): Ref<boolean> {
    return this.imageSettingToolbarVisible;
  }

  /**
   * 获取图片设置工具栏数据
   */
  public getImageSettingToolbarData(): Ref<any> {
    return this.imageSettingToolbarData;
  }
}

/**
 * 创建图片设置工具处理器Hook
 * @param canvasManager Canvas管理器实例
 */
export function useImageSettingToolsHandle(canvasManager: any) {
  const imageSettingToolbarVisible = ref(false);
  const imageSettingToolbarData = ref(null);
  const imageSettingToolsHandle = ref<ImageSettingToolsHandle | null>(null);
  
  // 监听事件，直接更新本地状态
  const handleShowImageSettingToolbar = (data: any) => {
    console.log("handleShowImageSettingToolbar", data);
    imageSettingToolbarData.value = data;
    imageSettingToolbarVisible.value = true;
    if (imageSettingToolsHandle.value) {
      imageSettingToolsHandle.value.getImageSettingToolbarData().value = data;
      imageSettingToolsHandle.value.getImageSettingToolbarVisible().value = true;
    }
  };
  
  const handleHideImageSettingToolbar = () => {
    imageSettingToolbarVisible.value = false;
    imageSettingToolbarData.value = null;
    if (imageSettingToolsHandle.value) {
      imageSettingToolsHandle.value.getImageSettingToolbarVisible().value = false;
      imageSettingToolsHandle.value.getImageSettingToolbarData().value = null;
    }
  };
  
  onMounted(() => {
    // 注册事件监听
    EventBus.on(EventTypes.CONTROL_PANEL.SHOW_IMAGE_SETTING_TOOLBAR, handleShowImageSettingToolbar);
    EventBus.on(EventTypes.CONTROL_PANEL.HIDE_IMAGE_SETTING_TOOLBAR, handleHideImageSettingToolbar);
  });
  
  onUnmounted(() => {
    // 移除事件监听
    EventBus.off(EventTypes.CONTROL_PANEL.SHOW_IMAGE_SETTING_TOOLBAR, handleShowImageSettingToolbar);
    EventBus.off(EventTypes.CONTROL_PANEL.HIDE_IMAGE_SETTING_TOOLBAR, handleHideImageSettingToolbar);
    
    if (imageSettingToolsHandle.value) {
      imageSettingToolsHandle.value.destroy();
      imageSettingToolsHandle.value = null;
    }
  });
  
  return {
    imageSettingToolsHandle,
    // 直接返回本地状态，而不是计算属性
    imageSettingToolbarVisible,
    imageSettingToolbarData
  };
}