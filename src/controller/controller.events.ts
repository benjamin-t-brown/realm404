/*
global
Direction
G_controller_movePlayer
G_controller_playerInputComplete
G_controller_useItem
G_controller_equipItem
G_controller_acquireItem
G_controller_render
G_model_getTileSize
G_model_getCurrentWorld
G_model_getCanvas
G_model_isInputDisabled
G_model_playerGetActor
G_model_actorGetPosition
G_model_shouldDrawTargetingLine
G_model_getTargetSelectedCb
G_model_setTargetSelectedCb
G_model_worldGetCurrentRoom
G_model_unsetHighlightedTiles
G_model_setHighlightedTiles
G_model_getTargetType
G_model_setTargetType
G_model_setDrawTargetingLine
G_model_unsetSelectedInventoryItemIndex
G_model_getScale
G_model_actorGetInventory
G_model_itemIsUsable
G_model_itemCanBeEquipped
G_model_itemGetBaseItem
G_model_setSelectedInventoryItemIndex
G_model_roomGetSurroundingItemsAt
G_model_addLog
G_model_setCutsceneLine
G_view_showTargetingLine
G_view_hideTargetingLine
G_view_clearScreen
G_view_renderWorld
G_view_renderUi
G_utils_getTargets
G_utils_cycleItemInArr
G_view_playSound
LEFT
RIGHT
UP
DOWN
DOWN_LEFT
DOWN_RIGHT
UP_LEFT
UP_RIGHT
PAUSE
*/

let isRendering = false;
let renderAfter = false;
const debounceRender = (world: World) => {
  const scale = G_model_getScale();
  if (!isRendering) {
    isRendering = true;
    G_view_clearScreen();
    G_view_renderWorld(world, scale);
  } else {
    if (!renderAfter) {
      renderAfter = true;
      setTimeout(() => {
        isRendering = false;
        if (renderAfter) {
          renderAfter = false;
          debounceRender(world);
        }
      }, 16);
    }
  }
};

let isWaitingForInput = false;
let waitForInputCb: (() => void) | null = null;
const G_controller_waitForInput = async () => {
  return new Promise(resolve => {
    isWaitingForInput = true;
    waitForInputCb = () => {
      waitForInputCb = null;
      isWaitingForInput = false;
      resolve();
    };
  });
};

const G_controller_initEvents = () => {
  const KEY_MAP_TO_DIR = {
    40: DOWN,
    34: DOWN_RIGHT,
    35: DOWN_LEFT,
    37: LEFT,
    12: PAUSE,
    39: RIGHT,
    36: UP_LEFT,
    38: UP,
    33: UP_RIGHT,
    32: PAUSE, // space
    98: DOWN, // num lock on
    99: DOWN_RIGHT,
    97: DOWN_LEFT,
    100: LEFT,
    101: PAUSE,
    102: RIGHT,
    103: UP_LEFT,
    104: UP,
    105: RIGHT,
  };

  window.addEventListener('keydown', ev => {
    const world = G_model_getCurrentWorld();
    if (G_model_isInputDisabled()) {
      return;
    }

    if (isWaitingForInput && waitForInputCb) {
      waitForInputCb();
      return;
    }

    // allows use of the cutscene text to show for 1 frame, then go away
    G_model_setCutsceneLine('');

    const movePlayer = (direction: Direction) => {
      G_controller_stopTargeting();
      G_controller_movePlayer(world.player, direction, world);
    };

    const { which } = ev;
    let key = KEY_MAP_TO_DIR[which] || which;

    switch (true) {
      case ((k: number) => k >= 1 && k <= 9)(Number(key)): // isDirection
        movePlayer(key as Direction);
        break;
      case key === 27:
        // if (G_model_shouldDrawTargetingLine()) {
        //   G_model_addLog(` - cancel`);
        // }
        G_controller_stopTargeting();
        G_view_renderUi();
        debounceRender(world);
        break;
      default: {
        const actor = G_model_playerGetActor(world.player);
        const room = G_model_worldGetCurrentRoom(world);

        // number keys not including 0
        if (key > 48 && key <= 57) {
          const i = key - 49;
          const inventory = G_model_actorGetInventory(actor);
          const item = inventory[i];
          if (item) {
            const baseItem = G_model_itemGetBaseItem(item);
            if (G_model_itemIsUsable(item)) {
              G_model_setSelectedInventoryItemIndex(i);
              G_controller_useItem(baseItem, actor);
            } else if (G_model_itemCanBeEquipped(item)) {
              G_controller_equipItem(i, actor);
            }
          }
        }
        // letter keys a,b,c,d,e,f,g
        if (key >= 65 && key <= 72) {
          const nearbyItemsAt = G_model_roomGetSurroundingItemsAt(room, actor);
          const i = key - 65;
          const [item, x, y] = nearbyItemsAt[i] || [];
          if (item) {
            G_controller_acquireItem(item, actor, x, y, room);
          }
        }
      }
    }
  });

  const canvas = G_model_getCanvas();
  canvas.onmousemove = ev => {
    const world = G_model_getCurrentWorld();
    const scale = G_model_getScale();
    if (G_model_shouldDrawTargetingLine()) {
      const { offsetX, offsetY } = ev;
      const targetType = G_model_getTargetType();
      const actor = G_model_playerGetActor(world.player);
      const [x, y] = G_model_actorGetPosition(actor);
      const tileSize = G_model_getTileSize();
      const tileSizeScaled = tileSize * scale;
      const targetPx = x * tileSizeScaled + tileSizeScaled / 2;
      const targetPy = y * tileSizeScaled + tileSizeScaled / 2;
      const tx = Math.floor(offsetX / tileSizeScaled);
      const ty = Math.floor(offsetY / tileSizeScaled);
      G_view_showTargetingLine(targetPx, targetPy, offsetX, offsetY);
      G_model_setHighlightedTiles(
        G_utils_getTargets(tx, ty, targetType as TargetArea),
        G_model_worldGetCurrentRoom(world)
      );
      debounceRender(world);
    } else {
      G_view_hideTargetingLine();
    }
  };
  canvas.onmousedown = ev => {
    const handleTargetSelected = G_model_getTargetSelectedCb();
    if (handleTargetSelected) {
      const world = G_model_getCurrentWorld();
      const { offsetX, offsetY } = ev;
      const tileSize = G_model_getTileSize() * 2;
      handleTargetSelected(
        Math.floor(offsetX / tileSize),
        Math.floor(offsetY / tileSize)
      );
      debounceRender(world);
    }
  };
};

const G_controller_getTargetedPosition = async (
  targetType: TargetArea
): Promise<[number, number] | null> => {
  return new Promise(resolve => {
    G_model_setDrawTargetingLine(true);
    G_model_setTargetType(targetType);
    G_model_setTargetSelectedCb((x, y) => {
      if (x > -1 && y > -1) {
        G_view_hideTargetingLine();
        G_model_unsetSelectedInventoryItemIndex();
        resolve([x, y]);
      } else {
        resolve(null);
      }
      G_model_setTargetSelectedCb(null);
      G_controller_stopTargeting();
    });
  });
};

const G_controller_stopTargeting = () => {
  G_view_hideTargetingLine();
  G_model_unsetSelectedInventoryItemIndex();
  G_model_unsetHighlightedTiles(
    G_model_worldGetCurrentRoom(G_model_getCurrentWorld())
  );
  const handleTargetSelected = G_model_getTargetSelectedCb();
  if (handleTargetSelected) {
    handleTargetSelected(-1, -1);
  }
};
