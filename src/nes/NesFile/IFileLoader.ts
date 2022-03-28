import ICartridge from "../Cartridge/ICartridge";

export default interface IFileLoader {
    /**
     * 从数据生成卡带
     * @param data
     */
    load(data: Uint8Array): ICartridge;
}
