import NumberUtils from "../Utils/NumberUtils";

class ShiftRegister {
    /**
     * 2个字节
     */
    public get tileHighByte(): number {
        return this.m_TileHighByte;
    }
    private m_TileHighByte: number = 0;

    /**
     * 2个字节
     */
    public get tileLowByte(): number {
        return this.m_TileLowByte;
    }
    private m_TileLowByte: number = 0;

    /**
     * 2个字节
     */
    public get attributeHighByte(): number {
        return this.m_AttributeHighByte;
    }
    private m_AttributeHighByte: number = 0;

    /**
     * 2个字节
     */
    public get attributeLowByte(): number {
        return this.m_AttributeLowByte;
    }
    private m_AttributeLowByte: number = 0;

    /**
     * 因为绘制过程是高7bit 6bit 5bit，所以是左移
     */
    public leftMove(): void {
        this.m_TileHighByte = NumberUtils.toUInt16(this.m_TileHighByte << 1);
        this.m_TileLowByte = NumberUtils.toUInt16(this.m_TileLowByte << 1);
        this.m_AttributeHighByte = NumberUtils.toUInt16(this.m_AttributeHighByte << 1);
        this.m_AttributeLowByte = NumberUtils.toUInt16(this.m_AttributeLowByte << 1);
    }

    public fillTileHighByte(data: number): void {
        this.m_TileHighByte |= NumberUtils.toUInt8(data);
    }

    public fillTileLowByte(data: number): void {
        this.m_TileLowByte |= NumberUtils.toUInt8(data);
    }

    public fillAttributeHighByte(data: number): void {
        this.m_AttributeHighByte |= NumberUtils.toUInt8(data);
    }

    public fillAttributeLowByte(data: number): void {
        this.m_AttributeLowByte |= NumberUtils.toUInt8(data);
    }
}

export default ShiftRegister;
