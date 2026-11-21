export const GRAIN_LEVELS = {
  wheat:     { label: 'WHEAT',         default: 5,  min: 0,  max: 20, defaultFlowRate: 75, minFlowRate: 10, maxFlowRate: 100 },
  chana_dal: { label: 'CHANA DAL',     default: 15, min: 10, max: 20, defaultFlowRate: 50, minFlowRate: 10, maxFlowRate: 100 },
  rice:      { label: 'RICE',          default: 10, min: 2,  max: 20, defaultFlowRate: 50, minFlowRate: 10, maxFlowRate: 100 },
  ragi:      { label: 'RAGI',          default: 5,  min: 0,  max: 20, defaultFlowRate: 50, minFlowRate: 10, maxFlowRate: 100 },
  fada:      { label: 'SPLITS (FADA)', default: 20, min: 10, max: 20, defaultFlowRate: 75, minFlowRate: 10, maxFlowRate: 100 },
  jowar:     { label: 'JOWAR',         default: 5,  min: 0,  max: 20, defaultFlowRate: 50, minFlowRate: 10, maxFlowRate: 100 },
  bajra:     { label: 'BAJRA',         default: 5,  min: 0,  max: 20, defaultFlowRate: 50, minFlowRate: 10, maxFlowRate: 100 },
  masala:    { label: 'MASALA',        default: 10, min: 2,  max: 20, defaultFlowRate: 75, minFlowRate: 10, maxFlowRate: 100 },
  others:    { label: 'OTHERS',        default: 8,  min: 0,  max: 20, defaultFlowRate: 50, minFlowRate: 10, maxFlowRate: 100 },
};

export const getGrainConfig = (id) => GRAIN_LEVELS[id] || GRAIN_LEVELS.others;