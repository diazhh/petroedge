declare module 'omron-fins' {
  export class FinsClient {
    constructor(port: number, host: string, options?: any);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    read(address: string, length: number): Promise<number[]>;
    write(address: string, values: number[]): Promise<void>;
  }
}
