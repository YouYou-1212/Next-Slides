import { Frame } from "./Frame";
import * as fabric from "fabric";
import type { FrameOptions, FrameNumberStyle } from "../../types/canvas";
import { ColorUtils } from "../../utils/ColorUtils";
import { COLORS } from "../../constants/theme";
import { FrameEventHandler } from "./events/FrameEventHandler";
import { EventBus, EventTypes } from "../../utils/EventBus";
import type { CustomCanvas } from "../canvas/CustomCanvas";

export class FrameManager {
  private frames: Map<string, Frame> = new Map();
  private canvas: CustomCanvas;
  private frameEventHandler: FrameEventHandler;
  private currentFrame: Frame | null = null;

  constructor(canvas: CustomCanvas) {
    this.canvas = canvas;
    this.frameEventHandler = new FrameEventHandler(canvas, this);
  }

  // 创建新的Frame
  createFrame(options: FrameOptions): Frame {
    // 设置初始order
    const order = this.frames.size + 1;
    // 调试日志
    console.log("Creating frame with order:", order);

    const frame = new Frame({
      ...options,
      // fill: ColorUtils.generateSoftRandomColor(),
      // fill: COLORS.TRANSPARENT,
      order: order,
    });
    //给Frame添加事件处理
    this.frameEventHandler.setupFrameEvents(frame);

    this.frames.set(frame.id, frame);
    this.canvas.add(frame);

    // 创建并关联序号标签
    // this.frameNumberManager.createFrameNumber(frame);

    this.canvas.requestRenderAll();

    // 发出Frame添加事件
    EventBus.emit(EventTypes.FRAME.FRAME_ADDED, {
      frameId: frame.id,
      frame: frame,
      framesCount: this.frames.size,
      frames: this.getAllFrames()
    });

    // 同时触发画布更新事件
    // EventBus.emit(EventTypes.CANVAS.CANVAS_UPDATE, {
    //   type: "frame_added",
    //   frameId: frame.id
    // });

    return frame;
  }

  /**
   * 更新FrameNumber的位置
   * @param frameId Frame的ID
   * @param position 新的位置
   */
  public updateNumberPositionForFrame(frame: Frame) {
    // this.frameNumberManager.updateNumberPositionForFrame(frame);
  }

  // 删除Frame
  deleteFrame(frameId: string) {
    const frame = this.frames.get(frameId);
    if (frame) {
      frame.clearContents();
      this.canvas.remove(frame);
      this.frames.delete(frameId);

      // 发出Frame删除事件
      EventBus.emit(EventTypes.FRAME.FRAME_REMOVED, {
        frameId: frameId,
        framesCount: this.frames.size,
        frames: this.getAllFrames()
      });
    }

    // this.frameNumberManager.deleteFrameNumber(frameId);
    this.updateFrameOrder();

    // 同时触发画布更新事件   这里可以不用触发，Canvas ObjectEvent中已经触发
    // EventBus.emit(EventTypes.CANVAS.CANVAS_UPDATE, {
    //   type: EventTypes.FRAME.FRAME_REMOVED,
    //   frameId: frameId
    // });
  }

  // 获取指定Frame
  getFrame(frameId: string): Frame | undefined {
    return this.frames.get(frameId);
  }

  // 获取所有Frame
  getAllFrames(): Frame[] {
    return Array.from(this.frames.values()).sort((a, b) => a.order - b.order);
  }

  // 设置当前选中的Frame
  setCurrentFrame(frame: Frame | null) {
    this.currentFrame = frame;

    // 发出当前Frame更新事件
    if (frame) {
      EventBus.emit(EventTypes.FRAME.FRAME_UPDATED, {
        frameId: frame.id,
        frame: frame,
        isCurrent: true
      });
    }
  }

  // 获取当前选中的Frame
  getCurrentFrame(): Frame | null {
    return this.currentFrame;
  }

  // 更新Frame的顺序
  private updateFrameOrder() {
    const frames = Array.from(this.frames.values());
    frames.sort((a, b) => a.order - b.order);

    frames.forEach((frame, index) => {
      const newOrder = index + 1;
      frame.order = newOrder;

      // this.frameNumberManager.updateNumberText(frame);
    });
    // this.canvas.requestRenderAll();

    // 发出Frame重新排序事件
    EventBus.emit(EventTypes.FRAME.FRAMES_REORDERED, {
      frames: this.getAllFrames()
    });
  }


/**
   * 更新引用关系
   * 在从JSON导入后调用，重新建立对象引用
   */
public updateReferences() {
  // 查找画布中的所有Frame
  const canvas = this.canvas;
  const objects = canvas.getObjects();
  // console.log("更新引用关系前，objects：", objects);
  // 找到所有Frame
  const frames = objects.filter(obj => obj.type === Frame.type) as Frame[];
  
  // 清空当前Map
  this.frames.clear();
  
  // 将找到的Frame添加到Map中
  frames.forEach(frame => {
    this.frames.set(frame.id, frame);
    // 同时触发画布更新事件
    EventBus.emit(EventTypes.CANVAS.CANVAS_UPDATE, { type: EventTypes.CANVAS.CANVAS_UPDATE, target: frame });
  });
  // console.log("更新引用关系后，frames数量：", this.frames.size);
  
  // 如果当前没有选中的Frame，但有Frame存在，则选中第一个
  if (!this.currentFrame && frames.length > 0) {
    this.currentFrame = frames[0];
  }
}


  // 移动Frame顺序
  moveFrameUp(frameId: string) {
    const frame = this.frames.get(frameId);
    if (frame && frame.order > 1) {
      const prevFrame = this.findFrameByOrder(frame.order - 1);
      if (prevFrame) {
        const tempOrder = frame.order;
        frame.order = prevFrame.order;
        prevFrame.order = tempOrder;
        this.canvas.requestRenderAll();

        // 更新Frame顺序
        this.updateFrameOrder();
      }
    }
  }

  moveFrameDown(frameId: string) {
    const frame = this.frames.get(frameId);
    if (frame && frame.order < this.frames.size) {
      const nextFrame = this.findFrameByOrder(frame.order + 1);
      if (nextFrame) {
        const tempOrder = frame.order;
        frame.order = nextFrame.order;
        nextFrame.order = tempOrder;
        this.canvas.requestRenderAll();

        // 更新Frame顺序
        this.updateFrameOrder();
      }
    }
  }

  private findFrameByOrder(order: number): Frame | undefined {
    return Array.from(this.frames.values()).find(
      (frame) => frame.order === order
    );
  }

  /**
   * 查找包含指定对象的Frame
   * @param object 要查找的对象
   * @returns 包含对象的Frame，如果未找到则返回null
   */
  public findParentFrame(object: fabric.Object): Frame | null {
    return (
      (this.canvas
        .getObjects()
        .filter((obj) => obj instanceof Frame)
        .find((frame) => (frame as Frame).contents.has(object)) as Frame) ||
      null
    );
  }

  // 清空所有Frame
  clear() {
    this.frames.forEach((frame) => {
      this.canvas.remove(frame);
    });
    this.frames.clear();
    this.currentFrame = null;

    // 发出清空Frame事件
    EventBus.emit(EventTypes.FRAME.FRAMES_CLEARED, {
      framesCount: 0
    });
  }
}
