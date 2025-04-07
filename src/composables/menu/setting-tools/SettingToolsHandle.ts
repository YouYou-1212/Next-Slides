import { ref, type Ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { EventBus, EventTypes } from '../../../utils/EventBus';


export class SettingToolsHandle {
  
  private textSettingToolbarVisible: Ref<boolean> = ref(false);
  
  private textSettingToolbarData: Ref<any> = ref(null);
  
  
  constructor(private canvasManager: any) {
    this.init();
  }

  
  private init(): void {
    
  }


  
  public destroy(): void {
  }

  
  public getTextSettingToolbarVisible(): Ref<boolean> {
    return this.textSettingToolbarVisible;
  }

  
  public getTextSettingToolbarData(): Ref<any> {
    return this.textSettingToolbarData;
  }
}


export function useSettingToolsHandle(canvasManager: any) {
  const textSettingToolbarVisible = ref(false);
  const textSettingToolbarData = ref(null);
  const settingToolsHandle = ref<SettingToolsHandle | null>(null);
  
   
   const handleShowTextSettingToolbar = (data: any) => {
    
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
    
    EventBus.on(EventTypes.CONTROL_PANEL.SHOW_TEXT_SETTING_TOOLBAR, handleShowTextSettingToolbar);
    EventBus.on(EventTypes.CONTROL_PANEL.HIDE_TEXT_SETTING_TOOLBAR, handleHideTextSettingToolbar);
  });
  
  onUnmounted(() => {
    
    EventBus.off(EventTypes.CONTROL_PANEL.SHOW_TEXT_SETTING_TOOLBAR, handleShowTextSettingToolbar);
    EventBus.off(EventTypes.CONTROL_PANEL.HIDE_TEXT_SETTING_TOOLBAR, handleHideTextSettingToolbar);
    
    if (settingToolsHandle.value) {
      settingToolsHandle.value.destroy();
      settingToolsHandle.value = null;
    }
  });
  
  return {
    settingToolsHandle,
    
    textSettingToolbarVisible,
    textSettingToolbarData
  };
}