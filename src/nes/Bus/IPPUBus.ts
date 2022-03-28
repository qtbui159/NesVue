import ICartridge from "../Cartridge/ICartridge";
import IReadWrite from "../Common/IReadWrite";
import IRam from "../Memory/IRam";
import IPalette from "../PPU/IPalette";

export default interface IPPUBus extends IReadWrite {
    /**
     * 连接卡带
     * @param cartridge 卡带
     */
    connectCartridge(cartridge: ICartridge): void;

    /**
     * 连接显存
     * @param vram 显存
     */
    connectVRam(vram: IRam): void;

    /**
     * 连接调色板
     * @param palette
     */
    connectPalette(palette: IPalette): void;
}
