import MirroringMode from "../Common/MirroringMode";
import IPPU2C02 from "./IPPU2C02";
import MaskRegister from "./MaskRegister";
import ShiftRegister from "./ShiftRegister";
import Sprite from "./Sprite";
import StatusRegister from "./StatusRegister";
import VRamRegister from "./VRamRegister";
import CtrlRegister from "./CtrlRegister";
import Latch from "./Latch";
import IPPUBus from "../Bus/IPPUBus";
import BitUtils from "../Utils/BitUtils";
import NumberUtils from "../Utils/NumberUtils";
import IRenderAction from "../Common/IRenderAction";

//参考资料：
//1*)https://wiki.nesdev.org/w/index.php?title=PPU_power_up_state
//2*)https://wiki.nesdev.org/w/index.php?title=Mirroring#Nametable_Mirroring
//3*)https://wiki.nesdev.org/w/index.php?title=PPU_nametables
//4*)https://wiki.nesdev.org/w/index.php?title=PPU_attribute_tables
//5*)https://wiki.nesdev.org/w/index.php?title=PPU_pattern_tables
//6*)https://wiki.nesdev.org/w/index.php/PPU_registers#The_PPUDATA_read_buffer_.28post-fetch.29
//7*)https://wiki.nesdev.org/w/index.php?title=Sprite_overflow_games
//8*)https://wiki.nesdev.org/w/index.php?title=PPU_sprite_evaluation
//9*)https://wiki.nesdev.org/w/index.php?title=PPU_scrolling#At_dot_256_of_each_scanline
//10*)https://wiki.nesdev.org/w/images/4/4f/Ppu.svg
//11*)https://wiki.nesdev.org/w/index.php?title=PPU_rendering

class PPU2C02 implements IPPU2C02 {
    public Ctrl: CtrlRegister;
    public Mask: MaskRegister;
    public Status: StatusRegister;
    public T: VRamRegister;
    public V: VRamRegister;
    public fineXScroll: number;
    public readBuffer: number;
    public oam: Uint8Array;
    public oamAddr: number;
    public wirteX2Flag: boolean;

    private m_MirroringMode: MirroringMode;
    private m_SecondOAM: Sprite[];
    private m_ShiftRegister: ShiftRegister;
    private m_Latch: Latch;
    private m_PPUBus: IPPUBus;

    private m_Scanline: number;
    private m_Cycle: number;
    /**
     * 是否偶数帧
     */
    private m_EvenFrame: boolean;
    private m_Sprite0Hits: boolean;
    private m_SpriteData: (SpriteColor | null)[];
    private m_Frame: Uint8ClampedArray;
    private m_NmiInterrupt: VoidFunction;

    private m_Render: IRenderAction | null;

    public constructor(ppuBus: IPPUBus, nmiInterrupt: VoidFunction) {
        this.Ctrl = new CtrlRegister();
        this.Mask = new MaskRegister();
        this.Status = new StatusRegister();
        this.T = new VRamRegister();
        this.V = new VRamRegister();
        this.fineXScroll = 0;
        this.readBuffer = 0;
        this.oam = new Uint8Array(256);
        this.oamAddr = 0;
        this.wirteX2Flag = false;

        this.m_MirroringMode = MirroringMode.Horizontal;
        this.m_SecondOAM = [];
        this.m_ShiftRegister = new ShiftRegister();
        this.m_Latch = new Latch();
        this.m_PPUBus = ppuBus;

        this.m_Scanline = 0;
        this.m_Cycle = 0;
        this.m_EvenFrame = true;
        this.m_Sprite0Hits = false;
        this.m_SpriteData = new Array(256 * 2); //横坐标256其实就够了，这里特意扩大一倍防止越界，fetchNextLineSpritePixel方法中最右边的精灵可能会越界
        this.m_Frame = new Uint8ClampedArray(256 * 240);
        this.m_NmiInterrupt = nmiInterrupt;

        this.m_Render = null;
    }

    public setRenderCallback(render: IRenderAction): void {
        this.m_Render = render;
    }

    public ticktock(): void {
        if (this.m_Scanline >= 0 && this.m_Scanline <= 239) {
            this.handleVisibleScanline();
        } else if (this.m_Scanline == 240) {
            this.handlePostRenderScanline();
        } else if (this.m_Scanline >= 241 && this.m_Scanline <= 260) {
            this.handleVBlank();
        } else if (this.m_Scanline == 261) {
            this.handlePreRenderScanline();
        } else {
            throw new Error("invalid scanline");
        }

        ++this.m_Cycle;
        if (this.m_Cycle == 341) {
            this.m_Cycle = 0;
            ++this.m_Scanline;
        }

        if (this.m_Scanline > 261) {
            this.render();
            //所有扫描线都执行完毕，到下一帧了
            this.m_Scanline = 0;
            this.m_Cycle = 0;

            this.m_EvenFrame = !this.m_EvenFrame;
            this.m_Sprite0Hits = false;
            if (!this.m_EvenFrame) {
                //奇数帧的第一个cycle会直接跳过
                this.m_Cycle = 1;
            }
        }
    }

    private handleVisibleScanline(): void {
        if (this.Mask.b == 0 && this.Mask.s == 0) {
            return;
        }

        if (this.m_Cycle == 0) {
            //idle
        } else if (this.m_Cycle >= 1 && this.m_Cycle <= 256) {
            if (this.m_Cycle == 1) {
                this.resetSecondOAM();
            }

            this.shiftRegisterLeftMove();
            this.renderPixel(this.m_Cycle - 1, this.m_Scanline);
            this.fillLatch();

            if (this.m_Cycle == 65) {
                this.calculateSprite();
            }
            if (this.m_Cycle == 256) {
                this.increaseY();
            }
        } else if (this.m_Cycle == 257) {
            this.copyTxToVx();
            this.fetchNextLineSpritePixel();
        } else if (this.m_Cycle >= 258 && this.m_Cycle <= 320) {
            //idle
        } else if (this.m_Cycle >= 321 && this.m_Cycle <= 336) {
            this.shiftRegisterLeftMove();
            this.fillLatch();
        } else if (this.m_Cycle <= 340) {
            //NT byte， Unused NTfetches
        } else {
            throw new Error(`unknown cycles ${this.m_Cycle}`);
        }
    }

    private handlePostRenderScanline(): void {
        //idle
    }

    private handleVBlank(): void {
        if (this.m_Scanline != 241) {
            return;
        }

        if (this.m_Cycle == 1) {
            this.Status.V = 1;
        } else if (this.m_Cycle == 16 && this.Ctrl.V == 1 && this.Status.V == 1) {
            //nmi中断
            this.m_NmiInterrupt();
        }
    }

    private handlePreRenderScanline() {
        if (this.Mask.b == 0 && this.Mask.s == 0) {
            return;
        }

        if (this.m_Cycle == 0) {
            //idle
        } else if (this.m_Cycle >= 1 && this.m_Cycle <= 256) {
            if (this.m_Cycle == 1) {
                this.Status.updateValue(0);
                this.resetSecondOAM();
            }

            this.shiftRegisterLeftMove();
            this.fillLatch();

            if (this.m_Cycle == 65) {
                this.calculateSprite();
            }
            if (this.m_Cycle == 256) {
                this.increaseY();
            }
        } else if (this.m_Cycle == 257) {
            this.copyTxToVx();
            this.fetchNextLineSpritePixel();
        } else if (this.m_Cycle >= 258 && this.m_Cycle <= 320) {
            if (this.m_Cycle >= 280 && this.m_Cycle <= 305) {
                this.V.updateBit(BitUtils.get(this.T.value, 5), 5);
                this.V.updateBit(BitUtils.get(this.T.value, 6), 6);
                this.V.updateBit(BitUtils.get(this.T.value, 7), 7);
                this.V.updateBit(BitUtils.get(this.T.value, 8), 8);
                this.V.updateBit(BitUtils.get(this.T.value, 9), 9);

                this.V.updateBit(BitUtils.get(this.T.value, 11), 11);
                this.V.updateBit(BitUtils.get(this.T.value, 12), 12);
                this.V.updateBit(BitUtils.get(this.T.value, 13), 13);
                this.V.updateBit(BitUtils.get(this.T.value, 14), 14);
            }
        } else if (this.m_Cycle >= 321 && this.m_Cycle <= 336) {
            this.shiftRegisterLeftMove();
            this.fillLatch();
        } else if (this.m_Cycle <= 340) {
            //NT byte， Unused NTfetches
        } else {
            throw new Error(`unknown cycles ${this.m_Cycle}`);
        }
    }

    private renderPixel(x: number, y: number): void {
        const paletteBit3: number = BitUtils.get(this.m_ShiftRegister.attributeHighByte, 15 - this.fineXScroll);
        const paletteBit2: number = BitUtils.get(this.m_ShiftRegister.attributeLowByte, 15 - this.fineXScroll);
        const paletteBit1: number = BitUtils.get(this.m_ShiftRegister.tileHighByte, 15 - this.fineXScroll);
        const paletteBit0: number = BitUtils.get(this.m_ShiftRegister.tileLowByte, 15 - this.fineXScroll);
        const backgroundPaletteAddressIndex: number = (paletteBit3 << 3) | (paletteBit2 << 2) | (paletteBit1 << 1) | paletteBit0;
        const spriteColor: SpriteColor | null = this.m_SpriteData[x];
        const isBackgroundTransparent: boolean = backgroundPaletteAddressIndex % 4 == 0;
        const pos: number = y * 256 + x;
        if (spriteColor != null) {
            //因为有镜像关系，所以能被4整除的其实都是透明色
            const isSpriteTransparent: boolean = spriteColor.paletteAddressIndex % 4 == 0;

            if (spriteColor.isFrontOfBackground) {
                //背景前
                //如果精灵不透明显示精灵色，透明则显示背景色

                if (isSpriteTransparent) {
                    this.m_Frame[pos] = this.fetchBackgroundPaletteIndexByAddress(backgroundPaletteAddressIndex);
                } else {
                    this.m_Frame[pos] = this.fetchSpritePaletteIndexByAddress(spriteColor.paletteAddressIndex);
                }
            } else {
                //背景后
                //如果精灵透明则显示背景色
                //如果精灵不透明，1.如果背景透明则显示不透明的精灵色
                //               2.如果背景不透明则显示背景色

                if (isSpriteTransparent) {
                    this.m_Frame[pos] = this.fetchBackgroundPaletteIndexByAddress(backgroundPaletteAddressIndex);
                } else {
                    if (isBackgroundTransparent) {
                        this.m_Frame[pos] = this.fetchSpritePaletteIndexByAddress(spriteColor.paletteAddressIndex);
                    } else {
                        this.m_Frame[pos] = this.fetchBackgroundPaletteIndexByAddress(backgroundPaletteAddressIndex);
                    }
                }
            }

            if (!this.m_Sprite0Hits && spriteColor.isZero) {
                if (!isBackgroundTransparent && !isSpriteTransparent) {
                    this.m_Sprite0Hits = true;
                    this.Status.S = 1;
                }
            }
        } else {
            this.m_Frame[pos] = this.fetchBackgroundPaletteIndexByAddress(backgroundPaletteAddressIndex);
        }
    }

    private resetSecondOAM(): void {
        if (this.Mask.s == 0) {
            return;
        }

        this.m_SecondOAM = [];
    }

    private calculateSprite(): void {
        if (this.Mask.s == 0) {
            return;
        }

        const spriteHeight: number = this.Ctrl.H == 1 ? 16 : 8;
        for (let i = 0; i < 256; i += 4) {
            const y: number = this.oam[i];
            const x: number = this.oam[i + 3];
            if (y >= 0xef) {
                continue;
            }
            if (this.Mask.M == 0 && x < 8) {
                continue;
            }
            if (y <= this.m_Scanline && this.m_Scanline < y + spriteHeight) {
                const spriteData: Uint8Array = new Uint8Array(4);
                spriteData[0] = this.oam[i];
                spriteData[1] = this.oam[i + 1];
                spriteData[2] = this.oam[i + 2];
                spriteData[3] = this.oam[i + 3];
                const sprite: Sprite = new Sprite(i / 4, spriteData);
                this.m_SecondOAM.push(sprite);

                if (this.m_SecondOAM.length >= 8) {
                    //精灵溢出了
                    this.Status.O = 1;
                    break;
                }
            }
        }
    }

    private shiftRegisterLeftMove(): void {
        if (this.Mask.b == 0) {
            return;
        }

        this.m_ShiftRegister.leftMove();
    }

    private copyLatchToRegister(): void {
        if (this.Mask.b == 0) {
            return;
        }

        this.m_ShiftRegister.fillTileHighByte(this.m_Latch.backgroundTileHighByte);
        this.m_ShiftRegister.fillTileLowByte(this.m_Latch.backgroundTileLowByte);

        const ZERO_BITS: number = 0x00;
        const ONE_BITS: number = 0xff;

        const palette0Bit: number = BitUtils.get(this.m_Latch.paletteHighByte, 0);
        this.m_ShiftRegister.fillAttributeLowByte(palette0Bit == 1 ? ONE_BITS : ZERO_BITS);

        const palette1Bit: number = BitUtils.get(this.m_Latch.paletteHighByte, 1);
        this.m_ShiftRegister.fillAttributeHighByte(palette1Bit == 1 ? ONE_BITS : ZERO_BITS);
    }

    private fillLatch(): void {
        if (this.Mask.b == 0) {
            return;
        }

        const key: number = this.m_Cycle % 8;
        if (key == 0) {
            this.increaseX();
        } else if (key == 1) {
            this.copyLatchToRegister();

            ////NT byte, NameTable 中的 tile 索引
            const tileIndexAddress: number = 0x2000 | (this.V.value & 0x0fff);
            const tileIndex: number = this.m_PPUBus.readByte(tileIndexAddress);
            this.m_Latch.nameTableTileIndex = tileIndex;
        } else if (key == 3) {
            //AT byte, AttributeTable 中的2位颜色信息
            const attributeAddress: number = 0x23c0 | (this.V.value & 0x0c00) | ((this.V.value >> 4) & 0x38) | ((this.V.value >> 2) & 0x07);
            const direction: Direction = this.getDirection(this.V.coarseXScroll, this.V.coarseYScroll);
            const attributeData: number = this.m_PPUBus.readByte(attributeAddress);
            let highPalette: number = 0;
            if (direction == Direction.leftTop) {
                highPalette = attributeData & 0x03;
            } else if (direction == Direction.rightTop) {
                highPalette = (attributeData & 0x0c) >> 2;
            } else if (direction == Direction.leftBottom) {
                highPalette = (attributeData & 0x30) >> 4;
            } else {
                highPalette = (attributeData & 0xc0) >> 6;
            }

            this.m_Latch.paletteHighByte = highPalette;
        } else if (key == 5) {
            //Low BG tile byte, 根据 tile 索引取 背景tile 低位
            let patternTableOffset: number = this.m_Latch.nameTableTileIndex * 16 + this.V.fineYScroll;
            if (this.Ctrl.B == 1) {
                patternTableOffset += 0x1000;
            }
            this.m_Latch.backgroundTileLowByte = this.m_PPUBus.readByte(patternTableOffset);
        } else if (key == 7) {
            //High BG tile byte, 根据 tile 索引取 背景tile 高位
            let patternTableOffset: number = this.m_Latch.nameTableTileIndex * 16 + this.V.fineYScroll + 8;
            if (this.Ctrl.B == 1) {
                patternTableOffset += 0x1000;
            }
            this.m_Latch.backgroundTileHighByte = this.m_PPUBus.readByte(patternTableOffset);
        }
    }

    private fetchNextLineSpritePixel() {
        if (this.Mask.s == 0) {
            return;
        }

        this.m_SpriteData.fill(null);

        if (this.Ctrl.H == 0) {
            //8x8的精灵

            //因为index越小的优先级越小，所以倒序来
            for (let i = this.m_SecondOAM.length - 1; i >= 0; --i) {
                const sprite: Sprite = this.m_SecondOAM[i];
                const y: number = sprite.data[0];
                const index: number = sprite.data[1];
                const status: number = sprite.data[2];
                const x: number = sprite.data[3];
                let offset: number = index * 16;
                if (this.Ctrl.S == 1) {
                    offset += 0x1000;
                }

                const frontOfBackground: boolean = BitUtils.get(status, 5) == 0; //是背景前还是背景后
                const horizontalFlip: boolean = BitUtils.get(status, 6) == 1; //水平翻转
                const verticalFlip: boolean = BitUtils.get(status, 7) == 1; //垂直翻转
                let lowPatternData: number = 0;
                let highPatternData: number = 0;

                if (verticalFlip) {
                    lowPatternData = this.m_PPUBus.readByte(offset + 7 - (this.m_Scanline - y));
                    highPatternData = this.m_PPUBus.readByte(offset + 7 - (this.m_Scanline - y) + 8);
                } else {
                    lowPatternData = this.m_PPUBus.readByte(offset + (this.m_Scanline - y));
                    highPatternData = this.m_PPUBus.readByte(offset + (this.m_Scanline - y) + 8);
                }

                const highPalette: number = (status & 0x03) << 2;
                for (let j = 7; j >= 0; --j) {
                    let bit0: number = 0;
                    let bit1: number = 0;

                    if (horizontalFlip) {
                        bit0 = BitUtils.get(lowPatternData, 7 - j);
                        bit1 = BitUtils.get(highPatternData, 7 - j);
                    } else {
                        bit0 = BitUtils.get(lowPatternData, j);
                        bit1 = BitUtils.get(highPatternData, j);
                    }

                    const paletteAddressIndex: number = highPalette | (bit1 << 1) | bit0;
                    this.m_SpriteData[x + 7 - j] = new SpriteColor(paletteAddressIndex, frontOfBackground, sprite.isZero);
                }
            }
        } else {
            //8x16的精灵
        }
    }

    private increaseX(): void {
        let tmpAddr: number = this.V.value;
        if ((tmpAddr & 0x1f) == 31) {
            tmpAddr = NumberUtils.toUInt16(tmpAddr & ~0x001f);
            tmpAddr = NumberUtils.toUInt16(tmpAddr ^ 0x400);
            this.V.updateValue(tmpAddr);
        } else {
            this.V.updateValue(NumberUtils.toUInt16(tmpAddr + 1));
        }
    }

    private increaseY(): void {
        let tmpAddr: number = this.V.value;
        if ((tmpAddr & 0x7000) != 0x7000) {
            tmpAddr += 0x1000;
        } else {
            tmpAddr = NumberUtils.toUInt16(tmpAddr & ~0x7000);
            let y: number = (tmpAddr & 0x03e0) >> 5;

            if (y == 29) {
                y = 0;
                tmpAddr = NumberUtils.toUInt16(tmpAddr ^ 0x0800);
            } else if (y == 31) {
                y = 0;
            } else {
                y += 1;
            }

            tmpAddr = NumberUtils.toUInt16((tmpAddr & ~0x03e0) | (y << 5));
        }

        this.V.updateValue(tmpAddr);
    }

    private copyTxToVx(): void {
        this.V.updateBit(BitUtils.get(this.T.value, 0), 0);
        this.V.updateBit(BitUtils.get(this.T.value, 1), 1);
        this.V.updateBit(BitUtils.get(this.T.value, 2), 2);
        this.V.updateBit(BitUtils.get(this.T.value, 3), 3);
        this.V.updateBit(BitUtils.get(this.T.value, 4), 4);
        this.V.updateBit(BitUtils.get(this.T.value, 10), 10);
    }

    /**
     * 获取该tile在大tile上的方向，左上，右上，左下，右下
     * @param x tile坐标系的x轴
     * @param y tile坐标系的y轴
     */
    private getDirection(x: number, y: number): Direction {
        const modX: number = x % 4;
        const modY: number = y % 4;

        const isLeft: boolean = modX == 0 || modX == 1;
        const isTop: boolean = modY == 0 || modY == 1;

        if (isLeft && isTop) {
            return Direction.leftTop;
        } else if (isLeft && !isTop) {
            return Direction.leftBottom;
        } else if (!isLeft && isTop) {
            return Direction.rightTop;
        }
        return Direction.rightBottom;
    }

    /**
     * 通过背景调色板地址取得调色板索引
     * @param addr
     * @returns
     */
    private fetchBackgroundPaletteIndexByAddress(addr: number): number {
        const offset: number = 0x3f00 + addr;
        return this.m_PPUBus.readByte(offset);
    }

    /**
     * 通过精灵调色板地址取得调色板索引
     * @param addr
     * @returns
     */
    private fetchSpritePaletteIndexByAddress(addr: number): number {
        const offset: number = 0x3f10 + addr;
        return this.m_PPUBus.readByte(offset);
    }

    public switchNameTableMirroring(mode: MirroringMode): void {
        this.m_MirroringMode = mode;
    }

    public writeByte(addr: number, data: number): void {
        this.m_PPUBus.writeByte(addr, data);
    }

    public readByte(addr: number): number {
        const data: number = this.m_PPUBus.readByte(addr);
        return data;
    }

    private render(): void {
        if (this.m_Render == null) {
            return;
        }

        this.m_Render(this.m_Frame);
    }
}

enum Direction {
    leftTop = 1,
    leftBottom,
    rightTop,
    rightBottom,
}

class SpriteColor {
    private m_PaletteAddressIndex: number;
    private m_IsFrontOfBackground: boolean;
    private m_IsZero: boolean;

    /**
     * 调色板索引
     */
    public get paletteAddressIndex(): number {
        return this.m_PaletteAddressIndex;
    }

    /**
     * 是否在背景前
     */
    public get isFrontOfBackground(): boolean {
        return this.m_IsFrontOfBackground;
    }

    /**
     * 是否是归属于精灵0的
     */
    public get isZero(): boolean {
        return this.m_IsZero;
    }

    public constructor(paletteAddressIndex: number, isFrontOfBackground: boolean, isZero: boolean) {
        this.m_PaletteAddressIndex = paletteAddressIndex;
        this.m_IsFrontOfBackground = isFrontOfBackground;
        this.m_IsZero = isZero;
    }
}

export default PPU2C02;
