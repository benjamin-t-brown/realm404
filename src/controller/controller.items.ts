/*
global
G_model_actorGetDropLvl
G_model_actorGetPosition
G_model_roomAddItemAt
G_model_roomRemoveItemAt
G_model_actorPushInventory
G_model_getCurrentWorld
G_model_itemGetName
G_model_itemGetBaseItem
G_model_itemGetOnUse
G_model_itemGetAmount
G_model_itemGetSellAmount
G_model_itemInvokeOnAcquire
G_model_actorSetEquippedItem
G_model_addLog
G_model_playerModifyGold
G_model_playerGetActor
G_model_actorSubtractFromInventory
G_model_setSelectedInventoryItemIndex
G_controller_render
G_view_renderUi
G_view_playSound
G_utils_randInArr
G_DROPS_LVL1
G_DROPS_LVL2
G_DROPS_LVL3
G_CHEST_LVL1
G_CHEST_LVL2
G_CHEST_LVL3
*/

const G_controller_dropItem = (
  dropLvl: number,
  x: number,
  y: number,
  room: Room,
  isChest?: boolean
) => {
  let drops: (Item | (number | Item)[])[];
  if (dropLvl === 1) {
    drops = isChest ? G_CHEST_LVL1 : G_DROPS_LVL1;
  } else if (dropLvl === 2) {
    drops = isChest ? G_CHEST_LVL2 : G_DROPS_LVL2;
  } else if (dropLvl === 3) {
    drops = isChest ? G_CHEST_LVL3 : G_DROPS_LVL3;
  } else {
    return;
  }
  const drop = G_utils_randInArr(drops);
  G_model_roomAddItemAt(room, drop, x, y);
};

const G_controller_dropItemActor = (actor: Actor, room: Room) => {
  const [x, y] = G_model_actorGetPosition(actor);
  G_controller_dropItem(room.lvl, x, y, room);
};

const G_controller_useItem = async (item: Item, user: Actor) => {
  // const baseItem = G_model_itemGetBaseItem(item);
  // const itemName = G_model_itemGetName(baseItem);
  G_view_playSound('use');
  // G_model_addLog(`Use "${itemName}"`);

  G_view_renderUi();
  if (await (G_model_itemGetOnUse(item) as any)(user)) {
    G_model_actorSubtractFromInventory(user, item);
    G_model_setSelectedInventoryItemIndex(-1);
  }
  G_view_renderUi();
};

const G_controller_equipItem = async (i: number, user: Actor) => {
  G_view_playSound('eqp');
  G_model_actorSetEquippedItem(user, i);
  G_view_renderUi();
};

const G_controller_acquireItem = (
  item: GenericItem,
  actor: Actor,
  x: number,
  y: number,
  room: Room
) => {
  const baseItem = G_model_itemGetBaseItem(item);
  const itemName = G_model_itemGetName(baseItem);
  // const itemAmount = G_model_itemGetAmount(item);
  G_model_roomRemoveItemAt(room, itemName, x, y);

  // if, after calling a possible onAcquire function, the item should be kept...
  if (G_model_itemInvokeOnAcquire(item)) {
    G_model_actorPushInventory(actor, item);
    G_view_playSound('acquire');
  }
  // G_model_addLog(`Acquired "${itemName}" (${itemAmount})`);
  G_view_renderUi();
  G_controller_render(G_model_getCurrentWorld());
};

const G_controller_sellItem = (item: GenericItem, player: Player) => {
  G_view_playSound('sell');
  const sellValue = G_model_itemGetSellAmount(item);
  G_model_playerModifyGold(player, sellValue);
  const actor = G_model_playerGetActor(player);
  G_model_actorSubtractFromInventory(actor, item);
  G_view_renderUi();
};
