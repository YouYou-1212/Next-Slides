import { ActiveSelection } from "fabric";
import { CustomCanvas } from "../canvas/CustomCanvas";
import { Frame } from "../slides/Frame";
import { PageFrame } from "../slides/PageFrame";
import { ImageControl } from "../subassembly/controls/ImageControl";
import { ShapeControl } from "../subassembly/controls/ShapeControl";
import { TextControl } from "../subassembly/controls/TextControl";
import type { MenuItemConfig } from "./MenuItemConfig";
import { GroupControl } from "../subassembly/controls/GroupControl";
import { PictureControl } from "../subassembly/controls/PictureControl";


export class MenuItems {

  
  public static getCanvasMenuItems(callbacks: MenuCallbacks): MenuItemConfig[] {
    return [
      { label: "插入一页", action: callbacks.insertFrame },
      { label: "粘贴", action: callbacks.paste },
      { label: "更换背景", action: callbacks.changeBackground },
      { label: "更换配色", action: callbacks.changeColorScheme },
      { label: "插入文本", action: callbacks.insertText },
      { label: "插入图片", action: callbacks.insertImage },
      { separator: true, label: "", action: () => { } },
      { label: "开始演示", action: callbacks.startPresentation },
    ];
  }


  
  public static getPageFrameMenuItems(
    callbacks: MenuCallbacks
  ): MenuItemConfig[] {
    return [
      { label: "插入一页", action: callbacks.insertFrame },
      { label: "更换背景", action: callbacks.changeBackground },
      { label: "更换配色", action: callbacks.changeColorScheme },
      { label: "插入文本", action: callbacks.insertText },
      { label: "插入图片", action: callbacks.insertImage },
    ];
  }

  
  public static getFrameMenuItems(callbacks: MenuCallbacks): MenuItemConfig[] {
    return [
      ...this.getLayerOperationMenuItems(callbacks),
      { separator: true, label: "", action: () => { } },
      { label: "插入文本", action: callbacks.insertText },
      { label: "插入图片", action: callbacks.insertImage },
      { label: "插入形状", action: callbacks.insertShape },
      { separator: true, label: "", action: () => { } },
      ...this.getBasicEditMenuItems(callbacks),
    ];
  }

  
  public static getContentMenuItems(
    callbacks: MenuCallbacks
  ): MenuItemConfig[] {
    return [
      ...this.getLayerOperationMenuItems(callbacks),
      { separator: true, label: "", action: () => { } },
      ...this.getBasicEditMenuItems(callbacks),
    ];
  }


  public static getActiveSelectionContentMenuItems(
    callbacks: MenuCallbacks
  ): MenuItemConfig[] {
    return [
      ...this.getLayerOperationMenuItems(callbacks),
      { separator: true, label: "", action: () => { } },
      { label: "创建组", action: callbacks.createGroup },
      ...this.getBasicEditMenuItems(callbacks),
    ];
  }



  public static getGroupContentMenuItems(
    callbacks: MenuCallbacks
  ): MenuItemConfig[] {
    return [
      ...this.getLayerOperationMenuItems(callbacks),
      { separator: true, label: "", action: () => { } },
      { label: "取消组", action: callbacks.cancelGroup },
      ...this.getBasicEditMenuItems(callbacks),
    ];
  }



  
  private static getLayerOperationMenuItems(
    callbacks: MenuCallbacks
  ): MenuItemConfig[] {
    return [
      { label: "向上一层", action: () => callbacks.moveLayer("up") },
      { label: "向下一层", action: () => callbacks.moveLayer("down") },
      { label: "置于顶层", action: () => callbacks.moveLayer("top") },
      { label: "置于底层", action: () => callbacks.moveLayer("bottom") },
    ];
  }


  
  private static getBasicEditMenuItems(
    callbacks: MenuCallbacks
  ): MenuItemConfig[] {
    return [
      { label: "复制", action: callbacks.copyObject },
      { label: "剪切", action: callbacks.cutObject },
      { label: "删除", action: callbacks.deleteObject },
    ];
  }


  
  public static getAllMenuItems(
    callbacks: MenuCallbacks
  ): Map<string, MenuItemConfig[]> {
    const menuItems = new Map<string, MenuItemConfig[]>();

    menuItems.set(PageFrame.type, this.getPageFrameMenuItems(callbacks));
    menuItems.set(CustomCanvas.type, this.getCanvasMenuItems(callbacks));
    menuItems.set(Frame.type, this.getFrameMenuItems(callbacks));
    menuItems.set(TextControl.type, this.getContentMenuItems(callbacks));
    menuItems.set(PictureControl.type, this.getContentMenuItems(callbacks));
    menuItems.set(ShapeControl.type, this.getContentMenuItems(callbacks));
    menuItems.set(ActiveSelection.type, this.getActiveSelectionContentMenuItems(callbacks));
    menuItems.set(GroupControl.type, this.getGroupContentMenuItems(callbacks));

    return menuItems;
  }
}


export interface MenuCallbacks {
  insertFrame: () => void;
  changeBackground: () => void;
  changeColorScheme: () => void;
  insertText: () => void;
  insertImage: () => void;
  insertShape: () => void;
  createGroup: () => void;
  cancelGroup: () => void;
  paste: () => void;
  copyObject: () => void;
  cutObject: () => void;
  deleteObject: () => void;
  moveLayer: (direction: "up" | "down" | "top" | "bottom") => void;
  startPresentation: () => void;
}
