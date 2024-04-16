import { describe, it } from "vitest";
import JsonToTS from "..";
import { expectTwoTypesAreEqual } from "./util";

describe("No dedupe", function () {

  it("null should stay if it is part of array elements", function() {
    const json = {
      arr: [42, "42", null]
    };
    const expectedType = `interface RootObject {
        arr: (null | number | string)[];
      }`;
    const _interface = JsonToTS(json, {
      dedupe: false,
    })[0];
    expectTwoTypesAreEqual(_interface, expectedType);
  });
  it("should not create separate interfaces for the same type", function () {
    const json = {
      a: {
        b: 42
      }
    };
    const expectedType = `interface RootObject {
        a: {
            b: number;
        };
      }`;
    const _interface = JsonToTS(json, {
      dedupe: false,
    })[0];
    expectTwoTypesAreEqual(_interface, expectedType);
  })
  it("should not dedupe interfaces", function () {
    const json = {
      name: "Larry",
      parent: {
        name: "Garry",
        parent: {
          name: "Marry",
          parent: null,
        },
      },
    };
    const expectedType = `interface RootObject {
        name: string;
        parent: {
            name: string;
            parent: {
                name: string;
                parent?: any;
            };
        };
      }`;
    const _interface = JsonToTS(json, {
      dedupe: false,
    })[0];
    expectTwoTypesAreEqual(_interface, expectedType);
  });
  it("should work with array merging", function () {
    const json = {
      cats: [{ name: "Kittin" }, { name: "Sparkles" }]
    };
    const expectedType = 
      `interface RootObject {
        cats: {
          name: string;
        }[];
      }`;
    const _interface = JsonToTS(json, {
      dedupe: false,
    })[0];
    expectTwoTypesAreEqual(_interface, expectedType);
  });
  it("should work with array merging with null", function() {
    const json = [
      {
        field: { tag: "world" }
      },
      {
        field: { tag: 42 }
      },
      {
        field: null
      }
    ];
    const expectedType = `interface RootObject {
        field?: {
          tag: number | string;
        };
      }`;
    const _interface = JsonToTS(json, {
      dedupe: false,
    })[0];
    
    expectTwoTypesAreEqual(_interface, expectedType);
  });
  it("should solve edge case 1", function(){
    const json = {
      cats: [{ age: [42] }, { age: ["42"] }],
      dads: ["hello", 42]
    };
    const expectedType = `interface RootObject {
        cats: {
          age: (number | string)[];
        }[];
        dads: (number | string)[];
      }`;
    const _interface = JsonToTS(json, {
      dedupe: false,
    })[0];
    expectTwoTypesAreEqual(_interface, expectedType);
  })
  it("should solve edge case 2", function() {
    const json = {
      items: [
        {
          billables: [
            {
              quantity: 2,
              price: 0
            }
          ]
        },
        {
          billables: [
            {
              priceCategory: {
                title: "Adult",
                minAge: 0,
                maxAge: 99
              },
              quantity: 2,
              price: 226
            }
          ]
        }
      ]
    };
    const expectedType = `interface RootObject {
        items: {
          billables: {
            quantity: number;
            price: number;
            priceCategory?: {
              title: string;
              minAge: number;
              maxAge: number;
            };
          }[];
        }[];
      }`;
    const _interface = JsonToTS(json, {
      dedupe: false,
    })[0];
    
    expectTwoTypesAreEqual(_interface, expectedType);
    
  })

  it("should solve edge case 3", function() {
    const json = [
      {
        nestedElements: [
          {
            commonField: 42,
            optionalField: "field"
          },
          {
            commonField: 42,
            optionalField3: "field3"
          }
        ]
      },
      {
        nestedElements: [
          {
            commonField: "42",
            optionalField2: "field2"
          }
        ]
      }
    ];
    const expectedType = `interface RootObject {
        nestedElements: {
          commonField: number | string;
          optionalField?: string;
          optionalField3?: string;
          optionalField2?: string;
        }[];
      }`;
    const _interface = JsonToTS(json, {
      dedupe: false,
    })[0];
    expectTwoTypesAreEqual(_interface, expectedType);
  })
  it("should merge empty array with primitive types", function() {
    const json = [
      {
        nestedElements: []
      },
      {
        nestedElements: ["kittin"]
      }
    ];
    const expectedType = `interface RootObject {
        nestedElements: string[];
      }`;
    const _interface = JsonToTS(json, {
      dedupe: false,
    })[0];
    
    expectTwoTypesAreEqual(_interface, expectedType);
  });
  it("should merge empty array with array types", function() {
    const json = [
      {
        nestedElements: []
      },
      {
        nestedElements: [["string"]]
      }
    ];
    const expectedType = `interface RootObject {
        nestedElements: string[][];
      }`;
    const _interface = JsonToTS(json, {
      dedupe: false,
    })[0];
    expectTwoTypesAreEqual(_interface, expectedType);
    
  });

  it("should support multi nested arrays", function() {
    const json = {
      cats: [
        [{ name: "Kittin" }, { name: "Kittin" }, { name: "Kittin" }],
        [{ name: "Kittin" }, { name: "Kittin" }, { name: "Kittin" }]
      ]
    };
    const expectedType = `
    interface RootObject {
      cats: {
        name: string;
      }[][];
    }`
    const _interface = JsonToTS(json, {
      dedupe: false,
    })[0];
    expectTwoTypesAreEqual(_interface, expectedType);
  })});