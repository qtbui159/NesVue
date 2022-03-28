class BitUtils {
    /**
     * 置1
     * @param data 数据
     * @param pos 比特位
     */
    public set(data: number, pos: number): number {
        return data | (1 << pos);
    }
    /**
     * 置0
     * @param data 原始数据
     * @param pos 比特位
     */
    public clear(data: number, pos: number): number {
        return data & ~(1 << pos);
    }

    /**
     * 取位数据
     * @param data 原始数据
     * @param pos 比特位
     * @returns 1或者0
     */
    public get(data: number, pos: number): number {
        return data & (1 << pos) ? 1 : 0;
    }
}

export default new BitUtils();
