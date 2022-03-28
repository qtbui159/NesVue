import ICartridge from "../Cartridge/ICartridge";
import IJoyStick from "../JoyStick/IJoyStick";
import IRam from "../Memory/IRam";
import IPPU2C02 from "../PPU/IPPU2C02";
import BitUtils from "../Utils/BitUtils";
import NumberUtils from "../Utils/NumberUtils";
import ICPUBus from "./ICPUBus";

/**
 * 参考资料
 * 1*)https://wiki.nesdev.org/w/index.php?title=PPU_registers#PPUSCROLL
 * 2*)https://wiki.nesdev.org/w/index.php?title=PPU_registers#Address_.28.242006.29_.3E.3E_write_x2
 * 3*)https://wiki.nesdev.org/w/index.php/PPU_registers#The_PPUDATA_read_buffer_.28post-fetch.29
 * 4*)https://wiki.nesdev.org/w/index.php?title=PPU_scrolling
 */

class CPUBus implements ICPUBus {
    private m_DMACycle: VoidFunction | null = null;
    private m_RAM: IRam = {} as any;
    private m_Cartridge: ICartridge = {} as any;
    private m_PPU2C02: IPPU2C02 = {} as any;
    private m_P1JoyStick: IJoyStick | null = null;
    private m_P2JoyStick: IJoyStick | null = null;

    public connectRAM(ram: IRam): void {
        this.m_RAM = ram;
    }

    public connectCartridge(cartridge: ICartridge): void {
        this.m_Cartridge = cartridge;
    }

    public connectPPU2C02(ppu: IPPU2C02): void {
        this.m_PPU2C02 = ppu;
    }

    public setDMACycleFunction(dmaCycle: VoidFunction): void {
        this.m_DMACycle = dmaCycle;
    }

    public connectJoyStick(p1: IJoyStick, p2: IJoyStick): void {
        this.m_P1JoyStick = p1;
        this.m_P2JoyStick = p2;
    }

    public writeByte(addr: number, data: number): void {
        if (addr < 0x2000) {
            this.m_RAM.writeByte(addr, data);
        } else if (addr >= 0x2000 && addr < 0x4020) {
            //ppu,apu,joystick registers

            if (addr < 0x4000) {
                const ioAddr: number = this.getIORegisterRealAddr(addr);
                if (ioAddr == 0x2000) {
                    this.m_PPU2C02.Ctrl.updateValue(data);
                    this.m_PPU2C02.T.updateBit(BitUtils.get(data, 0), 10);
                    this.m_PPU2C02.T.updateBit(BitUtils.get(data, 1), 11);
                } else if (ioAddr == 0x2001) {
                    this.m_PPU2C02.Mask.updateValue(data);
                } else if (ioAddr == 0x2002) {
                    throw new Error("address can not write");
                } else if (ioAddr == 0x2003) {
                    this.m_PPU2C02.oamAddr = data;
                } else if (ioAddr == 0x2004) {
                    this.m_PPU2C02.oam[this.m_PPU2C02.oamAddr++] = data;
                } else if (ioAddr == 0x2005) {
                    if (this.m_PPU2C02.wirteX2Flag) {
                        //二写

                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 0), 12);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 1), 13);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 2), 14);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 3), 5);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 4), 6);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 5), 7);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 6), 8);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 7), 9);
                    } else {
                        //一写

                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 3), 0);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 4), 1);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 5), 2);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 6), 3);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 7), 4);

                        this.m_PPU2C02.fineXScroll = data & 0x07;
                    }

                    this.m_PPU2C02.wirteX2Flag = !this.m_PPU2C02.wirteX2Flag;
                } else if (ioAddr == 0x2006) {
                    if (this.m_PPU2C02.wirteX2Flag) {
                        //二写

                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 0), 0);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 1), 1);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 2), 2);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 3), 3);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 4), 4);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 5), 5);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 6), 6);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 7), 7);

                        this.m_PPU2C02.V.updateValue(this.m_PPU2C02.T.value);
                    } else {
                        //一写

                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 0), 8);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 1), 9);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 2), 10);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 3), 11);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 4), 12);
                        this.m_PPU2C02.T.updateBit(BitUtils.get(data, 5), 13);
                        this.m_PPU2C02.T.updateBit(0, 14);
                    }

                    this.m_PPU2C02.wirteX2Flag = !this.m_PPU2C02.wirteX2Flag;
                } else if (ioAddr == 0x2007) {
                    let vramAddr: number = this.m_PPU2C02.V.value;
                    this.m_PPU2C02.writeByte(vramAddr, data);

                    if (this.m_PPU2C02.Ctrl.I == 1) {
                        vramAddr = NumberUtils.toUInt16(vramAddr + 32);
                    } else {
                        vramAddr = NumberUtils.toUInt16(vramAddr + 1);
                    }
                    this.m_PPU2C02.V.updateValue(vramAddr);
                } else {
                    throw new Error("Not support address");
                }
            } else if (addr == 0x4014) {
                //dma

                const startAddr: number = NumberUtils.toUInt16(data << 8);
                const endAddr: number = startAddr | 0xff;
                const blockData: Uint8Array = this.m_RAM.readBlock(startAddr, endAddr);
                this.m_PPU2C02.oam = blockData;
                if (this.m_DMACycle) {
                    this.m_DMACycle();
                }
            } else if (addr == 0x4016) {
                //joystick

                const clearStrobe: boolean = BitUtils.get(data, 0) == 0;
                if (clearStrobe) {
                    this.m_P1JoyStick?.clearOffset();
                    this.m_P2JoyStick?.clearOffset();
                }
            }
        } else if (addr >= 0x6000) {
            this.m_Cartridge.mapper.writeByte(addr, data);
        } else {
            throw new Error("Not support address");
        }
    }

    public readByte(addr: number): number {
        if (addr < 0x2000) {
            return this.m_RAM.readByte(addr);
        } else if (addr >= 0x2000 && addr < 0x4020) {
            //ppu,apu,joystick registers
            if (addr < 0x4000) {
                const ioAddr: number = this.getIORegisterRealAddr(addr);
                if (ioAddr == 0x2000) {
                    throw new Error("address is not readable");
                } else if (ioAddr == 0x2001) {
                    throw new Error("address is not readable");
                } else if (ioAddr == 0x2002) {
                    // 读取后会清除VBlank状态
                    const data: number = this.m_PPU2C02.Status.value;
                    this.m_PPU2C02.Status.V = 0;
                    //参考资料4*)
                    this.m_PPU2C02.wirteX2Flag = false;
                    return data;
                } else if (ioAddr == 0x2003) {
                    throw new Error("address is not readable");
                } else if (ioAddr == 0x2004) {
                    return this.m_PPU2C02.oam[this.m_PPU2C02.oamAddr];
                } else if (ioAddr == 0x2005) {
                    throw new Error("address is not readable");
                } else if (ioAddr == 0x2006) {
                    throw new Error("address is not readable");
                } else if (ioAddr == 0x2007) {
                    //参考资料4*),这里读取的永远都是缓存值
                    const oldData: number = this.m_PPU2C02.readBuffer;
                    let vramAddr: number = this.m_PPU2C02.V.value;
                    const newData: number = this.m_PPU2C02.readByte(vramAddr);
                    this.m_PPU2C02.readBuffer = newData;
                    if (this.m_PPU2C02.Ctrl.I == 1) {
                        vramAddr = NumberUtils.toUInt16(vramAddr + 32);
                    } else {
                        vramAddr = NumberUtils.toUInt16(vramAddr + 1);
                    }
                    this.m_PPU2C02.V.updateValue(vramAddr);
                    return oldData;
                } else {
                    throw new Error("Not support address");
                }
            } else if (addr == 0x4014) {
                throw new Error("address is not readable");
            } else if (addr == 0x4016) {
                if (this.m_P1JoyStick) {
                    return this.m_P1JoyStick.value;
                }
                return 0;
            } else if (addr == 0x4017) {
                if (this.m_P2JoyStick) {
                    return this.m_P2JoyStick.value;
                }
                return 0;
            } else {
                return 0;
            }
        } else if (addr >= 0x6000) {
            return this.m_Cartridge.mapper.readByte(addr);
        } else {
            throw new Error("Not support address");
        }
    }

    private getIORegisterRealAddr(addr: number): number {
        return addr & 0x2007;
    }
}

export default CPUBus;
