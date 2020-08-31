/*
global
G_view_drawSprite
G_controller_createEmptyVisMap
G_model_createCanvas
G_model_getWorldSize
G_model_getRoomSize
G_model_getRoomAt
G_model_actorGetStats
G_model_playerSetWorldPosition
G_model_roomGetTileAt
G_model_roomGetActorAt
G_model_tileIsPassable
G_utils_randInRange
G_utils_randInArr
G_SPAWN_LVL1
G_SPAWN_LVL2
G_SPAWN_LVL3
G_ITEM_KNIFE
G_ITEM_CLUB
G_BEHAVIOR_NONE
G_ITEM_POTION
hp
G_controller_dropItem
*/

//game start sound?
// with (new AudioContext())
//   [3, 4, 6, 7, 10, 15, 22].map((v, i) => {
//     with (createOscillator())
//       v &&
//         start(
//           (e = [7, 6, 5, 4, 3, 2, 1][i] / 10),
//           connect(destination),
//           (frequency.value = 988 / 1.06 ** v),type="triangle"
//         ) + stop(e + 0.12);
//   });

const START = 0;
const LVL1 = [1, 3, 4];
const LVL1Chest = [2, 5, 6, 7];
const LVL2 = [8];
const LVL2Chest = [9, 10, 11];
const LVL3 = [14];
const LVL3Chest = [12, 13];
const BOSS = 15;

const to2d = (i: number, width: number) => {
  return [i % width, Math.floor(i / width)];
};
const to1d = (x: number, y: number, width: number) => {
  return y * width + x;
};

const randMod = () => G_utils_randInArr(['', '_r1', '_r2', '_r3', '_f']);

const getRow = (i: number, room: Room): Tile[] => {
  const roomSize = G_model_getRoomSize();
  const ind = i * roomSize;
  return room.tiles.slice(ind, ind + roomSize);
};
const getColumn = (j: number, room: Room): Tile[] => {
  const ret: Tile[] = [];
  const roomSize = G_model_getRoomSize();
  for (let i = 0; i < G_model_getRoomSize(); i++) {
    ret.push(room.tiles[j + i * roomSize]);
  }
  return ret;
};

const setTileId = (id: number, tile: Tile) => {
  tile[0] = 't_' + id;
  tile[1] = id;
};

const getAllRoomsOfLvl = (lvl: number, world: World): Room[] => {
  return world.rooms.filter(r => r.lvl === lvl);
};

const getAllAdjacentRooms = (room: Room, world: World, lvl: number): Room[] => {
  const adjacentRooms: Room[] = [];
  const roomsToCheck: Room[] = [room];
  const roomsChecked: Room[] = [];

  const checkRoom = (r: Room | null) => {
    if (r) {
      if (r.lvl === lvl && !adjacentRooms.includes(r)) {
        adjacentRooms.push(r);
      } else if (r.lvl === room.lvl && !roomsChecked.includes(r)) {
        roomsToCheck.push(r);
      }
    }
  };

  do {
    const r = roomsToCheck.shift() as Room;
    roomsChecked.push(r);
    getAdjacentRooms(r, world).forEach(checkRoom);
  } while (roomsToCheck.length);

  return adjacentRooms;
};

const getAdjacentRooms = (room: Room, world: World): Room[] => {
  const worldSize = G_model_getWorldSize();
  const [x, y] = to2d(world.rooms.indexOf(room), worldSize);
  return [
    G_model_getRoomAt(x, y - 1, world),
    G_model_getRoomAt(x, y + 1, world),
    G_model_getRoomAt(x - 1, y, world),
    G_model_getRoomAt(x + 1, y, world),
  ] as Room[];
};

const openEdgesBetween = (room1: Room, room2: Room, world: World) => {
  const roomSize = G_model_getRoomSize();
  getAdjacentRooms(room1, world).forEach((r, i) => {
    const setPassable = (tile: Tile) => {
      const tileId = room1.tiles[roomSize + 1][1];
      setTileId(tileId, tile);
    };

    const bxMin = 4;
    const bxMax = 4;

    if (r === room2) {
      switch (i) {
        case 0: // up
          getRow(0, room1).slice(bxMin, -bxMax).forEach(setPassable);
          break;
        case 1: // down
          getRow(roomSize - 1, room1)
            .slice(bxMin, -bxMax)
            .forEach(setPassable);
          break;
        case 2: // left
          getColumn(0, room1).slice(bxMin, -bxMax).forEach(setPassable);
          break;
        case 3: // right
          getColumn(roomSize - 1, room1)
            .slice(bxMin, -bxMax)
            .forEach(setPassable);
      }
    }
  });
};

const generateRooms = (lvl: number, baseAdjacentRoom: Room, world: World) => {
  const getRandIdLvl = () =>
    G_utils_randInArr(lvl === 1 ? LVL1 : lvl === 2 ? LVL2 : LVL3);
  if (lvl > 1) {
    baseAdjacentRoom.lvl = lvl;
    baseAdjacentRoom.mod = randMod();
    baseAdjacentRoom.id = getRandIdLvl();
  }
  for (let i = 0; i < 4; i++) {
    const adjacentRooms = getAllAdjacentRooms(baseAdjacentRoom, world, 0);
    if (adjacentRooms.length) {
      const r = G_utils_randInArr(adjacentRooms);
      r.lvl = lvl;
      r.mod = randMod();
      r.id = getRandIdLvl();
    }
  }
};

const spawnEnemiesInRoom = (room: Room, spawns: SpawnDefinition[]) => {
  const randomPosInRect = (
    x: number,
    y: number,
    w: number,
    h: number
  ): [number, number] => {
    return [G_utils_randInRange(x, x + w), G_utils_randInRange(y, y + h)];
  };
  const isAbleToSpawn = (x: number, y: number, room: Room): boolean => {
    const tile = G_model_roomGetTileAt(room, x, y);
    const actor = G_model_roomGetActorAt(room, x, y);
    if (G_model_tileIsPassable(tile as Tile) && actor === null) {
      return true;
    }
    return false;
  };
  const roomSize = G_model_getRoomSize();
  spawns.forEach(spawn => {
    const [enemy, min, max, size, item] = spawn;
    const xy = roomSize / 2 - size / 2;
    let ctr = 0;
    let x: number;
    let y: number;
    let nToSpawn = G_utils_randInRange(min, max + 1);
    for (let i = 0; i < nToSpawn; i++) {
      let shouldContinue = false;
      do {
        const [px, py] = randomPosInRect(xy, xy, size, size);
        x = px;
        y = py;
        ctr++;
        if (ctr > 10) {
          shouldContinue = true;
          break;
        }
      } while (!isAbleToSpawn(x, y, room));
      if (shouldContinue) {
        continue;
      }

      // sprite index, lvl, name, Stats, behavior
      let [spriteIndex, lvl, name, stats, behavior] = enemy;
      const newActor: Actor = [
        name,
        'a',
        spriteIndex,
        x,
        y,
        [...stats],
        [item],
        0,
        behavior,
        true,
        false,
        lvl,
        0,
        0,
      ];
      room.a.push(newActor);
    }
  });
};

const colors = {
  5011569: 0,
  634050: 1,
  255255255: 2,
  25523198: 3,
  256163: 4,
  357193: 5,
  '000': 6,
  79103129: 7,
  606060: 8,
  803030: 9,
  18411180: 10,
  4132209: 11,
  2295968: 12,
  44232244: 13,
  25114643: 14,
  175191210: 15,
};

const G_model_createWorld = (spritePrefix: string): World => {
  // create world and player
  const playerActor: Actor = [
    'player',
    'a',
    0, // id
    9, // x
    12, // y
    hp(100),
    [
      G_ITEM_KNIFE,
      // G_ITEM_SWORD,
      // G_ITEM_MAGIC_SWORD,
      // [G_ITEM_ARROW, 10],
      [G_ITEM_POTION, 3],
      // G_ITEM_SCROLL_FLAME,
      // G_ITEM_BOW,
      // G_ITEM_SCROLL_FIREBALL,
      // G_ITEM_FINE_SWORD,
      // G_ITEM_KEY,
    ] as GenericItem[],
    0,
    0,
    true,
    false,
    0,
    0,
    0,
  ];
  const player: Player = [0, 0, playerActor, 0];
  const world = {
    rooms: [] as Room[],
    p: [] as Particle[],
    player,
    end: [] as number[],
  };

  // setup sizes
  const worldSize = G_model_getWorldSize();
  const roomSize = G_model_getRoomSize();
  const numRooms = worldSize * worldSize;

  // create initial rooms
  for (let i = 0; i < numRooms; i++) {
    const room = {
      lvl: 0,
      id: 15,
      tiles: [] as Tile[],
      p: [] as Particle[],
      visMap: G_controller_createEmptyVisMap([roomSize, roomSize]),
      explMap: G_controller_createEmptyVisMap([roomSize, roomSize]),
      items: [] as ItemAt[],
      a: [] as Actor[],
      mod: '',
    };
    world.rooms.push(room);
  }

  // create starting room and ending room
  const startingRoom = G_utils_randInArr(world.rooms);
  startingRoom.lvl = 1;
  // startingRoom.mod = randMod();
  startingRoom.id = START;
  let ind = world.rooms.indexOf(startingRoom);
  let [x, y] = to2d(ind, worldSize);
  G_model_playerSetWorldPosition(player, x, y);

  let endingRoom: Room;
  do {
    endingRoom = G_utils_randInArr(world.rooms);
  } while (endingRoom === startingRoom);
  endingRoom.lvl = 4;
  endingRoom.id = BOSS;
  endingRoom.mod = '';
  const i = world.rooms.indexOf(endingRoom);
  world.end = to2d(i, 4);

  // generate room regions
  generateRooms(1, startingRoom, world);
  const snowRoom = G_utils_randInArr(
    getAllAdjacentRooms(startingRoom, world, 0)
  );
  generateRooms(2, snowRoom, world);
  const adjSnowRooms = getAllAdjacentRooms(snowRoom, world, 0);
  const lavaRoom = G_utils_randInArr(
    adjSnowRooms.length
      ? adjSnowRooms
      : getAllAdjacentRooms(startingRoom, world, 0)
  );
  generateRooms(3, lavaRoom, world);

  // this happens sometimes, instead of logically fixing it, just punt and redo D:
  if (
    getAllRoomsOfLvl(3, world).length <= 2 ||
    getAllRoomsOfLvl(2, world).length <= 2
  ) {
    return G_model_createWorld(spritePrefix);
  }

  // fill remaining rooms as lvl 1
  getAllRoomsOfLvl(0, world).forEach(r => {
    r.lvl = 1;
    r.mod = randMod();
    r.id = G_utils_randInArr(LVL1);
    // getAdjacentRooms(r, world).forEach(r2 => {
    //   if (r2) {
    //     openEdgesBetween(r, r2, world);
    //     openEdgesBetween(r2, r, world);
    //   }
    // });
  });

  // add chests
  {
    const r = G_utils_randInArr(
      getAllRoomsOfLvl(1, world).filter(r => r !== startingRoom)
    );
    r.id = G_utils_randInArr(LVL1Chest);
  }
  {
    const r = G_utils_randInArr(getAllRoomsOfLvl(2, world));
    r.id = G_utils_randInArr(LVL2Chest);
  }
  {
    const r = G_utils_randInArr(getAllRoomsOfLvl(3, world));
    r.id = G_utils_randInArr(LVL3Chest);
  }

  // read room data from image sprites and set the tiles accordingly
  const Wall = (x: number, y: number): Tile => ['t_14', 14, x, y, false];
  const pngSize = 16;
  for (let i = 0; i < numRooms; i++) {
    const { tiles, id, mod } = world.rooms[i];
    const [, ctx] = G_model_createCanvas(pngSize, pngSize);
    const sprite = spritePrefix + '_' + id + mod;
    G_view_drawSprite(sprite, 0, 0, 1, ctx);
    const { data } = ctx.getImageData(0, 0, pngSize, pngSize);
    for (let j = 0; j < roomSize * roomSize; j++) {
      const [x, y] = to2d(j, roomSize);
      tiles.push(Wall(x, y));
    }
    let ctr = 0;
    for (let j = 0; j < data.length; j += 4) {
      const colorKey = `${data[j + 0]}${data[j + 1]}${data[j + 2]}`;
      const ind = colors[colorKey] || 0;
      const tx = 1 + (ctr % pngSize);
      const ty = 1 + Math.floor(ctr / pngSize);
      const tInd = to1d(tx, ty, roomSize);
      tiles[tInd] = ['t_' + ind, ind, tx, ty, false];
      ctr++;
    }
  }

  // open edges between all rooms of same region and 1 room from each region
  for (let j = 0; j < numRooms; j++) {
    const room = world.rooms[j];
    getAdjacentRooms(room, world).forEach(r => {
      if (r && r.lvl === room.lvl) {
        openEdgesBetween(room, r, world);
      }
    });
  }
  const snowRoomAdj = G_utils_randInArr(
    getAllAdjacentRooms(startingRoom, world, 2)
  );
  getAdjacentRooms(snowRoomAdj, world).forEach(r => {
    if (r && r.lvl === 1) {
      openEdgesBetween(snowRoomAdj, r, world);
      openEdgesBetween(r, snowRoomAdj, world);
    }
  });
  const adjSnowRoomsAdj = getAllAdjacentRooms(snowRoomAdj, world, 3);
  const lavaRoomAdj = G_utils_randInArr(
    adjSnowRoomsAdj.length
      ? adjSnowRoomsAdj
      : getAllAdjacentRooms(startingRoom, world, 3)
  );
  getAdjacentRooms(lavaRoomAdj, world).forEach(r => {
    if (r && r.lvl === 2) {
      openEdgesBetween(lavaRoomAdj, r, world);
      openEdgesBetween(r, lavaRoomAdj, world);
    }
  });

  getAdjacentRooms(endingRoom, world).forEach(r => {
    if (r) {
      openEdgesBetween(endingRoom, r, world);
      openEdgesBetween(r, endingRoom, world);
    }
  });

  // spawn enemies
  getAllRoomsOfLvl(1, world).forEach(r => {
    if (r !== startingRoom) {
      spawnEnemiesInRoom(r, G_SPAWN_LVL1);
    }
  });

  getAllRoomsOfLvl(2, world).forEach(r => {
    spawnEnemiesInRoom(r, G_SPAWN_LVL2);
  });

  getAllRoomsOfLvl(3, world).forEach(r => {
    if (r !== endingRoom) {
      spawnEnemiesInRoom(r, G_SPAWN_LVL3);
    }
  });

  // the merchant
  const merchant: Actor = [
    name,
    'a',
    12,
    4,
    12,
    hp(100),
    [],
    0,
    G_BEHAVIOR_NONE,
    true,
    false,
    2,
    0,
    0,
  ];

  startingRoom.a.push(merchant);
  G_controller_dropItem(1, 4, 6, startingRoom);
  G_controller_dropItem(1, 13, 3, startingRoom);

  return world;
};
