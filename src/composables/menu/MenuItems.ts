import { CustomCanvas } from "../canvas/CustomCanvas";
import { Frame } from "../slides/Frame";
import { PageFrame } from "../slides/PageFrame";
import { ImageControl } from "../subassembly/controls/ImageControl";
import { ShapeControl } from "../subassembly/controls/ShapeControl";
import { TextControl } from "../subassembly/controls/TextControl";
import type { MenuItemConfig } from "./MenuItemConfig";

/**
 * 菜单项工厂类
 * 负责创建和管理不同类型的菜单项配置
 */
export class MenuItems {
  /**
   * 获取PageFrame的菜单项
   * @param callbacks 回调函数对象
   * @returns PageFrame菜单项配置数组
   */
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

  /**
   * 获取Canvas空白区域的菜单项
   * @param callbacks 回调函数对象
   * @returns Canvas菜单项配置数组
   */
  public static getCanvasMenuItems(callbacks: MenuCallbacks): MenuItemConfig[] {
    return [
      { label: "插入一页", action: callbacks.insertFrame },
      { label: "粘贴", action: callbacks.paste },
      { label: "更换背景", action: callbacks.changeBackground },
      { label: "更换配色", action: callbacks.changeColorScheme },
      { label: "插入文本", action: callbacks.insertText },
      { label: "插入图片", action: callbacks.insertImage },
      { separator: true, label: "", action: () => {} },
      { label: "开始演示", action: callbacks.startPresentation },
    ];
  }

  /**
   * 获取Frame的菜单项
   * @param callbacks 回调函数对象
   * @returns Frame菜单项配置数组
   */
  public static getFrameMenuItems(callbacks: MenuCallbacks): MenuItemConfig[] {
    return [
      { label: "向上一层", action: () => callbacks.moveLayer("up") },
      { label: "向下一层", action: () => callbacks.moveLayer("down") },
      { label: "置于顶层", action: () => callbacks.moveLayer("top") },
      { label: "置于底层", action: () => callbacks.moveLayer("bottom") },
      { separator: true, label: "", action: () => {} },
      { label: "插入文本", action: callbacks.insertText },
      { label: "插入图片", action: callbacks.insertImage },
      { label: "插入形状", action: callbacks.insertShape },
      { separator: true, label: "", action: () => {} },
      { label: "复制", action: callbacks.copyObject },
      { label: "剪切", action: callbacks.cutObject },
      { label: "删除", action: callbacks.deleteObject },
    ];
  }

  /**
   * 获取Frame内部对象的菜单项
   * @param callbacks 回调函数对象
   * @returns Frame内部对象菜单项配置数组
   */
  public static getContentMenuItems(
    callbacks: MenuCallbacks
  ): MenuItemConfig[] {
    return [
      { label: "向上一层", action: () => callbacks.moveLayer("up") },
      { label: "向下一层", action: () => callbacks.moveLayer("down") },
      { label: "置于顶层", action: () => callbacks.moveLayer("top") },
      { label: "置于底层", action: () => callbacks.moveLayer("bottom") },
      { separator: true, label: "", action: () => {} },
      { label: "复制", action: callbacks.copyObject },
      { label: "剪切", action: callbacks.cutObject },
      { label: "删除", action: callbacks.deleteObject },
    ];
  }

  /**
   * 获取所有菜单项配置
   * @param callbacks 回调函数对象
   * @returns 所有菜单项配置的Map
   */
  public static getAllMenuItems(
    callbacks: MenuCallbacks
  ): Map<string, MenuItemConfig[]> {
    const menuItems = new Map<string, MenuItemConfig[]>();

    menuItems.set(PageFrame.type, this.getPageFrameMenuItems(callbacks));
    menuItems.set(CustomCanvas.type, this.getCanvasMenuItems(callbacks));
    menuItems.set(Frame.type, this.getFrameMenuItems(callbacks));
    menuItems.set(TextControl.type, this.getContentMenuItems(callbacks));
    menuItems.set(ImageControl.type, this.getContentMenuItems(callbacks));
    menuItems.set(ShapeControl.type, this.getContentMenuItems(callbacks));

    return menuItems;
  }
}

/**
 * 菜单回调函数接口
 */
export interface MenuCallbacks {
  insertFrame: () => void;
  changeBackground: () => void;
  changeColorScheme: () => void;
  insertText: () => void;
  insertImage: () => void;
  insertShape: () => void; 
  paste: () => void;
  copyObject: () => void;
  cutObject: () => void;
  deleteObject: () => void;
  moveLayer: (direction: "up" | "down" | "top" | "bottom") => void;
  startPresentation: () => void;
}
