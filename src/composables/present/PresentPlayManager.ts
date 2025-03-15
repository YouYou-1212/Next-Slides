import { ref } from "vue";
import * as fabric from "fabric";
import { TransitionAnimation } from "../animation/TransitionAnimation";
import type { PlayAction } from "./Present";
import { calculateViewportInfo } from "../../utils/CanvasUtils";

/**
 * 演示播放管理器
 */
export class PresentPlayManager {
  private canvas: fabric.Canvas;
  private actions: PlayAction[] = [];
  private currentActionIndex = ref(-1);
  private animation = TransitionAnimation();

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
    this.initializeEventHandlers();
  }

  private initializeEventHandlers() {
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  /**
   * 播放演示
   * @param actions 动作列表
   */
  public play(actions: PlayAction[]) {
    console.log("PresentPlayManager play actions:", actions);
    this.actions = actions;
    this.currentActionIndex.value = 0;
    this.showInitialView();
  }

  private showInitialView() {
    if (this.actions.length === 0) return;

    // 获取第一个动作（应该是 PageFrame）
    const firstAction = this.actions[0];
    if (firstAction.type !== "pageframe") return;

    const viewportInfo = calculateViewportInfo(this.canvas , firstAction.target);
    // this.canvas.setViewportTransform(viewportInfo.currentTransform);
    const { zoomToFrame } = this.animation;
    zoomToFrame(this.canvas, {
      viewportTransform: viewportInfo.transform,
      duration: 1,
    });
  }


  private handleKeyDown(e: KeyboardEvent) {
    console.log("handleKeyDown:", e.key);
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
      case " ":
        this.nextFrame();
        break;
      case "ArrowUp":
      case "ArrowLeft":
        this.previousFrame();
        break;
    }
  }

  // 判断两个页面的关系
  private determineTransitionType(currentFrame: any, nextFrame: any) {
    if (!currentFrame) {
      return "initial"; // 首个页面
    }

    const currentInfo = calculateViewportInfo(this.canvas , currentFrame.target);
    const nextInfo = calculateViewportInfo(this.canvas , nextFrame.target);

    // 判断下一个页面是否在当前页面内
    const isNextInsideCurrent =
      nextInfo.left >= currentInfo.left &&
      nextInfo.top >= currentInfo.top &&
      nextInfo.right <= currentInfo.right &&
      nextInfo.bottom <= currentInfo.bottom;

    // 判断页面大小是否相似（允许5%的误差）
    const isSimilarSize =
      Math.abs(nextInfo.width - currentInfo.width) / currentInfo.width < 0.02 &&
      Math.abs(nextInfo.height - currentInfo.height) / currentInfo.height <
        0.02;

    if (isNextInsideCurrent) {
      return "zoom-in"; // 下一个页面在当前页面内，直接缩放进入
    } else if (isSimilarSize) {
      return "pan"; // 页面大小相似，直接平移
    } else {
      return "zoom-pan"; // 页面大小不同，需要缩放平移
    }
  }

  private navigateToFrame(action: PlayAction) {
    const currentIndex = this.currentActionIndex.value;
    const currentAction = currentIndex >= 0 ? this.actions[currentIndex] : null;
    const nextViewportInfo = calculateViewportInfo(this.canvas , action.target);
    // this.canvas.setViewportTransform(nextViewportInfo.currentTransform);
    const { zoomToFrame } = this.animation;

    // 确定过渡类型
    const transitionType = this.determineTransitionType(currentAction, action);
    console.log("过渡类型:", transitionType);

    // 计算动画时长和缩放比例
    let duration = 2; // 默认动画时长
    let exitScale = 0.9; // 默认退出缩放比例

    if (currentAction) {
      const currentInfo = calculateViewportInfo(this.canvas , currentAction.target);
      this.canvas.setViewportTransform(nextViewportInfo.currentTransform);

      // 获取当前视口变换
      const currentViewport = this.canvas.viewportTransform;
      
      // 计算当前页面在屏幕上的实际中心点位置
      const currentScreenX = currentInfo.centerX * currentViewport[0] + currentViewport[4];
      const currentScreenY = currentInfo.centerY * currentViewport[3] + currentViewport[5];
      
      // 计算目标页面在原始坐标系下的中心点位置
      const nextScreenX = nextViewportInfo.centerX;
      const nextScreenY = nextViewportInfo.centerY;

      // 计算两个页面中心点之间的实际距离
      const distance = Math.sqrt(
        Math.pow(currentScreenX - nextScreenX, 2) +
        Math.pow(currentScreenY - nextScreenY, 2)
      );

      // 根据距离计算动画时长，距离越远时长越长
      // 假设最大距离为5000像素，对应最长动画时间4秒
      const maxDistance = 5000;
      const minDuration = 1; // 最短动画时长
      const maxDuration = 3; // 最长动画时长

      duration =
        minDuration +
        (maxDuration - minDuration) * Math.min(distance / maxDistance, 1);
      console.log("页面中心点距离:", distance, "计算的动画时长:", duration);

      // 根据距离计算退出缩放比例，距离越远缩放比例越大
      // 最小缩放到90%，最大缩放到70%
      if (transitionType === "zoom-pan") {
        const minScale = 0.8; // 最小缩放比例
        const maxScale = 0.4; // 最大缩放比例

        exitScale =
          minScale -
          (minScale - maxScale) * Math.min(distance / maxDistance, 1);
        console.log("计算的退出缩放比例:", exitScale);
      }
    }

    const animationOptions = {
      viewportTransform: nextViewportInfo.transform,
      duration: transitionType === "initial" ? 0 : duration,
      // 平移时不需要退出效果
      exitEffect: transitionType !== "pan",
      // 传递退出缩放比例
      exitScale: exitScale,
      ease: "power3.inOut",
      // 传递过渡类型给动画函数
      transitionType,
      onComplete: () => {
        console.log("Frame切换完成");
      },
    };

    zoomToFrame(this.canvas, animationOptions);
  }

  public nextFrame() {
    if (this.currentActionIndex.value >= this.actions.length - 1) return;
    this.currentActionIndex.value++;
    this.navigateToFrame(this.actions[this.currentActionIndex.value]);
  }

  public previousFrame() {
    if (this.currentActionIndex.value <= 0) {
      this.currentActionIndex.value = 0;
      this.showInitialView();
      return;
    }
    this.currentActionIndex.value--;
    this.navigateToFrame(this.actions[this.currentActionIndex.value]);
  }

  public destroy() {
    window.removeEventListener("keydown", this.handleKeyDown.bind(this));
    this.actions = [];
    this.currentActionIndex.value = -1;
  }
}
