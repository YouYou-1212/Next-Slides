import { gsap } from "gsap";

export function TransitionAnimation() {
  const zoomToFrame = (canvas: any, options: any = {}) => {
    const {
      duration = 2.5, 
      viewportTransform,
      onComplete,
      ease = "power3.inOut", 
      exitEffect = true, 
      exitScale = 0.9, 
      transitionType = "zoom-pan", 
    } = options;
    
    if (transitionType === "initial") {
      canvas.setViewportTransform(viewportTransform);
      canvas.requestRenderAll();
      if (onComplete) onComplete();
      return;
    }
    
    const currentViewport = [...canvas.viewportTransform];
    
    

    
    const currentScale = currentViewport[0]; 
    const currentTranslateX = currentViewport[4];
    const currentTranslateY = currentViewport[5];

    const targetScale = viewportTransform[0]; 
    const targetTranslateX = viewportTransform[4];
    const targetTranslateY = viewportTransform[5];

    
    const animationValues = {
      scale: currentScale,
      translateX: currentTranslateX,
      translateY: currentTranslateY,
      progress: 0, 
      opacity: 1, 
    };

    
    const tl = gsap.timeline({
      onComplete: () => {
        
        if (onComplete) onComplete();
      },
    });

    
    const screenNativeWidth = window.screen.width * window.devicePixelRatio;
    const screenNativeHeight = window.screen.height * window.devicePixelRatio;
    const screenCenterX = screenNativeWidth / 2;
    const screenCenterY = screenNativeHeight / 2;

    
    const startCenterX = (screenCenterX - currentTranslateX) / currentScale;
    const startCenterY = (screenCenterY - currentTranslateY) / currentScale;
    const endCenterX = (screenCenterX - targetTranslateX) / targetScale;
    const endCenterY = (screenCenterY - targetTranslateY) / targetScale;

    
    if (transitionType === "zoom-in") {
      
      tl.to(animationValues, {
        duration: duration,
        scale: targetScale,
        translateX: targetTranslateX,
        translateY: targetTranslateY,
        ease,
        onUpdate: updateViewport,
      });
    } else if (transitionType === "pan") {
      
      tl.to(animationValues, {
        duration: duration,
        translateX: targetTranslateX,
        translateY: targetTranslateY,
        ease,
        onUpdate: updateViewport,
      });
    } else {
      
      if (exitEffect) {
        
        tl.to(animationValues, {
          duration: duration * 0.3,
          
          scale: currentScale * exitScale,
          opacity: 0.95,
          ease: "power2.in",
          onUpdate: function () {
            const progress = this.progress();

            
            const currentCenterX =
              startCenterX + (endCenterX - startCenterX) * progress * 0.3;
            const currentCenterY =
              startCenterY + (endCenterY - startCenterY) * progress * 0.3;

            
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

            
            applyOpacity(canvas, animationValues.opacity);

            canvas.requestRenderAll();
          },
        });
      }

      
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

      
      if (animationValues.opacity < 1) {
        applyOpacity(canvas, animationValues.opacity);
      } else {
        restoreOpacity(canvas);
      }

      canvas.requestRenderAll();
    }

    
    function applyOpacity(canvas: any, opacity: number) {
      canvas.getObjects().forEach((obj: any) => {
        if (obj._originalOpacity === undefined) {
          obj._originalOpacity = obj.opacity;
        }
        obj.set("opacity", obj._originalOpacity * opacity);
      });
    }

    
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
    
    const originalOpacity = target.opacity || 1;
    const originalScale = target.scaleX || 1;

    
    target.set({
      opacity: 0,
      scaleX: originalScale * 0.9,
      scaleY: originalScale * 0.9,
    });

    
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
      rotation = 0, 
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

    
    const animationValues = {
      scale: currentScale,
      translateX: currentTranslateX,
      translateY: currentTranslateY,
      rotation: 0, 
    };

    return gsap.to(animationValues, {
      duration,
      scale: targetScale,
      translateX: targetTranslateX,
      translateY: targetTranslateY,
      rotation,
      ease,
      onUpdate: function () {
        
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
