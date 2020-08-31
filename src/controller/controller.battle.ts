/*
global
G_model_actorGetEquippedItem
G_model_itemGetDamage
G_model_itemGetBaseItem
G_model_statsModifyHp
G_model_actorGetStats
G_model_roomAddParticle
G_model_worldGetCurrentRoom
G_model_particleCreate
G_model_actorGetName
G_model_actorGetPosition
G_model_actorSetAttacking
G_model_setSelectedInventoryItemIndex
G_model_itemGetOnUse
G_model_actorSetEquippedItem
G_model_actorGetDamage
G_model_addLog
G_view_renderUi
G_view_playSound
G_utils_randInRange
*/

type DmgMinMax = [number, number];

const SPRITE_EFFECT_INDEX_STRIKE = 0;
const SPRITE_EFFECT_INDEX_MAG = 15;

const G_controller_strikeActor = (
  attacker: Actor,
  victim: Actor,
  world: World
): number => {
  if (victim === attacker) {
    return 0;
  }

  const [min, max] = G_model_actorGetDamage(attacker);
  const attackerDmg = G_utils_randInRange(min, max + 1);
  G_model_statsModifyHp(G_model_actorGetStats(victim), -attackerDmg);

  const [x, y] = G_model_actorGetPosition(victim);
  const particle = G_model_particleCreate(
    SPRITE_EFFECT_INDEX_STRIKE,
    x,
    y,
    `${attackerDmg}`
  );
  const currentRoom = G_model_worldGetCurrentRoom(world);
  G_model_roomAddParticle(currentRoom, particle);
  G_model_actorSetAttacking(attacker, true);
  G_view_playSound('strike');

  // G_model_addLog(
  //   `${G_model_actorGetName(attacker)} attacks ${G_model_actorGetName(victim)}`
  // );
  // G_model_addLog(` - ${attackerDmg} dmg!`);

  return attackerDmg;
};

const G_controller_damageScroll = (
  attacker: Actor,
  victim: Actor,
  dmgMinMax: DmgMinMax,
  sound: string,
  world: World
): number => {
  if (victim === attacker) {
    return 0;
  }

  const [dmgMin, dmgMax] = dmgMinMax;
  const dmg = G_utils_randInRange(dmgMin, dmgMax);
  G_model_statsModifyHp(G_model_actorGetStats(victim), -dmg);

  const [x, y] = G_model_actorGetPosition(victim);
  const particle = G_model_particleCreate(
    SPRITE_EFFECT_INDEX_MAG,
    x,
    y,
    `${dmg}`
  );
  const currentRoom = G_model_worldGetCurrentRoom(world);
  G_model_roomAddParticle(currentRoom, particle);
  G_model_actorSetAttacking(attacker, true);
  if (sound) {
    G_view_playSound(sound);
  }

  // G_model_addLog(` -${G_model_actorGetName(attacker)} invokes scroll`);
  // G_model_addLog(` - ${dmg} dmg!`);

  return dmg;
};
