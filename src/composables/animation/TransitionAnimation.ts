import { gsap } from "gsap";

export function TransitionAnimation() {
  const zoomToFrame = (canvas: any, options: any = {}) => {
    const {
      duration = 2.5, // 默认动画时长
      viewportTransform,
      onComplete,
      ease = "power3.inOut", // 使用更平滑的缓动函数
      exitEffect = true, // 是否添加退出效果
      exitScale = 0.9, // 新增参数：退出缩放比例
      transitionType = "zoom-pan", // 默认为缩放平移
    } = options;
    // 如果是初始帧，直接设置视口变换，不执行动画
    if (transitionType === "initial") {
      canvas.setViewportTransform(viewportTransform);
      canvas.requestRenderAll();
      if (onComplete) onComplete();
      return;
    }
    // 获取当前视口变换
    const currentViewport = [...canvas.viewportTransform];
    console.log("动画开始 - 当前视口:", currentViewport);
    console.log("动画开始 - 目标视口:", viewportTransform);

    // 提取当前和目标的缩放和平移值
    const currentScale = currentViewport[0]; // 假设 scaleX = scaleY
    const currentTranslateX = currentViewport[4];
    const currentTranslateY = currentViewport[5];

    const targetScale = viewportTransform[0]; // 假设 scaleX = scaleY
    const targetTranslateX = viewportTransform[4];
    const targetTranslateY = viewportTransform[5];

    // 创建动画对象，分别跟踪缩放和平移
    const animationValues = {
      scale: currentScale,
      translateX: currentTranslateX,
      translateY: currentTranslateY,
      progress: 0, // 用于控制整体进度
      opacity: 1, // 用于控制淡出效果
    };

    // 创建时间轴动画，实现更复杂的动画序列
    const tl = gsap.timeline({
      onComplete: () => {
        console.log("动画完成 - 最终视口:", canvas.viewportTransform);
        if (onComplete) onComplete();
      },
    });

    // 计算屏幕中心点
    const screenNativeWidth = window.screen.width * window.devicePixelRatio;
    const screenNativeHeight = window.screen.height * window.devicePixelRatio;
    const screenCenterX = screenNativeWidth / 2;
    const screenCenterY = screenNativeHeight / 2;

    // 计算当前中心点和目标中心点
    const startCenterX = (screenCenterX - currentTranslateX) / currentScale;
    const startCenterY = (screenCenterY - currentTranslateY) / currentScale;
    const endCenterX = (screenCenterX - targetTranslateX) / targetScale;
    const endCenterY = (screenCenterY - targetTranslateY) / targetScale;

    // 根据过渡类型设置不同的动画
    if (transitionType === "zoom-in") {
      // 直接缩放进入，不需要退出效果
      tl.to(animationValues, {
        duration: duration,
        scale: targetScale,
        translateX: targetTranslateX,
        translateY: targetTranslateY,
        ease,
        onUpdate: updateViewport,
      });
    } else if (transitionType === "pan") {
      // 仅平移，保持缩放不变
      tl.to(animationValues, {
        duration: duration,
        translateX: targetTranslateX,
        translateY: targetTranslateY,
        ease,
        onUpdate: updateViewport,
      });
    } else {
      // 缩放平移 (zoom-pan)
      if (exitEffect) {
        // 添加退出效果
        tl.to(animationValues, {
          duration: duration * 0.3,
          // 使用传入的退出缩放比例
          scale: currentScale * exitScale,
          opacity: 0.95,
          ease: "power2.in",
          onUpdate: function () {
            const progress = this.progress();

            // 计算当前中心点位置（在收缩过程中逐渐向目标中心点过渡）
            const currentCenterX =
              startCenterX + (endCenterX - startCenterX) * progress * 0.3;
            const currentCenterY =
              startCenterY + (endCenterY - startCenterY) * progress * 0.3;

            // 计算新的平移值
            const newTranslateX =
              screenCenterX - currentCenterX * animationValues.scale;
            const newTranslateY =
              screenCenterY - currentCenterY * animationValues.scale;

            const currentTransform = [
              animationValues.scale,
              0,
              0,
              animationValues.scale,
              newTranslateX,
              newTranslateY,
            ];

            canvas.setViewportTransform(currentTransform);
            animationValues.translateX = newTranslateX;
            animationValues.translateY = newTranslateY;

            // 应用透明度
            applyOpacity(canvas, animationValues.opacity);

            canvas.requestRenderAll();
          },
        });
      }

      // 主动画（进入动画）
      tl.to(animationValues, {
        duration: duration * (exitEffect ? 0.7 : 1),
        scale: targetScale,
        translateX: targetTranslateX,
        translateY: targetTranslateY,
        progress: 1,
        opacity: 1,
        ease,
        onUpdate: updateViewport,
      });
    }

    // 更新视口的通用函数
    function updateViewport() {
      const currentTransform = [
        animationValues.scale,
        0,
        0,
        animationValues.scale,
        animationValues.translateX,
        animationValues.translateY,
      ];

      canvas.setViewportTransform(currentTransform);

      // 处理透明度
      if (animationValues.opacity < 1) {
        applyOpacity(canvas, animationValues.opacity);
      } else {
        restoreOpacity(canvas);
      }

      canvas.requestRenderAll();
    }

    // 应用透明度
    function applyOpacity(canvas: any, opacity: number) {
      canvas.getObjects().forEach((obj: any) => {
        if (obj._originalOpacity === undefined) {
          obj._originalOpacity = obj.opacity;
        }
        obj.set("opacity", obj._originalOpacity * opacity);
      });
    }

    // 恢复透明度
    function restoreOpacity(canvas: any) {
      canvas.getObjects().forEach((obj: any) => {
        if (obj._originalOpacity !== undefined) {
          obj.set("opacity", obj._originalOpacity);
          delete obj._originalOpacity;
        }
      });
    }

    return tl;
  };

  const fadeIn = (target: any, duration: number = 0.5) => {
    // 保存原始状态
    const originalOpacity = target.opacity || 1;
    const originalScale = target.scaleX || 1;

    // 设置初始状态
    target.set({
      opacity: 0,
      scaleX: originalScale * 0.9,
      scaleY: originalScale * 0.9,
    });

    // 创建动画
    return gsap.to(target, {
      duration,
      opacity: originalOpacity,
      scaleX: originalScale,
      scaleY: originalScale,
      ease: "power2.out",
    });
  };

  const fadeOut = (target: any, duration: number = 0.5) => {
    return gsap.to(target, {
      duration,
      opacity: 0,
      scaleX: target.scaleX * 0.9,
      scaleY: target.scaleY * 0.9,
      ease: "power2.in",
    });
  };

  const rotateZoom = (canvas: any, options: any = {}) => {
    const {
      duration = 1.5,
      viewportTransform,
      rotation = 0, // 目标旋转角度
      onComplete,
      ease = "power3.inOut",
    } = options;

    const currentViewport = [...canvas.viewportTransform];
    const currentScale = currentViewport[0];
    const currentTranslateX = currentViewport[4];
    const currentTranslateY = currentViewport[5];

    const targetScale = viewportTransform[0];
    const targetTranslateX = viewportTransform[4];
    const targetTranslateY = viewportTransform[5];

    // 创建动画值对象
    const animationValues = {
      scale: currentScale,
      translateX: currentTranslateX,
      translateY: currentTranslateY,
      rotation: 0, // 初始旋转角度
    };

    return gsap.to(animationValues, {
      duration,
      scale: targetScale,
      translateX: targetTranslateX,
      translateY: targetTranslateY,
      rotation,
      ease,
      onUpdate: function () {
        // 应用旋转和缩放变换
        const rotationRad = (animationValues.rotation * Math.PI) / 180;
        const cos = Math.cos(rotationRad);
        const sin = Math.sin(rotationRad);

        const currentTransform = [
          animationValues.scale * cos,
          animationValues.scale * sin,
          -animationValues.scale * sin,
          animationValues.scale * cos,
          animationValues.translateX,
          animationValues.translateY,
        ];

        canvas.setViewportTransform(currentTransform);
        canvas.requestRenderAll();
      },
      onComplete,
    });
  };

  return {
    zoomToFrame,
    fadeIn,
    fadeOut,
    rotateZoom,
  };
}
