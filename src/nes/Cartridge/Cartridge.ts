import MirroringMode from "../Common/MirroringMode";
import ICartridge from "./ICartridge";
import IMapper from "./IMapper";
import Mapper000 from "./Mapper/Mapper000";

class Cartridge implements ICartridge {
    private m_MirroringMode: MirroringMode;
    public get mirroringMode(): MirroringMode {
        return this.m_MirroringMode;
    }

    private m_CHRRom: Uint8Array;
    public get chrRom(): Uint8Array {
        return this.m_CHRRom;
    }

    private m_PRGRom: Uint8Array;
    public get prgRom(): Uint8Array {
        return this.m_PRGRom;
    }

    private m_Mapper: IMapper = {} as any;
    public get mapper(): IMapper {
        return this.m_Mapper;
    }

    private constructor(mirroringMode: MirroringMode, prgRom: Uint8Array, chrRom: Uint8Array, mapper: IMapper) {
        this.m_MirroringMode = mirroringMode;
        this.m_CHRRom = chrRom;
        this.m_PRGRom = prgRom;
        this.m_Mapper = mapper;
    }

    public static create(mirroringMode: MirroringMode, prgRom: Uint8Array, chrRom: Uint8Array, mapperVersion: number) {
        const prgRam: Uint8Array = new Uint8Array(0x2000);
        let mapper: IMapper;
        if (mapperVersion == 0) {
            mapper = new Mapper000(prgRam, prgRom, chrRom);
        } else {
            throw new Error(`Not support mapper versoin ${mapperVersion}`);
        }

        return new Cartridge(mirroringMode, prgRom, chrRom, mapper);
    }
}

export default Cartridge;
