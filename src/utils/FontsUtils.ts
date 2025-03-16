// 字体名称映射表（英文到中文）
export const fontNameMapping: Record<string, string> = {
    // 中文字体
    'Microsoft YaHei': '微软雅黑',
    'Microsoft YaHei UI': '微软雅黑 UI',
    'SimSun': '宋体',
    'SimHei': '黑体',
    'KaiTi': '楷体',
    'FangSong': '仿宋',
    'STXihei': '华文细黑',
    'STKaiti': '华文楷体',
    'STSong': '华文宋体',
    'STFangsong': '华文仿宋',
    'STZhongsong': '华文中宋',
    'STHupo': '华文琥珀',
    'STXinwei': '华文新魏',
    'STLiti': '华文隶书',
    'FZShuTi': '方正舒体',
    'FZYaoti': '方正姚体',
    'YouYuan': '幼圆',
    'LiSu': '隶书',
    'NSimSun': '新宋体',
    'DFKai-SB': '标楷体',
    'Source Han Sans CN': '思源黑体',
    'Source Han Serif CN': '思源宋体',
    'Noto Sans SC': 'Noto Sans 简体中文',
    'Noto Serif SC': 'Noto Serif 简体中文',
    'PingFang SC': '苹方-简',
    'Hiragino Sans GB': '冬青黑体',
    'WenQuanYi Micro Hei': '文泉驿微米黑',
    'WenQuanYi Zen Hei': '文泉驿正黑',

    'HYQiHei': '汉仪旗黑',
    'HYKaiti': '汉仪楷体',
    'HYZhuoKai': '汉仪卓楷',
    'HYLeMiao': '汉仪乐喵体',
    'HYXiaoMaiTi': '汉仪小麦体',
    'HYCuYuan': '汉仪粗圆',
    'HYDaSongJ': '汉仪大宋简',
    'HYShangWeiShouShuW': '汉仪尚巍手书W',
    'MingLiU': '细明体',
    'PMingLiU': '新细明体',
    'MingLiU-ExtB': '细明体-ExtB',
    'PMingLiU-ExtB': '新细明体-ExtB',
    'MingLiU_HKSCS': '细明体_HKSCS',
    'MingLiU_HKSCS-ExtB': '细明体_HKSCS-ExtB',
    'SimSun-ExtB': '宋体-ExtB',
    'FangSong_GB2312': '仿宋_GB2312',
    'KaiTi_GB2312': '楷体_GB2312',
    'Dengxian': '等线',
    'Dengxian Light': '等线 Light',
    'Founder Type': '方正字体',
    'Founder Clear Song': '方正清刻本悦宋简体',
    'Founder Black Body': '方正黑体',
    'Founder Thin': '方正细黑',
    'Founder Compact': '方正综艺简体',
    'Founder Cute': '方正卡通',
    'Founder Handwriting': '方正行楷',
    'Founder Elegant': '方正隶变简体',
    'Founder Super': '方正超粗黑',
    'Founder Shao': '方正少儿',
    'Founder Simplified': '方正简体',
    'Founder Imitation Song': '方正仿宋',
    'Founder Regular Script': '方正楷体',
    'Founder Small': '方正小标宋简体',
    'Founder Xin': '方正新书宋简体',
    'Founder Yan': '方正颜宋简体',
    'Founder Fang': '方正仿宋简体',
    'Founder Song': '方正书宋简体',
    'Founder Old': '方正老宋简体',

    // 英文字体
    'Arial': 'Arial 标准',
    'Arial Black': 'Arial 黑体',
    'Comic Sans MS': 'Comic Sans 手写体',
    'Courier New': 'Courier New 等宽字体',
    'Georgia': 'Georgia 衬线体',
    'Impact': 'Impact 粗体',
    'Times New Roman': 'Times New Roman 衬线体',
    'Trebuchet MS': 'Trebuchet MS 无衬线体',
    'Verdana': 'Verdana 无衬线体',
    'Webdings': 'Webdings 符号',
    'Wingdings': 'Wingdings 符号',
    'Calibri': 'Calibri 无衬线体',
    'Cambria': 'Cambria 衬线体',
    'Consolas': 'Consolas 等宽字体',
    'Segoe UI': 'Segoe UI 界面字体',
    'Tahoma': 'Tahoma 无衬线体',
    'Helvetica': 'Helvetica 无衬线体',
    'Helvetica Neue': 'Helvetica Neue 现代无衬线体',
    'Lucida Sans': 'Lucida Sans 无衬线体',
    'Lucida Console': 'Lucida Console 等宽字体',
    'Monaco': 'Monaco 等宽字体',
    'Palatino Linotype': 'Palatino Linotype 衬线体',
    'Book Antiqua': 'Book Antiqua 古典衬线体',
    'Garamond': 'Garamond 优雅衬线体',
    'Century Gothic': 'Century Gothic 几何无衬线体',
    'Franklin Gothic': 'Franklin Gothic 无衬线体',
    'Copperplate': 'Copperplate 铜板体',
    'Papyrus': 'Papyrus 手写体',
    'Brush Script MT': 'Brush Script MT 笔刷体',
};

// 获取系统字体并应用中文映射
export async function getSystemFonts(): Promise<Array<{ label: string, value: string }>> {
    try {
        if ("queryLocalFonts" in window) {
            const availableFonts = await (window as any).queryLocalFonts();

            // 转换为需要的格式，并应用中文映射
            const formattedFonts = availableFonts.map((font: { family: string }) => ({
                // 使用映射表获取中文名称，如果没有则使用原名
                label: fontNameMapping[font.family] || font.family, 
                value: font.family
            }));

            // 去重
            const uniqueFonts = [];
            const fontMap = new Map();

            for (const font of formattedFonts) {
                if (!fontMap.has(font.value.toLowerCase())) {
                    fontMap.set(font.value.toLowerCase(), true);
                    uniqueFonts.push(font);
                }
            }

            return uniqueFonts;
        } else {
            console.warn("浏览器不支持queryLocalFonts API");
            return [];
        }
    } catch (e) {
        console.error('获取系统字体失败:', e);
        return [];
    }
}

// 默认字体列表
export const defaultFonts = [
    { label: '微软雅黑', value: 'Microsoft YaHei' },
    { label: '宋体', value: 'SimSun' },
    { label: '黑体', value: 'SimHei' },
    { label: '楷体', value: 'KaiTi' },
    { label: '仿宋', value: 'FangSong' },
    { label: 'Arial 标准', value: 'Arial' },
    { label: 'Times New Roman 衬线体', value: 'Times New Roman' },
    { label: 'Courier New 等宽字体', value: 'Courier New' },
];