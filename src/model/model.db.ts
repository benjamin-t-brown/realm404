/*
global
G_model_actorGetStats
G_model_statsModifyHp
G_model_getCurrentWorld
G_model_roomGetActorAt
G_model_worldGetCurrentRoom
G_model_actorGetInventory
G_model_actorGetPosition
G_model_itemGetBaseItem
G_model_addLog
G_model_playerModifyGold
G_model_roomGetTileAt
G_model_tileGetId
G_model_roomSetTileAt
G_model_setCutsceneLine
G_controller_render
G_view_playSound
G_controller_damageScroll
G_controller_getTargetedPosition
G_controller_playerInputComplete
G_controller_dropItem
G_utils_getTargets
G_utils_randInRange
G_BEHAVIOR_RAND
G_TARGETING_SINGLE
G_TARGETING_3X3
G_TILE_CHEST
G_TILE_GATE
G_TILE_GRASS
*/

type TargetingType = 0 | 1;
const TARGETING_SCROLL = 0;
// const TARGETING_BOW = 1;

const useTargeting = async (
  type: TargetingType,
  user: Actor,
  targetArea: TargetArea,
  dmg: DmgMinMax,
  sound: string,
  pos?: [number, number] | null
): Promise<boolean> => {
  pos = pos || (await G_controller_getTargetedPosition(targetArea));
  if (pos) {
    const world = G_model_getCurrentWorld();
    const [x, y] = pos;
    const targets = G_utils_getTargets(x, y, targetArea);
    let targetFound = false;
    for (let i = 0; i < targets.length; i++) {
      const [tx, ty] = targets[i];
      const actor = G_model_roomGetActorAt(
        G_model_worldGetCurrentRoom(world),
        tx,
        ty
      );
      if (actor) {
        if (type === TARGETING_SCROLL) {
          G_controller_damageScroll(
            user,
            actor,
            dmg,
            targetFound ? '' : sound,
            world
          );
          targetFound = true;
        }
        //  else if (type === TARGETING_BOW) {
        //   G_controller_damageScroll(
        //     user,
        //     actor,
        //     dmg,
        //     targetFound ? '' : sound,
        //     world
        //   );
        //   targetFound = true;
        // }
      }
    }
    if (targetFound) {
      G_controller_playerInputComplete();
      return true;
    } else {
      G_view_playSound('cancel');
      return false;
      // G_model_addLog(` - cancel`);
    }
  }
  return false;
};

const onGetRandomGold = (min: number, max: number) => (): boolean => {
  G_view_playSound('gold');
  G_model_playerModifyGold(
    G_model_getCurrentWorld().player,
    G_utils_randInRange(min, max)
  );
  return false;
};
const G_ITEM_GOLD_SM: Item = [
  13,
  'Gold S',
  {
    onAcq: onGetRandomGold(5, 10),
  },
  0,
];
const G_ITEM_GOLD_MD: Item = [
  13,
  'Gold M',
  {
    onAcq: onGetRandomGold(10, 20),
  },
  1,
];
const G_ITEM_GOLD_LG: Item = [
  13,
  'Gold L',
  {
    onAcq: onGetRandomGold(20, 30),
  },
  1,
];
const G_ITEM_KEY: Item = [
  14,
  'Key',
  {
    async onUse(user: Actor) {
      const world = G_model_getCurrentWorld();
      const room = G_model_worldGetCurrentRoom(world);
      const [x, y] = G_model_actorGetPosition(user);
      const targets = G_utils_getTargets(x, y, G_TARGETING_3X3);

      for (let i = 0; i < targets.length; i++) {
        const [x, y] = targets[i];
        const tile = G_model_roomGetTileAt(room, x, y);
        if (tile) {
          const id = G_model_tileGetId(tile);
          if (id === G_TILE_GATE || id === G_TILE_CHEST) {
            G_view_playSound('unlock');
            G_model_roomSetTileAt(room, x, y, G_TILE_GRASS);
            if (id === G_TILE_CHEST) {
              G_controller_dropItem(room.lvl, x, y, room, true);
            }
            setTimeout(() => {
              G_controller_render(world);
            });
            return true;
          }
        }
      }
      G_model_setCutsceneLine('You are nearby nothing to unlock!');
      G_view_playSound('cancel');

      return false;
    },
  },
  10,
];

const G_ITEM_KNIFE: Item = [
  2,
  'Knife',
  {
    getDmg: () => [4, 8],
  },
  5,
];
const G_ITEM_SWORD: Item = [
  3,
  'Sword',
  {
    getDmg: () => [8, 16],
  },
  10,
];
const G_ITEM_FINE_SWORD: Item = [
  3,
  'Fine Sword',
  {
    getDmg: () => [16, 24],
  },
  50,
];
const G_ITEM_MAGIC_SWORD: Item = [
  4,
  'Magic Sword',
  {
    getDmg: () => [24, 32],
  },
  100,
];

// const G_ITEM_BOW: Item = [
//   7,
//   'Bow',
//   {
//     onUse: async (user: Actor) => {
//       return useTargeting(
//         TARGETING_SCROLL,
//         user,
//         G_TARGETING_3X3,
//         [10, 15],
//         'bow',
//         G_model_actorGetPosition(user)
//       );
//     },
//   },
//   15,
// ];
// const G_ITEM_ARROW: Item = [8, 'Arrow', {}, 1];
// const G_ITEM_FINE_ARROW: Item = [8, 'Fine Arrow', {}, 30];
const G_ITEM_SCROLL_FLAME: Item = [
  6,
  'Scroll: Flame',
  {
    onUse: (user: Actor): Promise<any> => {
      return useTargeting(
        TARGETING_SCROLL,
        user,
        G_TARGETING_SINGLE,
        [13, 20],
        'flame'
      );
    },
  },
  50,
];
const G_ITEM_SCROLL_COMBUST: Item = [
  6,
  'Scroll: Combust',
  {
    onUse: (user: Actor): Promise<any> => {
      G_view_playSound('flame');
      return useTargeting(
        TARGETING_SCROLL,
        user,
        G_TARGETING_3X3,
        [18, 28],
        '',
        G_model_actorGetPosition(user)
      );
    },
  },
  65,
];
const G_ITEM_SCROLL_FIREBALL: Item = [
  6,
  'Scroll: Fireball',
  {
    onUse: (user: Actor): Promise<any> => {
      return useTargeting(
        TARGETING_SCROLL,
        user,
        G_TARGETING_3X3,
        [15, 25],
        'flame'
      );
    },
  },
  75,
];
const G_ITEM_SCROLL_EVISCERATE: Item = [
  6,
  'Scroll: Eviscerate',
  {
    onUse: async (user: Actor) => {
      return useTargeting(
        TARGETING_SCROLL,
        user,
        G_TARGETING_SINGLE,
        [32, 40],
        'flame'
      );
    },
  },
  200,
];
// const G_ITEM_SCROLL_TELEPORT: Item = [
//   5,
//   'Scroll: Teleport',
//   {
//     onUse: async (user: Actor) => {},
//   },
//   100,
// ];
// const G_ITEM_SCROLL_FLY: Item = [
//   5,
//   'Scroll: Fly',
//   {
//     onUse: async (user: Actor) => {},
//   },
//   50,
// ];
// const G_ITEM_SCROLL_HASTE: Item = [
//   5,
//   'Scroll: Haste',
//   {
//     onUse: async (user: Actor) => {},
//   },
//   50,
// ];
// const G_ITEM_SCROLL_CLOAK: Item = [
//   5,
//   'Scroll: Cloak',
//   {
//     onUse: async (user: Actor) => {},
//   },
//   50,
// ];

const G_ITEM_POTION: Item = [
  9,
  'Potion',
  {
    async onUse(user: Actor) {
      G_model_statsModifyHp(
        G_model_actorGetStats(user),
        G_utils_randInRange(10, 15)
      );
      return true;
    },
  },
  50,
];

const G_DROPS_LVL1 = [
  G_ITEM_KNIFE,
  G_ITEM_SWORD,
  // G_ITEM_ARROW,
  G_ITEM_GOLD_SM,
  G_ITEM_SCROLL_FLAME,
  G_ITEM_SCROLL_COMBUST,
  // G_ITEM_SCROLL_FLY,
  G_ITEM_POTION,
  G_ITEM_KEY,
];
const G_CHEST_LVL1 = [
  // G_ITEM_BOW,
  [G_ITEM_POTION, 3],
  [G_ITEM_SCROLL_FLAME, 3],
  [G_ITEM_SCROLL_COMBUST, 2],
  [G_ITEM_SCROLL_FIREBALL, 2],
  // G_ITEM_SCROLL_TELEPORT,
  // [G_ITEM_ARROW, 5],
];
const G_DROPS_LVL2 = [
  G_ITEM_SWORD,
  // [G_ITEM_ARROW, 3],
  G_ITEM_GOLD_SM,
  G_ITEM_GOLD_MD,
  G_ITEM_SCROLL_FLAME,
  G_ITEM_SCROLL_COMBUST,
  G_ITEM_FINE_SWORD,
  G_ITEM_POTION,
  // G_ITEM_SCROLL_FLY,
];
const G_CHEST_LVL2 = [
  // [G_ITEM_FINE_ARROW, 5],
  [G_ITEM_SCROLL_FIREBALL, 2],
  [G_ITEM_SCROLL_FLAME, 5],
  [G_ITEM_POTION, 5],
  // [G_ITEM_ARROW, 10],
];

const G_DROPS_LVL3 = [
  G_ITEM_GOLD_MD,
  G_ITEM_GOLD_LG,
  G_ITEM_FINE_SWORD,
  G_ITEM_SCROLL_FLAME,
  G_ITEM_POTION,
  // [G_ITEM_SCROLL_HASTE, 2],
  // [G_ITEM_FINE_ARROW, 3],
  [G_ITEM_POTION, 2],
  // [G_ITEM_ARROW, 10],
  G_ITEM_KEY,
];
const G_CHEST_LVL3 = [G_ITEM_MAGIC_SWORD, [G_ITEM_SCROLL_EVISCERATE, 3]];

const hp = (n: number): Stats => [n, n];

// sprite index, lvl, name, Stats, Inventory, behavior
type EnemyDefinition = [number, number, string, Stats, Behavior];
const G_ENEMY_MINOR_GOLEM: EnemyDefinition = [
  2,
  1,
  'mG',
  hp(6),
  G_BEHAVIOR_RAND,
];
const G_ENEMY_GOLEM: EnemyDefinition = [4, 1, 'G', hp(14), G_BEHAVIOR_RAND];
const G_ENEMY_CASTER: EnemyDefinition = [6, 1, 'C', hp(17), G_BEHAVIOR_RAND];
// const G_ENEMY_ARCHER: EnemyDefinition = [
//   8,
//   1,
//   'Archer',
//   hp(21),
//   G_BEHAVIOR_RAND,
// ];
const G_ENEMY_MAJOR_GOLEM: EnemyDefinition = [
  10,
  1,
  'MG',
  hp(38),
  G_BEHAVIOR_RAND,
];
// const G_ENEMY_MERCHANT: EnemyDefinition = [
//   12,
//   1,
//   'Merchant',
//   hp(10),
//   G_BEHAVIOR_RAND,
// ];
// const G_ENEMY_LORD: EnemyDefinition = [12, 1, 'Lord', hp(100), G_BEHAVIOR_RAND];

// enemy, min amount, max amount, spawn area rect size (in tiles)
type SpawnDefinition = [EnemyDefinition, number, number, number, Item];
const G_SPAWN_LVL1: SpawnDefinition[] = [
  [G_ENEMY_MINOR_GOLEM, 4, 6, 12, G_ITEM_KNIFE],
  [G_ENEMY_GOLEM, 4, 6, 10, G_ITEM_KNIFE],
];
const G_SPAWN_LVL2: SpawnDefinition[] = [
  [G_ENEMY_MINOR_GOLEM, 0, 2, 12, G_ITEM_SWORD],
  [G_ENEMY_GOLEM, 2, 6, 10, G_ITEM_KNIFE],
  [G_ENEMY_CASTER, 1, 4, 4, G_ITEM_KNIFE],
  // [G_ENEMY_ARCHER, 1, 4, 12, G_ITEM_FINE_SWORD],
  [G_ENEMY_MAJOR_GOLEM, 1, 2, 10, G_ITEM_SWORD],
];
const G_SPAWN_LVL3: SpawnDefinition[] = [
  [G_ENEMY_GOLEM, 0, 2, 12, G_ITEM_SWORD],
  [G_ENEMY_CASTER, 2, 5, 10, G_ITEM_KNIFE],
  // [G_ENEMY_ARCHER, 2, 5, 12, G_ITEM_FINE_SWORD],
  [G_ENEMY_MAJOR_GOLEM, 8, 10, 10, G_ITEM_SWORD],
];

// const G_SPAWN_BOSS: SpawnDefinition[] = [
//   [G_ENEMY_LORD, 0, 2, 12, G_ITEM_FINE_SWORD],
// ];
