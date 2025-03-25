/**
 * 自定义事件总线
 * 所有自定义事件类型都在这里定义
 */

type EventCallback = (payload?: any) => void;


// 定义事件类型常量
export const EventTypes = {
  CONTROL_PANEL: {
    OPEN: 'open-control-panel',
    SHOW_TEXT_SETTING_TOOLBAR: 'control-panel:show-text-toolbar',
    HIDE_TEXT_SETTING_TOOLBAR: 'control-panel:hide-text-setting-toolbar',
    SHOW_IMAGE_SETTING_TOOLBAR: 'control-panel:show-image-toolbar',
    HIDE_IMAGE_SETTING_TOOLBAR: 'control-panel:hide-image-setting-toolbar',
    UPDATE_IMAGE_SETTING_TOOLBAR: 'control-panel:update-image-setting-toolbar',
  },
  PANEL_TYPE: {
    BACKGROUND_IMAGE: 'background-image',
    BACKGROUND_COLOR: 'background-color',
    INSERT_IMAGE: 'insert-image',
  },
  PANEL_ACTION: {
    //替换图片
    REPLACE_IMAGE: 'replace-image',
  },
  // 添加画布背景变化事件
  CANVAS: {
    CANVAS_UPDATE:'canvas:update',
    BACKGROUND_COLOR_CHANGE: 'canvas:background-color-change',
    BACKGROUND_IMAGE_CHANGE: 'canvas:background-image-change',
    ZOOM_CHANGE: 'canvas:zoom-change'
  },
  // 添加Frame相关事件
  FRAME: {
    FRAME_ADDED: 'frame:added',
    FRAME_REMOVED: 'frame:removed',
    FRAME_UPDATED: 'frame:updated',
    FRAMES_REORDERED: 'frames:reordered',
    FRAMES_CLEARED: 'frames:cleared'
  }, 
} as const;


class EventBusClass {
  private events: Map<string, EventCallback[]>;

  constructor() {
    this.events = new Map();
  }

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback?: EventCallback): void {
    if (!this.events.has(event)) return;
    
    if (callback) {
      // 如果提供了回调函数，只移除特定的回调
      const callbacks = this.events.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
      
      if (callbacks.length === 0) {
        this.events.delete(event);
      }
    } else {
      // 如果没有提供回调函数，移除该事件的所有监听器
      this.events.delete(event);
    }
  }

  emit(event: string, payload?: any): void {
    if (!this.events.has(event)) return;
    
    this.events.get(event)!.forEach(callback => {
      callback(payload);
    });
  }
}

export const EventBus = new EventBusClass();