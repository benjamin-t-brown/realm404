/*
global
G_BEHAVIOR_NONE
G_model_itemGetBaseItem
G_model_itemGetName
G_model_itemGetAmount
G_model_itemModifyAmount
G_model_itemGetDamage
*/

// name, sprite, id, x, y, stats, inventory, facing direction (0 = left, 1 = right), behavior, shouldUpdateThisRound, attacking, dropLvl, onDeath
type Actor = [
  string,
  string,
  number,
  number,
  number,
  Stats,
  GenericItem[],
  0 | 1, // 7 direction
  Behavior, // 8 behavior
  boolean, // 9 shouldUpdateThisRound
  boolean, // 10 attacking
  number, // 11 drop lvl
  number, // 12 equipped item,
  (() => void) | any // 13 onDeath
];

const G_FACING_LEFT = 0;
const G_FACING_RIGHT = 1;

type Allegiance = 0 | 1;
const G_ALLEGIANCE_PLAYER = 0;
const G_ALLEGIANCE_ENEMY = 1;

const G_model_actorGetName = (actor: Actor) => {
  return actor[0];
};

const G_model_actorGetSprite = (actor: Actor) => {
  const facing = actor[7];
  const spriteIndexOffset = actor[10] ? 1 : 0;
  return (
    actor[1] +
    '_' +
    (actor[2] + spriteIndexOffset) +
    (facing === G_FACING_LEFT ? '_f' : '')
  );
};

const G_model_actorGetStats = (actor: Actor): Stats => {
  return actor[5];
};
const G_model_actorGetInventory = (actor: Actor): GenericItem[] => {
  return actor[6];
};
const G_model_actorModInventory = (
  actor: Actor,
  item: GenericItem,
  add: boolean
) => {
  const inventory = G_model_actorGetInventory(actor);
  const baseItem = G_model_itemGetBaseItem(item);
  const itemName = G_model_itemGetName(baseItem);
  for (let i = 0; i < inventory.length; i++) {
    const item2 = inventory[i];
    const item2Base = G_model_itemGetBaseItem(item2);
    const item2Name = G_model_itemGetName(item2Base);
    if (itemName === item2Name) {
      if (add) {
        const mod = G_model_itemGetAmount(item);
        const newItem2 = G_model_itemModifyAmount(item2, mod) as GenericItem;
        inventory[i] = newItem2;
      } else {
        const newItem2 = G_model_itemModifyAmount(item2, -1);
        if (newItem2) {
          inventory[i] = newItem2;
        } else {
          const equippedItem = G_model_actorGetEquippedItem(actor);
          const equipI = actor[12];
          if (equippedItem) {
            const baseEquippedItem = G_model_itemGetBaseItem(equippedItem);
            const equippedItemName = G_model_itemGetName(baseEquippedItem);
            if (equippedItemName === itemName) {
              G_model_actorSetEquippedItem(actor, -1);
            } else if (equipI > i) {
              G_model_actorSetEquippedItem(actor, equipI - 1);
            }
          }
          inventory.splice(i, 1);
        }
      }
      return;
    }
  }
  if (add) {
    inventory.push(item);
  }
};
const G_model_actorPushInventory = (actor: Actor, item: GenericItem) => {
  G_model_actorModInventory(actor, item, true);
};
const G_model_actorSubtractFromInventory = (
  actor: Actor,
  item: GenericItem
) => {
  G_model_actorModInventory(actor, item, false);
};
const G_model_actorGetPosition = (actor: Actor): [number, number] => {
  return (actor as any).slice(3, 5);
};
const G_model_actorSetPosition = (actor: Actor, x: number, y: number) => {
  actor[3] = x;
  actor[4] = y;
};

const G_model_actorGetEquippedItem = (actor: Actor): GenericItem | null => {
  const inventory = G_model_actorGetInventory(actor);
  const genericItem: GenericItem | undefined = inventory[actor[12]];
  return genericItem ? genericItem : null;
};
const G_model_actorSetEquippedItem = (actor: Actor, index: number) => {
  actor[12] = index;
};

const G_model_actorSetFacing = (actor: Actor, facing: 0 | 1) => {
  actor[7] = facing;
};
const G_model_actorSetId = (actor: Actor, id: number) => {
  actor[2] = id;
};
const G_model_actorSetSprite = (actor: Actor, sprite: string) => {
  actor[1] = sprite;
};
const G_model_actorSetName = (actor: Actor, name: string) => {
  actor[0] = name;
};

const G_model_actorSetShouldUpdate = (actor: Actor, b: boolean) => {
  actor[9] = b;
};
const G_model_actorGetShouldUpdate = (actor: Actor) => {
  return actor[9];
};

const G_model_actorSetAttacking = (actor: Actor, v: boolean) => {
  actor[10] = v;
};

const G_model_actorRoundReset = (actor: Actor) => {
  G_model_actorSetAttacking(actor, false);
};

const G_model_actorIsDead = (actor: Actor) => {
  return G_model_statsGetHp(G_model_actorGetStats(actor)) <= 0;
};

const G_model_actorGetBehavior = (actor: Actor): Behavior => {
  return actor[8];
};
const G_model_actorGetAllegiance = (actor: Actor): Allegiance => {
  return G_model_actorGetBehavior(actor) === G_BEHAVIOR_NONE
    ? G_ALLEGIANCE_PLAYER
    : G_ALLEGIANCE_ENEMY;
};

const G_model_actorGetDropLvl = (actor: Actor): number => {
  return actor[11];
};

// hp, maxHp
type Stats = [number, number];

const G_model_statsSetHpMaxHp = (stats: Stats, hp: number) => {
  stats[0] = stats[1] = hp;
};
const G_model_statsModifyHp = (stats: Stats, v: number) => {
  stats[0] += v;
  if (stats[0] < 0) {
    stats[0] = 0;
  } else if (stats[0] > stats[1]) {
    stats[0] = stats[1];
  }
};
const G_model_statsGetHp = (stats: Stats): number => {
  return stats[0];
};
const G_model_statsGetMaxHp = (stats: Stats): number => {
  return stats[1];
};

const G_model_actorGetDamage = (actor: Actor): DmgMinMax => {
  const attackerItem = G_model_actorGetEquippedItem(actor);
  let [min, max]: DmgMinMax = [1, 3];
  if (attackerItem) {
    const [minMod, maxMod] = G_model_itemGetDamage(
      G_model_itemGetBaseItem(attackerItem),
      actor
    );
    min += minMod;
    max += maxMod;
  }
  return [min, max];
};
