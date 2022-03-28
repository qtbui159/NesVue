import RegisterBase from "../Register/RegisterBase";
import BitUtils from "../Utils/BitUtils";

export default class CtrlRegister extends RegisterBase {
    /**
     * nametable地址 低位
     */
    public get NLow(): number {
        return BitUtils.get(this.value, 0);
    }

    public set NLow(value: number) {
        this.updateBit(value, 0);
    }

    /**
     * nametable地址 高位
     */
    public get NHigh(): number {
        return BitUtils.get(this.value, 1);
    }

    public set NHigh(value: number) {
        this.updateBit(value, 1);
    }

    /**
     * PPU读写显存增量
     * 0(+1 列模式) 1(+32 行模式)
     */
    public get I(): number {
        return BitUtils.get(this.value, 2);
    }

    public set I(value: number) {
        this.updateBit(value, 2);
    }

    /**
     * 精灵用图样表地址
     * 0($0000) 1($1000)
     */
    public get S(): number {
        return BitUtils.get(this.value, 3);
    }

    public set S(value: number) {
        this.updateBit(value, 3);
    }

    /**
     * 背景用图样表地址
     * 0($0000) 1($1000)
     */
    public get B(): number {
        return BitUtils.get(this.value, 4);
    }

    public set B(value: number) {
        this.updateBit(value, 4);
    }

    /**
     * 精灵尺寸(高度)
     * 0(8x8) 1(8x16)
     */
    public get H(): number {
        return BitUtils.get(this.value, 5);
    }

    public set H(value: number) {
        this.updateBit(value, 5);
    }

    /**
     * PPU 主/从模式
     * FC没有用到
     */
    public get P(): number {
        return BitUtils.get(this.value, 6);
    }

    public set P(value: number) {
        this.updateBit(value, 6);
    }

    /**
     * NMI生成使能标志位
     * 1(在VBlank时触发NMI)
     */
    public get V(): number {
        return BitUtils.get(this.value, 7);
    }

    public set V(value: number) {
        this.updateBit(value, 7);
    }
}
