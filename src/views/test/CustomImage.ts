import * as fabric from 'fabric';

export class CustomImage extends fabric.Group {
    static type = 'CustomImage';
    private _isSvg: boolean = false;
    private _borderColor: string = '#000';
    private _borderWidth: number = 1;
    private _borderRadius: number = 0;


    static async create(url: string, options: any = {}) {
        const isSvg = url.toLowerCase().endsWith('.svg') ||
            url.toLowerCase().startsWith('data:image/svg+xml');

        if (isSvg) {
            const { objects, options: svgOptions } = await fabric.loadSVGFromURL(url);
            if (!objects || objects.length === 0) {
                throw new Error('加载SVG资源失败');
            }
            const validObjects = objects.filter(Boolean) as fabric.Object[];
            return new CustomImage(validObjects, {
                ...options,
                _isSvg: true,
                ...svgOptions
            });
        } else {
            const img = await fabric.FabricImage.fromURL(url, options);
            return new CustomImage([img], {
                ...options,
                _isSvg: false
            });
        }
    }

    async replaceResource(url: string): Promise<this> {
        
        const originalProps = {
            left: this.left,
            top: this.top,
            
            
            scaleX: this.scaleX,
            scaleY: this.scaleY,
            angle: this.angle,
            flipX: this.flipX,
            flipY: this.flipY,
            skewX: this.skewX,
            skewY: this.skewY,
            originX: this.originX,
            originY: this.originY
        };

        const isSvg = url.toLowerCase().endsWith('.svg') ||
            url.toLowerCase().startsWith('data:image/svg+xml');

        if (isSvg) {
            const { objects, options: svgOptions } = await fabric.loadSVGFromURL(url);
            if (!objects || objects.length === 0) {
                throw new Error('加载SVG资源失败');
            }
            this._isSvg = true;

            
            while (this._objects.length > 0) {
                this.remove(this._objects[0]);
            }

            
            const validObjects = objects.filter(Boolean) as fabric.Object[];
            validObjects.forEach(obj => {
                
                obj.set({
                    left: 0,
                    top: 0,
                    originX: 'center',
                    originY: 'center'
                });
                this.add(obj);
            });

            
            this.set({
                ...svgOptions,
                ...originalProps
            });
            
            
            this.setCoords();
        } else {
            const img = await fabric.Image.fromURL(url);
            this._isSvg = false;

            
            while (this._objects.length > 0) {
                this.remove(this._objects[0]);
            }

            
            img.set({
                left: 0,
                top: 0,
                originX: 'center',
                originY: 'center'
            });
            
            
            this.add(img);

            
            this.set(originalProps);
            
            
            this.setCoords();
        }

        
        this.dirty = true;
        this.canvas?.requestRenderAll();
        return this;
    }



setBorderColor(color: string): this {
    this._borderColor = color;
    this.dirty = true;
    return this;
}


getBorderColor(): string {
    return this._borderColor;
}


setBorderWidth(width: number): this {
    this._borderWidth = width;
    this.dirty = true;
    return this;
}


getBorderWidth(): number {
    return this._borderWidth;
}


setBorderRadius(radius: number): this {
    this._borderRadius = radius;
    this.dirty = true;
    return this;
}


getBorderRadius(): number {
    return this._borderRadius;
}


render(ctx: CanvasRenderingContext2D): void {
    
    
    super.render(ctx);
    
    if (this._borderWidth > 0 && this._borderColor !== 'transparent') {
        
        ctx.save();
        
        
        const m = this.calcTransformMatrix();
        ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        
        
        this._renderBorder(ctx);
        
        
        ctx.restore();
    }
    
}


private _renderBorder(ctx: CanvasRenderingContext2D): void {
    
    const width = this.width || 0;
    const height = this.height || 0;
    
    ctx.save();
    
    
    ctx.lineWidth = this._borderWidth;
    ctx.strokeStyle = this._borderColor;
    
    
    const halfBorderWidth = this._borderWidth / 2;
    
    
    const left = -width / 2 - halfBorderWidth;
    const top = -height / 2 - halfBorderWidth;
    const borderWidth = width + this._borderWidth;
    const borderHeight = height + this._borderWidth;
    
    
    if (this._borderRadius > 0) {
        this._renderRoundRect(
            ctx, 
            left, 
            top, 
            borderWidth, 
            borderHeight, 
            this._borderRadius
        );
    } else {
        
        ctx.beginPath();
        ctx.rect(left, top, borderWidth, borderHeight);
        ctx.stroke();
    }
    
    ctx.restore();
}


private _renderRoundRect(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    radius: number
): void {
    
    const r = Math.min(radius, Math.min(width, height) / 2);
    
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.stroke();
}




    constructor(objects: fabric.Object[], options: any = {}) {
        
        super(objects, options);
        this._isSvg = options._isSvg || false;

        this._borderColor = options.borderColor !== undefined ? options.borderColor : '#000';
        this._borderWidth = options.borderWidth !== undefined ? options.borderWidth : 1;
        this._borderRadius = options.borderRadius !== undefined ? options.borderRadius : 0;

        Object.defineProperty(this, 'type', {
            value: CustomImage.type,
            configurable: false,
            writable: false
        });
    }

    isSvg(): boolean {
        return this._isSvg;
    }

    toObject(propertiesToInclude: any[] = []): any {
        return super.toObject([
            ...propertiesToInclude,
            '_isSvg',
            '_borderColor',
            '_borderWidth',
            '_borderRadius'
        ]);
    }
}