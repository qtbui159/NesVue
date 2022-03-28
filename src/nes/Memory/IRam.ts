import IReadWrite from "../Common/IReadWrite";

export default interface IRam extends IReadWrite {
    /**
     * 读一整块内存
     * @param startAddr 起始地址（包含）
     * @param endAddr 结束地址（不包含）
     */
    readBlock(startAddr: number, endAddr: number): Uint8Array;
}
