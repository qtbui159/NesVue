import IRam from "./IRam";

export default class VRam implements IRam {
    private readonly m_Data: Uint8Array = new Uint8Array(0x1000);

    public writeByte(addr: number, data: number): void {
        const realAddr: number = this.getRealAddr(addr);
        this.m_Data[realAddr] = data;
    }

    public readByte(addr: number): number {
        const realAddr: number = this.getRealAddr(addr);
        return this.m_Data[realAddr];
    }

    public readBlock(startAddr: number, endAddr: number): Uint8Array {
        throw new Error("Not support function");
    }

    private getRealAddr(addr: number): number {
        if (addr >= 0x3000 && addr <= 0x3eff) {
            //$3000-3EFF is usually a mirror of the 2kB region from $2000-2EFF. The PPU does not render from this address range, so this space has negligible utility.
            addr -= 0x1000;
        }
        return addr - 0x2000;
    }
}
