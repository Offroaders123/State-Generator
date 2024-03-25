import { readFile } from "node:fs/promises";
import pnbt from "prismarine-nbt";
import { Float32, Int16, Int32, Int8, TAG, Tag, getTagType, read, stringify } from "nbtify";
import { definition } from "./definition.js";

import type { Root } from "./definition.js";

interface BlockState {
  name: string;
  states: Record<string, Tag>;
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

// blockStates = blockStates.filter(state => /wall/i.test(state.name));

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
    .map<[string, [string, Record<string, Tag[]>]]>(([key, variant]) => {
      const state: Record<string, [TAG, Set<Tag>]> = {};
      for (const entry of variant){
        for (const [key, value] of Object.entries(entry)){
          if (!(key in state)) state[key] = [getTagType(value), new Set()];
          state[key]![1].add(value.valueOf() as Tag);
        }
      }
      return [key, [snake2PascalCase(key), Object.fromEntries(Object.entries(state)
        .map<[string, Tag[]]>(([key, [type, value]]) =>
          [key, [...value]
            .map(pos => {
              switch (type){
                case TAG.BYTE: return new Int8(pos as unknown as number);
                case TAG.SHORT: return new Int16(pos as unknown as number);
                case TAG.INT: return new Int32(pos as unknown as number);
                case TAG.FLOAT: return new Float32(pos as unknown as number);
                default: return pos;
              }
            })
          ]
        )
        .sort((previous, next) => previous[0].localeCompare(next[0])))]
      ];
    })
    .sort((previous, next) => previous[0].localeCompare(next[0]))
) satisfies Root;
// console.log(deduped);

// console.log(stringify(deduped));

const types = definition(deduped, { name: "BlockStateNameMap" });
console.log(types);

/**
 * Converts a Prismarine-NBT based object to an NBTify one.
 * Should I look into adding this as a feature to NBTify?
 * I think it might seem a bit to verbose and single-use concerning.
 */
async function fromPtoIfy<T extends object>(states: T): Promise<T> {
  return (await read<T>(pnbt.writeUncompressed(pnbt.comp(states) as pnbt.NBT, "big"), { bedrockLevel: false })).data;
}

function snake2CamelCase(string: string): string {
  return string
    .replace(/_(\w)/g, (_$, $1) => $1.toUpperCase());
}

function snake2PascalCase(string: string): string {
  const s: string = snake2CamelCase(string);
  return `${s.charAt(0).toUpperCase()}${s.substr(1)}`; 
}