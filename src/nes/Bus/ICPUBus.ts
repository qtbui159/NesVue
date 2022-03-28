import IReadWrite from "../Common/IReadWrite";
import IRam from "../Memory/IRam";
import ICartridge from "../Cartridge/ICartridge";
import IPPU2C02 from "../PPU/IPPU2C02";
import IJoyStick from "../JoyStick/IJoyStick";

interface ICPUBus extends IReadWrite {
    connectRAM(ram: IRam): void;
    connectCartridge(cartridge: ICartridge): void;
    connectPPU2C02(ppu: IPPU2C02): void;
    connectJoyStick(p1: IJoyStick, p2: IJoyStick): void;
    setDMACycleFunction(dmaCycle: VoidFunction): void;
}

export default ICPUBus;
