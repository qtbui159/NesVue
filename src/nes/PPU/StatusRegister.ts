import RegisterBase from "../Register/RegisterBase";
import BitUtils from "../Utils/BitUtils";

/**
 * 参考资料
 * 1*)https://wiki.nesdev.org/w/index.php?title=PPU_sprite_evaluation#Sprite_overflow_bug
 */
export default class StatusRegister extends RegisterBase {
    /**
     * 精灵溢出标志位
     * 0(当前扫描线精灵个数小于8)，注意，该位有硬件bug，参考1*)
     *
     * Sprite overflow. The intent was for this flag to be set
     * whenever more than eight sprites appear on a scanline, but a
     * hardware bug causes the actual behavior to be more complicated
     * and generate false positives as well as false negatives; see
     * PPU sprite evaluation.This flag is set during sprite
     * evaluation and cleared at dot 1 (the second dot) of the
     * pre-render line.
     */
    public get O(): number {
        return BitUtils.get(this.value, 5);
    }

    public set O(value: number) {
        this.updateBit(value, 5);
    }

    /**
     * 精灵命中测试标志位
     * 1(#0精灵命中) VBlank之后置0
     * Sprite 0 Hit.  Set when a nonzero pixel of sprite 0 overlaps
     * a nonzero background pixel; cleared at dot 1 of the pre-render
     * line.Used for raster timing.
     */
    public get S(): number {
        return BitUtils.get(this.value, 6);
    }

    public set S(value: number) {
        this.updateBit(value, 6);
    }

    /**
     * VBlank标志位
     * VBlank开始时置1, 结束或者读取该字节($2002)后置0
     * Vertical blank has started (0: not in vblank; 1: in vblank).
     * Set at dot 1 of line 241 (the line * after* the post-render
     * line); cleared after reading $2002 and at dot 1 of the
     * pre-render line.
     */
    public get V(): number {
        return BitUtils.get(this.value, 7);
    }

    public set V(value: number) {
        this.updateBit(value, 7);
    }
}
