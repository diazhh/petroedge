declare module 'node-snap7' {
  export class S7Client {
    constructor();
    ConnectTo(host: string, rack: number, slot: number): Promise<void>;
    Disconnect(): Promise<void>;
    DBRead(dbNumber: number, start: number, size: number): Promise<Buffer>;
    DBWrite(dbNumber: number, start: number, size: number, buffer: Buffer): Promise<void>;
    ReadArea(area: number, dbNumber: number, start: number, amount: number, wordLen: number): Promise<Buffer>;
    WriteArea(area: number, dbNumber: number, start: number, amount: number, wordLen: number, buffer: Buffer): Promise<void>;
  }
}
