import JoyStickKey from "../Common/JoyStickKey";
import BitUtils from "../Utils/BitUtils";
import IJoyStick from "./IJoyStick";

/**
 * 参考资料
 * 1*)https://wiki.nesdev.org/w/index.php?title=Standard_controller
 */

export default class JoyStick implements IJoyStick {
    private m_Offset: number = 0;

    private m_Value: number = 0;
    public get value(): number {
        return BitUtils.get(this.m_Value, this.m_Offset--);
    }

    public clearOffset(): void {
        this.m_Offset = 7;
    }

    public sendKey(key: JoyStickKey, pressDown: boolean): void {
        let pos: number = -1;
        if (key == JoyStickKey.a) {
            pos = 7;
        } else if (key == JoyStickKey.b) {
            pos = 6;
        } else if (key == JoyStickKey.down) {
            pos = 2;
        } else if (key == JoyStickKey.left) {
            pos = 1;
        } else if (key == JoyStickKey.right) {
            pos = 0;
        } else if (key == JoyStickKey.select) {
            pos = 5;
        } else if (key == JoyStickKey.start) {
            pos = 4;
        } else if (key == JoyStickKey.up) {
            pos = 3;
        } else {
            throw new Error("Not support joystick key");
        }

        if (pressDown) {
            this.m_Value = BitUtils.set(this.m_Value, pos);
        } else {
            this.m_Value = BitUtils.clear(this.m_Value, pos);
        }
    }
}
