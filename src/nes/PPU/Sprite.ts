/**
 * 精灵
 */
class Sprite {
    private m_Index: number;
    private m_Data: Uint8Array;

    public get isZero(): boolean {
        return this.m_Index == 0;
    }

    public get data(): Uint8Array {
        return this.m_Data;
    }

    /**
     *
     * @param index 索引0-63
     * @param data 精灵数据
     */
    public constructor(index: number, data: Uint8Array) {
        if (index < 0 || index > 63) {
            throw new Error("sprite index out of range");
        }
        this.m_Index = index;
        this.m_Data = data;
    }
}

export default Sprite;
