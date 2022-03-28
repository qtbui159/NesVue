import IMapper from "../IMapper";
import NumberUtils from "../../Utils/NumberUtils";

export default class Mapper000 implements IMapper {
    private m_PRGRam: Uint8Array;
    private m_PRGRom: Uint8Array;
    private m_CHRRom: Uint8Array;

    public get version(): number {
        return 0;
    }

    public constructor(prgRam: Uint8Array, prgRom: Uint8Array, chrRom: Uint8Array) {
        this.m_PRGRam = prgRam;
        this.m_PRGRom = prgRom;
        this.m_CHRRom = chrRom;
    }

    public writeByte(addr: number, data: number): void {
        throw new Error("Not support Operation");
    }

    public readByte(addr: number): number {
        if (addr < 0x2000) {
            //PPU总线使用
            return this.m_CHRRom[addr];
        } else if (addr >= 0x6000 && addr <= 0x7fff) {
            const realAddr = this.getPRGRamRealAddr(addr);
            return this.m_PRGRam[realAddr];
        } else if (addr >= 0x8000 && addr <= 0xffff) {
            const realAddr = this.getPRGRomRealAddr(addr);
            return this.m_PRGRom[realAddr];
        }
        throw new Error(`Not support address ${addr.toString(16)}`);
    }

    private getPRGRomRealAddr(addr: number): number {
        const NROM128 = 16 * 1024;
        const NROM256 = 32 * 1024;

        if (this.m_PRGRom.byteLength == NROM128) {
            return NumberUtils.toUInt16((addr & 0xbfff) - 0x8000);
        } else if (this.m_PRGRom.byteLength == NROM256) {
            return NumberUtils.toUInt16(addr - 0x8000);
        }

        throw new Error(`Not support prg rom size ${this.m_PRGRom.byteLength}`);
    }

    private getPRGRamRealAddr(addr: number): number {
        return NumberUtils.toUInt16(addr - 0x6000);
    }
}
