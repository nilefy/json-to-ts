import { getTypeStructure, optimizeTypeStructure } from "./get-type-structure";
import { Options } from "./model";
import {
  getInterfaceDescriptions,
  getInterfaceStringFromDescription
} from "./get-interfaces";
import { getNames } from "./get-names";
import { isArray, isObject } from "./util";

export default function JsonToTS(json: any, userOptions?: Options): string[] {
  const defaultOptions: Options = {
    rootName: "RootObject",
    dedupe: true,
    interfaceOrType: "interface",
    named: true,
  };
  const options = {
    ...defaultOptions,
    ...userOptions
  };
  /**
   * Parsing currently works with (Objects) and (Array of Objects) not and primitive types and mixed arrays etc..
   * so we shall validate, so we dont start parsing non Object type
   */
  const isArrayOfObjects =
    isArray(json) &&
    json.length > 0 &&
    json.reduce((a, b) => a && isObject(b), true);

  if (!(isObject(json) || isArrayOfObjects)) {
    throw new Error("Only (Object) and (Array of Object) are supported");
  }
  const typeStructure = getTypeStructure(json);
  /**
   * due to merging array types some types are switched out for merged ones
   * so we delete the unused ones here
   */
  optimizeTypeStructure(typeStructure);

  const names = options.dedupe ? getNames(typeStructure, options.rootName) : [{
    id: typeStructure.rootTypeId,
    name: options.rootName
  }];

  return getInterfaceDescriptions(typeStructure, names, options).map(
    (e)=> getInterfaceStringFromDescription({...e, options})
  );
}

(<any>JsonToTS).default = JsonToTS;
module.exports = JsonToTS;
