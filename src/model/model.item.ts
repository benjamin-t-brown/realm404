type ItemStats = {
  getDmg?: (user: Actor) => DmgMinMax;
  onUse?: (user: Actor) => Promise<boolean>; // return true if the item was used, false if not
  onAcq?: () => boolean; // return true to keep item, false to discard
};

// sprite_index, name, stats, sellAmount
type Item = [number, string, ItemStats, number];
type ItemWithAmount = [Item, number];
type GenericItem = Item | ItemWithAmount;

const G_model_itemGetName = (item: Item): string => {
  return item[1];
};
const G_model_itemGetSprite = (item: Item): string => {
  return 'misc_' + item[0];
};

const G_model_itemGetBaseItem = (itemObj: GenericItem): Item => {
  if (itemObj.length === 2) {
    return itemObj[0];
  } else {
    return itemObj;
  }
};

const G_model_itemGetAmount = (itemObj: GenericItem): number => {
  if (itemObj.length === 2) {
    return itemObj[1];
  } else {
    return 1;
  }
};

const G_model_itemModifyAmount = (
  itemObj: GenericItem,
  mod: number
): GenericItem | null => {
  if (itemObj.length === 2) {
    let amt = itemObj[1] + mod;
    if (amt < 0) {
      amt = 0;
    }
    itemObj[1] = amt;
    return amt ? itemObj : null;
  } else {
    if (mod > 0) {
      return [itemObj as Item, 1 + mod];
    } else {
      return null;
    }
  }
};

const G_model_itemGetSellAmount = (itemObj: GenericItem): number => {
  const item = G_model_itemGetBaseItem(itemObj);
  return item[3];
};

const G_model_itemIsUsable = (itemObj: GenericItem): boolean => {
  return !!G_model_itemGetOnUse(itemObj);
};
const G_model_itemGetOnUse = (
  itemObj: GenericItem
): ((user: Actor) => Promise<boolean>) | undefined => {
  const item = G_model_itemGetBaseItem(itemObj);
  const meta = item[2];
  return meta.onUse;
};
const G_model_itemInvokeOnAcquire = (itemObj: GenericItem): boolean => {
  const item = G_model_itemGetBaseItem(itemObj);
  const meta = item[2];
  const func = meta.onAcq;
  if (func) {
    return func();
  }
  return true;
};

const G_model_itemCanBeEquipped = (itemObj: GenericItem): boolean => {
  const item = G_model_itemGetBaseItem(itemObj);
  const meta = item[2];
  return !!meta.getDmg;
};

const G_model_itemGetDamage = (item: Item, user: Actor): DmgMinMax => {
  const meta = item[2];
  if (meta.getDmg) {
    return meta.getDmg(user);
  } else {
    return [0, 0];
  }
};
