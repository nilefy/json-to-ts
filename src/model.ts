export enum TypeGroup {
  Primitive,
  Array,
  Object,
  Date
}

export interface TypeDescription {
  id: string;
  isUnion?: boolean;
  typeObj?: { [index: string]: string };
  arrayOfTypes?: string[];
}

export interface TypeStructure {
  rootTypeId: string;
  types: TypeDescription[];
}

export interface NameEntry {
  id: string;
  name: string;
}

export interface NameStructure {
  rootName: string;
  names: NameEntry[];
}

export interface InterfaceDescription {
  name: string;
  typeMap: object;
}

export type Options = {
  rootName?: string;
  dedupe?: boolean;
  named?: boolean;
  interfaceOrType?: "interface" | "type";
};


export interface KeyMetaData {
  keyValue: string;
  isOptional: boolean;
}
