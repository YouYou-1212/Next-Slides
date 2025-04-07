

type EventCallback = (payload?: any) => void;



export const EventTypes = {
  CONTROL_PANEL: {
    OPEN: 'open-control-panel',
    SHOW_TEXT_SETTING_TOOLBAR: 'control-panel:show-text-toolbar',
    HIDE_TEXT_SETTING_TOOLBAR: 'control-panel:hide-text-setting-toolbar',
    SHOW_IMAGE_SETTING_TOOLBAR: 'control-panel:show-image-toolbar',
    HIDE_IMAGE_SETTING_TOOLBAR: 'control-panel:hide-image-setting-toolbar',
    UPDATE_IMAGE_SETTING_TOOLBAR: 'control-panel:update-image-setting-toolbar',
    SHOW_GROUP_SETTING_TOOLBAR: 'control-panel:show-group-toolbar',
    HIDE_GROUP_SETTING_TOOLBAR: 'control-panel:hide-group-setting-toolbar',
    SHOW_SHAPE_SETTING_TOOLBAR: 'control-panel:show-shape-toolbar',
    HIDE_SHAPE_SETTING_TOOLBAR: 'control-panel:hide-shape-setting-toolbar',

  },
  PANEL_TYPE: {
    BACKGROUND_IMAGE: 'background-image',
    BACKGROUND_COLOR: 'background-color',
    INSERT_IMAGE: 'insert-image',
  },
  PANEL_ACTION: {
    
    REPLACE_IMAGE: 'replace-image',
  },
  
  CANVAS: {
    CANVAS_UPDATE:'canvas:update',
    BACKGROUND_COLOR_CHANGE: 'canvas:background-color-change',
    BACKGROUND_IMAGE_CHANGE: 'canvas:background-image-change',
    ZOOM_CHANGE: 'canvas:zoom-change'
  },
  
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
      
      const callbacks = this.events.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
      
      if (callbacks.length === 0) {
        this.events.delete(event);
      }
    } else {
      
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