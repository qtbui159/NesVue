import JoyStickKey from "../Common/JoyStickKey";

export default interface IJoyStick {
    get value(): number;

    /**
     * 清除选通
     */
    clearOffset(): void;

    /**
     * 发送按键信息
     * @param key 按键
     * @param pressDown true按下,false抬起
     */
    sendKey(key: JoyStickKey, pressDown: boolean): void;
}
