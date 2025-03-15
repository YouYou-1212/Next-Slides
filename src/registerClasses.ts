// import * as fabric from "fabric";
// import { Frame } from "./composables/slides/Frame";
// import { PageFrame } from "./composables/slides/PageFrame";
// import { Slides } from "./composables/slides/Slides";

// /**
//  * 注册自定义Fabric类
//  * 确保序列化和反序列化时能正确处理这些类型
//  */
// export function registerFabricClasses() {
//   // 注册 Slides 类
// if (!(fabric as any).Slides) {
//     (fabric as any).Slides = Slides;
//     fabric.classRegistry.setClass(Slides, Slides.type);
//   }
  
//   // 注册 Frame 类
//   if (!(fabric as any).Frame) {
//     (fabric as any).Frame = Frame;
//     fabric.classRegistry.setClass(Frame, Frame.type);
//   }
  
//   // 注册 PageFrame 类
//   if (!(fabric as any).PageFrame) {
//     (fabric as any).PageFrame = PageFrame;
//     fabric.classRegistry.setClass(PageFrame, PageFrame.type);
//   }
  
//   console.log('Fabric自定义类注册完成');
// }

// /**
//  * 确保类有正确的fromObject静态方法
//  */
// // function ensureFromObjectMethod() {
// //   // 为 Slides 添加 fromObject 方法
// //   if (!Slides.fromObject) {
// //     Slides.fromObject = function(object: any, callback: Function) {
// //       return fabric.Object._fromObject('Slides', object, callback);
// //     };
// //   }
  
// //   // 为 Frame 添加 fromObject 方法
// //   if (!Frame.fromObject) {
// //     Frame.fromObject = function(object: any, callback: Function) {
// //       return fabric.Object._fromObject('Frame', object, callback);
// //     };
// //   }
  
// //   // 为 PageFrame 添加 fromObject 方法
// //   if (!PageFrame.fromObject) {
// //     PageFrame.fromObject = function(object: any, callback: Function) {
// //       return fabric.Object._fromObject('PageFrame', object, callback);
// //     };
// //   }
// // }

// // // 确保所有类都有fromObject方法
// // ensureFromObjectMethod();