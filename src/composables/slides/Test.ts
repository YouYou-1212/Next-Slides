import { classRegistry, type SerializedPathProps } from 'fabric';
import * as fabric from "fabric";

export interface SerializedPathPlusProps extends SerializedPathProps {
  id?: string;
  name?: string;
}

export class PathPlus extends fabric.Rect {
  static type: 'path' // if you want it to override Path completely
  declare id?: string;
  declare name?: string;

 toJSON() {
  return {
   ...super.toObject(),
   id: this.id,
   name: this.name,
  } as SerializedPathPlusProps;
 }

// 添加 toObject 方法以支持克隆自定义属性
toObject(propertiesToInclude: any[] = []): any{
  return super.toObject([...propertiesToInclude, 'id', 'name']);
}
  

}

// to make possible restoring from serialization
classRegistry.setClass(PathPlus, 'path');
// to make PathPlus connected to svg Path element
classRegistry.setSVGClass(PathPlus, 'path');