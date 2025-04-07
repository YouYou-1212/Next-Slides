import { classRegistry, type SerializedPathProps } from 'fabric';
import * as fabric from "fabric";

export interface SerializedPathPlusProps extends SerializedPathProps {
  id?: string;
  name?: string;
}

export class PathPlus extends fabric.Rect {
  static type: 'path' 
  declare id?: string;
  declare name?: string;

 toJSON() {
  return {
   ...super.toObject(),
   id: this.id,
   name: this.name,
  } as SerializedPathPlusProps;
 }


toObject(propertiesToInclude: any[] = []): any{
  return super.toObject([...propertiesToInclude, 'id', 'name']);
}
  

}


classRegistry.setClass(PathPlus, 'path');

classRegistry.setSVGClass(PathPlus, 'path');