declare module 'ethernet-ip' {
  export class Controller {
    constructor();
    connect(host: string, slot?: number): Promise<void>;
    disconnect(): Promise<void>;
    destroy(): Promise<void>;
    readTag(tag: Tag): Promise<void>;
    writeTag(tag: Tag): Promise<void>;
    readTagList(tagList: TagList): Promise<void>;
    writeTagList(tagList: TagList): Promise<void>;
    getControllerTagList(): Promise<any[]>;
  }

  export class Tag {
    constructor(name: string, program?: string | null, value?: any);
    name: string;
    value: any;
    type: number;
    error: any;
  }

  export class TagList extends Array<Tag> {
    constructor();
    add(tag: Tag): void;
  }
}
