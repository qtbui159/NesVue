import IReadWrite from "../Common/IReadWrite";
import MirroringMode from "../Common/MirroringMode";
import MaskRegister from "./MaskRegister";
import StatusRegister from "./StatusRegister";
import VRamRegister from "./VRamRegister";
import CtrlRegister from "./CtrlRegister";
import IRenderAction from "../Common/IRenderAction";

export default interface IPPU2C02 extends IReadWrite {
    Ctrl: CtrlRegister;
    Mask: MaskRegister;
    Status: StatusRegister;
    T: VRamRegister;
    V: VRamRegister;

    /**
     * Fine X scroll (3 bits)
     */
    fineXScroll: number;

    /**
     * 1字节的读缓存
     */
    readBuffer: number;

    /**
     * 精灵RAM内存，存在PPU内，一共256字节
     * 不存在总线上，写还可以通过DMA(CPU总线$4014)一次性复制256字节，读写可以直接单字节操作
     */
    oam: Uint8Array;

    /**
     * Object Attribute Memory地址
     */
    oamAddr: number;

    /**
     * 双写操作，初始化为false
     * First or second write toggle (1 bit)
     */
    wirteX2Flag: boolean;

    /**
     * 一个时钟周期
     */
    ticktock(): void;

    /**
     * 切换当前PPU的命名表映射规则
     * @param mode 映射规则
     */
    switchNameTableMirroring(mode: MirroringMode): void;

    /**
     * 绘制回调
     * @param render
     */
    setRenderCallback(render: IRenderAction): void;
}
