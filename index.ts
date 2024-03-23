import { readFile } from "node:fs/promises";
import pnbt from "prismarine-nbt";
import { read, stringify } from "nbtify";

interface BlockState {
  name: string;
  states: Record<string, object>;
  hash: number;
}

const statesJson: string = await readFile("./BlockStates.json", { encoding: "utf-8" });

const blockStates: BlockState[] = JSON.parse(statesJson);
// console.log(blockStates.map(state => state.states));

// console.log(
//   await Promise.all(
//     blockStates.map(async state => stringify(await read(pnbt.writeUncompressed(pnbt.comp(state.states, ""), "big"), { bedrockLevel: false })))
//   )
// );

// console.log(
//   await Promise.all(blockStates.map(state => fromPtoIfy(state.states)))
// );

await Promise.all(blockStates.map(async state => {
  const converted = await fromPtoIfy(state.states);
  state.states = converted;
}));

// console.log(blockStates);

const stringy: string = stringify(blockStates, { space: 2 });
console.log(stringy);

/**
 * Converts a Prismarine-NBT based object to an NBTify one.
 * Should I look into adding this as a feature to NBTify?
 * I think it might seem a bit to verbose and single-use concerning.
 */
async function fromPtoIfy<T extends object>(states: T): Promise<T> {
  return (await read<T>(pnbt.writeUncompressed(pnbt.comp(states) as pnbt.NBT, "big"), { bedrockLevel: false })).data;
}