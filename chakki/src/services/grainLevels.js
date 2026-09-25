// default = table ka "Default Texture", min = table ka "Max Limit" column
export const GRAIN_LEVELS = {
  wheat:     { label: 'WHEAT',         default: 5,  min: 0,  max: 20 }, // TODO max
  chana_dal: { label: 'CHANA DAL',     default: 15, min: 10, max: 20 },
  rice:      { label: 'RICE',          default: 10, min: 2,  max: 20 },
  ragi:      { label: 'RAGI',          default: 5,  min: 0,  max: 20 },
  fada:      { label: 'SPLITS (FADA)', default: 20, min: 10, max: 20 },
  jowar:     { label: 'JOWAR',         default: 5,  min: 0,  max: 20 },
  bajra:     { label: 'BAJRA',         default: 5,  min: 0,  max: 20 },
  masala:    { label: 'MASALA',        default: 10, min: 2,  max: 20 },
  others:    { label: 'OTHERS',        default: 8,  min: 0,  max: 20 },
};

export const getGrainConfig = (id) => GRAIN_LEVELS[id] || GRAIN_LEVELS.others;