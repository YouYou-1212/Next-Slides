import { ref, type Ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { EventBus, EventTypes } from '../../../utils/EventBus';

/**
 * 设置工具处理类
 * 用于管理编辑器中各种设置工具的显示状态
 */
export class SettingToolsHandle {
  // 文本设置工具栏显示状态
  private textSettingToolbarVisible: Ref<boolean> = ref(false);
  // 文本设置工具栏数据
  private textSettingToolbarData: Ref<any> = ref(null);
  
  /**
   * 构造函数
   * @param canvasManager Canvas管理器实例
   */
  constructor(private canvasManager: any) {
    this.init();
  }

  /**
   * 初始化设置工具处理器
   */
  private init(): void {
    console.log("SettingToolsHandle 初始化完成");
  }


  /**
   * 销毁设置工具处理器
   */
  public destroy(): void {
  }

  /**
   * 获取文本设置工具栏显示状态
   */
  public getTextSettingToolbarVisible(): Ref<boolean> {
    return this.textSettingToolbarVisible;
  }

  /**
   * 获取文本设置工具栏数据
   */
  public getTextSettingToolbarData(): Ref<any> {
    return this.textSettingToolbarData;
  }
}

/**
 * 创建设置工具处理器Hook
 * @param canvasManager Canvas管理器实例
 */
export function useSettingToolsHandle(canvasManager: any) {
  const textSettingToolbarVisible = ref(false);
  const textSettingToolbarData = ref(null);
  const settingToolsHandle = ref<SettingToolsHandle | null>(null);
  
   // 监听事件，直接更新本地状态
   const handleShowTextSettingToolbar = (data: any) => {
    console.log("useSettingToolsHandle 收到显示文本设置工具栏事件", data);
    textSettingToolbarData.value = data;
    textSettingToolbarVisible.value = true;
    if (settingToolsHandle.value) {
      settingToolsHandle.value.getTextSettingToolbarData().value = data;
      settingToolsHandle.value.getTextSettingToolbarVisible().value = true;
    }
  };
  
  const handleHideTextSettingToolbar = () => {
    textSettingToolbarVisible.value = false;
    textSettingToolbarData.value = null;
    if (settingToolsHandle.value) {
      settingToolsHandle.value.getTextSettingToolbarVisible().value = false;
      settingToolsHandle.value.getTextSettingToolbarData().value = null;
    }
  };
  
  onMounted(() => {
    // 注册事件监听
    EventBus.on(EventTypes.CONTROL_PANEL.SHOW_TEXT_SETTING_TOOLBAR, handleShowTextSettingToolbar);
    EventBus.on(EventTypes.CONTROL_PANEL.HIDE_TEXT_SETTING_TOOLBAR, handleHideTextSettingToolbar);
  });
  
  onUnmounted(() => {
    // 移除事件监听
    EventBus.off(EventTypes.CONTROL_PANEL.SHOW_TEXT_SETTING_TOOLBAR, handleShowTextSettingToolbar);
    EventBus.off(EventTypes.CONTROL_PANEL.HIDE_TEXT_SETTING_TOOLBAR, handleHideTextSettingToolbar);
    
    if (settingToolsHandle.value) {
      settingToolsHandle.value.destroy();
      settingToolsHandle.value = null;
    }
  });
  
  return {
    settingToolsHandle,
    // 直接返回本地状态，而不是计算属性
    textSettingToolbarVisible,
    textSettingToolbarData
  };
}