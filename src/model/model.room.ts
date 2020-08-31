/*
global
G_model_getWorldSize
G_model_getRoomSize
G_model_playerGetWorldPosition
G_model_actorGetPosition
G_model_playerGetActor
G_model_getCurrentWorld
G_model_itemGetName
G_model_itemGetBaseItem
*/

// sprite, id, x, y, highlighted
type Tile = [string, number, number, number, boolean];
type ItemAt = [Item | [Item, number], number, number];
// sprite, startTime, ms duration, x, y, text
type Particle = [string, number, number, number, number, string];
interface Room {
  tiles: Tile[];
  visMap: number[][];
  explMap: number[][];
  p: Particle[];
  a: Actor[];
  items: ItemAt[];
  lvl: number;
  id: number;
  mod: string;
}

const WALLS = [3, 4, 5, 6, 9, 10, 11, 12, 13, 14];
const SIGHT_WALLS = [3, 4, 5, 6, 14];
const G_TILE_CHEST = 10;
const G_TILE_GATE = 9;
const G_TILE_GRASS = 0;

const G_PARTICLE_INDEX_STRIKE = 0;
const G_PARTICLE_INDEX_MAGIC = 1;

const G_model_particleCreate = (
  spriteIndex: number,
  x: number,
  y: number,
  text: string
): Particle => {
  return ['misc_' + spriteIndex, +new Date(), 500, x, y, text];
};

const G_model_roomGetActorAt = (
  room: Room,
  x: number,
  y: number
): Actor | null => {
  for (let i = 0; i < room.a.length; i++) {
    const actor = room.a[i];
    const [x2, y2] = G_model_actorGetPosition(actor);
    if (x2 === x && y2 === y) {
      return actor;
    }
  }
  const world = G_model_getCurrentWorld();
  if (world) {
    const actor = G_model_playerGetActor(world.player);
    const [x2, y2] = G_model_actorGetPosition(actor);
    if (x2 === x && y2 === y) {
      return actor;
    }
  }
  return null;
};

const G_model_roomAddParticle = (room: Room, particle: Particle) => {
  room.p.push(particle);
};

const G_model_roomGetTileAt = (
  room: Room,
  x: number,
  y: number
): Tile | null => {
  const sz = G_model_getRoomSize();
  if (x < 0 || x >= sz) {
    return null;
  }
  if (y < 0 || y >= sz) {
    return null;
  }
  return room.tiles[y * G_model_getRoomSize() + x];
};
const G_model_roomSetTileAt = (
  room: Room,
  x: number,
  y: number,
  id: number
) => {
  const tile = G_model_roomGetTileAt(room, x, y);
  if (tile) {
    tile[0] = 't_' + id;
    tile[1] = id;
  }
};

const G_model_roomAddItemAt = (
  room: Room,
  item: Item,
  x: number,
  y: number
) => {
  room.items.push([item, x, y]);
};
const G_model_roomGetItemsAt = (room: Room, x: number, y: number): ItemAt[] => {
  const ret: ItemAt[] = [];
  for (let i = 0; i < room.items.length; i++) {
    const [, xi, yi] = room.items[i];
    if (x === xi && y === yi) {
      ret.push(room.items[i]);
    }
  }
  return ret;
};
const G_model_roomRemoveItemAt = (
  room: Room,
  itemName: string,
  x: number,
  y: number
): boolean => {
  const { items } = room;
  for (let i = 0; i < items.length; i++) {
    let [item, iX, iY] = items[i];
    if (
      x === iX &&
      y === iY &&
      itemName === G_model_itemGetName(G_model_itemGetBaseItem(item))
    ) {
      items.splice(i, 1);
      return true;
    }
  }
  return false;
};

const G_model_roomGetSurroundingItemsAt = (
  room: Room,
  actor: Actor
): ItemAt[] => {
  let ret: ItemAt[] = [];
  const [x, y] = G_model_actorGetPosition(actor);

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      ret = ret.concat(G_model_roomGetItemsAt(room, x + j, y + i));
    }
  }
  return ret;
};

const G_model_roomPosIsVisible = (
  room: Room,
  x: number,
  y: number
): boolean => {
  return !!room.visMap[y][x];
};
const G_model_roomPosIsExplored = (
  room: Room,
  x: number,
  y: number
): boolean => {
  return !!room.explMap[y][x];
};

const G_model_setHighlightedTiles = (
  tilePositions: [number, number][],
  room: Room
) => {
  G_model_unsetHighlightedTiles(room);
  for (let i = 0; i < tilePositions.length; i++) {
    const [x, y] = tilePositions[i];
    G_model_tileSetHighlighted(G_model_roomGetTileAt(room, x, y), true);
  }
};

const G_model_unsetHighlightedTiles = (room: Room) => {
  for (let i = 0; i < room.tiles.length; i++) {
    G_model_tileSetHighlighted(room.tiles[i], false);
  }
};

const G_model_tileGetId = (tile: Tile | null) => {
  return tile?.[1] || 0;
};

const G_model_tileIsPassable = (tile: Tile | null): boolean => {
  return !WALLS.includes(G_model_tileGetId(tile));
};

const G_model_tileBlocksSight = (tile: Tile | null): boolean => {
  return SIGHT_WALLS.includes(G_model_tileGetId(tile));
};

const G_model_tileIsHighlighted = (tile: Tile | null): boolean => {
  return !!tile?.[4];
};

const G_model_tileSetHighlighted = (tile: Tile | null, v: boolean) => {
  if (tile) {
    tile[4] = v;
  }
};
