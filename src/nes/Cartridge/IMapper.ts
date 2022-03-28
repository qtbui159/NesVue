import IReadWrite from "../Common/IReadWrite";

export default interface IMapper extends IReadWrite {
    get version(): number;
}
