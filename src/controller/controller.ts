/*
global
G_model_getCurrentWorld
G_model_worldGetCurrentRoom
G_model_actorSetShouldUpdate
G_model_actorGetShouldUpdate
G_model_actorGetBehavior
G_model_setInputDisabled
G_model_actorRoundReset
G_model_playerGetActor
G_model_actorIsDead
G_model_actorGetPosition
G_model_getUpdateUiThisRound
G_model_setUpdateUiThisRound
G_model_setCutsceneVisible
G_model_setIsVictory
G_model_playerModifyGold
G_model_playerSetWorldPosition
G_model_actorSetPosition
G_model_setCutsceneLine
G_controller_getBehaviorUpdateFunc
G_controller_dropItemActor
G_controller_setVisibility
G_view_clearScreen
G_view_renderWorld
G_view_playSound
G_view_renderUi
G_start
hp
G_ITEM_FINE_SWORD
G_BEHAVIOR_RAND
*/

const LOOP_MS = 16;

const G_controller_playerInputComplete = () => {
  G_model_setInputDisabled(true);
  const world = G_model_getCurrentWorld();
  const room = G_model_worldGetCurrentRoom(world);
  for (let i = 0; i < room.a.length; i++) {
    const act = room.a[i];
    G_model_actorSetShouldUpdate(act, true);
  }
  G_controller_updateWorld();
};

const G_controller_render = (world: World) => {
  const scale = 2;

  const room = G_model_worldGetCurrentRoom(world);
  const playerActor = G_model_playerGetActor(world.player);
  const [x, y] = G_model_actorGetPosition(playerActor);
  G_controller_setVisibility(x, y, room);

  G_view_clearScreen();
  G_view_renderWorld(world, scale);
};

const G_controller_updateWorld = () => {
  const world = G_model_getCurrentWorld();
  const room = G_model_worldGetCurrentRoom(world);
  if (room.p.length) {
    for (let i = 0; i < room.p.length; i++) {
      const particle = room.p[i];
      const [, startTime, duration] = particle;
      const now = +new Date();
      if (now - startTime >= duration) {
        room.p.splice(i, 1);
        i--;
      }
    }
    setTimeout(G_controller_updateWorld, LOOP_MS);
    G_controller_render(world);
    return;
  }

  const playerActor = G_model_playerGetActor(world.player);
  G_model_actorRoundReset(playerActor);
  if (G_model_actorIsDead(playerActor)) {
    G_view_playSound('lose');
    setTimeout(() => {
      G_start();
    }, 2000);
    return;
  }

  for (let i = 0; i < room.a.length; i++) {
    const act = room.a[i];
    if (G_model_actorIsDead(act)) {
      room.a.splice(i, 1);
      i--;
      G_controller_dropItemActor(act, room);
      G_view_playSound('dead');

      // onDead callback (boss only right now)
      if (act[13]) {
        act[13]();
      }
    } else if (G_model_actorGetShouldUpdate(act)) {
      G_model_actorSetShouldUpdate(act, false);
      const behavior = G_model_actorGetBehavior(act);
      const behaviorFunc = G_controller_getBehaviorUpdateFunc(behavior);
      behaviorFunc(act, world);
      setTimeout(G_controller_updateWorld, 1);
      return;
    } else {
      G_model_actorRoundReset(act);
    }
  }

  G_controller_render(world);
  G_view_renderUi();
  setTimeout(() => {
    G_model_setInputDisabled(false);
  }, LOOP_MS);
};

const G_controller_youWin = () => {
  G_model_setCutsceneVisible(true);
  G_model_setIsVictory(true);
  G_view_playSound('win');
  setTimeout(() => {
    G_view_clearScreen();
  });
};

(window as any).finalRoom = () => {
  G_view_playSound('sell');
  const world = G_model_getCurrentWorld();
  const player = world.player;
  const actor = G_model_playerGetActor(player);
  G_model_playerModifyGold(world.player, -404);
  const [endWx, endWy] = world.end;
  G_model_playerSetWorldPosition(player, endWx, endWy);
  G_model_actorSetPosition(actor, 6, 11);
  const endingRoom = G_model_worldGetCurrentRoom(world);

  const boss: Actor = [
    'Lord',
    'a',
    14,
    11,
    6,
    hp(150),
    [G_ITEM_FINE_SWORD],
    0,
    G_BEHAVIOR_RAND,
    true,
    false,
    2,
    0,
    G_controller_youWin,
  ];

  endingRoom.a.push(boss);
  G_model_setCutsceneLine('Who dares challenge me!');
  G_controller_render(world);
  G_view_renderUi();
};
