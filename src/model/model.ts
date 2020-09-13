/*
global
G_view_drawSprite
G_model_playerGetWorldPosition
*/

interface World {
  rooms: Room[];
  player: Player;
  end: number[];
}

const G_model_worldGetCurrentRoom = (world: World): Room => {
  const player = world.player;
  const [wx, wy] = G_model_playerGetWorldPosition(player);
  const ws = G_model_getWorldSize();
  return world.rooms[wy * ws + wx];
};

let model_world: World | null = null;
let model_soundEnabled = true;
let model_inputDisabled = false;
let model_drawTargetingLine = false;
let model_selectedInventoryItemIndex = -1;
let model_handleTargetSelected: ((x: number, y: number) => void) | null = null;
let model_targetType: TargetArea | null = null;
let model_cutsceneVisible: boolean;
let model_cutsceneLine: string = '';
let model_cutsceneSprite: string = '';
let model_updateUiThisRound: boolean = false;
let model_isVictory = false;

const G_model_getScale = (): number => 2;
const G_model_setCurrentWorld = (world: World) => (model_world = world);
const G_model_getCurrentWorld = (): World => model_world as World;
const G_model_getRoomSize = () => 18;
const G_model_getWorldSize = () => 4;
const G_model_getTileSize = () => 16;
const G_model_getRoomAt = (
  wx: number,
  wy: number,
  world: World
): Room | null => {
  const worldSize = G_model_getWorldSize();
  if (wx < 0 || wy < 0 || wx >= worldSize || wy >= worldSize) {
    return null;
  }
  return world.rooms[wy * worldSize + wx] || null;
};
const G_model_getCurrentPlayer = () => G_model_getCurrentWorld().player;

const G_model_isInputDisabled = (): boolean => model_inputDisabled;
const G_model_setInputDisabled = (v: boolean) => (model_inputDisabled = v);

const G_model_setSoundEnabled = (v: boolean) => (model_soundEnabled = v);
const G_model_isSoundEnabled = () => model_soundEnabled;
const G_model_setTargetSelectedCb = (
  cb: null | ((x: number, y: number) => void)
) => (model_handleTargetSelected = cb);
const G_model_getTargetSelectedCb = ():
  | ((x: number, y: number) => void)
  | null => model_handleTargetSelected;
const G_model_setDrawTargetingLine = (v: boolean) =>
  (model_drawTargetingLine = v);
const G_model_shouldDrawTargetingLine = (): boolean => model_drawTargetingLine;
const G_model_setSelectedInventoryItemIndex = (n: number) =>
  (model_selectedInventoryItemIndex = n);
const G_model_getSelectedInventoryItemIndex = () =>
  model_selectedInventoryItemIndex;
const G_model_unsetSelectedInventoryItemIndex = () =>
  G_model_setSelectedInventoryItemIndex(-1);
const G_model_getTargetType = (): TargetArea | null => {
  return model_targetType;
};
const G_model_setTargetType = (v: TargetArea | null) => {
  model_targetType = v;
};

// const G_model_addLog = (l: string) => {
//   model_logs.push(l);
//   if (model_logs.length > 999) {
//     model_logs.unshift();
//   }
// };
// const G_model_getLogs = () => {
//   return model_logs;
// };

const G_model_setCutsceneVisible = (v: boolean) => (model_cutsceneVisible = v);
const G_model_isCutsceneVisible = () => model_cutsceneVisible;
const G_model_setCutsceneLine = (v: string) => (model_cutsceneLine = v);
const G_model_getCutsceneLine = (): string => model_cutsceneLine;
const G_model_setCutsceneSprite = (v: string) => (model_cutsceneSprite = v);
const G_model_getCutsceneSprite = () => model_cutsceneSprite;
const G_model_setUpdateUiThisRound = (v: boolean) =>
  (model_updateUiThisRound = v);
const G_model_getUpdateUiThisRound = (): boolean => model_updateUiThisRound;
const G_model_setIsVictory = (v: boolean) => (model_isVictory = v);
const G_model_getIsVictory = (): boolean => model_isVictory;
