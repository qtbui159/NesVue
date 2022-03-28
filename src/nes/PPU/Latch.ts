import NumberUtils from "../Utils/NumberUtils";

export default class Latch {
    private m_NameTableTileIndex: number = 0;
    public get nameTableTileIndex(): number {
        return this.m_NameTableTileIndex;
    }
    public set nameTableTileIndex(value: number) {
        this.m_NameTableTileIndex = NumberUtils.toUInt16(value);
    }

    private m_PaletteHighByte: number = 0;
    public get paletteHighByte(): number {
        return this.m_PaletteHighByte;
    }
    public set paletteHighByte(value: number) {
        this.m_PaletteHighByte = NumberUtils.toUInt8(value);
    }

    private m_BackgroundTileLowByte: number = 0;
    public get backgroundTileLowByte(): number {
        return this.m_BackgroundTileLowByte;
    }
    public set backgroundTileLowByte(value: number) {
        this.m_BackgroundTileLowByte = NumberUtils.toUInt8(value);
    }

    private m_BackgroundTileHighByte: number = 0;
    public get backgroundTileHighByte(): number {
        return this.m_BackgroundTileHighByte;
    }
    public set backgroundTileHighByte(value: number) {
        this.m_BackgroundTileHighByte = NumberUtils.toUInt8(value);
    }
}
