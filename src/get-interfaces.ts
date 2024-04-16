import { InterfaceDescription, NameEntry, TypeStructure, KeyMetaData, Options } from "./model";
import { isHash, findTypeById, isNonArrayUnion } from "./util";

function isKeyNameValid(keyName: string) {
  const regex = /^[a-zA-Z_][a-zA-Z\d_]*$/;
  return regex.test(keyName);
}

function parseKeyMetaData(key: string): KeyMetaData {
  const isOptional = key.endsWith("--?");

  if (isOptional) {
    return {
      isOptional,
      keyValue: key.slice(0, -3),
    };
  } else {
    return {
      isOptional,
      keyValue: key,
    };
  }
}

function findNameById(id: string, names: NameEntry[]): string {
  return names.find(_ => _.id === id).name;
}

function removeNullFromUnion(unionTypeName: string) {
  const typeNames = unionTypeName.split(" | ");
  const nullIndex = typeNames.indexOf("null");
  typeNames.splice(nullIndex, 1);
  return typeNames.join(" | ");
}

function replaceTypeObjIdsWithNames(typeObj: { [index: string]: string }, names: NameEntry[]): object {
  return (
    Object.entries(typeObj)
      // quote key if is invalid and question mark if optional from array merging
      .map(([key, type]): [string, string, boolean] => {
        const { isOptional, keyValue } = parseKeyMetaData(key);
        const isValid = isKeyNameValid(keyValue);

        const validName = isValid ? keyValue : `'${keyValue}'`;

        return isOptional ? [`${validName}?`, type, isOptional] : [validName, type, isOptional];
      })
      // replace hashes with names referencing the hashes
      .map(([key, type, isOptional]): [string, string, boolean] => {
        if (!isHash(type)) {
          return [key, type, isOptional];
        }
        const newType = findNameById(type, names);
        return [key, newType, isOptional];
      })
      // if union has null, remove null and make type optional
      .map(([key, type, isOptional]): [string, string, boolean] => {
        if (!(isNonArrayUnion(type) && type.includes("null"))) {
          return [key, type, isOptional];
        }

        const newType = removeNullFromUnion(type);
        const newKey = isOptional ? key : `${key}?`; // if already optional dont add question mark
        return [newKey, newType, isOptional];
      })
      // make null optional and set type as any
      .map(([key, type, isOptional]): [string, string, boolean] => {
        if (type !== "null") {
          return [key, type, isOptional];
        }

        const newType = "any";
        const newKey = isOptional ? key : `${key}?`; // if already optional dont add question mark
        return [newKey, newType, isOptional];
      })
      .reduce((agg, [key, value]) => {
        agg[key] = value;
        return agg;
      }, {})
  );
}

const stringifyTypeMapRecursive = (typeMap: InterfaceDescription["typeMap"]): string => {
  let res = "{\n";
  for (const key in typeMap) {
    let innerString = "";
    if (typeof typeMap[key] === "string") {
      innerString = typeMap[key];
    } else {
      innerString = stringifyTypeMapRecursive(typeMap[key]);
    }
    res += `${key}: ${innerString};\n`;
  }
  res += "}";
  return res;
};

export function getTypeStringFromDescription(args:{
  name: string, typeMap?: InterfaceDescription["typeMap"], type?: string
}, options: Options): string 
 {
  const { name, typeMap, type } = args;
  const stringTypeMap = type || stringifyTypeMapRecursive(typeMap);
  if (options.named !== false && options.interfaceOrType === "interface") {
    let interfaceString = `interface ${name}`;
    interfaceString += stringTypeMap;
    return interfaceString;
  }
  if (options.named !== false && options.interfaceOrType === "type") {
    let typeString = `type ${name} = `;
    typeString += stringTypeMap;
    return typeString;
  }
  if (options.named === false) {
    return stringTypeMap;
  }
}

export function getInterfaceDescriptions(
  typeStructure: TypeStructure,
  names: NameEntry[],
  options: Options
) {
  const res = names
  .map(({ id, name }) => {
      const typeDescription = findTypeById(id, typeStructure.types);
      if (typeDescription.typeObj) {
        const typeMap = replaceTypeObjIdsWithNames(typeDescription.typeObj, names);
        return { name, typeMap };
      } else {
        return null;
      }
    })
    .filter(_ => _ !== null);
  if(options.dedupe === false){
    return dupe(res, options.rootName);
  }
  return res;
}

const dupe = (InterfaceDescriptions: InterfaceDescription[], rootName: string) => {
  // this is kinda hacky but I'm not about to rewrite the whole thing
  const rootId = rootName;
  const buildType = (id: string) => {
    const typeDescription = InterfaceDescriptions.find((_) => _.name === id);
    const typeMap = typeDescription.typeMap;
    const resTypeMap = {};
    for (const key in typeMap) {
      if (typeof typeMap[key] === "string") {
        let arrLength = 0;
        const arrayMatch = typeMap[key].matchAll(/\[\]/g);
        for (const _ of arrayMatch) {
          arrLength++;
        }
        const isArray = arrLength > 0;
        const stripFromArrayBrackets = typeMap[key].replace(/\[\]/g, "");
        const stripFromBracketsAndSpaces = stripFromArrayBrackets.replace(/\s/g, "");
        const found = InterfaceDescriptions.find((_) => _.name === stripFromBracketsAndSpaces);
        if (found) {
          if(isArray) {
            resTypeMap[key] = `${buildType(stripFromBracketsAndSpaces)}${"[]".repeat(arrLength)}`;
            continue;
          }
          resTypeMap[key] = buildType(stripFromBracketsAndSpaces);
        } else {
        resTypeMap[key] = typeMap[key];
        }
      } else {
        resTypeMap[key] = buildType(typeMap[key]);
      }
    }
    return stringifyTypeMapRecursive(resTypeMap);
  };
  return[{
    name: rootName,
    type: buildType(rootId)
  }]
};
