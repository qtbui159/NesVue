import INes from "./INes";
import ICartridge from "./Cartridge/ICartridge";
import IRam from "./Memory/IRam";
import Ram from "./Memory/Ram";
import ICPUBus from "./Bus/ICPUBus";
import CPUBus from "./Bus/CPUBus";
import ICPU6502 from "./CPU/ICPU6502";
import CPU6502 from "./CPU/CPU6502";
import IFileLoader from "./NesFile/IFileLoader";
import Nes10FileLoader from "./NesFile/Nes10FileLoader";
import PPU2C02 from "./PPU/PPU2C02";
import IPPU2C02 from "./PPU/IPPU2C02";
import IPPUBus from "./Bus/IPPUBus";
import PPUBus from "./Bus/PPUBus";
import VRam from "./Memory/VRam";
import IPalette from "./PPU/IPalette";
import Palette from "./PPU/Palette";
import MiscUtils from "./Utils/MiscUtils";
import IRenderAction from "./Common/IRenderAction";
import RGB from "./Common/RGB";
import JoyStickKey from "./Common/JoyStickKey";
import IJoyStick from "./JoyStick/IJoyStick";
import JoyStick from "./JoyStick/JoyStick";

class Nes implements INes {
    private m_Cartridge: ICartridge;

    private m_Ram: IRam;
    private m_CPUBus: ICPUBus;
    private m_CPU6502: ICPU6502;

    private m_PPU2C02: IPPU2C02;
    private m_PPUBus: IPPUBus;
    private m_VRam: IRam;
    private m_Palette: IPalette;

    private m_P1JoyStick: IJoyStick;
    private m_P2JoyStick: IJoyStick;

    private m_ShouldSleep: boolean;

    public constructor() {
        //cpu部分
        this.m_Ram = new Ram();
        this.m_CPUBus = new CPUBus();
        this.m_CPU6502 = new CPU6502(this.m_CPUBus);

        //ppu部分
        this.m_PPUBus = new PPUBus();
        this.m_PPU2C02 = new PPU2C02(this.m_PPUBus, this.m_CPU6502.nmi.bind(this.m_CPU6502));
        this.m_VRam = new VRam();
        this.m_Palette = new Palette();

        //卡带
        this.m_Cartridge = {} as any;

        //手柄
        this.m_P1JoyStick = new JoyStick();
        this.m_P2JoyStick = new JoyStick();

        //总线连接
        this.m_CPUBus.connectRAM(this.m_Ram);
        this.m_CPUBus.connectPPU2C02(this.m_PPU2C02);
        this.m_CPUBus.setDMACycleFunction(this.m_CPU6502.dmaCycle.bind(this.m_CPU6502));
        this.m_CPUBus.connectJoyStick(this.m_P1JoyStick, this.m_P2JoyStick);
        this.m_PPUBus.connectVRam(this.m_VRam);
        this.m_PPUBus.connectPalette(this.m_Palette);

        this.m_ShouldSleep = false;
    }

    public setRenderCallback(render: IRenderAction): void {
        this.m_PPU2C02.setRenderCallback((rgbIndex: Uint8ClampedArray) => {
            const result: Uint8ClampedArray = new Uint8ClampedArray(rgbIndex.length * 4);
            let j: number = 0;

            for (let i = 0, count = rgbIndex.length; i < count; ++i) {
                const rgb: RGB = this.m_Palette.indexToRGB(rgbIndex[i]);
                result[j++] = rgb.R;
                result[j++] = rgb.G;
                result[j++] = rgb.B;
                result[j++] = 0xff;
            }

            render(result);
            this.m_ShouldSleep = true;
        });
    }

    public insertCartridge(data: Uint8Array): void {
        const fileLoader: IFileLoader = new Nes10FileLoader();
        this.m_Cartridge = fileLoader.load(data);

        this.m_CPUBus.connectCartridge(this.m_Cartridge);
        this.m_PPUBus.connectCartridge(this.m_Cartridge);
    }

    public async powerUp(): Promise<void> {
        this.m_CPU6502.reset();

        while (true) {
            this.m_CPU6502.ticktockFlatCycle();
            this.m_PPU2C02.ticktock();
            this.m_PPU2C02.ticktock();
            this.m_PPU2C02.ticktock();

            if (this.m_ShouldSleep) {
                this.m_ShouldSleep = false;
                await MiscUtils.sleepAsync(0);
            }
        }
    }

    public p1SendKey(key: JoyStickKey, pressDown: boolean): void {
        this.m_P1JoyStick.sendKey(key, pressDown);
    }

    public p2SendKey(key: JoyStickKey, pressDown: boolean): void {
        this.m_P2JoyStick.sendKey(key, pressDown);
    }
}

export default Nes;
