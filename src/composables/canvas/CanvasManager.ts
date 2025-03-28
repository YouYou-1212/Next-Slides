// src/lib/canvas/CanvasManager.ts
import * as fabric from "fabric";
import { Frame } from "../slides/Frame";
import { PageFrameManager } from "../slides/PageFrameManager";
import { FrameManager } from "../slides/FrameManager";
import { ControlsManager } from "../subassembly/ControlsManager";
import { ContextMenuManager } from "../menu/ContextMenuManager";

import { initAligningGuidelines } from '../../../node_modules/fabric/extensions';
import { ModeManager } from "./ModeManager";
import { COLORS, SIZES, STYLES } from "../../constants/theme";
import { EventManager } from "./EventManager";
import { calculateViewportInfo, setCanvasManager } from "../../utils/CanvasUtils";
import { CanvasSyncManager } from "./CanvasSyncManager";
import { CustomCanvas } from "./CustomCanvas";
import type { Slides } from "../slides/Slides";

//默认演示模板
import defaultTemplate from '../../../public/res/NextSlide_Export_20250318_1151.json';


export interface CanvasOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  selection?: boolean;
  preserveObjectStacking?: boolean;
}

export class CanvasManager {
  // 子组件管理器
  private controlsManager: ControlsManager;
  //主画布
  private canvas: CustomCanvas;
  //演示画布
  private presentationCanvas: fabric.Canvas;
  // 添加画布同步管理器
  private canvasSyncManager: CanvasSyncManager;

  private pageFrameManager: PageFrameManager;
  private frameManager: FrameManager;
  private modeManager: ModeManager;
  // 添加 EventManager
  private eventManager: EventManager;
  //是否拖动状态
  private isDragging = false;
  private lastPosX = 0;
  private lastPosY = 0;
  private contextMenuManager: ContextMenuManager;
  // 空格拖动状态
  private isSpaceDragging = false;
  private currentDragMode: 'default' | 'pan' | 'select' = 'default';

  constructor(
    canvasElement: HTMLCanvasElement,
    presentationCanvasElement: HTMLCanvasElement,
    containerElement: HTMLElement,
    options: CanvasOptions = {}
  ) {
    // 初始化画布
    const defaultOptions = {
      width: containerElement.clientWidth,
      height: containerElement.clientHeight,
      backgroundColor: "#00000000",
      selection: true,
      preserveObjectStacking: true,
      allowTouchScrolling: false,
      stopContextMenu: true,
      skipOffscreen: true, // 跳过屏幕外对象渲染
      fireRightClick: false, // 禁用右键事件处理
      fireMiddleClick: false, // 禁用中键事件处理
      enableRetinaScaling: true, // 支持高分辨率显示
      renderOnAddRemove: true, // 减少自动渲染
      stateful: false, // 减少状态更新
      // selection: false,           // 禁用多选以提高性能
      ...options,
    };

    this.canvas = new CustomCanvas(canvasElement, defaultOptions);
    this.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];

    // 初始化演示画布
    this.presentationCanvas = new fabric.Canvas(presentationCanvasElement, {
      ...defaultOptions,
      selection: false,
      // backgroundColor: "#fff", //此处设置背景无效
    });
    this.presentationCanvas.viewportTransform = [1, 0, 0, 1, 0, 0];

    // 初始化画布同步管理器
    this.canvasSyncManager = new CanvasSyncManager(
      this.canvas,
      this.presentationCanvas
    );

    // 启用 GPU 加速
    // this.canvas.enableRetinaScaling = true;
    // this.canvas.selection = false;
    // this.canvas.renderOnAddRemove = false;

    // // 设置画布样式以启用硬件加速
    this.canvas.wrapperEl.style.transform = "translateZ(0)";
    this.canvas.wrapperEl.style.backfaceVisibility = "hidden";
    this.canvas.wrapperEl.style.perspective = "1000px";
    this.canvas.wrapperEl.style.willChange = "transform";

    // 同样为演示画布启用 GPU 加速
    this.presentationCanvas.wrapperEl.style.transform = "translateZ(0)";
    this.presentationCanvas.wrapperEl.style.backfaceVisibility = "hidden";
    this.presentationCanvas.wrapperEl.style.perspective = "1000px";
    this.presentationCanvas.wrapperEl.style.willChange = "transform";

    // 减少不必要的事件检查
    this.canvas.selection = true;
    this.canvas.skipTargetFind = false;
    this.canvas.perPixelTargetFind = false;
    this.canvas.targetFindTolerance = 4;

    this.canvas.selection = true; // 保持选择功能
    this.canvas.skipTargetFind = false;
    this.canvas.perPixelTargetFind = false;

    fabric.InteractiveFabricObject.createControls = function () {
      // console.log("createControls");
      const controls = fabric.controlsUtils.createObjectDefaultControls();
      // 移除 mtr 控制点
      delete (controls as any).mtr;
      return { controls };
    };

    // 设置全局控制点样式
    fabric.InteractiveFabricObject.ownDefaults = {
      ...fabric.InteractiveFabricObject.ownDefaults,
      cornerColor: STYLES.CORNER.COLOR,
      cornerStyle: STYLES.CORNER.STYLE,
      padding: SIZES.PADDING_0,
      cornerSize: STYLES.CORNER.SIZE,
      transparentCorners: STYLES.CORNER.TRANSPARENT,
      lockRotation: false,
    };

    // 启用辅助线
    this.initAligningGuidelines();

    // 初始化管理器
    this.pageFrameManager = new PageFrameManager(this.canvas);
    this.frameManager = this.pageFrameManager.getFrameManager();
    this.controlsManager = new ControlsManager(this.canvas, this);
    // 模式管理器
    this.modeManager = new ModeManager(this.canvas, this.presentationCanvas);
    // 初始化事件管理器
    this.eventManager = new EventManager(this.canvas, this);
    // 初始化空格拖动模式
    // this.initSpaceDragMode();
    // this.initEventHandlers();
    // 初始化右键菜单管理器
    this.contextMenuManager = new ContextMenuManager(this.canvas, this);

    this.initPageFramge();
    this.initResizeListener();

    setCanvasManager(this);

    // 导入默认模板
    this.importCanvasFromJSON(defaultTemplate);
  }


  /**
   * 初始化辅助线
   */
  initAligningGuidelines() {
    const config = {
      margin: 4,
      width: 1,
      color: 'rgb(255,0,0,0.9)',
    };

    const deactivate = initAligningGuidelines(this.canvas, config);
  }

  /**
   * 初始化PageFrame
   */
  initPageFramge() {
    const page = this.createPageFrame();
    this.canvas.add(page);
    this.canvas.centerObject(page);
    this.canvas.bringObjectToFront(page);
  }

  initResizeListener() {
    // 添加窗口 resize 事件监听
    window.addEventListener("resize", () => {
      // 获取父容器尺寸
      const container = this.canvas.wrapperEl?.parentElement;
      if (!container) return;

      // 设置 canvas 尺寸为父容器尺寸
      this.canvas.setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });

      // 重新渲染 canvas
      this.canvas.requestRenderAll();
    });

    // 初始化时也调用一次以设置正确的尺寸
    window.dispatchEvent(new Event("resize"));
  }

  // 获取控件管理器
  public getControlsManager() {
    return this.controlsManager;
  }

  public getModeManager(): ModeManager {
    return this.modeManager;
  }

  // PageFrame 相关方法
  public createPageFrame() {
    return this.pageFrameManager.createDefaultPage();
  }

  public getPageFrame() {
    return this.pageFrameManager.getPageFrame();
  }

  // Frame 相关方法
  public addNewFrame() {
    return this.pageFrameManager.addNewFrame();
  }

  /**
   * 获取当前选中帧
   */
  public getCurrentFrame() {
    return this.frameManager.getCurrentFrame();
  }

  public getAllFrames() {
    const frames = this.frameManager.getAllFrames();
    return frames;
  }


  /**
   * 返回所有的Slides，包含PageFrame
   * @returns 
   */
  public getAllSlides() {
    const pageFrame = this.getPageFrame();
    const frames = this.frameManager.getAllFrames();

    // 确保返回的数组中PageFrame在第一位
    return pageFrame ? [pageFrame, ...frames] : frames;
  }


  public deleteFrame(frameId: string) {
    this.pageFrameManager.deleteFrame(frameId);
  }

  public moveFrameUp(frameId: string) {
    this.frameManager.moveFrameUp(frameId);
  }

  public moveFrameDown(frameId: string) {
    this.frameManager.moveFrameDown(frameId);
  }

  // 画布管理方法
  public handleResize(width: number, height: number) {
    this.canvas.setDimensions({ width, height });
    this.presentationCanvas.setDimensions({ width, height });
  }

  public destroy() {
    // 清理平移模式的事件处理器
    this.disablePanMode();
    this.canvas.dispose();
    this.presentationCanvas.dispose();

    // 销毁同步管理器
    this.canvasSyncManager.destroy();
    if (this.canvasSyncManager) {
      this.canvasSyncManager.destroy();
    }
  }

  /**
   * 导航到选中的帧
   * 
   */
  public navigateToFrame(frame: Slides) {
    // 获取画布
    const canvas = this.getMainCanvas();
    const viewportInfo: any = calculateViewportInfo(canvas, frame)
    // 设置视口变换，使帧居中
    canvas.setViewportTransform(viewportInfo.transform);
  };

  public setZoom(zoom: number) {
    const centerPoint:fabric.Point = this.canvas.getVpCenter();
    this.canvas.zoomToPoint(centerPoint , zoom);
  }

  public getZoom() {
    return this.canvas.getZoom();
  }

  public setBackgroundColor(color: string) {
    this.canvas.backgroundColor = color;
    this.canvas.requestRenderAll();
  }

  // 获取管理器实例
  public getPageFrameManager() {
    return this.pageFrameManager;
  }

  public getFrameManager() {
    return this.frameManager;
  }

  public getAllObjects() {
    return this.canvas.getObjects();
  }

  public getMainCanvas() {
    return this.canvas;
  }

  public getPresentationCanvas() {
    return this.presentationCanvas;
  }

  public clear() {
    this.pageFrameManager.clear();
    this.canvas.clear();
  }


  /**
   * 移除对象
   * @param object
   */
  public removeObject(object: fabric.Object) {
    const parentFrame = this.getFrameManager().findParentFrame(object);
    if (parentFrame) {
      parentFrame.removeContent(object);
    }
    this.canvas.remove(object);
  }

  /**
    * 设置画布的拖动模式
    * @param mode 拖动模式: 'default' - 默认模式, 'pan' - 平移模式, 'select' - 选择模式
    * @param isSpaceDragging 是否是空格拖动
    */
  public setDragMode(mode: 'default' | 'pan' | 'select'  , isSpaceDragging = false) {
    // 如果模式没有变化，则不执行任何操作
    if (this.currentDragMode === mode) return;
    this.isSpaceDragging = isSpaceDragging;

    // 保存新的模式
    this.currentDragMode = mode;

    // 获取画布实例
    const canvas = this.getMainCanvas();

    // 根据模式设置画布属性
    switch (mode) {
      case 'pan':
        canvas.selection = false;
        canvas.skipTargetFind = true;
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';
        canvas.moveCursor = 'grabbing';
        this.enablePanMode();
        break;

      case 'select':
        canvas.selection = true;
        canvas.skipTargetFind = false;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
        canvas.moveCursor = 'move';
        this.disablePanMode();
        break;

      case 'default':
      default:
        // 默认模式：启用对象选择
        canvas.selection = true;
        canvas.skipTargetFind = false;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
        canvas.moveCursor = 'move';

        // 禁用平移模式
        this.disablePanMode();
        break;
    }

    // 重新渲染画布
    canvas.requestRenderAll();
  }


  /**
    * 启用平移模式
    * 添加鼠标事件处理器以实现画布拖动
    */
  private enablePanMode() {
    const canvas = this.getMainCanvas();

    // 移除可能存在的旧事件处理器
    this.disablePanMode();

    // 添加鼠标按下事件
    canvas.on('mouse:down', this.handlePanMouseDown);
    // 添加鼠标移动事件
    canvas.on('mouse:move', this.handlePanMouseMove);
    // 添加鼠标松开事件
    canvas.on('mouse:up', this.handlePanMouseUp);
  }

  /**
   * 禁用平移模式
   * 移除鼠标事件处理器
   */
  private disablePanMode() {
    const canvas = this.getMainCanvas();

    // 移除鼠标事件处理器
    canvas.off('mouse:down', this.handlePanMouseDown);
    canvas.off('mouse:move', this.handlePanMouseMove);
    canvas.off('mouse:up', this.handlePanMouseUp);

    // 重置拖动状态
    this.isDragging = false;
  }

  /**
   * 处理平移模式下的鼠标按下事件
   */
  private handlePanMouseDown = (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
    if (!opt) return;

    // 设置拖动状态
    this.isDragging = true;

    // 记录鼠标位置
    this.lastPosX = opt.viewportPoint.x;
    this.lastPosY = opt.viewportPoint.y;

    // 更改光标样式
    this.canvas.defaultCursor = 'grabbing';
  };

  /**
   * 处理平移模式下的鼠标移动事件
   */
  private handlePanMouseMove = (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
    if (!this.isDragging) return;

    if (!opt) return;

   // 计算鼠标移动距离
   const deltaX = opt.viewportPoint.x - this.lastPosX;
   const deltaY = opt.viewportPoint.y - this.lastPosY;

    // 更新鼠标位置
    this.lastPosX = opt.viewportPoint.x;
    this.lastPosY = opt.viewportPoint.y;

    // 获取当前视口变换
    const vpt = this.canvas.viewportTransform;
    if (!vpt) return;

    // 更新视口变换以实现画布平移
    vpt[4] += deltaX;
    vpt[5] += deltaY;

    // 应用新的视口变换
    this.canvas.setViewportTransform(vpt);

    // 阻止事件冒泡和默认行为
    const evt = opt.e;
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }
  };

  /**
   * 处理平移模式下的鼠标松开事件
   */
  private handlePanMouseUp = () => {
    // 重置拖动状态
    this.isDragging = false;

    // 恢复光标样式
    this.canvas.defaultCursor = 'grab';
  };

  /**
   * 获取当前拖动模式
   * @returns 当前的拖动模式
   */
  public getDragMode() {
    return this.currentDragMode;
  }


  /**
   * 是否处于拖动模式
   * @returns 
   */
  public isDragMode() {
    return this.currentDragMode === 'pan' ? true : false; 
  }



  /**
     * 将画布内容导出为JSON
     */
  public exportCanvasToJSON() {
    try {
      // 导出前取消所有选中状态
      this.canvas.discardActiveObject();
      const currentTransform: any = [...this.canvas.viewportTransform!];
      // 临时重置视口变换为默认值
      this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      // 获取画布JSON数据
      const canvasJSON = this.canvas.toJSON();
      // 恢复原始视口变换
      this.canvas.setViewportTransform(currentTransform);

      // 创建Blob对象
      const blob = new Blob([JSON.stringify(canvasJSON, null, 2)], { type: 'application/json' });

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // 设置文件名
      const date = new Date();
      const fileName = `NextSlide_Export_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}.json`;
      link.download = fileName;

      // 触发下载
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('画布导出成功');
    } catch (error) {
      console.error('导出画布失败:', error);
    }
  }

  /**
   * 从JSON导入画布内容
   * @param jsonData JSON字符串或对象
   */
  public importCanvasFromJSON(jsonData: string | object) {
    console.log('importCanvasFromJSON', jsonData);
    try {
      // 清空当前画布
      this.clear();

      // 解析JSON数据
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      // 加载JSON到画布
      this.canvas.loadFromJSON(data).then(() => {
        // 加载完成后的回调
        console.log('画布导入成功');
        // 重新渲染画布
        this.canvas.requestRenderAll();

        // 更新PageFrame和Frame的引用
        this.pageFrameManager.updateReferences();
      });
    } catch (error) {
      console.error('导入画布失败:', error);
    }
  }

}
