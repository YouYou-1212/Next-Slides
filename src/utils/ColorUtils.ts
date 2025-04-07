
export class ColorUtils {
  // 预定义的Frame颜色列表
  public static readonly FRAME_COLORS: string[] = [
    "#FFE5E5", // 浅红色
    "#E5FFE5", // 浅绿色
    "#E5E5FF", // 浅蓝色
    "#FFFFE5", // 浅黄色
    "#FFE5FF", // 浅紫色
    "#E5FFFF", // 浅青色
    "#F5E6D3", // 浅棕色
    "#E6E6FA", // 薰衣草色
    "#F0FFF0", // 蜜瓜色
    "#F5F5DC", // 米色
  ];

  // 主题颜色列表
  public static readonly THEME_COLORS: string[] = [
    "#1890ff", // 蓝色
    "#52c41a", // 绿色
    "#faad14", // 黄色
    "#f5222d", // 红色
    "#722ed1", // 紫色
    "#eb2f96", // 粉色
    "#fa8c16", // 橙色
    "#13c2c2", // 青色
  ];

  
  // 现代扁平化UI配色方案
  public static readonly FLAT_UI_COLORS: string[] = [
    "#1abc9c", // 绿松石
    "#2ecc71", // 翡翠绿
    "#3498db", // 彼得河蓝
    "#9b59b6", // 紫水晶
    "#34495e", // 湿沥青
    "#16a085", // 绿海
    "#27ae60", // 星光绿
    "#2980b9", // 蓝宝石
    "#8e44ad", // 紫藤
    "#2c3e50", // 午夜蓝
  ];

  // Material Design配色方案
  public static readonly MATERIAL_COLORS: string[] = [
    "#f44336", // 红色
    "#e91e63", // 粉色
    "#9c27b0", // 紫色
    "#673ab7", // 深紫色
    "#3f51b5", // 靛蓝色
    "#2196f3", // 蓝色
    "#03a9f4", // 浅蓝色
    "#00bcd4", // 青色
    "#009688", // 蓝绿色
    "#4caf50", // 绿色
  ];

  // 柔和渐变色配色方案
  public static readonly GRADIENT_COLORS: string[] = [
    "#a18cd1", // 薰衣草渐变起始色
    "#fbc2eb", // 粉色渐变起始色
    "#84fab0", // 绿色渐变起始色
    "#8fd3f4", // 蓝色渐变起始色
    "#d4fc79", // 黄绿色渐变起始色
    "#96e6a1", // 薄荷绿渐变起始色
    "#fda085", // 橙色渐变起始色
    "#f6d365", // 黄色渐变起始色
    "#fad0c4", // 桃色渐变起始色
    "#ffecd2", // 米色渐变起始色
  ];

  // 北欧简约风格配色方案
  public static readonly NORDIC_COLORS: string[] = [
    "#f9f9f9", // 白雪
    "#e8e8e8", // 浅灰
    "#d9e2ec", // 冰蓝
    "#b3c2cf", // 淡蓝灰
    "#4a5568", // 深灰蓝
    "#2d3748", // 暗蓝
    "#e2e8f0", // 银灰
    "#edf2f7", // 珍珠白
    "#f7fafc", // 雾白
    "#cbd5e0", // 云灰
  ];

  // 科技感配色方案
  public static readonly TECH_COLORS: string[] = [
    "#00b8d4", // 科技蓝
    "#00bfa5", // 科技绿
    "#00c853", // 霓虹绿
    "#2979ff", // 电光蓝
    "#3d5afe", // 靛蓝
    "#651fff", // 深紫
    "#d500f9", // 亮紫
    "#f50057", // 霓虹粉
    "#ff3d00", // 霓虹橙
    "#1a237e", // 深蓝
  ];

   // 中国传统色彩方案
   public static readonly TRADITIONAL_CHINESE_COLORS: string[] = [
    "#e4c6d0", // 霞光红
    "#789262", // 竹青
    "#493131", // 紫檀
    "#a98175", // 绾红
    "#1c1c1c", // 玄青
    "#9d2933", // 胭脂
    "#d4f2e7", // 青白
    "#f2be45", // 赤金
    "#61649f", // 青黛
    "#8d4bbb", // 紫色
    "#d71345", // 朱红
    "#45b97c", // 青翠
    "#4b5cc4", // 宝蓝
    "#f05654", // 银红
    "#8e453f", // 赭石
    "#ffb3a7", // 粉红
    "#e0eee8", // 青白
    "#96c37d", // 春绿
    "#9b4400", // 琥珀
    "#f35336", // 彤红
  ];

  
  public static getRandomColor(colors: string[] = ColorUtils.FRAME_COLORS): string {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  
  public static generateRandomColor(opacity: number = 1): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return opacity === 1 
      ? `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      : `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  
  public static generateSoftRandomColor(): string {
    // 使用HSL颜色模型生成柔和颜色
    const h = Math.floor(Math.random() * 360); // 随机色相
    const s = Math.floor(Math.random() * 30) + 70; // 高饱和度 (70-100%)
    const l = Math.floor(Math.random() * 15) + 80; // 高亮度 (80-95%)
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  
  public static getColorByIndex(index: number, colors: string[] = ColorUtils.FRAME_COLORS): string {
    return colors[index % colors.length];
  }

  
  public static setColorOpacity(color: string, opacity: number): string {
    // 处理十六进制颜色
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // 处理rgb颜色
    if (color.startsWith('rgb(')) {
      const rgb = color.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
      }
    }
    
    return color;
  }

  
  public static rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  
  public static hexToRgb(hex: string): {r: number, g: number, b: number} | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  
  public static shadeColor(color: string, amount: number): string {
    const rgb = ColorUtils.hexToRgb(color);
    if (!rgb) return color;
    
    const { r, g, b } = rgb;
    const newR = Math.max(0, Math.min(255, r + amount));
    const newG = Math.max(0, Math.min(255, g + amount));
    const newB = Math.max(0, Math.min(255, b + amount));
    
    return ColorUtils.rgbToHex(newR, newG, newB);
  }

  
  public static getColorPickerHtml(id: string, initialColor: string = '#1890ff'): string {
    return `
      <div class="color-picker-container" style="margin: 10px 0;">
        <label for="${id}" style="display: block; margin-bottom: 5px;">选择颜色:</label>
        <input type="color" id="${id}" value="${initialColor}" style="width: 50px; height: 30px;">
        <input type="text" id="${id}-text" value="${initialColor}" style="margin-left: 10px; width: 80px;">
        <div class="color-presets" style="margin-top: 5px; display: flex; flex-wrap: wrap;">
          ${ColorUtils.THEME_COLORS.map(color => 
            `<div class="color-preset" data-color="${color}" style="width: 20px; height: 20px; background-color: ${color}; margin: 2px; cursor: pointer; border-radius: 2px;"></div>`
          ).join('')}
        </div>
      </div>
    `;
  }

  
  public static initColorPicker(id: string, onChange?: (color: string) => void): void {
    if (typeof document === 'undefined') return; // 服务器端渲染时跳过

    const colorInput = document.getElementById(id) as HTMLInputElement;
    const textInput = document.getElementById(`${id}-text`) as HTMLInputElement;
    const presets = document.querySelectorAll(`#${id}-container .color-preset`);

    if (colorInput && textInput) {
      // 颜色输入变化时更新文本输入
      colorInput.addEventListener('input', () => {
        textInput.value = colorInput.value;
        onChange?.(colorInput.value);
      });

      // 文本输入变化时更新颜色输入
      textInput.addEventListener('input', () => {
        // 验证是否为有效的颜色格式
        if (/^#[0-9A-F]{6}$/i.test(textInput.value)) {
          colorInput.value = textInput.value;
          onChange?.(textInput.value);
        }
      });

      // 预设颜色点击事件
      presets.forEach(preset => {
        preset.addEventListener('click', (e) => {
          const color = (e.currentTarget as HTMLElement).getAttribute('data-color') || '#1890ff';
          colorInput.value = color;
          textInput.value = color;
          onChange?.(color);
        });
      });
    }
  }
}