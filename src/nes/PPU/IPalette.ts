import IReadWrite from "../Common/IReadWrite";
import RGB from "../Common/RGB"

/**
 * 调色板
 */
export default interface IPalette extends IReadWrite {
    indexToRGB(index: number): RGB;
}
