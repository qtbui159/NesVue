import RegisterBase from "../Register/RegisterBase";
import NumberUtils from "../Utils/NumberUtils";

export default class VRAMRegister extends RegisterBase {
    /**
     * 粗略X滚动偏移（按tile瓦片,8像素)
     * 0-4bit
     */
    public get coarseXScroll(): number {
        return NumberUtils.toUInt8(this.value & 0x1f);
    }

    /**
     * 粗略Y滚动偏移（按tile瓦片,8像素)
     * 5-9bit
     */
    public get coarseYScroll(): number {
        return NumberUtils.toUInt8((this.value >> 5) & 0x1f);
    }

    /**
     * 命名表选择
     * 10-11bit
     */
    public get nameTable(): number {
        return NumberUtils.toUInt8((this.value >> 10) & 0x3);
    }

    /**
     * Y精确滚动偏移（按1像素）
     * 12-14bit
     */
    public get fineYScroll(): number {
        return NumberUtils.toUInt8((this.value >> 12) & 0x7);
    }
}
