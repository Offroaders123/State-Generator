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

// const stringy: string = stringify(blockStates, { space: 2 });
// console.log(stringy);

function groupBlockNames(blockStates: BlockState[]): Partial<Record<string, BlockState[]>> {
  return Object.groupBy(blockStates, state => state.name);
}

const grouped = groupBlockNames(blockStates);
// console.log(grouped);

// console.log(stringify(grouped));

const groupedMapped = Object.fromEntries(
  Object.entries(grouped)
    .map(([key, value]) => [key, value!.map(state => state.states)])
);
// console.log(groupedMapped);

// console.log(stringify(groupedMapped));

const deduped = Object.fromEntries(
  Object.entries(groupedMapped)
    .map(([key, variant]) => {
      const state: Record<string, Set<object>> = {};
      for (const entry of variant){
        for (const [key, value] of Object.entries(entry)){
          if (!(key in state)) state[key] = new Set();
          state[key]!.add(value);
        }
      }
      return [key, Object.fromEntries(Object.entries(state)
        .map(([key, value]) => [key, [...value]]))
      ];
  })
);
// console.log(deduped);

console.log(stringify(deduped));

/**
 * Converts a Prismarine-NBT based object to an NBTify one.
 * Should I look into adding this as a feature to NBTify?
 * I think it might seem a bit to verbose and single-use concerning.
 */
async function fromPtoIfy<T extends object>(states: T): Promise<T> {
  return (await read<T>(pnbt.writeUncompressed(pnbt.comp(states) as pnbt.NBT, "big"), { bedrockLevel: false })).data;
}