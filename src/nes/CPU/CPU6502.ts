import ICPU6502 from "./ICPU6502";
import StatusRegister from "./StatusRegister";
import ICPUBus from "../Bus/ICPUBus";
import NumberUtils from "../Utils/NumberUtils";
import BitUtils from "../Utils/BitUtils";

interface OpFunction {
    (opCode: number): void;
}

class CPU6502 implements ICPU6502 {
    private m_OpCodeMapFunction: Map<number, OpFunction>;
    private m_CPUBus: ICPUBus;

    public X: number;
    public Y: number;
    public A: number;

    public get PC(): number {
        return this.m_PC;
    }
    public set PC(newPC: number) {
        this.m_PC = NumberUtils.toUInt16(newPC);
    }
    private m_PC: number = 0;

    public get SP(): number {
        return this.m_SP;
    }
    public set SP(newSP: number) {
        this.m_SP = NumberUtils.toUInt8(newSP);
    }
    private m_SP: number = 0;

    public P: StatusRegister;

    public Cycles: number = 0;
    private m_DmaDelay: number = 0;

    public constructor(cpuBus: ICPUBus) {
        this.m_CPUBus = cpuBus;

        this.X = 0;
        this.Y = 0;
        this.A = 0;
        this.PC = 0;
        this.SP = 0;
        this.P = new StatusRegister();

        this.m_OpCodeMapFunction = new Map<number, OpFunction>();

        this.init();
    }

    private init(): void {
        this.batchAdd(this.adc, 0x69, 0x65, 0x75, 0x6d, 0x7d, 0x79, 0x61, 0x71);
        this.batchAdd(this.and, 0x29, 0x25, 0x35, 0x2d, 0x3d, 0x39, 0x21, 0x31);
        this.batchAdd(this.asl, 0x0a, 0x06, 0x16, 0x0e, 0x1e);
        this.batchAdd(this.bcc, 0x90);
        this.batchAdd(this.bcs, 0xb0);
        this.batchAdd(this.beq, 0xf0);
        this.batchAdd(this.bit, 0x24, 0x2c);
        this.batchAdd(this.bmi, 0x30);
        this.batchAdd(this.bne, 0xd0);
        this.batchAdd(this.bpl, 0x10);
        this.batchAdd(this.brk, 0x00);
        this.batchAdd(this.bvc, 0x50);
        this.batchAdd(this.bvs, 0x70);
        this.batchAdd(this.clc, 0x18);
        this.batchAdd(this.cld, 0xd8);
        this.batchAdd(this.cli, 0x58);
        this.batchAdd(this.clv, 0xb8);
        this.batchAdd(this.cmp, 0xc9, 0xc5, 0xd5, 0xcd, 0xdd, 0xd9, 0xc1, 0xd1);
        this.batchAdd(this.cpx, 0xe0, 0xe4, 0xec);
        this.batchAdd(this.cpy, 0xc0, 0xc4, 0xcc);
        this.batchAdd(this.dec, 0xc6, 0xd6, 0xce, 0xde);
        this.batchAdd(this.dex, 0xca);
        this.batchAdd(this.dey, 0x88);
        this.batchAdd(this.eor, 0x49, 0x45, 0x55, 0x4d, 0x5d, 0x59, 0x41, 0x51);
        this.batchAdd(this.inc, 0xe6, 0xf6, 0xee, 0xfe);
        this.batchAdd(this.inx, 0xe8);
        this.batchAdd(this.iny, 0xc8);
        this.batchAdd(this.jmp, 0x4c, 0x6c);
        this.batchAdd(this.jsr, 0x20);
        this.batchAdd(this.lda, 0xa9, 0xa5, 0xb5, 0xad, 0xbd, 0xb9, 0xa1, 0xb1);
        this.batchAdd(this.ldx, 0xa2, 0xa6, 0xb6, 0xae, 0xbe);
        this.batchAdd(this.ldy, 0xa0, 0xa4, 0xb4, 0xac, 0xbc);
        this.batchAdd(this.lsr, 0x4a, 0x46, 0x56, 0x4e, 0x5e);
        this.batchAdd(this.nop, 0xea);
        this.batchAdd(this.ora, 0x09, 0x05, 0x15, 0x0d, 0x1d, 0x19, 0x01, 0x11);
        this.batchAdd(this.pha, 0x48);
        this.batchAdd(this.php, 0x08);
        this.batchAdd(this.pla, 0x68);
        this.batchAdd(this.plp, 0x28);
        this.batchAdd(this.rol, 0x2a, 0x26, 0x36, 0x2e, 0x3e);
        this.batchAdd(this.ror, 0x6a, 0x66, 0x76, 0x6e, 0x7e);
        this.batchAdd(this.rti, 0x40);
        this.batchAdd(this.rts, 0x60);
        this.batchAdd(this.sbc, 0xe9, 0xe5, 0xf5, 0xed, 0xfd, 0xf9, 0xe1, 0xf1);
        this.batchAdd(this.sec, 0x38);
        this.batchAdd(this.sed, 0xf8);
        this.batchAdd(this.sei, 0x78);
        this.batchAdd(this.sta, 0x85, 0x95, 0x8d, 0x9d, 0x99, 0x81, 0x91);
        this.batchAdd(this.stx, 0x86, 0x96, 0x8e);
        this.batchAdd(this.sty, 0x84, 0x94, 0x8c);
        this.batchAdd(this.tax, 0xaa);
        this.batchAdd(this.tay, 0xa8);
        this.batchAdd(this.tsx, 0xba);
        this.batchAdd(this.txa, 0x8a);
        this.batchAdd(this.txs, 0x9a);
        this.batchAdd(this.tya, 0x98);
        this.batchAdd(this.unofficial_nop, 0x80, 0x04, 0x44, 0x64, 0x0c, 0x14, 0x34, 0x54, 0x74, 0xd4, 0xf4, 0x1c, 0x3c, 0x5c, 0x7c, 0xdc, 0xfc, 0x89, 0x82, 0xc2, 0xe2, 0x1a, 0x3a, 0x5a, 0x7a, 0xda, 0xfa);
        this.batchAdd(this.unofficial_lax, 0xa3, 0xa7, 0xab, 0xaf, 0xb3, 0xb7, 0xbf);
        this.batchAdd(this.unofficial_sax, 0x83, 0x87, 0x8f, 0x97);
        this.batchAdd(this.unofficial_sbc, 0xeb);
        this.batchAdd(this.unofficial_dcp, 0xc3, 0xc7, 0xcf, 0xd3, 0xd7, 0xdb, 0xdf);
        this.batchAdd(this.unofficial_isc_isb, 0xe3, 0xe7, 0xef, 0xf3, 0xf7, 0xfb, 0xff);
        this.batchAdd(this.unofficial_slo, 0x03, 0x07, 0x0f, 0x13, 0x17, 0x1b, 0x1f);
        this.batchAdd(this.unofficial_rla, 0x23, 0x27, 0x2f, 0x33, 0x37, 0x3b, 0x3f);
        this.batchAdd(this.unofficial_sre, 0x43, 0x47, 0x4f, 0x53, 0x57, 0x5b, 0x5f);
        this.batchAdd(this.unofficial_rra, 0x63, 0x67, 0x6f, 0x73, 0x77, 0x7b, 0x7f);
    }

    private batchAdd(func: OpFunction, ...opCodes: number[]) {
        if (!func) {
            throw new Error("argument func invalid");
        }
        if (!opCodes || opCodes.length == 0) {
            throw new Error("argument opCodes invalid");
        }

        for (const opCode of opCodes) {
            if (this.m_OpCodeMapFunction.has(opCode)) {
                throw new Error("key already exists");
            }
            this.m_OpCodeMapFunction.set(opCode, func.bind(this));
        }
    }

    public ticktock(): void {
        const opCode: number = this.m_CPUBus.readByte(this.PC++);
        if (!this.m_OpCodeMapFunction.has(opCode)) {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        const opFunction: OpFunction | undefined = this.m_OpCodeMapFunction.get(opCode);
        opFunction!(opCode);
    }

    public ticktockFlatCycle(): void {
        if (this.m_DmaDelay > 0) {
            --this.m_DmaDelay;
            return;
        }

        if (this.Cycles == 0) {
            this.ticktock();
        }
        this.Cycles--;
    }

    public dmaCycle(): void {
        if (this.Cycles % 2 == 0) {
            this.m_DmaDelay++;
        }
        this.m_DmaDelay += 513;
    }

    public reset(): void {
        const resetAddr: number = 0xfffc;
        this.PC = this.readUInt16(resetAddr);
        this.SP = 0xfd;
        this.A = 0;
        this.X = 0;
        this.Y = 0;
        this.P.updateValue(0x24);
    }

    public nmi(): void {
        const nmiAddr: number = 0xfffa;
        const high: number = NumberUtils.toUInt8((this.PC >> 8) & 0xff);
        const low: number = NumberUtils.toUInt8(this.PC & 0xff);
        let pValue: number = this.P.value;
        pValue = BitUtils.set(pValue, 5);

        this.push(high);
        this.push(low);
        this.push(pValue);

        this.P.I = 1;
        this.PC = this.readUInt16(nmiAddr);

        this.Cycles += 7;
    }

    public irq(): void {
        if (this.P.I == 1) {
            return;
        }

        const irqAddr: number = 0xfffe;
        const high: number = NumberUtils.toUInt8((this.PC >> 8) & 0xff);
        const low: number = NumberUtils.toUInt8(this.PC & 0xff);
        let pValue: number = this.P.value;
        pValue = BitUtils.set(pValue, 5);

        this.push(high);
        this.push(low);
        this.push(pValue);

        this.P.I = 1;
        this.PC = this.readUInt16(irqAddr);

        this.Cycles += 7;
    }

    private adc(opCode: number): void {
        let addr: number;
        if (opCode == 0x69) {
            addr = this.immediateAddressing();
            this.Cycles += 2;
        } else if (opCode == 0x65) {
            addr = this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0x75) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 4;
        } else if (opCode == 0x6d) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else if (opCode == 0x7d) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteXAddressing();
            addr = tmpAddr;
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else if (opCode == 0x79) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteYAddressing();
            addr = tmpAddr;
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else if (opCode == 0x61) {
            addr = this.indexedIndirectAddressing();
            this.Cycles += 6;
        } else if (opCode == 0x71) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.indirectIndexedAddressing();
            addr = tmpAddr;
            this.Cycles += 5;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        const data: number = this.m_CPUBus.readByte(addr);
        const oldA: number = this.A;
        const carryValue: number = NumberUtils.toUInt16(this.A + data + this.P.C);
        this.A = NumberUtils.toUInt8(this.A + data + this.P.C);

        this.P.Z = this.A == 0 ? 1 : 0;
        this.P.N = BitUtils.get(this.A, 7);
        this.P.O = this.checkAddOverflowPresent(oldA, data, this.P.C) ? 1 : 0;
        this.P.C = carryValue >> 8 != 0 ? 1 : 0;
    }

    private and(opCode: number): void {
        let addr: number;
        if (opCode == 0x29) {
            addr = this.immediateAddressing();
            this.Cycles += 2;
        } else if (opCode == 0x25) {
            addr = this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0x35) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 4;
        } else if (opCode == 0x2d) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else if (opCode == 0x3d) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteXAddressing();
            addr = tmpAddr;
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else if (opCode == 0x39) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteYAddressing();
            addr = tmpAddr;
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else if (opCode == 0x21) {
            addr = this.indexedIndirectAddressing();
            this.Cycles += 6;
        } else if (opCode == 0x31) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.indirectIndexedAddressing();
            addr = tmpAddr;
            this.Cycles += 5;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        const data: number = this.m_CPUBus.readByte(addr);

        this.A = NumberUtils.toUInt8(this.A & data);
        this.P.Z = this.A == 0 ? 1 : 0;
        this.P.N = BitUtils.get(this.A, 7);
    }

    private asl(opCode: number): void {
        let addr: number;
        if (opCode == 0x0a) {
            const newCarryFlag: number = BitUtils.get(this.A, 7);
            this.A = NumberUtils.toUInt8(this.A << 1);

            this.P.Z = this.A == 0 ? 1 : 0;
            this.P.N = BitUtils.get(this.A, 7);
            this.P.C = newCarryFlag;
            this.Cycles += 2;
            return;
        } else if (opCode == 0x06) {
            addr = this.zeroPageAddressing();
            this.Cycles += 5;
        } else if (opCode == 0x16) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 6;
        } else if (opCode == 0x0e) {
            addr = this.absoluteAddressing();
            this.Cycles += 6;
        } else if (opCode == 0x1e) {
            const { addr: tmpAddr } = this.absoluteXAddressing();
            addr = tmpAddr;
            this.Cycles += 7;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        let data: number = this.m_CPUBus.readByte(addr);
        const newCarryFlag: number = BitUtils.get(data, 7);
        data = NumberUtils.toUInt8(data << 1);
        this.m_CPUBus.writeByte(addr, data);

        this.P.Z = data == 0 ? 1 : 0;
        this.P.N = BitUtils.get(data, 7);
        this.P.C = newCarryFlag;
    }

    private bcc(opCode: number): void {
        if (opCode == 0x90) {
            let offset: number = this.relativeAddressing();
            offset = NumberUtils.toInt8(offset);
            this.Cycles += 2;
            if (this.P.C == 0) {
                this.Cycles += 1;
                const newAddr: number = NumberUtils.toUInt16(this.PC + offset);
                if (this.isCrossPage(newAddr, this.PC)) {
                    this.Cycles += 1;
                }
                this.PC = newAddr;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private bcs(opCode: number): void {
        if (opCode == 0xb0) {
            let offset: number = this.relativeAddressing();
            offset = NumberUtils.toInt8(offset);
            this.Cycles += 2;
            if (this.P.C == 1) {
                this.Cycles += 1;

                const newAddr: number = NumberUtils.toUInt16(this.PC + offset);
                if (this.isCrossPage(newAddr, this.PC)) {
                    this.Cycles += 1;
                }
                this.PC = newAddr;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private beq(opCode: number): void {
        if (opCode == 0xf0) {
            let offset: number = this.relativeAddressing();
            offset = NumberUtils.toInt8(offset);
            this.Cycles += 2;
            if (this.P.Z == 1) {
                this.Cycles += 1;

                const newAddr: number = NumberUtils.toUInt16(this.PC + offset);
                if (this.isCrossPage(newAddr, this.PC)) {
                    this.Cycles += 1;
                }
                this.PC = newAddr;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private bit(opCode: number): void {
        let addr: number;
        if (opCode == 0x24) {
            addr = this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0x2c) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        const data: number = this.m_CPUBus.readByte(addr);
        const result: number = data & this.A;
        this.P.Z = result == 0 ? 1 : 0;
        this.P.O = BitUtils.get(data, 6);
        this.P.N = BitUtils.get(data, 7);
    }

    private bmi(opCode: number): void {
        if (opCode == 0x30) {
            let offset: number = this.relativeAddressing();
            offset = NumberUtils.toInt8(offset);
            this.Cycles += 2;
            if (this.P.N == 1) {
                this.Cycles += 1;

                const newAddr: number = NumberUtils.toUInt16(this.PC + offset);
                if (this.isCrossPage(newAddr, this.PC)) {
                    this.Cycles += 1;
                }
                this.PC = newAddr;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private bne(opCode: number): void {
        if (opCode == 0xd0) {
            let offset: number = this.relativeAddressing();
            offset = NumberUtils.toInt8(offset);
            this.Cycles += 2;
            if (this.P.Z == 0) {
                this.Cycles += 1;

                const newAddr: number = NumberUtils.toUInt16(this.PC + offset);
                if (this.isCrossPage(newAddr, this.PC)) {
                    this.Cycles += 1;
                }
                this.PC = newAddr;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private bpl(opCode: number): void {
        if (opCode == 0x10) {
            let offset: number = this.relativeAddressing();
            offset = NumberUtils.toInt8(offset);
            this.Cycles += 2;
            if (this.P.N == 0) {
                this.Cycles += 1;

                const newAddr: number = NumberUtils.toUInt16(this.PC + offset);
                if (this.isCrossPage(newAddr, this.PC)) {
                    this.Cycles += 1;
                }
                this.PC = newAddr;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private brk(opCode: number): void {
        if (opCode == 0x00) {
            const high: number = NumberUtils.toUInt8((this.PC >> 7) & 0xff);
            const low: number = NumberUtils.toUInt8(this.PC & 0xff);
            let pValue: number = this.P.value;
            pValue = BitUtils.set(pValue, 4);
            pValue = BitUtils.set(pValue, 5);
            this.push(high);
            this.push(low);
            this.push(pValue);

            this.P.B = 1;
            this.P.I = 1;
            this.Cycles += 7;

            this.PC = this.readUInt16(0xfffe);
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private bvc(opCode: number): void {
        if (opCode == 0x50) {
            let offset: number = this.relativeAddressing();
            offset = NumberUtils.toInt8(offset);
            this.Cycles += 2;
            if (this.P.O == 0) {
                this.Cycles += 1;

                const newAddr: number = NumberUtils.toUInt16(this.PC + offset);
                if (this.isCrossPage(newAddr, this.PC)) {
                    this.Cycles += 1;
                }
                this.PC = newAddr;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private bvs(opCode: number): void {
        if (opCode == 0x70) {
            let offset: number = this.relativeAddressing();
            offset = NumberUtils.toInt8(offset);
            this.Cycles += 2;
            if (this.P.O == 1) {
                this.Cycles += 1;

                const newAddr: number = NumberUtils.toUInt16(this.PC + offset);
                if (this.isCrossPage(newAddr, this.PC)) {
                    this.Cycles += 1;
                }
                this.PC = newAddr;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private clc(opCode: number): void {
        if (opCode == 0x18) {
            this.P.C = 0;
            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private cld(opCode: number): void {
        if (opCode == 0xd8) {
            this.P.D = 0;
            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private cli(opCode: number): void {
        if (opCode == 0x58) {
            this.P.I = 0;
            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private clv(opCode: number): void {
        if (opCode == 0xb8) {
            this.P.O = 0;
            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private cmp(opCode: number): void {
        let addr: number;
        if (opCode == 0xc9) {
            addr = this.immediateAddressing();
            this.Cycles += 2;
        } else if (opCode == 0xc5) {
            addr = this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0xd5) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 4;
        } else if (opCode == 0xcd) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else if (opCode == 0xdd) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteXAddressing();
            addr = tmpAddr;
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else if (opCode == 0xd9) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteYAddressing();
            addr = tmpAddr;
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else if (opCode == 0xc1) {
            addr = this.indexedIndirectAddressing();
            this.Cycles += 6;
        } else if (opCode == 0xd1) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.indirectIndexedAddressing();
            addr = tmpAddr;
            this.Cycles += 5;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        const data: number = this.m_CPUBus.readByte(addr);
        const diff: number = NumberUtils.toUInt8(this.A - data);
        this.P.C = this.A >= data ? 1 : 0;
        this.P.Z = this.A == data ? 1 : 0;
        this.P.N = BitUtils.get(diff, 7);
    }

    private cpx(opCode: number): void {
        let addr: number;
        if (opCode == 0xe0) {
            addr = this.immediateAddressing();
            this.Cycles += 2;
        } else if (opCode == 0xe4) {
            addr = this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0xec) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        const data: number = this.m_CPUBus.readByte(addr);
        const diff: number = NumberUtils.toUInt8(this.X - data);
        this.P.C = this.X >= data ? 1 : 0;
        this.P.Z = this.X == data ? 1 : 0;
        this.P.N = BitUtils.get(diff, 7);
    }

    private cpy(opCode: number): void {
        let addr: number;
        if (opCode == 0xc0) {
            addr = this.immediateAddressing();
            this.Cycles += 2;
        } else if (opCode == 0xc4) {
            addr = this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0xcc) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        const data: number = this.m_CPUBus.readByte(addr);
        const diff: number = NumberUtils.toUInt8(this.Y - data);
        this.P.C = this.Y >= data ? 1 : 0;
        this.P.Z = this.Y == data ? 1 : 0;
        this.P.N = BitUtils.get(diff, 7);
    }

    private dec(opCode: number): void {
        let addr: number;
        if (opCode == 0xc6) {
            addr = this.zeroPageAddressing();
            this.Cycles += 5;
        } else if (opCode == 0xd6) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 6;
        } else if (opCode == 0xce) {
            addr = this.absoluteAddressing();
            this.Cycles += 6;
        } else if (opCode == 0xde) {
            const { addr: tmpAddr } = this.absoluteXAddressing();
            addr = tmpAddr;
            this.Cycles += 7;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        let data: number = this.m_CPUBus.readByte(addr);
        data = NumberUtils.toUInt8(data - 1);
        this.m_CPUBus.writeByte(addr, data);

        this.P.Z = data == 0 ? 1 : 0;
        this.P.N = BitUtils.get(data, 7);
    }

    private dex(opCode: number): void {
        if (opCode == 0xca) {
            this.X = NumberUtils.toUInt8(this.X - 1);
            this.P.Z = this.X == 0 ? 1 : 0;
            this.P.N = BitUtils.get(this.X, 7);
            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private dey(opCode: number): void {
        if (opCode == 0x88) {
            this.Y = NumberUtils.toUInt8(this.Y - 1);
            this.P.Z = this.Y == 0 ? 1 : 0;
            this.P.N = BitUtils.get(this.Y, 7);
            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private eor(opCode: number): void {
        let addr: number;
        if (opCode == 0x49) {
            addr = this.immediateAddressing();
            this.Cycles += 2;
        } else if (opCode == 0x45) {
            addr = this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0x55) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 4;
        } else if (opCode == 0x4d) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else if (opCode == 0x5d) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteXAddressing();
            this.Cycles += 4;
            addr = tmpAddr;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else if (opCode == 0x59) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteYAddressing();
            this.Cycles += 4;
            addr = tmpAddr;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else if (opCode == 0x41) {
            addr = this.indexedIndirectAddressing();
            this.Cycles += 6;
        } else if (opCode == 0x51) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.indirectIndexedAddressing();
            this.Cycles += 5;
            addr = tmpAddr;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        let data: number = this.m_CPUBus.readByte(addr);
        this.A ^= data;
        this.P.Z = this.A == 0 ? 1 : 0;
        this.P.N = BitUtils.get(this.A, 7);
    }

    private inc(opCode: number): void {
        let addr: number;
        if (opCode == 0xe6) {
            addr = this.zeroPageAddressing();
            this.Cycles += 5;
        } else if (opCode == 0xf6) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 6;
        } else if (opCode == 0xee) {
            addr = this.absoluteAddressing();
            this.Cycles += 6;
        } else if (opCode == 0xfe) {
            const { addr: tmpAddr } = this.absoluteXAddressing();
            addr = tmpAddr;
            this.Cycles += 7;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        let data: number = this.m_CPUBus.readByte(addr);
        data = NumberUtils.toUInt8(data + 1);
        this.m_CPUBus.writeByte(addr, data);
        this.P.Z = data == 0 ? 1 : 0;
        this.P.N = BitUtils.get(data, 7);
    }

    private inx(opCode: number): void {
        if (opCode == 0xe8) {
            this.X = NumberUtils.toUInt8(this.X + 1);
            this.P.Z = this.X == 0 ? 1 : 0;
            this.P.N = BitUtils.get(this.X, 7);

            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private iny(opCode: number): void {
        if (opCode == 0xc8) {
            this.Y = NumberUtils.toUInt8(this.Y + 1);
            this.P.Z = this.Y == 0 ? 1 : 0;
            this.P.N = BitUtils.get(this.Y, 7);

            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private jmp(opCode: number): void {
        let addr: number;
        if (opCode == 0x4c) {
            addr = this.absoluteAddressing();
            this.Cycles += 3;
        } else if (opCode == 0x6c) {
            addr = this.indirectAddressing();
            this.Cycles += 5;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        this.PC = addr;
    }

    private jsr(opCode: number): void {
        if (opCode == 0x20) {
            const addr: number = this.absoluteAddressing();
            const returnAddr: number = NumberUtils.toUInt16(this.PC - 1);
            const high: number = NumberUtils.toUInt8((returnAddr >> 8) & 0xff);
            const low: number = NumberUtils.toUInt8(returnAddr & 0xff);
            this.push(high);
            this.push(low);

            this.PC = addr;
            this.Cycles += 6;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private lda(opCode: number): void {
        let addr: number;
        if (opCode == 0xa9) {
            addr = this.immediateAddressing();
            this.Cycles += 2;
        } else if (opCode == 0xa5) {
            addr = this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0xb5) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 4;
        } else if (opCode == 0xad) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else if (opCode == 0xbd) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteXAddressing();
            addr = tmpAddr;
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else if (opCode == 0xb9) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteYAddressing();
            addr = tmpAddr;
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else if (opCode == 0xa1) {
            addr = this.indexedIndirectAddressing();
            this.Cycles += 6;
        } else if (opCode == 0xb1) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.indirectIndexedAddressing();
            addr = tmpAddr;
            this.Cycles += 5;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        const data: number = this.m_CPUBus.readByte(addr);
        this.A = data;
        this.P.Z = this.A == 0 ? 1 : 0;
        this.P.N = BitUtils.get(this.A, 7);
    }

    private ldx(opCode: number): void {
        let addr: number;
        if (opCode == 0xa2) {
            addr = this.immediateAddressing();
            this.Cycles += 2;
        } else if (opCode == 0xa6) {
            addr = this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0xb6) {
            addr = this.zeroPageYAddressing();
            this.Cycles += 4;
        } else if (opCode == 0xae) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else if (opCode == 0xbe) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteYAddressing();
            addr = tmpAddr;
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        const data: number = this.m_CPUBus.readByte(addr);
        this.X = data;
        this.P.Z = this.X == 0 ? 1 : 0;
        this.P.N = BitUtils.get(this.X, 7);
    }

    private ldy(opCode: number): void {
        let addr: number;
        if (opCode == 0xa0) {
            addr = this.immediateAddressing();
            this.Cycles += 2;
        } else if (opCode == 0xa4) {
            addr = this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0xb4) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 4;
        } else if (opCode == 0xac) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else if (opCode == 0xbc) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteXAddressing();
            addr = tmpAddr;
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        const data: number = this.m_CPUBus.readByte(addr);
        this.Y = data;
        this.P.Z = this.Y == 0 ? 1 : 0;
        this.P.N = BitUtils.get(this.Y, 7);
    }

    private lsr(opCode: number): void {
        let addr: number;
        if (opCode == 0x4a) {
            this.P.C = BitUtils.get(this.A, 0);
            this.A = NumberUtils.toUInt8(this.A >> 1);
            this.P.Z = this.A == 0 ? 1 : 0;
            this.P.N = BitUtils.get(this.A, 7);

            this.Cycles += 2;
            return;
        } else if (opCode == 0x46) {
            addr = this.zeroPageAddressing();
            this.Cycles += 5;
        } else if (opCode == 0x56) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 6;
        } else if (opCode == 0x4e) {
            addr = this.absoluteAddressing();
            this.Cycles += 6;
        } else if (opCode == 0x5e) {
            const { addr: tmpAddr } = this.absoluteXAddressing();
            addr = tmpAddr;
            this.Cycles += 7;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        let data: number = this.m_CPUBus.readByte(addr);
        this.P.C = BitUtils.get(data, 0);
        data = NumberUtils.toInt8(data >> 1);
        this.m_CPUBus.writeByte(addr, data);

        this.P.Z = data == 0 ? 1 : 0;
        this.P.N = BitUtils.get(data, 7);
    }

    private nop(opCode: number): void {
        if (opCode == 0xea) {
            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private ora(opCode: number): void {
        let addr: number;
        if (opCode == 0x09) {
            addr = this.immediateAddressing();
            this.Cycles += 2;
        } else if (opCode == 0x05) {
            addr = this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0x15) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 4;
        } else if (opCode == 0x0d) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else if (opCode == 0x1d) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteXAddressing();
            addr = tmpAddr;
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else if (opCode == 0x19) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteYAddressing();
            addr = tmpAddr;
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else if (opCode == 0x01) {
            addr = this.indexedIndirectAddressing();
            this.Cycles += 6;
        } else if (opCode == 0x11) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.indirectIndexedAddressing();
            addr = tmpAddr;
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        const data: number = this.m_CPUBus.readByte(addr);
        this.A = NumberUtils.toUInt8(this.A | data);
        this.P.Z = this.A == 0 ? 1 : 0;
        this.P.N = BitUtils.get(this.A, 7);
    }

    private pha(opCode: number): void {
        if (opCode == 0x48) {
            this.push(this.A);
            this.Cycles += 3;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private php(opCode: number): void {
        if (opCode == 0x08) {
            let pValue: number = this.P.value;
            pValue = BitUtils.set(pValue, 4);
            pValue = BitUtils.set(pValue, 5);
            this.push(pValue);
            this.Cycles += 3;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private pla(opCode: number): void {
        if (opCode == 0x68) {
            this.A = this.pop();
            this.P.Z = this.A == 0 ? 1 : 0;
            this.P.N = BitUtils.get(this.A, 7);
            this.Cycles += 4;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private plp(opCode: number): void {
        if (opCode == 0x28) {
            let pValue: number = this.pop();
            pValue = BitUtils.set(pValue, 5);
            pValue = BitUtils.clear(pValue, 4);
            this.P.updateValue(pValue);
            this.Cycles += 4;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private rol(opCode: number): void {
        let addr: number;
        if (opCode == 0x2a) {
            const oldCarryFlag: number = this.P.C;
            const newCarryFlag: number = BitUtils.get(this.A, 7);
            this.A = NumberUtils.toUInt8(this.A << 1);
            if (oldCarryFlag == 1) {
                this.A = BitUtils.set(this.A, 0);
            }
            this.P.C = newCarryFlag;
            this.P.Z = this.A == 0 ? 1 : 0;
            this.P.N = BitUtils.get(this.A, 7);
            this.Cycles += 2;
            return;
        } else if (opCode == 0x26) {
            addr = this.zeroPageAddressing();
            this.Cycles += 5;
        } else if (opCode == 0x36) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 6;
        } else if (opCode == 0x2e) {
            addr = this.absoluteAddressing();
            this.Cycles += 6;
        } else if (opCode == 0x3e) {
            const { addr: tmpAddr } = this.absoluteXAddressing();
            addr = tmpAddr;
            this.Cycles += 7;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        let data: number = this.m_CPUBus.readByte(addr);
        const oldCarryFlag: number = this.P.C;
        const newCarryFlag: number = BitUtils.get(data, 7);
        data = NumberUtils.toUInt8(data << 1);
        if (oldCarryFlag == 1) {
            data = BitUtils.set(data, 0);
        }
        this.P.C = newCarryFlag;
        this.P.Z = data == 0 ? 1 : 0;
        this.P.N = BitUtils.get(data, 7);
        this.m_CPUBus.writeByte(addr, data);
    }

    private ror(opCode: number): void {
        let addr: number;
        if (opCode == 0x6a) {
            const oldCarryFlag: number = this.P.C;
            const newCarryFlag: number = BitUtils.get(this.A, 0);
            this.A = NumberUtils.toUInt8(this.A >> 1);
            if (oldCarryFlag == 1) {
                this.A = BitUtils.set(this.A, 7);
            }
            this.P.C = newCarryFlag;
            this.P.Z = this.A == 0 ? 1 : 0;
            this.P.N = BitUtils.get(this.A, 7);
            this.Cycles += 2;
            return;
        } else if (opCode == 0x66) {
            addr = this.zeroPageAddressing();
            this.Cycles += 5;
        } else if (opCode == 0x76) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 6;
        } else if (opCode == 0x6e) {
            addr = this.absoluteAddressing();
            this.Cycles += 6;
        } else if (opCode == 0x7e) {
            const { addr: tmpAddr } = this.absoluteXAddressing();
            addr = tmpAddr;
            this.Cycles += 7;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        let data: number = this.m_CPUBus.readByte(addr);
        const oldCarryFlag: number = this.P.C;
        const newCarryFlag: number = BitUtils.get(data, 0);
        data = NumberUtils.toUInt8(data >> 1);
        if (oldCarryFlag == 1) {
            data = BitUtils.set(data, 7);
        }
        this.P.C = newCarryFlag;
        this.P.Z = data == 0 ? 1 : 0;
        this.P.N = BitUtils.get(data, 7);
        this.m_CPUBus.writeByte(addr, data);
    }

    private rti(opCode: number): void {
        if (opCode == 0x40) {
            let pValue: number = this.pop();
            pValue = BitUtils.set(pValue, 5);
            pValue = BitUtils.clear(pValue, 4);
            this.P.updateValue(pValue);

            const low: number = this.pop();
            const high: number = this.pop();
            this.PC = NumberUtils.toUInt16((high << 8) | low);
            this.Cycles += 6;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private rts(opCode: number): void {
        if (opCode == 0x60) {
            const low: number = this.pop();
            const high: number = this.pop();
            this.PC = NumberUtils.toUInt16((high << 8) | low);
            ++this.PC;

            this.Cycles += 6;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private sbc(opCode: number): void {
        let addr: number;
        if (opCode == 0xe9) {
            addr = this.immediateAddressing();
            this.Cycles += 2;
        } else if (opCode == 0xe5) {
            addr = this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0xf5) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 4;
        } else if (opCode == 0xed) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else if (opCode == 0xfd) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteXAddressing();
            addr = tmpAddr;
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else if (opCode == 0xf9) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.absoluteYAddressing();
            addr = tmpAddr;
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else if (opCode == 0xe1) {
            addr = this.indexedIndirectAddressing();
            this.Cycles += 6;
        } else if (opCode == 0xf1) {
            const { addr: tmpAddr, isCrossPage: crossPage } = this.indirectIndexedAddressing();
            addr = tmpAddr;
            this.Cycles += 5;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        const data: number = this.m_CPUBus.readByte(addr);
        const oldA: number = this.A;
        const carrayValue: number = NumberUtils.toInt16(this.A - data - (1 - this.P.C));

        this.A = NumberUtils.toUInt8(this.A - data - (1 - this.P.C));
        this.P.Z = this.A == 0 ? 1 : 0;
        this.P.N = BitUtils.get(this.A, 7);
        this.P.O = this.checkSubOverflowPresent(oldA, data, 1 - this.P.C) ? 1 : 0;
        this.P.C = carrayValue >= 0 ? 1 : 0;
    }

    private sec(opCode: number): void {
        if (opCode == 0x38) {
            this.P.C = 1;
            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private sed(opCode: number): void {
        if (opCode == 0xf8) {
            this.P.D = 1;
            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private sei(opCode: number): void {
        if (opCode == 0x78) {
            this.P.I = 1;
            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private sta(opCode: number): void {
        let addr: number;
        if (opCode == 0x85) {
            addr = this.zeroPageAddressing();
            this.Cycles += 2;
        } else if (opCode == 0x95) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 4;
        } else if (opCode == 0x8d) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else if (opCode == 0x9d) {
            const { addr: tmpAddr } = this.absoluteXAddressing();
            addr = tmpAddr;
            this.Cycles += 5;
        } else if (opCode == 0x99) {
            const { addr: tmpAddr } = this.absoluteYAddressing();
            addr = tmpAddr;
            this.Cycles += 5;
        } else if (opCode == 0x81) {
            addr = this.indexedIndirectAddressing();
            this.Cycles += 6;
        } else if (opCode == 0x91) {
            const { addr: tmpAddr } = this.indirectIndexedAddressing();
            addr = tmpAddr;
            this.Cycles += 6;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        this.m_CPUBus.writeByte(addr, this.A);
    }

    private stx(opCode: number): void {
        let addr: number;
        if (opCode == 0x86) {
            addr = this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0x96) {
            addr = this.zeroPageYAddressing();
            this.Cycles += 4;
        } else if (opCode == 0x8e) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        this.m_CPUBus.writeByte(addr, this.X);
    }

    private sty(opCode: number): void {
        let addr: number;
        if (opCode == 0x84) {
            addr = this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0x94) {
            addr = this.zeroPageXAddressing();
            this.Cycles += 4;
        } else if (opCode == 0x8c) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        this.m_CPUBus.writeByte(addr, this.Y);
    }

    private tax(opCode: number): void {
        if (opCode == 0xaa) {
            this.X = this.A;
            this.P.Z = this.X == 0 ? 1 : 0;
            this.P.N = BitUtils.get(this.X, 7);

            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private tay(opCode: number): void {
        if (opCode == 0xa8) {
            this.Y = this.A;
            this.P.Z = this.Y == 0 ? 1 : 0;
            this.P.N = BitUtils.get(this.Y, 7);

            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private tsx(opCode: number): void {
        if (opCode == 0xba) {
            this.X = this.SP;
            this.P.Z = this.X == 0 ? 1 : 0;
            this.P.N = BitUtils.get(this.X, 7);
            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private txa(opCode: number): void {
        if (opCode == 0x8a) {
            this.A = this.X;
            this.P.Z = this.A == 0 ? 1 : 0;
            this.P.N = BitUtils.get(this.A, 7);
            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private txs(opCode: number): void {
        if (opCode == 0x9a) {
            this.SP = this.X;
            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private tya(opCode: number): void {
        if (opCode == 0x98) {
            this.A = this.Y;
            this.P.Z = this.A == 0 ? 1 : 0;
            this.P.N = BitUtils.get(this.A, 7);
            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private unofficial_nop(opCode: number): void {
        if (opCode == 0x80) {
            this.immediateAddressing();
            this.Cycles += 2;
        } else if (opCode == 0x04 || opCode == 0x44 || opCode == 0x64) {
            this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0x0c) {
            this.absoluteAddressing();
            this.Cycles += 4;
        } else if (opCode == 0x14 || opCode == 0x34 || opCode == 0x54 || opCode == 0x74 || opCode == 0xd4 || opCode == 0xf4) {
            this.zeroPageXAddressing();
            this.Cycles += 4;
        } else if (opCode == 0x1c || opCode == 0x3c || opCode == 0x5c || opCode == 0x7c || opCode == 0xdc || opCode == 0xfc) {
            const { isCrossPage: crossPage } = this.absoluteXAddressing();
            this.Cycles += 4;
            if (crossPage) {
                this.Cycles += 1;
            }
        } else if (opCode == 0x89) {
            this.immediateAddressing();
            this.Cycles += 2;
        } else if (opCode == 0x82 || opCode == 0xc2 || opCode == 0xe2) {
            this.immediateAddressing();
            this.Cycles += 2;
        } else if (opCode == 0x1a || opCode == 0x3a || opCode == 0x5a || opCode == 0x7a || opCode == 0xda || opCode == 0xfa) {
            this.Cycles += 2;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private unofficial_lax(opCode: number): void {
        let tmpCycle: number = this.Cycles;

        if (opCode == 0xa3) {
            this.lda(0xa1);
            tmpCycle += 6;
        } else if (opCode == 0xa7) {
            this.lda(0xa5);
            tmpCycle += 3;
        } else if (opCode == 0xab) {
            this.lda(0xa9);
            tmpCycle += 2;
        } else if (opCode == 0xaf) {
            this.lda(0xad);
            tmpCycle += 4;
        } else if (opCode == 0xb3) {
            this.lda(0xb1);
            tmpCycle += 5;
        } else if (opCode == 0xb7) {
            const addr: number = this.zeroPageYAddressing();
            tmpCycle += 4;

            const data: number = this.m_CPUBus.readByte(addr);
            this.A = data;
            this.P.Z = this.A == 0 ? 1 : 0;
            this.P.N = BitUtils.get(this.A, 7);
        } else if (opCode == 0xbf) {
            this.lda(0xb9);
            tmpCycle += 4;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        this.tax(0xaa);
        this.Cycles = tmpCycle;
    }

    private unofficial_sax(opCode: number): void {
        let addr: number;
        if (opCode == 0x83) {
            addr = this.indexedIndirectAddressing();
            this.Cycles += 6;
        } else if (opCode == 0x87) {
            addr = this.zeroPageAddressing();
            this.Cycles += 3;
        } else if (opCode == 0x8f) {
            addr = this.absoluteAddressing();
            this.Cycles += 4;
        } else if (opCode == 0x97) {
            addr = this.zeroPageYAddressing();
            this.Cycles += 4;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        this.m_CPUBus.writeByte(addr, this.A & this.X);
    }

    private unofficial_sbc(opCode: number): void {
        if (opCode == 0xeb) {
            this.sbc(0xe9);
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }
    }

    private unofficial_dcp(opCode: number): void {
        let addr: number;
        let tmpCycle: number = this.Cycles;
        if (opCode == 0xc3) {
            addr = this.indexedIndirectAddressing();
            tmpCycle += 8;
        } else if (opCode == 0xc7) {
            addr = this.zeroPageAddressing();
            tmpCycle += 5;
        } else if (opCode == 0xcf) {
            addr = this.absoluteAddressing();
            tmpCycle += 6;
        } else if (opCode == 0xd3) {
            const { addr: tmpAddr } = this.indirectIndexedAddressing();
            addr = tmpAddr;
            tmpCycle += 8;
        } else if (opCode == 0xd7) {
            addr = this.zeroPageXAddressing();
            tmpCycle += 6;
        } else if (opCode == 0xdb) {
            const { addr: tmpAddr } = this.absoluteYAddressing();
            addr = tmpAddr;
            tmpCycle += 7;
        } else if (opCode == 0xdf) {
            const { addr: tmpAddr } = this.absoluteXAddressing();
            addr = tmpAddr;
            tmpCycle += 7;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        //dec
        let data: number = this.m_CPUBus.readByte(addr);
        data = NumberUtils.toUInt8(data - 1);
        this.m_CPUBus.writeByte(addr, data);

        //cmp
        const diff: number = NumberUtils.toUInt8(this.A - data);
        this.P.C = this.A >= data ? 1 : 0;
        this.P.Z = this.A == data ? 1 : 0;
        this.P.N = BitUtils.get(diff, 7);

        this.Cycles = tmpCycle;
    }

    private unofficial_isc_isb(opCode: number): void {
        let addr: number;
        let tmpCycle: number = this.Cycles;

        if (opCode == 0xe3) {
            addr = this.indexedIndirectAddressing();
            tmpCycle += 8;
        } else if (opCode == 0xe7) {
            addr = this.zeroPageAddressing();
            tmpCycle += 5;
        } else if (opCode == 0xef) {
            addr = this.absoluteAddressing();
            tmpCycle += 6;
        } else if (opCode == 0xf3) {
            const { addr: tmpAddr } = this.indirectIndexedAddressing();
            addr = tmpAddr;
            tmpCycle += 8;
        } else if (opCode == 0xf7) {
            addr = this.zeroPageXAddressing();
            tmpCycle += 6;
        } else if (opCode == 0xfb) {
            const { addr: tmpAddr } = this.absoluteYAddressing();
            addr = tmpAddr;
            tmpCycle += 7;
        } else if (opCode == 0xff) {
            const { addr: tmpAddr } = this.absoluteXAddressing();
            addr = tmpAddr;
            tmpCycle += 7;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        //inc
        let data: number = this.m_CPUBus.readByte(addr);
        data = NumberUtils.toUInt8(data + 1);
        this.m_CPUBus.writeByte(addr, data);

        //sbc
        const oldA: number = this.A;
        const carrayValue: number = NumberUtils.toInt16(this.A - data - (1 - this.P.C));

        this.A = NumberUtils.toUInt8(this.A - data - (1 - this.P.C));
        this.P.Z = this.A == 0 ? 1 : 0;
        this.P.N = BitUtils.get(this.A, 7);
        this.P.O = this.checkSubOverflowPresent(oldA, data, 1 - this.P.C) ? 1 : 0;
        this.P.C = carrayValue >= 0 ? 1 : 0;

        this.Cycles = tmpCycle;
    }

    private unofficial_slo(opCode: number): void {
        let addr: number;
        let tmpCycle: number = this.Cycles;

        if (opCode == 0x03) {
            addr = this.indexedIndirectAddressing();
            tmpCycle += 8;
        } else if (opCode == 0x07) {
            addr = this.zeroPageAddressing();
            tmpCycle += 5;
        } else if (opCode == 0x0f) {
            addr = this.absoluteAddressing();
            tmpCycle += 6;
        } else if (opCode == 0x13) {
            const { addr: tmpAddr } = this.indirectIndexedAddressing();
            addr = tmpAddr;
            tmpCycle += 8;
        } else if (opCode == 0x17) {
            addr = this.zeroPageXAddressing();
            tmpCycle += 6;
        } else if (opCode == 0x1b) {
            const { addr: tmpAddr } = this.absoluteYAddressing();
            addr = tmpAddr;
            tmpCycle += 7;
        } else if (opCode == 0x1f) {
            const { addr: tmpAddr } = this.absoluteXAddressing();
            addr = tmpAddr;
            tmpCycle += 7;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        //asl
        let data: number = this.m_CPUBus.readByte(addr);
        const newCarryFlag: number = BitUtils.get(data, 7);
        data = NumberUtils.toUInt8(data << 1);
        this.m_CPUBus.writeByte(addr, data);

        this.P.Z = data == 0 ? 1 : 0;
        this.P.N = BitUtils.get(data, 7);
        this.P.C = newCarryFlag;

        //ora
        this.A = NumberUtils.toUInt8(this.A | data);
        this.P.Z = this.A == 0 ? 1 : 0;
        this.P.N = BitUtils.get(this.A, 7);

        this.Cycles = tmpCycle;
    }

    private unofficial_rla(opCode: number): void {
        let addr: number;
        let tmpCycle: number = this.Cycles;

        if (opCode == 0x23) {
            addr = this.indexedIndirectAddressing();
            tmpCycle += 8;
        } else if (opCode == 0x27) {
            addr = this.zeroPageAddressing();
            tmpCycle += 5;
        } else if (opCode == 0x2f) {
            addr = this.absoluteAddressing();
            tmpCycle += 6;
        } else if (opCode == 0x33) {
            const { addr: tmpAddr } = this.indirectIndexedAddressing();
            addr = tmpAddr;
            tmpCycle += 8;
        } else if (opCode == 0x37) {
            addr = this.zeroPageXAddressing();
            tmpCycle += 6;
        } else if (opCode == 0x3b) {
            const { addr: tmpAddr } = this.absoluteYAddressing();
            addr = tmpAddr;
            tmpCycle += 7;
        } else if (opCode == 0x3f) {
            const { addr: tmpAddr } = this.absoluteXAddressing();
            addr = tmpAddr;
            tmpCycle += 7;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        //rol
        let data: number = this.m_CPUBus.readByte(addr);
        const oldCarryFlag: number = this.P.C;
        const newCarryFlag: number = BitUtils.get(data, 7);
        data = NumberUtils.toUInt8(data << 1);
        if (oldCarryFlag == 1) {
            data = BitUtils.set(data, 0);
        }
        this.P.C = newCarryFlag;
        this.P.Z = data == 0 ? 1 : 0;
        this.P.N = BitUtils.get(data, 7);
        this.m_CPUBus.writeByte(addr, data);

        //and
        this.A = NumberUtils.toUInt8(this.A & data);
        this.P.Z = this.A == 0 ? 1 : 0;
        this.P.N = BitUtils.get(this.A, 7);

        this.Cycles = tmpCycle;
    }

    private unofficial_sre(opCode: number): void {
        let addr: number;
        let tmpCycle: number = this.Cycles;

        if (opCode == 0x43) {
            addr = this.indexedIndirectAddressing();
            tmpCycle += 8;
        } else if (opCode == 0x47) {
            addr = this.zeroPageAddressing();
            tmpCycle += 5;
        } else if (opCode == 0x4f) {
            addr = this.absoluteAddressing();
            tmpCycle += 6;
        } else if (opCode == 0x53) {
            const { addr: tmpAddr } = this.indirectIndexedAddressing();
            addr = tmpAddr;
            tmpCycle += 8;
        } else if (opCode == 0x57) {
            addr = this.zeroPageXAddressing();
            tmpCycle += 6;
        } else if (opCode == 0x5b) {
            const { addr: tmpAddr } = this.absoluteYAddressing();
            addr = tmpAddr;
            tmpCycle += 7;
        } else if (opCode == 0x5f) {
            const { addr: tmpAddr } = this.absoluteXAddressing();
            addr = tmpAddr;
            tmpCycle += 7;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        //lsr
        let data: number = this.m_CPUBus.readByte(addr);
        this.P.C = BitUtils.get(data, 0);
        data = NumberUtils.toInt8(data >> 1);
        this.m_CPUBus.writeByte(addr, data);

        this.P.Z = data == 0 ? 1 : 0;
        this.P.N = BitUtils.get(data, 7);

        //eor
        this.A ^= data;
        this.P.Z = this.A == 0 ? 1 : 0;
        this.P.N = BitUtils.get(this.A, 7);

        this.Cycles = tmpCycle;
    }

    private unofficial_rra(opCode: number): void {
        let addr: number;
        let tmpCycle: number = this.Cycles;

        if (opCode == 0x63) {
            addr = this.indexedIndirectAddressing();
            tmpCycle += 8;
        } else if (opCode == 0x67) {
            addr = this.zeroPageAddressing();
            tmpCycle += 5;
        } else if (opCode == 0x6f) {
            addr = this.absoluteAddressing();
            tmpCycle += 6;
        } else if (opCode == 0x73) {
            const { addr: tmpAddr } = this.indirectIndexedAddressing();
            addr = tmpAddr;
            tmpCycle += 8;
        } else if (opCode == 0x77) {
            addr = this.zeroPageXAddressing();
            tmpCycle += 6;
        } else if (opCode == 0x7b) {
            const { addr: tmpAddr } = this.absoluteYAddressing();
            addr = tmpAddr;
            tmpCycle += 7;
        } else if (opCode == 0x7f) {
            const { addr: tmpAddr } = this.absoluteXAddressing();
            addr = tmpAddr;
            tmpCycle += 7;
        } else {
            throw new Error(`不支持的opCode,${opCode.toString(16)}`);
        }

        //ror
        let data: number = this.m_CPUBus.readByte(addr);
        const oldCarryFlag: number = this.P.C;
        const newCarryFlag: number = BitUtils.get(data, 0);
        data = NumberUtils.toUInt8(data >> 1);
        if (oldCarryFlag == 1) {
            data = BitUtils.set(data, 7);
        }
        this.P.C = newCarryFlag;
        this.P.Z = data == 0 ? 1 : 0;
        this.P.N = BitUtils.get(data, 7);
        this.m_CPUBus.writeByte(addr, data);

        //adc
        const oldA: number = this.A;
        const carryValue: number = NumberUtils.toUInt16(this.A + data + this.P.C);
        this.A = NumberUtils.toUInt8(this.A + data + this.P.C);

        this.P.Z = this.A == 0 ? 1 : 0;
        this.P.N = BitUtils.get(this.A, 7);
        this.P.O = this.checkAddOverflowPresent(oldA, data, this.P.C) ? 1 : 0;
        this.P.C = carryValue >> 8 != 0 ? 1 : 0;

        this.Cycles = tmpCycle;
    }

    /**
     * immediate寻址
     * @returns
     */
    private immediateAddressing(): number {
        return this.PC++;
    }

    /**
     * 零页寻址
     * @returns
     */
    private zeroPageAddressing(): number {
        const addr: number = this.m_CPUBus.readByte(this.PC++);
        return addr & 0xff;
    }

    /**
     * 零页X寻址
     * @returns
     */
    private zeroPageXAddressing(): number {
        const addr: number = this.m_CPUBus.readByte(this.PC++);
        return (addr + this.X) & 0xff;
    }

    /**
     * 零页Y寻址
     * @returns
     */
    private zeroPageYAddressing(): number {
        const addr: number = this.m_CPUBus.readByte(this.PC++);
        return (addr + this.Y) & 0xff;
    }

    /**
     * 绝对地址寻址
     * @returns
     */
    private absoluteAddressing(): number {
        const addr: number = this.readUInt16(this.PC);
        this.PC += 2;
        return addr;
    }

    /**
     * 绝对地址X寻址
     * @returns
     */
    private absoluteXAddressing(): { addr: number; isCrossPage: boolean } {
        const addr: number = this.readUInt16(this.PC);
        this.PC += 2;
        const newAddr: number = NumberUtils.toUInt16(addr + this.X);
        return {
            addr: newAddr,
            isCrossPage: this.isCrossPage(addr, newAddr),
        };
    }

    /**
     * 绝对地址Y寻址
     * @returns
     */
    private absoluteYAddressing(): { addr: number; isCrossPage: boolean } {
        const addr: number = this.readUInt16(this.PC);
        this.PC += 2;
        const newAddr: number = NumberUtils.toUInt16(addr + this.Y);
        return {
            addr: newAddr,
            isCrossPage: this.isCrossPage(addr, newAddr),
        };
    }

    /**
     * 相对寻址
     * @returns
     */
    private relativeAddressing(): number {
        return this.m_CPUBus.readByte(this.PC++);
    }

    /**
     * 间接寻址
     * @returns
     */
    private indirectAddressing(): number {
        const addr: number = this.readUInt16(this.PC);
        this.PC += 2;

        if ((addr & 0xff) == 0xff) {
            //触发硬件bug
            const low: number = this.m_CPUBus.readByte(addr);
            const high: number = this.m_CPUBus.readByte(addr & 0xff00);
            const newAddr: number = (high << 8) | low;
            return newAddr;
        } else {
            return this.readUInt16(addr);
        }
    }

    /**
     * 间接X寻址
     * @returns
     */
    private indexedIndirectAddressing(): number {
        const offset: number = this.m_CPUBus.readByte(this.PC++);
        const addr: number = NumberUtils.toUInt8(offset + this.X);
        if ((addr & 0xff) == 0xff) {
            //触发硬件bug
            const low: number = this.m_CPUBus.readByte(addr);
            const high: number = this.m_CPUBus.readByte(addr & 0xff00);
            const newAddr: number = (high << 8) | low;
            return newAddr;
        } else {
            return this.readUInt16(addr);
        }
    }

    /**
     * 间接Y寻址
     */
    private indirectIndexedAddressing(): { addr: number; isCrossPage: boolean } {
        const oldAddr = this.PC;
        let addr: number = this.m_CPUBus.readByte(this.PC++);
        if ((addr & 0xff) == 0xff) {
            //触发硬件bug
            const low: number = this.m_CPUBus.readByte(addr);
            const high: number = this.m_CPUBus.readByte(addr & 0xff00);
            addr = (high << 8) | low;
        } else {
            addr = this.readUInt16(addr);
        }

        addr = NumberUtils.toUInt16(addr + this.Y);
        return {
            addr: addr,
            isCrossPage: this.isCrossPage(oldAddr, addr),
        };
    }

    private readUInt16(addr: number): number {
        const low: number = this.m_CPUBus.readByte(addr);
        const high: number = this.m_CPUBus.readByte(NumberUtils.toUInt16(addr + 1));
        return NumberUtils.toUInt16((high << 8) | low);
    }

    private isCrossPage(oldAddr: number, newAddr: number): boolean {
        return (oldAddr & 0xff00) != (newAddr & 0xff00);
    }

    /**
     * 推入一个字节到堆栈顶
     * @param data
     */
    private push(data: number): void {
        const addr = NumberUtils.toUInt16(0x100 + this.SP);
        this.m_CPUBus.writeByte(addr, NumberUtils.toUInt8(data));
        this.SP--;
    }

    /**
     * 从堆栈顶取出数据并出栈
     */
    private pop(): number {
        this.SP++;
        const addr = NumberUtils.toUInt16(0x100 + this.SP);
        return this.m_CPUBus.readByte(addr);
    }

    /**
     * 检测数组中的值(byte)相加是否会有溢出的情况
     * @param dataArray
     * @returns true表示有溢出，false表示无溢出
     */
    private checkAddOverflowPresent(...dataArray: number[]): boolean {
        if (!dataArray || dataArray.length == 0) {
            return false;
        }

        let sum: number = 0;
        for (const i of dataArray) {
            sum += NumberUtils.toInt8(i);
            if (sum > 127 || sum < -128) {
                return true;
            }
        }

        return false;
    }

    /**
     * 检测数组中的值(byte)相减是否会有溢出的情况
     * @param dataArray
     * @returns true表示有溢出，false表示无溢出
     */
    private checkSubOverflowPresent(...dataArray: number[]): boolean {
        if (!dataArray || dataArray.length == 0) {
            return false;
        }

        let sum: number = NumberUtils.toInt8(dataArray[0]);
        for (let i = 1; i < dataArray.length; ++i) {
            sum -= NumberUtils.toInt8(dataArray[i]);
            if (sum > 127 || sum < -128) {
                return true;
            }
        }

        return false;
    }
}

export default CPU6502;
