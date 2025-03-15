// src/lib/canvas/PageFrame.ts
import * as fabric from "fabric";
import { Slides } from "./Slides";
import type { PageFrameOptions } from "../../types/canvas";

export class PageFrame extends Slides {
  static type = "pageframe";
  initialLeft: number;
  initialTop: number;

  constructor(options: any) {
    // 设置默认的玻璃效果样式
    const pageFrameOptions = {
      ...options,
    };

    super(pageFrameOptions);
    this.initialLeft = options.left;
    this.initialTop = options.top;
  }

  // 初始化控制点
  initializeControls() {
    super.initializeControls();

    // 锁定旋转
    this.setControlsVisibility({
      // 'tl', 'tr', 'br', 'bl', 'ml', 'mt', 'mr', 'mb', 'mtr'
      mtr: false, // 隐藏旋转控制点
      bl: true, // 隐藏左下角控制点
      br: true, // 隐藏右下角控制点
      tl: true, // 隐藏左上角控制点
      tr: true, // 隐藏右上角控制点
      mb: false, // 隐藏底部控制点
      ml: false, // 隐藏左侧控制点
      mr: false, // 隐藏右侧控制点
      mt: false, // 隐藏顶部控制点
    });
  }

  toJSON() {
    return {
      ...super.toJSON(),
      initialLeft: this.initialLeft,
      initialTop: this.initialTop,
    };
  }

}

// to make possible restoring from serialization
fabric.classRegistry.setClass(PageFrame, PageFrame.type);
// to make PathPlus connected to svg Path element
fabric.classRegistry.setSVGClass(PageFrame, PageFrame.type);