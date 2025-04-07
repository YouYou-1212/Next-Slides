import { ref } from "vue";
import * as fabric from "fabric";
import { TransitionAnimation } from "../animation/TransitionAnimation";
import type { PlayAction } from "./Present";
import { calculateViewportInfo } from "../../utils/CanvasUtils";
import { PageFrame } from "../slides/PageFrame";


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

  
  public play(actions: PlayAction[]) {
    
    this.actions = actions;
    this.currentActionIndex.value = 0;
    this.showInitialView();
  }

  private showInitialView() {
    if (this.actions.length === 0) return;

    
    const firstAction = this.actions[0];
    if (firstAction.type !== PageFrame.type) return;

    const viewportInfo = calculateViewportInfo(this.canvas , firstAction.target , 0,0,true);
    
    const { zoomToFrame } = this.animation;
    zoomToFrame(this.canvas, {
      viewportTransform: viewportInfo.transform,
      duration: 1,
    });
  }


  private handleKeyDown(e: KeyboardEvent) {
    
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

  
  private determineTransitionType(currentFrame: any, nextFrame: any) {
    if (!currentFrame) {
      return "initial"; 
    }

    const currentInfo = calculateViewportInfo(this.canvas , currentFrame.target);
    const nextInfo = calculateViewportInfo(this.canvas , nextFrame.target);

    
    const isNextInsideCurrent =
      nextInfo.left >= currentInfo.left &&
      nextInfo.top >= currentInfo.top &&
      nextInfo.right <= currentInfo.right &&
      nextInfo.bottom <= currentInfo.bottom;

    
    const isSimilarSize =
      Math.abs(nextInfo.width - currentInfo.width) / currentInfo.width < 0.02 &&
      Math.abs(nextInfo.height - currentInfo.height) / currentInfo.height <
        0.02;

    if (isNextInsideCurrent) {
      return "zoom-in"; 
    } else if (isSimilarSize) {
      return "pan"; 
    } else {
      return "zoom-pan"; 
    }
  }

  private navigateToFrame(action: PlayAction) {
    const currentIndex = this.currentActionIndex.value;
    const currentAction = currentIndex >= 0 ? this.actions[currentIndex] : null;
    const nextViewportInfo = calculateViewportInfo(this.canvas , action.target);
    
    const { zoomToFrame } = this.animation;

    
    const transitionType = this.determineTransitionType(currentAction, action);
    

    
    let duration = 2; 
    let exitScale = 0.9; 

    if (currentAction) {
      const currentInfo = calculateViewportInfo(this.canvas , currentAction.target);
      this.canvas.setViewportTransform(nextViewportInfo.currentTransform);

      
      const currentViewport = this.canvas.viewportTransform;
      
      
      const currentScreenX = currentInfo.centerX * currentViewport[0] + currentViewport[4];
      const currentScreenY = currentInfo.centerY * currentViewport[3] + currentViewport[5];
      
      
      const nextScreenX = nextViewportInfo.centerX;
      const nextScreenY = nextViewportInfo.centerY;

      
      const distance = Math.sqrt(
        Math.pow(currentScreenX - nextScreenX, 2) +
        Math.pow(currentScreenY - nextScreenY, 2)
      );

      
      
      const maxDistance = 5000;
      const minDuration = 1; 
      const maxDuration = 3; 

      duration =
        minDuration +
        (maxDuration - minDuration) * Math.min(distance / maxDistance, 1);
      

      
      
      if (transitionType === "zoom-pan") {
        const minScale = 0.8; 
        const maxScale = 0.4; 

        exitScale =
          minScale -
          (minScale - maxScale) * Math.min(distance / maxDistance, 1);
        
      }
    }

    const animationOptions = {
      viewportTransform: nextViewportInfo.transform,
      duration: transitionType === "initial" ? 0 : duration,
      
      exitEffect: transitionType !== "pan",
      
      exitScale: exitScale,
      ease: "power3.inOut",
      
      transitionType,
      onComplete: () => {
        
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
