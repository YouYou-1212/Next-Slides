import { ref, type Ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { EventBus, EventTypes } from '../../../utils/EventBus';
import { BaseSettingToolsHandle, useBaseSettingToolsHandle } from './BaseSettingToolsHandle';
import { GroupControl } from '../../../composables/subassembly/controls/GroupControl';
import { TextControl } from '../../../composables/subassembly/controls/TextControl';
import { ImageControl } from '../../../composables/subassembly/controls/ImageControl';
import { MyActiveSelection } from '../../../composables/subassembly/controls/MyActiveSelection';
import { PictureControl } from '../../../composables/subassembly/controls/PictureControl';


export class GroupSettingToolsHandle extends BaseSettingToolsHandle {
    
    private _isAllText = false;
    private _isAllImage = false;
    private _isActiveSelection = false;

    
    constructor(canvasManager: any) {
        super(canvasManager);
    }

    public isAllText(): boolean {
        return this._isAllText;
    }

    public isAllImage(): boolean {
        return this._isAllImage;
    }

    public isActiveSelection(): boolean {
        return this._isActiveSelection;
    }

    
    protected override updateStyleState(): void {
        if (!this.targetObject) return;

        
        if (this.targetObject instanceof Array) {
            this._isActiveSelection = true;
            this.targetObject = this.canvasManager?.getMainCanvas().getActiveObject();
        }
        
        this._isActiveSelection = this.targetObject.type === MyActiveSelection.type;

        
        const objects = this.isActiveSelection()
            ? (this.targetObject as MyActiveSelection).getObjects()
            : (this.targetObject as GroupControl)._objects;
            

        
        this._isAllText = objects.length > 0 && objects.every(obj => obj.type === TextControl.type);
        this._isAllImage = objects.length > 0 && objects.every(obj => obj.type === PictureControl.type);
    }

    
    public createGroup(): void {
        if (!this.targetObject || !this.isActiveSelection) return;

        const activeSelection = this.targetObject as MyActiveSelection;

        const group = new GroupControl(activeSelection.removeAll())
        this.canvasManager?.getControlsManager().addGroup(group);
        this.canvasManager?.getMainCanvas().setActiveObject(group);
    }

    
    public ungroup(): void {
        if (!this.targetObject || this.isActiveSelection()) return;

        const groupControl = this.targetObject as GroupControl;
        this.canvasManager?.getMainCanvas().remove(groupControl);
        const subObjs = groupControl.removeAll();
        
        
        
    
        var sel = new MyActiveSelection(subObjs, {
          canvas: this.canvasManager?.getMainCanvas(),
        });
        this.canvasManager?.getMainCanvas().setActiveObject(sel);
    }

}


export function useGroupSettingToolsHandle(canvasManager: any) {
    const {
        toolsHandle: groupSettingToolsHandle,
        toolbarVisible: groupSettingToolbarVisible,
        toolbarData: groupSettingToolbarData,
        toolbarPosition,
        targetObject,
        visible
    } = useBaseSettingToolsHandle<GroupSettingToolsHandle>(
        canvasManager,
        EventTypes.CONTROL_PANEL.SHOW_GROUP_SETTING_TOOLBAR,
        EventTypes.CONTROL_PANEL.HIDE_GROUP_SETTING_TOOLBAR,
        GroupSettingToolsHandle
    );

    const isAllImage = computed(() => groupSettingToolsHandle.value?.isAllImage() || false);
    const isActiveSelection = computed(() => groupSettingToolsHandle.value?.isActiveSelection() || false);

    const isAllText = computed(() => {
        return groupSettingToolsHandle.value?.isAllText() || false;
    });

    return {
        groupSettingToolsHandle,
        groupSettingToolbarVisible,
        groupSettingToolbarData,
        toolbarPosition,
        isAllText,
        isAllImage,
        isActiveSelection,
        targetObject,
        visible
    };
}