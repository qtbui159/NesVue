import MirroringMode from "../Common/MirroringMode";
import IMapper from "./IMapper";

/**
 * 卡带
 */
interface ICartridge {
    /**
     * 镜像模式
     */
    get mirroringMode(): MirroringMode;

    /**
     * 资源数据
     */
    get chrRom(): Uint8Array;

    /**
     * 程序数据
     */
    get prgRom(): Uint8Array;

    get mapper(): IMapper;
}

export default ICartridge;
