import { expect } from "vitest"
export const removeWhiteSpace = (str) => str.replace(/\s/g, "")

export const expectTwoTypesAreEqual = (a:string, b:string) => {
    expect(removeWhiteSpace(a)).toBe(removeWhiteSpace(b))
}
