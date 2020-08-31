/*
global
G_controller_useItem
G_controller_equipItem
G_controller_render
G_controller_acquireItem
G_controller_sellItem
G_model_getCurrentWorld
G_model_itemGetBaseItem
G_model_itemGetAmount
G_model_itemGetName
G_model_itemGetSprite
G_model_itemIsUsable
G_model_itemCanBeEquipped
G_model_createCanvas
G_model_playerGetActor
G_model_actorGetInventory
G_model_actorSetEquippedItem
G_model_actorGetEquippedItem
G_model_actorGetStats
G_model_actorPushInventory
G_model_statsGetHp
G_model_statsGetMaxHp
G_model_setDrawTargetingLine
G_model_setSelectedInventoryItemIndex
G_model_getSelectedInventoryItemIndex
G_model_unsetSelectedInventoryItemIndex
G_model_setTargetSelectedCb
G_model_itemGetOnUse
G_model_worldGetCurrentRoom
G_model_roomGetSurroundingItemsAt
G_model_roomRemoveItemAt
G_model_getLogs
G_model_actorGetDamage
G_model_isCutsceneVisible
G_model_getCutsceneLine
G_model_getCutsceneSprite
G_model_playerIsAtSellTile
G_model_playerIsAtFountainTile
G_model_playerGetGold
G_model_itemGetSellAmount
G_model_getCurrentPlayer
G_model_setCutsceneLine
G_model_getIsVictory
G_model_setIsVictory
G_model_setCutsceneVisible
G_view_playSound
G_view_drawSprite
G_utils_cycleItemInArr
G_start
*/

// tracks the scroll top so it can be re-applied on re-render
let inventoryScrollTop = 0;
let pickupItemsScrollTop = 0;
const DIV = 'div';
const INNER_HTML = 'innerHTML';
const ONCLICK = 'onclick';

const appendChild = (parent: HTMLElement, child: HTMLElement) => {
  parent.appendChild(child);
};
const setClassName = (elem: HTMLElement, className: string) => {
  elem.className = className;
};
const getElementById = (id: string): HTMLElement | null =>
  document.getElementById(id);
const createElement = (
  name: string,
  innerHTML?: string,
  style?: { [key: string]: string }
): HTMLElement => {
  const elem = document.createElement(name);
  if (innerHTML) {
    elem[INNER_HTML] = innerHTML;
  }
  if (style) {
    setStyle(elem, style);
  }
  return elem;
};
const setStyle = (
  elem: HTMLElement,
  style: { [key: string]: string | undefined }
) => {
  for (let i in style) {
    elem.style[i] = style[i];
  }
};

const G_view_showTargetingLine = (
  x: number,
  y: number,
  x2: number,
  y2: number
) => {
  const parent = getElementById('tgt') as HTMLElement;
  setStyle(parent, { display: 'block' });
  const elem = parent.children[0];
  const setAttribute = 'setAttribute';
  elem[setAttribute]('x1', '' + x);
  elem[setAttribute]('x2', '' + x2);
  elem[setAttribute]('y1', '' + y);
  elem[setAttribute]('y2', '' + y2);
};

const G_view_hideTargetingLine = () => {
  G_model_setDrawTargetingLine(false);
  setStyle(getElementById('tgt') as HTMLElement, { display: 'none' });
};

const InventoryItem = (
  item: GenericItem | null,
  i: number,
  actor: Actor,
  parent: HTMLElement
) => {
  const div = createElement(DIV);
  setClassName(div, 'item hrz');
  if (item) {
    const baseItem = G_model_itemGetBaseItem(item);
    const amount = G_model_itemGetAmount(item);
    const itemName = G_model_itemGetName(baseItem);
    const itemSprite = G_model_itemGetSprite(baseItem);
    const isEquipped = G_model_actorGetEquippedItem(actor) === item;
    setStyle(div, { 'justify-content': 'flex-start' });

    if (i === G_model_getSelectedInventoryItemIndex()) {
      setStyle(div, { background: '#444' });
    }

    const cycleMenu = createElement(DIV);
    setClassName(cycleMenu, 'vrt menu-item-ctr');
    const createCycleFunc = (dir: 1 | -1) => {
      return () => {
        const equipI = actor[12];
        const newI = G_utils_cycleItemInArr(
          i,
          G_model_actorGetInventory(actor),
          dir
        );
        let nextI = equipI;
        if (newI === equipI) {
          nextI = equipI - dir;
        }
        if (isEquipped) {
          nextI = i + dir;
        }
        G_model_actorSetEquippedItem(actor, nextI);
        G_view_renderUi();
      };
    };

    const cycClassName = 'cyc-item';
    const cycleUp = createElement(DIV, 'up');
    setClassName(cycleUp, cycClassName);
    cycleUp[ONCLICK] = createCycleFunc(-1);
    appendChild(cycleMenu, cycleUp);
    const cycleDown = createElement(DIV, 'dn');
    setClassName(cycleDown, cycClassName);
    cycleDown[ONCLICK] = createCycleFunc(1);
    appendChild(cycleMenu, cycleDown);
    appendChild(div, cycleMenu);

    const numberLabel = createElement(DIV, `${i + 1}. `);
    setStyle(numberLabel, { margin: '5px', width: '20px' });
    appendChild(div, numberLabel);

    const menu = createElement(DIV);
    setClassName(menu, 'vrt menu-item-ctr');
    appendChild(div, menu);
    const world = G_model_getCurrentWorld();
    if (G_model_playerIsAtSellTile(world.player, world)) {
      const btn = createElement(DIV, 'SELL');
      btn[ONCLICK] = () => {
        G_controller_sellItem(item, G_model_getCurrentPlayer());
      };
      setClassName(btn, 'menu-item');
      setStyle(btn, { background: '#994' });
      appendChild(menu, btn);

      const cost = createElement(
        DIV,
        `${G_model_itemGetSellAmount(item)} gold `
      );
      setStyle(cost, {
        'text-align': 'center',
        color: '#FFE762',
        margin: '5px',
        width: '32px',
      });
      appendChild(div, cost);
    } else {
      if (G_model_itemIsUsable(item)) {
        const btn = createElement(DIV, 'USE');
        setClassName(btn, 'menu-item');
        btn[ONCLICK] = async () => {
          G_model_setSelectedInventoryItemIndex(i);
          G_controller_useItem(baseItem, actor);
        };
        appendChild(menu, btn);
      }
      if (G_model_itemCanBeEquipped(item) && !isEquipped) {
        const btn = createElement(DIV, 'EQP');
        btn[ONCLICK] = () => {
          G_controller_equipItem(i, actor);
        };
        setClassName(btn, 'menu-item');
        appendChild(menu, btn);
      }
    }

    const [canvas, ctx] = G_model_createCanvas(32, 32);
    setStyle(canvas, { margin: '2px' });
    G_view_drawSprite(itemSprite, 0, 0, 2, ctx);
    appendChild(div, canvas);

    const span = createElement(
      DIV,
      `${itemName} ${amount > 1 ? '(' + amount + ')' : ''}`,
      { width: '90px' }
    );
    if (isEquipped) {
      setStyle(span, { color: '#9ef' });
    }
    appendChild(div, span);
  }
  appendChild(parent, div);
};

const Inventory = (player: Player, parent: HTMLElement) => {
  const div = createElement(DIV);
  div.onscroll = () => {
    inventoryScrollTop = div.scrollTop;
  };
  setClassName(div, 'inventory');

  const title = createElement(DIV, 'INVENTORY');
  setClassName(title, 'title');
  appendChild(div, title);

  const actor = G_model_playerGetActor(player);
  const inventory = G_model_actorGetInventory(actor);
  for (let i = 0; i < 10; i++) {
    InventoryItem(inventory[i], i, actor, div);
  }
  appendChild(parent, div);
  div.scrollTop = inventoryScrollTop;
};

const PickupItemsRow = (
  item: GenericItem,
  i: number,
  room: Room,
  x: number,
  y: number,
  actor: Actor,
  parent: HTMLElement
) => {
  const div = createElement(DIV);
  setClassName(div, 'item hrz');
  setStyle(div, {
    width: '155px',
    background: '#555',
  });
  if (item) {
    const baseItem = G_model_itemGetBaseItem(item);
    const amount = G_model_itemGetAmount(item);
    const itemName = G_model_itemGetName(baseItem);
    const itemSprite = G_model_itemGetSprite(baseItem);
    const [canvas, ctx] = G_model_createCanvas(32, 32);
    setStyle(canvas, { margin: '2px' });
    G_view_drawSprite(itemSprite, 0, 0, 2, ctx);
    setStyle(div, { 'justify-content': 'flex-start' });
    const spanLetter = createElement(
      'span',
      `${String.fromCharCode(i + 65).toLowerCase()}.`
    );
    const span = createElement(
      'span',
      `${itemName} ${amount > 1 ? '(' + amount + ')' : ''}`
    );
    appendChild(div, spanLetter);
    appendChild(div, canvas);
    appendChild(div, span);
    div[ONCLICK] = () => {
      G_controller_acquireItem(item, actor, x, y, room);
    };
  }
  appendChild(parent, div);
};

const PickupItems = (player: Player, room: Room, parent: HTMLElement) => {
  const title = createElement(DIV, 'NEARBY ITEMS');
  setClassName(title, 'title');
  appendChild(parent, title);

  const actor = G_model_playerGetActor(player);
  const nearbyItemsAt = G_model_roomGetSurroundingItemsAt(room, actor);
  for (let i = 0; i < nearbyItemsAt.length; i++) {
    const [item, x, y] = nearbyItemsAt[i];
    PickupItemsRow(item, i, room, x, y, actor, parent);
  }
};

const Stats = (player: Player, parent: HTMLElement) => {
  const actor = G_model_playerGetActor(player);

  const statsDiv = createElement(DIV);
  setClassName(statsDiv, 'stats info-item');

  // const title = createElement(DIV, 'STATS');
  // setClassName(title, 'title');
  // appendChild(statsDiv, title);

  const actorDiv = createElement(DIV);
  setStyle(actorDiv, { padding: '8px', 'font-size': '22px' });
  const goldDiv = createElement(
    DIV,
    `Gold: ${G_model_playerGetGold(player)}/404`,
    {
      color: '#FFE762',
    }
  );
  appendChild(actorDiv, goldDiv);
  const stats = G_model_actorGetStats(actor);
  const hp = G_model_statsGetHp(stats);
  const maxHp = G_model_statsGetMaxHp(stats);
  const hpDiv = createElement(DIV, `HP: ${hp}/${maxHp}`, {
    color: hp < maxHp ? '#FB922B' : '',
  });
  appendChild(actorDiv, hpDiv);
  const [min, max] = G_model_actorGetDamage(actor);
  const dmgDiv = createElement(DIV, `DMG: ${min}-${max}`);
  appendChild(actorDiv, dmgDiv);

  appendChild(statsDiv, actorDiv);
  appendChild(parent, statsDiv);
};

const InfoDiv = (world: World, parent: HTMLElement) => {
  const ctrlDiv = createElement(DIV);
  setClassName(ctrlDiv, 'ctrl info-item hrz');
  const reset = createElement(DIV, 'Reset', {
    width: '80px',
  });
  setClassName(reset, 'menu-item');
  appendChild(ctrlDiv, reset);
  reset[ONCLICK] = () => {
    G_start();
  };

  // const logDiv = createElement(DIV);
  // setClassName(logDiv, 'log info-item');
  // const logTitle = createElement(DIV, 'LOG');
  // setClassName(logTitle, 'title');
  // appendChild(logDiv, logTitle);
  // G_model_getLogs().forEach(l => {
  //   const logRow = createElement(DIV, l);
  //   setClassName(logRow, 'log-row');
  //   appendChild(logDiv, logRow);
  // });

  const pickupDiv = createElement(DIV);
  setClassName(pickupDiv, 'pickup info-item');
  pickupDiv.onscroll = () => {
    pickupItemsScrollTop = pickupDiv.scrollTop;
  };
  PickupItems(world.player, G_model_worldGetCurrentRoom(world), pickupDiv);

  appendChild(parent, ctrlDiv);
  Stats(world.player, parent);
  // appendChild(parent, logDiv);
  appendChild(parent, pickupDiv);
  pickupDiv.scrollTop = pickupItemsScrollTop;
  // logDiv.scrollTop = 9999;
};

const Cutscene = (world: World, parent: HTMLElement) => {
  let line = G_model_getCutsceneLine();

  const span = createElement(DIV);
  setStyle(span, { margin: '25px 0', 'font-size': '1.25rem' });
  appendChild(parent, span);

  if (!G_model_isCutsceneVisible()) {
    const help = createElement(
      DIV,
      'NumPad/Arrows: move, Num5/Space: wait | Move into enemies to strike',
      {
        position: 'fixed',
        top: '5px',
      }
    );
    appendChild(parent, help);

    const player = world.player;
    if (G_model_playerIsAtFountainTile(player, world)) {
      const gold = G_model_playerGetGold(player);
      if (gold >= 404) {
        line =
          'You may enter...<div class="menu-item dona" onclick="window.finalRoom()">Donate Coins</div>';
      } else {
        line = 'More gold is required... ';
      }
    }
    if (G_model_playerIsAtSellTile(player, world)) {
      line = `What're ya sellin'?`;
    }
    if (!line) {
      setStyle(parent, {
        'min-height': '0px',
        height: '0px',
        border: '0',
      });
      return;
    }
  } else {
    let span2: HTMLElement;
    if (G_model_getIsVictory()) {
      line = 'You are victorious.';
      span2 = createElement(DIV, 'Again!', {
        padding: '5px',
      });
      setClassName(span2, 'menu-item dona');
      span2[ONCLICK] = () => {
        G_model_setIsVictory(false);
        G_model_setCutsceneVisible(false);
        G_start();
      };
    } else {
      span2 = createElement(DIV, 'Press any key');
      setStyle(span2, {
        margin: '100px',
        position: 'absolute',
        top: '0',
        color: '#bbb',
      });
    }
    appendChild(parent, span2);
  }
  setStyle(parent, {
    display: 'flex',
    'min-height': '90px',
    border: '2px outset #777',
  });
  span[INNER_HTML] = line;

  const [canvas, ctx] = G_model_createCanvas(32, 32);
  setStyle(canvas, { margin: '250px', position: 'absolute', top: '0' });
  const sprite = G_model_getCutsceneSprite();
  if (sprite) {
    G_view_drawSprite(sprite, 0, 0, 2, ctx);
  }
  appendChild(parent, canvas);
};

const G_view_renderUi = () => {
  const world = G_model_getCurrentWorld();
  const invDiv = getElementById('invDiv') as HTMLElement;
  invDiv[INNER_HTML] = '';
  const infoDiv = getElementById('infoDiv') as HTMLElement;
  infoDiv[INNER_HTML] = '';
  const cutDiv = getElementById('cutDiv') as HTMLElement;
  cutDiv[INNER_HTML] = '';

  if (G_model_getIsVictory() || G_model_isCutsceneVisible()) {
    setStyle(infoDiv, { width: '0' });
  } else {
    setStyle(infoDiv, { width: '' });
    Inventory(world.player, invDiv);
    InfoDiv(world, infoDiv);
  }
  Cutscene(world, cutDiv);
  setStyle(document.body.children[0] as HTMLElement, { display: 'flex' });
};
