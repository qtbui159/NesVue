export default class RGB {
    private m_R: number;
    public get R(): number {
        return this.m_R;
    }

    private m_G: number;
    public get G(): number {
        return this.m_G;
    }

    private m_B: number;
    public get B(): number {
        return this.m_B;
    }

    private m_Value: string;
    public get value(): string {
        return this.m_Value;
    }

    public constructor(r: number, g: number, b: number) {
        this.m_R = r;
        this.m_G = g;
        this.m_B = b;

        this.m_Value = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }
}
