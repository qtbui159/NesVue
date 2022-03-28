import ICartridge from "../Cartridge/ICartridge";
import IRam from "../Memory/IRam";
import IPalette from "../PPU/IPalette";
import IPPUBus from "./IPPUBus";

class PPUBus implements IPPUBus {
    private m_Cartridge: ICartridge = {} as any;
    private m_VRam: IRam = {} as any;
    private m_Palette: IPalette = {} as any;

    public connectCartridge(cartridge: ICartridge): void {
        this.m_Cartridge = cartridge;
    }

    public connectVRam(vram: IRam): void {
        this.m_VRam = vram;
    }

    public connectPalette(palette: IPalette): void {
        this.m_Palette = palette;
    }

    public writeByte(addr: number, data: number): void {
        const realAddr: number = this.getRealAddr(addr);
        if (realAddr < 0x2000) {
            this.m_Cartridge.mapper.writeByte(addr, data);
        } else if (realAddr >= 0x2000 && realAddr < 0x3f00) {
            this.m_VRam.writeByte(realAddr, data);
        } else if (realAddr >= 0x3f00 && realAddr < 0x4000) {
            this.m_Palette.writeByte(realAddr, data);
        } else {
            throw new Error("invalid ppu address");
        }
    }

    public readByte(addr: number): number {
        const realAddr: number = this.getRealAddr(addr);
        if (realAddr < 0x2000) {
            return this.m_Cartridge.mapper.readByte(addr);
        } else if (realAddr >= 0x2000 && realAddr < 0x3f00) {
            return this.m_VRam.readByte(realAddr);
        } else if (realAddr >= 0x3f00 && realAddr < 0x4000) {
            return this.m_Palette.readByte(realAddr);
        }

        throw new Error("invalid ppu address");
    }

    private getRealAddr(addr: number): number {
        return addr & 0x3fff;
    }
}

export default PPUBus;
