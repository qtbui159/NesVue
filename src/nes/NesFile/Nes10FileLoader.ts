import ICartridge from "../Cartridge/ICartridge";
import IFileLoader from "./IFileLoader";
import BitUtils from "../Utils/BitUtils";
import MirroringMode from "../Common/MirroringMode";
import Cartridge from "../Cartridge/Cartridge";

export default class Nes10FileLoader implements IFileLoader {
    public load(data: Uint8Array): ICartridge {
        /**
         * nes1.0文件组成
           header+trainer+PRG rom+CHR rom
           header为16字节
           header为0，trainer为0字节
           header为1，trainer为512字节
           PRGRom，16kb*n，n在header中指定
           CHRRom，8kb*n，n为header中指定
           所以data至少的大小为16+0+16kb+8kb
         */
        const MIN_SIZE: number = 16 + 0 + 16 * 1024 + 8 * 1024;
        if (!data || data.byteLength < MIN_SIZE) {
            throw new Error("invalid nes file data");
        }

        const header: number[] = [0x4e, 0x45, 0x53, 0x1a];
        const currentHeader: Uint8Array = data.subarray(0, 4);
        for (let i = 0; i < header.length; ++i) {
            if (header[i] != currentHeader[i]) {
                throw new Error("nes header is invalid");
            }
        }

        const amountOfPRGBlock: number = data[4];
        const amountOfCHRBlock: number = data[5];
        const flag1: number = data[6];
        const flag2: number = data[7];
        const bMirroringMode: number = BitUtils.get(flag1, 0);
        let mirroringMode: MirroringMode = MirroringMode.Horizontal;

        if (bMirroringMode == 0) {
            mirroringMode = MirroringMode.Horizontal;
        } else if (bMirroringMode == 1) {
            mirroringMode = MirroringMode.Vertical;
        }

        const trainerPresent: boolean = BitUtils.get(flag1, 2) == 1;
        const trainerSize: number = trainerPresent ? 512 : 0;
        const mapperLow: number = (flag1 & 0xf0) >> 4;
        const mapperHigh: number = flag2 & 0xf0;
        const mapperVersion = mapperHigh | mapperLow;
        const prgStart: number = 16 + trainerSize;
        const prgEnd: number = 16 + trainerSize + amountOfPRGBlock * 16 * 1024;
        const chrStart: number = prgEnd;
        const chrEnd: number = chrStart + amountOfCHRBlock * 8 * 1024;

        const prgData: Uint8Array = data.subarray(prgStart, prgEnd);
        const chrData: Uint8Array = data.subarray(chrStart, chrEnd);
        return Cartridge.create(mirroringMode, prgData, chrData, mapperVersion);
    }
}
