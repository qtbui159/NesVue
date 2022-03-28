interface ICPU6502 {
    /**
     * 执行一条指令
     */
    ticktock(): void;
    /**
     * 平滑执行一条指令，
     * 本意是一条指令需要2个周期,那么调用2次TickTockFlatCycle才能完成
     * 不过实际不能执行半条指令，此操作用于和ppu同步
     * 2个指令周期调用2次的处理细节
     * 第1次调用完成指令全部功能
     * 第2个调用为等待，所以一共使用2个指令周期
     */
    ticktockFlatCycle(): void;
    /**
     *RESET中断
     */
    reset(): void;
    /**
     * NMI中断
     */
    nmi(): void;
    /**
     * IRQ中断
     */
    irq(): void;

    /**
     * dma拷贝时添加cpu周期
     */
    dmaCycle(): void;
}

export default ICPU6502;
