import IRenderAction from "./Common/IRenderAction";
import JoyStickKey from "./Common/JoyStickKey";

export default interface INes {
    /**
     * 插入卡带
     * @param data 卡带数据
     */
    insertCartridge(data: Uint8Array): void;

    /**
     * 开机,需要先插卡带
     */
    powerUp(): Promise<void>;

    /**
     * 设置绘制回调
     * @param render 绘制回调
     */
    setRenderCallback(render: IRenderAction): void;

    /**
     * 手柄1按键
     * @param key 
     * @param pressDown 
     */
    p1SendKey(key: JoyStickKey, pressDown: boolean): void;

    /**
     * 手柄2按键
     * @param key 
     * @param pressDown 
     */
    p2SendKey(key: JoyStickKey, pressDown: boolean): void;
}
