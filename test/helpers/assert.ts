import chai from "chai";
import { solidity } from "ethereum-waffle";
const { BN } = require('@openzeppelin/test-helpers');

chai.use(solidity);
const { expect } = chai;

export function assertAlmostEqual(expected: string, actual: string) {
  const expectedBN = BN.isBN(expected) ? expected : new BN(expected);
  const actualBN = BN.isBN(actual) ? actual : new BN(actual);
  const diffBN = expectedBN.gt(actualBN) ? expectedBN.sub(actualBN) : actualBN.sub(expectedBN);
  return expect(
    diffBN.lt(expectedBN.div(new BN('1000'))),
    `Not almost equal. Expected ${expectedBN.toString()}. Actual ${actualBN.toString()}`
  );
}