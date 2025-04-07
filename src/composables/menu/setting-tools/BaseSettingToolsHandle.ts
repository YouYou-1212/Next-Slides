import { ref, type Ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { EventBus, EventTypes } from '../../../utils/EventBus';
import * as fabric from "fabric";
import type { CanvasManager } from '../../../composables/canvas/CanvasManager';


export class BaseSettingToolsHandle {
    
    protected toolbarVisible: boolean = false;
    
    protected toolbarData: any = null;
    
    protected targetObject: any = null;
    
    protected position = { top: 0, left: 0 };

    
    constructor(protected canvasManager: CanvasManager) {
        this.init();
    }

    
    protected init(): void {
        
    }

    
    public destroy(): void {
        
    }

    
    public syncDataAndVisible(data: any, visible: boolean): void {
        this.toolbarData = data;
        this.toolbarVisible = visible;

        
        if (data && data.target) {
            this.targetObject = data.target;
            if (this.targetObject instanceof Array) {
                this.targetObject = this.canvasManager?.getMainCanvas().getActiveObject();
            }
            this.updateStyleState();
            this.calculatePosition();
        }
    }

    
    protected updateStyleState(): void {
        
    }

    
    protected getToolbarSelector(): string {
        return '.setting-toolbar'; 
    }

    
    protected calculatePosition(): void {
        if (!this.targetObject || !this.canvasManager?.getMainCanvas()) return;
        const canvas = this.canvasManager.getMainCanvas();
        const obj = this.targetObject as fabric.FabricObject;
        
        if (this.targetObject instanceof Array) {
            return;
        }
        const objBounds = obj.getBoundingRect();
        const zoom = canvas.getZoom();
        const vpt = canvas.viewportTransform;

        if (!vpt) return;

        
        const objLeft = (objBounds.left * zoom + vpt[4]);
        const objTop = (objBounds.top * zoom + vpt[5]);
        const objWidth = objBounds.width * zoom;
        const objHeight = objBounds.height * zoom;

        nextTick(() => {
            
            const toolbarSelector = this.getToolbarSelector();
            const toolbarEl = document.querySelector(toolbarSelector) as HTMLElement;
            const toolbarWidth = toolbarEl ? toolbarEl.offsetWidth : 300;
            const toolbarHeight = toolbarEl ? toolbarEl.offsetHeight : 50;

            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            
            let left = objLeft + (objWidth / 2) - (toolbarWidth / 2);
            let top = objTop - toolbarHeight - 15;

            
            left = Math.max(10, Math.min(left, screenWidth - toolbarWidth - 10));
            top = Math.max(10, Math.min(top, screenHeight - toolbarHeight - 10));

            
            this.position = { left, top };
        });
    }

    
    public getPosition(): { top: number, left: number } {
        return this.position;
    }

    
    public getToolbarVisible(): boolean {
        return this.toolbarVisible;
    }

    
    public getToolbarData(): any {
        return this.toolbarData;
    }

    
    public getTargetObject(): any {
        return this.targetObject;
    }
}


export function useBaseSettingToolsHandle<T extends BaseSettingToolsHandle>(
    canvasManager: any,
    eventShowType: string,
    eventHideType: string,
    HandleClass: new (canvasManager: any) => T
) {
    const toolbarVisible = ref(false);
    const toolbarData = ref(null);
    const toolsHandle = ref<T>(new HandleClass(canvasManager));

    
    const handleShowToolbar = (data: any) => {
        
        toolbarData.value = data;
        toolbarVisible.value = true;
        if (toolsHandle.value) {
            toolsHandle.value.syncDataAndVisible(data, true);
        }
    };

    const handleHideToolbar = () => {
        toolbarVisible.value = false;
        toolbarData.value = null;
        if (toolsHandle.value) {
            toolsHandle.value.syncDataAndVisible(null, false);
        }
    };

    onMounted(() => {
        
        EventBus.on(eventShowType, handleShowToolbar);
        EventBus.on(eventHideType, handleHideToolbar);
    });

    onUnmounted(() => {
        
        EventBus.off(eventShowType, handleShowToolbar);
        EventBus.off(eventHideType, handleHideToolbar);

        if (toolsHandle.value) {
            toolsHandle.value.destroy();
        }
    });

    
    const toolbarPosition = computed(() => {
        
        
        return toolsHandle.value?.getPosition() || { top: 0, left: 0 };
    });

    
    const targetObject = computed(() => {
        return toolsHandle.value?.getTargetObject() || null;
    });

    
    const visible = computed(() => {
        return toolbarVisible.value;
    });

    return {
        toolsHandle,
        toolbarVisible,
        toolbarData,
        toolbarPosition,
        targetObject,
        visible
    };
}