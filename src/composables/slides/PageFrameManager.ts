import * as fabric from "fabric";
import { PageFrame } from "./PageFrame";
import { FrameManager } from "./FrameManager";
import type { PageFrameOptions } from "../../types/canvas";
import { Frame } from "./Frame";
import { PAGE_SIZE, SIZES, SLIDE_STYLES } from "../../constants/theme";
import { PageFrameEventHandler } from "./events/PageFrameEventHandler";
import { ColorUtils } from "../../utils/ColorUtils";

export class PageFrameManager {
  private canvas: any;
  private pageFrame: any;
  private frameManager: FrameManager;
  private pageFrameEventHandler: PageFrameEventHandler;

  constructor(canvas: any) {
    this.canvas = canvas;
    this.frameManager = new FrameManager(canvas);
    this.pageFrameEventHandler = new PageFrameEventHandler(canvas, this);
    this.initializeCanvas();
  }

  private initializeCanvas() {
    this.createDefaultPage();
    // this.initializeEventHandlers();
  }

  /**
   * 创建默认页面
   * @returns {PageFrame} 创建的页面实例
   */
  public createDefaultPage(): PageFrame {
    const { width, height } = this.calculatePageDimensions();
    const position = this.calculatePagePosition(width, height);
    // const styles = this.getPageStyles();

    this.pageFrame = new PageFrame({
      ...position,
      // ...styles,
      // fill: ColorUtils.generateSoftRandomColor(),
      width,
      height,
    });
    console.log("createDefaultPage", this.pageFrameEventHandler);
    this.pageFrameEventHandler.setupPageFrameEvents(this.pageFrame);
    // this.setCurrentPage(page);


    //TODO 测试代码
    // const frame = this.addNewFrame();

    // this.addNewFrame();

    // setTimeout(() => {
    //   this.canvas.setActiveObject(frame);
    // }, 0);
    return this.pageFrame;
  }

  /**
   * 计算页面尺寸
   * @private
   * @returns {{width: number, height: number}}
   */
  private calculatePageDimensions(): { width: number; height: number } {
    const zoom = this.canvas.getZoom();
    return {
      width: PAGE_SIZE.PAGE_FRAME.WIDTH / zoom,
      height: PAGE_SIZE.PAGE_FRAME.HEIGHT / zoom,
    };
  }

  /**
   * 计算页面位置
   * @private
   * @param {number} width - 页面宽度
   * @param {number} height - 页面高度
   * @returns {{left: number, top: number}}
   */
  private calculatePagePosition(
    width: number,
    height: number
  ): { left: number; top: number } {
    const vp = this.canvas.getVpCenter();
    return {
      left: vp.x - width / 2,
      top: vp.y - height / 2,
    };
  }


  /**
   * 添加新的Frame
   * @returns {Frame | null} 创建的Frame实例或null
   */
  public addNewFrame(): Frame | null {
    if (!this.pageFrame) {
      console.error("No active page");
      return null;
    }

    const frame = this.createFrame();
    if (!frame) return null;

    this.arrangeFrameInCanvas(frame);
    return frame;
  }

  /**
   * 创建Frame
   * @private
   * @returns {Frame | null}
   */
  private createFrame(): Frame | null {
    const { width, height } = this.calculateFrameDimensions();
    const position = this.calculateFramePosition(width, height);
    // const styles = this.getFrameStyles();

    return this.frameManager.createFrame({
      ...position,
      // ...styles,
      width,
      height,
      parentPage: this.pageFrame,
    });
  }

  /**
   * 计算Frame尺寸
   * @private
   * @returns {{width: number, height: number}}
   */
  private calculateFrameDimensions(): { width: number; height: number } {
    const zoom = this.canvas.getZoom();
    return {
      width: PAGE_SIZE.FRAME.WIDTH / zoom,
      height: PAGE_SIZE.FRAME.HEIGHT / zoom,
    };
  }

  /**
   * 计算Frame位置
   * @private
   * @param {number} width - Frame宽度
   * @param {number} height - Frame高度
   * @returns {{left: number, top: number}}
   */
  private calculateFramePosition(
    width: number,
    height: number
  ): { left: number; top: number } {
    const vp = this.canvas.getVpCenter();
    return {
      left: vp.x - width / 2,
      top: vp.y - height / 2,
    };
  }


  /**
   * 在画布中排列Frame
   * @private
   * @param {Frame} frame - 要排列的Frame
   */
  private arrangeFrameInCanvas(frame: Frame): void {
    if (!this.pageFrame) return;

    // this.currentPage.addFrame(frame);
    this.canvas.sendObjectToBack(this.pageFrame);
    // 确保所有Frame都在其他元素之上
    const allFrames = this.canvas
      .getObjects()
      .filter((obj: any) => obj instanceof Frame);
    allFrames.forEach((frameObj: Frame) => {
      if (frameObj !== frame) {
        this.canvas.bringObjectToFront(frameObj);
      }
    });
    this.canvas.bringObjectToFront(frame);
    this.canvas.setActiveObject(frame);
  }

  /**
   * 更新引用关系
   * 在从JSON导入后调用，重新建立对象引用
   */
  public updateReferences() {
    // 查找画布中的PageFrame
    const canvas = this.canvas;
    const objects = canvas.getObjects();
    
    // 找到PageFrame
    const pageFrame = objects.find((obj: { type: typeof PageFrame; }) => obj.type === PageFrame);
    if (pageFrame) {
      this.pageFrame = pageFrame;
    }
    
    // 更新FrameManager的引用
    this.frameManager.updateReferences();
  }

  // 获取当前页面
  public getPageFrame(): PageFrame | null {
    return this.pageFrame;
  }

  // 删除Frame
  public deleteFrame(frameId: string) {
    const frame = this.frameManager.getFrame(frameId);
    if (frame && this.pageFrame) {
      this.pageFrame.removeFrame(frame);
      this.frameManager.deleteFrame(frameId);
    }
  }

  // 获取当前选中的Frame
  public getCurrentFrame(): Frame | null {
    return this.frameManager.getCurrentFrame();
  }

  // 获取Frame管理器
  public getFrameManager(): FrameManager {
    return this.frameManager;
  }

  // 设置页面尺寸
  public setPageSize(width: number, height: number) {
    if (this.pageFrame) {
      this.pageFrame.set({
        width: width,
        height: height,
      });
      this.canvas.requestRenderAll();
    }
  }

  // 清空画布
  public clear() {
    if (this.pageFrame) {
      this.canvas.remove(this.pageFrame);
    }
    this.frameManager.clear();
    // this.pageFrame = null;
    this.canvas.requestRenderAll();
  }

  /**
   * 销毁管理器
   * @public
   */
  public destroy(): void {
    // 清理画布内容
    this.clear();
  }
}
