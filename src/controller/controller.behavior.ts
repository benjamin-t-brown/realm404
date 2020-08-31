/*
global
G_controller_moveActor
G_utils_randInRage
G_model_actorGetPosition
G_model_playerGetActor
UP
DOWN
LEFT
RIGHT
UP_RIGHT
UP_LEFT
DOWN_LEFT
DOWN_RIGHT
*/

type Behavior = 0 | 1 | 2 | 3 | 4;
const G_BEHAVIOR_NONE = 0;
const G_BEHAVIOR_RAND = 1;
const G_BEHAVIOR_BOSS = 2;
const G_BEHAVIOR_SHOOT = 3;
const G_BEHAVIOR_ATTACK = 4;

type BehaviorUpdateFunc = (actor: Actor, world: World) => void;

const Behaviors: BehaviorUpdateFunc[] = [
  (actor: Actor, world: World) => {}, // none
  // (actor: Actor, world: World) => {}, // boss
  // (actor: Actor, world: World) => {}, // attack
  // (actor: Actor, world: World) => {}, // shoot
  // rand
  (actor: Actor, world: World) => {
    const getDxDy = (actor1: Actor, actor2: Actor): [number, number] => {
      const [x, y] = G_model_actorGetPosition(actor1);
      const [oX, oY] = G_model_actorGetPosition(actor2);
      return [oX - x, oY - y];
    };

    const canSeeActor = (me: Actor, other: Actor): boolean => {
      const [dX, dY] = getDxDy(me, other);
      return Math.abs(dX) < 6 && Math.abs(dY) < 6;
    };

    const getDirectionTowards = (me: Actor, other: Actor): Direction[] => {
      const [dX, dY] = getDxDy(me, other);

      if (dY === 0) {
        return dX > 0 ? [RIGHT] : [LEFT];
      } else if (dX === 0) {
        return dY > 0 ? [DOWN] : [UP];
      } else {
        if (dX > 0 && dY > 0) {
          return [DOWN_RIGHT, DOWN, RIGHT];
        } else if (dX > 0 && dY < 0) {
          return [UP_RIGHT, UP, RIGHT];
        } else if (dX < 0 && dY > 0) {
          return [DOWN_LEFT, DOWN, LEFT];
        } else {
          return [UP_LEFT, UP, LEFT];
        }
      }
    };

    // const direction = `${G_utils_randInRage(0, 10)}` as Direction;
    if (canSeeActor(actor, G_model_playerGetActor(world.player))) {
      const directions = getDirectionTowards(
        actor,
        G_model_playerGetActor(world.player)
      );
      for (let i in directions) {
        if (G_controller_moveActor(actor, directions[i], world)) {
          break;
        }
      }
    }
  },
];

const G_controller_getBehaviorUpdateFunc = (
  b: Behavior
): BehaviorUpdateFunc => {
  return Behaviors[b];
};
