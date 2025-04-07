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
import { ActiveSelection } from "fabric";
import { GroupControl } from "../subassembly/controls/GroupControl";
import { PictureControl } from "../subassembly/controls/PictureControl";

export class ContextMenuManager {
  private canvas: fabric.Canvas;
  private menuElement: HTMLDivElement;
  private menuItems: Map<string, MenuItemConfig[]>;
  private handlerManager: HandlerManager;
  private canvasManager: CanvasManager;
  
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

  
  private initializeMenuItems(): Map<string, MenuItemConfig[]> {
    const callbacks: MenuCallbacks = {
      insertFrame: () => this.insertFrame(),
      changeBackground: () => this.changeBackground(),
      changeColorScheme: () => this.changeColorScheme(),
      insertText: () => this.insertText(),
      insertImage: () => this.insertImage(),
      createGroup: () => this.createGroup(),
      cancelGroup: () => this.cancelGroup(),
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

  
  private createMenuItem(item: MenuItemConfig): HTMLDivElement {
    
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

  
  private initializeEventListeners() {
    
    const canvasElement = this.canvas.upperCanvasEl;
    
    canvasElement.addEventListener(
      "contextmenu",
      (e) => {
        e.preventDefault();
        return false;
      },
      false
    );
    
    canvasElement.addEventListener("mousedown", this.handleMouseDown);

    
    document.addEventListener("click", () => {
      this.hideContextMenu();
    });

    
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideContextMenu();
      }
    });
  }

  
  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 2) {
      this.lastEvent = e; 
      
      e.preventDefault();

      
      let target: any = this.canvas.findTarget(e);
      if (!target) {
        target = this.canvas;
      }
      if (target) {
        
        if (!(target instanceof CustomCanvas)) this.canvas.setActiveObject(target);
        

        
        this.showContextMenu(e, target);
      } else {
        
        this.showCanvasContextMenu(e);
      }
    }
  };

  
  private showCanvasContextMenu(e: MouseEvent) {
    const menuItems = this.menuItems.get("canvas") || [];
    this.renderContextMenu(e, menuItems);
  }

  
  private showContextMenu(e: MouseEvent, target: fabric.Object) {
    let menuType: string;

    switch (true) {
      case target instanceof PageFrame:
        menuType = PageFrame.type;
        break;
      case target instanceof Frame:
        menuType = Frame.type;
        break;
      
      
      
      case target instanceof TextControl:
        menuType = TextControl.type;
        break;
      case target instanceof PictureControl:
        menuType = PictureControl.type;
        break;
      case target instanceof ActiveSelection:
        menuType = ActiveSelection.type;
        break;
      case target instanceof GroupControl:
        menuType = GroupControl.type;
        break;
      default:
        menuType = CustomCanvas.type;
        break;
    }
    const menuItems = this.menuItems.get(menuType) || [];
    this.renderContextMenu(e, menuItems);
  }

  
  private renderContextMenu(e: MouseEvent, menuItems: MenuItemConfig[]) {
    this.menuElement.innerHTML = "";

    menuItems.forEach((item) => {
      this.menuElement.appendChild(this.createMenuItem(item));
    });

    
    const x = e.clientX;
    const y = e.clientY;

    this.menuElement.style.left = `${x}px`;
    this.menuElement.style.top = `${y}px`;
    this.menuElement.style.display = "block";

    
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

  
  private hideContextMenu() {
    this.menuElement.style.display = "none";
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  

  
  private getCurrentPosition(): Position | undefined {
    if (!this.lastEvent) return undefined;
    return this.canvas.getPointer(this.lastEvent);
  }

  
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

  
  private changeBackground() {
    const params = {
      canvas: this.canvas,
      target: this.canvas.getActiveObject(),
      position: this.getCurrentPosition(),
    };

    this.handlerManager.background.handleChangeBackground(params);
    this.hideContextMenu();
  }

  
  private changeColorScheme() {
    const params = {
      canvas: this.canvas,
      target: this.canvas.getActiveObject(),
      position: this.getCurrentPosition(),
    };

    this.handlerManager.background.handleChangeColorScheme(params);
    this.hideContextMenu();
  }

  
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

  
  private insertImage() {
    const params = {
      canvas: this.canvas,
      target: this.canvas.getActiveObject(),
      position: this.getCurrentPosition(),
    };

    this.handlerManager.content.handleInsertImage(params);
    this.hideContextMenu();
  }

  private insertShape() {
    const params = {
      canvas: this.canvas,
      target: this.canvas.getActiveObject(),
      position: this.getCurrentPosition(),
    };

    this.handlerManager.content.handleInsertShape(params);
    this.hideContextMenu();
  }


  
  private createGroup() {
    const params = {
      canvas: this.canvas,
      target: this.canvas.getActiveObject(),
      position: this.getCurrentPosition(),
    };

    this.handlerManager.content.handleCreateGroup(params);
    this.hideContextMenu();
  }

  
  private cancelGroup() {
    const params = {
      canvas: this.canvas,
      target: this.canvas.getActiveObject(),
      position: this.getCurrentPosition(),
    };

    this.handlerManager.content.handleCancelGroup(params);
    this.hideContextMenu();
  }

  
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

  
  private startPresentation() {
    const params = {
      canvas: this.canvas,
      target: this.canvas.getActiveObject(),
      position: this.getCurrentPosition(),
    };

    this.handlerManager.presentation.handleStartPresentation(params);
    this.hideContextMenu();
  }

  
  public destroy() {
    
    const canvasElement = this.canvas.upperCanvasEl;
    canvasElement.removeEventListener("contextmenu", (e) => e.preventDefault());
    canvasElement.removeEventListener("mousedown", this.handleMouseDown);
    document.removeEventListener("click", this.hideContextMenu);

    
    if (this.menuElement && this.menuElement.parentNode) {
      this.menuElement.parentNode.removeChild(this.menuElement);
    }
  }
}
