import * as fabric from "fabric";
import { Frame } from "../slides/Frame";
import { PageFrame } from "../slides/PageFrame";
import type { MenuItemConfig } from "./MenuItemConfig";
import { MenuItems, type MenuCallbacks } from "./MenuItems";
import { HandlerManager } from "./HandlerManager";
import type { Position } from "./handles/types";
import type { CanvasManager } from "../canvas/CanvasManager";
import { TextControl } from "../subassembly/controls/TextControl";
import { CustomCanvas } from "../canvas/CustomCanvas";

export class ContextMenuManager {
  private canvas: fabric.Canvas;
  private menuElement: HTMLDivElement;
  private menuItems: Map<string, MenuItemConfig[]>;
  private handlerManager: HandlerManager;
  private canvasManager: CanvasManager;
  // 存储最后的事件对象
  private lastEvent: MouseEvent | null = null;

  constructor(canvas: CustomCanvas, canvasManager: CanvasManager) {
    this.canvas = canvas;
    this.canvasManager = canvasManager;
    this.menuElement = this.createMenuElement();
    this.menuItems = this.initializeMenuItems();
    this.handlerManager = new HandlerManager({
      canvas,
      canvasManager,
      contextMenuManager: this,
    });
    this.initializeEventListeners();
  }

  /**
   * 创建菜单DOM元素
   * @returns 菜单DOM元素
   */
  private createMenuElement(): HTMLDivElement {
    const menu = document.createElement("div");
    menu.style.position = "fixed";
    menu.style.display = "none";
    menu.style.backgroundColor = "#ffffff";
    menu.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    menu.style.borderRadius = "4px";
    menu.style.padding = "4px 0";
    menu.style.zIndex = "1000";
    document.body.appendChild(menu);
    return menu;
  }

  /**
   * 初始化菜单项
   * @returns 菜单项配置映射
   */
  private initializeMenuItems(): Map<string, MenuItemConfig[]> {
    const callbacks: MenuCallbacks = {
      insertFrame: () => this.insertFrame(),
      changeBackground: () => this.changeBackground(),
      changeColorScheme: () => this.changeColorScheme(),
      insertText: () => this.insertText(),
      insertImage: () => this.insertImage(),
      paste: () => this.paste(),
      copyObject: () => this.copyObject(),
      cutObject: () => this.cutObject(),
      deleteObject: () => this.deleteObject(),
      moveLayer: (direction) => this.moveActiveObject(direction),
      startPresentation: () => this.startPresentation(),
      insertShape: () => this.insertShape(),
    };

    return MenuItems.getAllMenuItems(callbacks);
  }

  /**
   * 创建单个菜单项
   * @param item 菜单项配置
   * @returns 菜单项DOM元素
   */
  private createMenuItem(item: MenuItemConfig): HTMLDivElement {
    // 如果是分隔线
    if (item.separator) {
      const separator = document.createElement("div");
      separator.style.height = "1px";
      separator.style.backgroundColor = "#e8e8e8";
      separator.style.margin = "4px 0";
      return separator;
    }

    const menuItem = document.createElement("div");
    menuItem.textContent = item.label;
    menuItem.style.padding = "8px 16px";
    menuItem.style.cursor = item.disabled ? "not-allowed" : "pointer";
    menuItem.style.fontSize = "14px";
    menuItem.style.userSelect = "none";
    menuItem.style.color = item.disabled ? "#bfbfbf" : "#000000";
    menuItem.style.display = "flex";
    menuItem.style.alignItems = "center";

    // 如果有图标
    if (item.icon) {
      const icon = document.createElement("span");
      icon.innerHTML = item.icon;
      icon.style.marginRight = "8px";
      menuItem.prepend(icon);
    }

    if (!item.disabled) {
      menuItem.addEventListener("mouseover", () => {
        menuItem.style.backgroundColor = "#f5f5f5";
      });
      menuItem.addEventListener("mouseout", () => {
        menuItem.style.backgroundColor = "transparent";
      });
      menuItem.addEventListener("click", item.action);
    }

    return menuItem;
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners() {
    // console.log("initializeEventListeners");
    const canvasElement = this.canvas.upperCanvasEl;
    // 阻止默认右键菜单
    canvasElement.addEventListener(
      "contextmenu",
      (e) => {
        e.preventDefault();
        return false;
      },
      false
    );
    // 监听右键点击事件
    canvasElement.addEventListener("mousedown", this.handleMouseDown);

    // 点击其他区域关闭菜单
    document.addEventListener("click", () => {
      this.hideContextMenu();
    });

    // ESC键关闭菜单
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideContextMenu();
      }
    });
  }

  /**
   * 处理鼠标按下事件
   */
  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 2) {
      this.lastEvent = e; // 保存事件对象
      // 右键点击
      e.preventDefault();

      // 获取点击位置的对象
      let target:any = this.canvas.findTarget(e);
      if(!target){
        target = this.canvas;
      }
      if (target) {
        // 选中右键点击的对象
        if(!(target instanceof CustomCanvas))this.canvas.setActiveObject(target);
        // this.canvas.requestRenderAll();

        // 显示右键菜单
        this.showContextMenu(e, target);
      } else {
        // 点击了画布空白区域
        this.showCanvasContextMenu(e);
      }
    }
  };

  /**
   * 显示画布空白区域的右键菜单
   * @param e 鼠标事件
   */
  private showCanvasContextMenu(e: MouseEvent) {
    const menuItems = this.menuItems.get("canvas") || [];
    this.renderContextMenu(e, menuItems);
  }

  /**
   * 显示对象的右键菜单
   * @param e 鼠标事件
   * @param target 目标对象
   */
  private showContextMenu(e: MouseEvent, target: fabric.Object) {
    let menuType: string;

    if (target instanceof PageFrame) {
      menuType = PageFrame.type;
    } else if (target instanceof Frame) {
      menuType = Frame.type;
    } else if (target instanceof CustomCanvas) {
      menuType = CustomCanvas.type;
    } else {
      menuType = TextControl.type;
    }
    const menuItems = this.menuItems.get(menuType) || [];
    this.renderContextMenu(e, menuItems);
  }

  /**
   * 渲染上下文菜单
   * @param e 鼠标事件
   * @param menuItems 菜单项配置
   */
  private renderContextMenu(e: MouseEvent, menuItems: MenuItemConfig[]) {
    this.menuElement.innerHTML = "";

    menuItems.forEach((item) => {
      this.menuElement.appendChild(this.createMenuItem(item));
    });

    // 定位菜单
    const x = e.clientX;
    const y = e.clientY;

    this.menuElement.style.left = `${x}px`;
    this.menuElement.style.top = `${y}px`;
    this.menuElement.style.display = "block";

    // 确保菜单不超出视窗
    const rect = this.menuElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (rect.right > viewportWidth) {
      this.menuElement.style.left = `${x - rect.width}px`;
    }

    if (rect.bottom > viewportHeight) {
      this.menuElement.style.top = `${y - rect.height}px`;
    }
  }

  /**
   * 隐藏上下文菜单
   */
  private hideContextMenu() {
    this.menuElement.style.display = "none";
  }

  // /**
  //  * 查找对象所属的Frame
  //  * @param object 目标对象
  //  * @returns 父Frame对象或null
  //  */
  // private findParentFrame(object: fabric.Object): Frame | null {
  //   return (
  //     (this.canvas
  //       .getObjects()
  //       .filter((obj) => obj instanceof Frame)
  //       .find((frame) => (frame as Frame).contents.has(object)) as Frame) ||
  //     null
  //   );
  // }

  /**
   * 获取当前鼠标位置
   * @returns 位置对象
   */
  private getCurrentPosition(): Position | undefined {
    if (!this.lastEvent) return undefined;
    return this.canvas.getPointer(this.lastEvent);
  }

  /**
   * 移动当前选中的对象
   * @param direction 移动方向
   */
  private moveActiveObject(direction: "up" | "down" | "top" | "bottom") {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;

    const position = this.getCurrentPosition();
    const params = {
      canvas: this.canvas,
      target: activeObject,
      position,
    };

    this.handlerManager.layer.handleMoveLayer(params, direction);
    this.hideContextMenu();
  }

  // 以下是菜单项对应的操作方法
  /**
   * 插入新Frame
   */
  private insertFrame() {
    const position = this.getCurrentPosition();
    if (!position) return;

    const params = {
      canvas: this.canvas,
      position,
      target: this.canvas.getActiveObject(),
    };

    this.handlerManager.frame.handleInsertFrame(params);
    this.hideContextMenu();
  }

  /**
   * 更换背景
   */
  private changeBackground() {
    const params = {
      canvas: this.canvas,
      target: this.canvas.getActiveObject(),
      position: this.getCurrentPosition(),
    };

    this.handlerManager.background.handleChangeBackground(params);
    this.hideContextMenu();
  }

  /**
   * 更换配色
   */
  private changeColorScheme() {
    const params = {
      canvas: this.canvas,
      target: this.canvas.getActiveObject(),
      position: this.getCurrentPosition(),
    };

    this.handlerManager.background.handleChangeColorScheme(params);
    this.hideContextMenu();
  }

  /**
   * 插入文本
   */
  private insertText() {
    const position = this.getCurrentPosition();
    if (!position) return;

    const params = {
      canvas: this.canvas,
      target: this.canvas.getActiveObject(),
      position,
    };

    this.handlerManager.content.handleInsertText(params);
    this.hideContextMenu();
  }

  /**
   * 插入图片
   */
  private insertImage() {
    const params = {
      canvas: this.canvas,
      target: this.canvas.getActiveObject(),
      position: this.getCurrentPosition(),
    };

    this.handlerManager.content.handleInsertImage(params);
    this.hideContextMenu();
  }

  private insertShape(){
    const params = {
      canvas: this.canvas,
      target: this.canvas.getActiveObject(),
      position: this.getCurrentPosition(),
    };

    this.handlerManager.content.handleInsertShape(params);
    this.hideContextMenu();
  }

  /**
   * 粘贴操作
   */
  private paste() {
    const position = this.getCurrentPosition();
    if (!position) return;

    const params = {
      canvas: this.canvas,
      target: this.canvas.getActiveObject(),
      position,
    };

    this.handlerManager.content.handlePaste(params);
    this.hideContextMenu();
  }

  /**
   * 复制对象
   */
  private copyObject() {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;

    const params = {
      canvas: this.canvas,
      target: activeObject,
      position: this.getCurrentPosition(),
    };

    this.handlerManager.content.handleCopyObject(params);
    this.hideContextMenu();
  }

  /**
   * 剪切对象
   */
  private cutObject() {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;

    const params = {
      canvas: this.canvas,
      target: activeObject,
      position: this.getCurrentPosition(),
    };

    this.handlerManager.content.handleCutObject(params);
    this.hideContextMenu();
  }

  /**
   * 删除对象
   */
  private deleteObject() {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;

    const params = {
      canvas: this.canvas,
      target: activeObject,
      position: this.getCurrentPosition(),
    };

    if (activeObject instanceof Frame) {
      this.handlerManager.frame.handleDeleteFrame(params);
    } else {
      this.handlerManager.content.handleDeleteObject(params);
    }

    this.hideContextMenu();
  }

  /**
   * 开始演示
   */
  private startPresentation() {
    const params = {
      canvas: this.canvas,
      target: this.canvas.getActiveObject(),
      position: this.getCurrentPosition(),
    };

    this.handlerManager.presentation.handleStartPresentation(params);
    this.hideContextMenu();
  }

  /**
   * 销毁上下文菜单管理器
   */
  public destroy() {
    // 移除事件监听
    const canvasElement = this.canvas.upperCanvasEl;
    canvasElement.removeEventListener("contextmenu", (e) => e.preventDefault());
    canvasElement.removeEventListener("mousedown", this.handleMouseDown);
    document.removeEventListener("click", this.hideContextMenu);

    // 移除DOM元素
    if (this.menuElement && this.menuElement.parentNode) {
      this.menuElement.parentNode.removeChild(this.menuElement);
    }
  }
}
