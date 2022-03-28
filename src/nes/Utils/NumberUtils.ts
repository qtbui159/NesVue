import BitUtils from "./BitUtils";

class NumberUtils {
    public toUInt8(value: number): number {
        return value & 0xff;
    }

    public toUInt16(value: number): number {
        return value & 0xffff;
    }

    public toInt8(value: number): number {
        if (value == 0) {
            return 0;
        }

        const isNegative: boolean = BitUtils.get(value, 7) == 1;
        const n: number = value & 0x7f;
        return isNegative ? n - 128 : n;
    }

    public toInt16(value: number): number {
        if (value == 0) {
            return 0;
        }

        const isNegative: boolean = BitUtils.get(value, 15) == 1;
        const n: number = value & 0x7fff;
        return isNegative ? n - 32768 : n;
    }
}

export default new NumberUtils();
