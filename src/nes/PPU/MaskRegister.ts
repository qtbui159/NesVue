import RegisterBase from "../Register/RegisterBase";
import BitUtils from "../Utils/BitUtils";

export default class MASKRegister extends RegisterBase {
    /**
     * 显示模式
     * 0(彩色) 1(灰阶)
     */
    public get Gray(): number {
        return BitUtils.get(this.value, 0);
    }

    public set Gray(value: number) {
        this.updateBit(value, 0);
    }

    /**
     * 背景掩码
     * 0(不显示最左边那列, 8像素)的背景，1显示
     */
    public get m(): number {
        return BitUtils.get(this.value, 1);
    }

    public set m(value: number) {
        this.updateBit(value, 1);
    }

    /**
     * 精灵掩码
     * 0(不显示最左边那列, 8像素)的精灵，1显示
     */
    public get M(): number {
        return BitUtils.get(this.value, 2);
    }

    public set M(value: number) {
        this.updateBit(value, 2);
    }

    /**
     * 背景显示使能标志位
     * 1(显示背景)
     */
    public get b(): number {
        return BitUtils.get(this.value, 3);
    }

    public set b(value: number) {
        this.updateBit(value, 3);
    }

    /**
     * 精灵显示使能标志位
     * 1(显示精灵)
     */
    public get s(): number {
        return BitUtils.get(this.value, 4);
    }

    public set s(value: number) {
        this.updateBit(value, 4);
    }

    /**
     * red (green on PAL/Dendy)
     */
    public get R(): number {
        return BitUtils.get(this.value, 5);
    }

    public set R(value: number) {
        this.updateBit(value, 5);
    }

    /**
     * Emphasize green (red on PAL/Dendy)
     */
    public get G(): number {
        return BitUtils.get(this.value, 6);
    }

    public set G(value: number) {
        this.updateBit(value, 6);
    }

    /**
     * Emphasize blue
     */
    public get B(): number {
        return BitUtils.get(this.value, 7);
    }

    public set B(value: number) {
        this.updateBit(value, 7);
    }
}
