interface IReadWrite {
    /**
     * 写1个字节
     * @param addr 地址
     * @param data 数据
     */
    writeByte(addr: number, data: number): void;

    /**
     * 读1个字节
     * @param addr 地址
     * @returns 返回读取的数据
     */
    readByte(addr: number): number;
}

export default IReadWrite;
