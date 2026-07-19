export const RESEARCH_PARADIGMS = [
  "generative-interactive",
  "latent-predictive",
  "mllm-integrated",
];

const figureFourCalibration = {
  "generative-interactive": new Set([
    "pathdreamer", "unipi", "unisim", "gaia-1", "drivedreamer", "copilot4d",
    "muvo", "occworld", "drive-wm", "gr-1", "vidar", "genie", "manigaussian",
    "robodreamer", "ivideogpt", "vista", "driveworld", "pandora", "bevworld",
    "gamengen", "oasis", "drivedreamer4d", "genie 2", "nwm", "drema",
    "gaussianworld", "infinicube", "cosmos", "wham", "muse", "gaia-2",
    "adaworld", "aether", "uva", "unified world models", "mineworld", "worldmem",
    "hunyuan-gamecraft", "deepverse", "1x world model", "spmem", "world4drive",
    "hunyuanworld", "yume", "genie 3", "matrix-game 2.0", "marble", "pan",
    "gwm-1", "lingbot-world", "cosmos policy", "waymo world model", "dreamzero",
    "fast-wam", "gigaworld-policy", "lingbot-world-infinity",
  ]),
  "latent-predictive": new Set([
    "world models", "planet", "muzero", "c-swm", "dreamer", "dreamerpro",
    "transdreamer", "efficientzero", "daydreamer", "masked world models", "td-mpc",
    "iris", "mile", "dreamerv2", "dreamerv3", "i-jepa", "twm", "trafficbots",
    "storm", "td-mpc2", "v-jepa", "v-jepa 2", "think2drive", "diamond", "jowa",
    "dino-wm", "dino-foresight", "pldm", "dino-world", "dreamer 4", "c-jepa",
    "leworldmodel", "delta-jepa",
  ]),
  "mllm-integrated": new Set([
    "3d-vla", "worldgpt", "univla", "worldvla", "dreamvla", "rynnvla-002",
    "videovla", "vla-jepa", "motubrain", "qwen-agentworld", "cosmos 3",
    "driving with llms", "simlingo", "drivevlm", "drivemlm",
  ]),
};

// These driving systems use an (M)LLM/VLM/VLA as a perception-to-planning or
// action interface. Their papers do not learn an observable world rollout or
// latent transition dynamics, so language-embedding terminology must not
// accidentally place them in the other two Fig. 4 lineages.
const mllmActionInterfaceOnly = new Set([
  "driving with llms", "simlingo", "drivevlm", "drivemlm",
]);

// Full-text audit of every work that the broad signals initially placed in
// both the generative and latent lineages. Observable generation must expose
// a future world output (rather than an auxiliary reconstruction), while a
// latent label requires a predictive state/transition used by the system
// (rather than a codec or diffusion latent alone). These overrides adjust only
// the two audited lineages; an independently supported MLLM label is preserved.
export const FULL_TEXT_PARADIGM_AUDIT = Object.freeze({
  "uva": ["generative-interactive", "latent-predictive"],
  "bevworld": ["generative-interactive", "latent-predictive"],
  "1x world model": ["generative-interactive", "latent-predictive"],
  "iris": ["generative-interactive", "latent-predictive"],
  "dreamer 4": ["generative-interactive", "latent-predictive"],
  "navwm": ["generative-interactive", "latent-predictive"],
  "harmowam": ["generative-interactive", "latent-predictive"],
  "video prediction policy": ["generative-interactive", "latent-predictive"],
  "dome": ["generative-interactive", "latent-predictive"],
  "kairos": ["generative-interactive", "latent-predictive"],
  "safedojo": ["generative-interactive", "latent-predictive"],
  "wmreward": ["generative-interactive", "latent-predictive"],
  "phantom": ["generative-interactive", "latent-predictive"],
  "drivelaw": ["generative-interactive", "latent-predictive"],
  "foundational lidar world models": ["generative-interactive", "latent-predictive"],
  "mirage": ["generative-interactive", "latent-predictive"],

  "gaia-2": ["generative-interactive"],
  "diamond": ["generative-interactive"],
  "cosmos": ["generative-interactive"],
  "pixel-to-4d": ["generative-interactive"],
  "infinicube": ["generative-interactive"],
  "lidardm": ["generative-interactive"],

  "dreamer": ["latent-predictive"],
  "dreamerv3": ["latent-predictive"],
  "dreamerv2": ["latent-predictive"],
  "mile": ["latent-predictive"],
  "transdreamer": ["latent-predictive"],
  "masked world models": ["latent-predictive"],
  "think2drive": ["latent-predictive"],
  "ev-wm": ["latent-predictive"],
  "omega-eva": ["latent-predictive"],
  "prism": ["latent-predictive"],
  "law": ["latent-predictive"],
  "world4drive": ["latent-predictive"],
  "dreamvla": ["latent-predictive"],
  "dlwm": ["latent-predictive"],
  "dreamerpro": ["latent-predictive"],
  "c-swm": ["latent-predictive"],
  "latentdriver": ["latent-predictive"],

  // Full-text-reviewed historical additions (2025).
  "diswm": ["latent-predictive"],
  "sensei": ["latent-predictive", "mllm-integrated"],
  "lumos": ["latent-predictive"],
  "glam": ["latent-predictive"],
  "generative predictive control": ["generative-interactive"],
  "flowdreamer": ["generative-interactive"],
  "enerverse": ["generative-interactive"],
  "pin-wm": ["latent-predictive"],
  "prompting with the future": ["generative-interactive", "latent-predictive"],
  "3dflowaction": ["latent-predictive"],
  "gaf": ["generative-interactive", "latent-predictive"],
  "manigaussian++": ["generative-interactive", "latent-predictive"],
  "egoagent": ["latent-predictive"],
  "trajworld": ["latent-predictive"],
  "twister": ["latent-predictive"],
  "dcwm": ["latent-predictive"],
  "statespacediffuser": ["generative-interactive", "latent-predictive"],
  "rlvr-world": ["generative-interactive"],
  "maskgwm": ["generative-interactive"],
  "epona": ["generative-interactive", "latent-predictive"],
  "longdwm": ["generative-interactive"],
  "scenediffuser++": ["generative-interactive", "latent-predictive"],

  // Full-text-reviewed historical additions (2024).
  "eva": ["generative-interactive", "mllm-integrated"],
  "prelar": ["latent-predictive"],
  "hrssm": ["latent-predictive"],
  "worlddreamer": ["generative-interactive"],
  "irasim": ["generative-interactive"],
  "vidman": ["generative-interactive"],
  "delta-iris": ["generative-interactive", "latent-predictive"],
  "pivot-r": ["generative-interactive", "mllm-integrated"],
  "pegs": ["generative-interactive", "latent-predictive"],
  "wmp": ["latent-predictive"],
  "x-mobility": ["generative-interactive", "latent-predictive"],
  "worldcoder": ["latent-predictive", "mllm-integrated"],
  "dynamiccity": ["generative-interactive"],
  "genad (predictive model)": ["generative-interactive", "latent-predictive"],
  "drivingworld": ["generative-interactive"],
  "doe-1": ["generative-interactive", "latent-predictive"],
  "drivinggpt": ["generative-interactive", "latent-predictive"],
  "owl-1": ["generative-interactive", "latent-predictive"],
  "infinitydrive": ["generative-interactive"],
  "delphi": ["generative-interactive"],
  "drivephysica": ["generative-interactive"],

  // Full-text-reviewed historical additions (2023 and earlier).
  "harmonydream": ["latent-predictive"],
  "dynalang": ["latent-predictive"],
  "statler": ["latent-predictive", "mllm-integrated"],
  "llm-dm": ["latent-predictive", "mllm-integrated"],
  "rap": ["latent-predictive", "mllm-integrated"],
  "safedreamer": ["latent-predictive"],
  "s4wm": ["latent-predictive"],
  "apv": ["latent-predictive"],
  "iso-dream": ["latent-predictive"],
  "dreamingv2": ["latent-predictive"],
  "multi-view dreaming": ["latent-predictive"],
  "denoised mdps": ["latent-predictive"],
  "slotformer": ["generative-interactive", "latent-predictive"],
  "drivegan": ["generative-interactive", "latent-predictive"],
  "g-swm": ["generative-interactive", "latent-predictive"],
  "gamegan": ["generative-interactive", "latent-predictive"],
  "phydnet": ["generative-interactive", "latent-predictive"],
  "scalor": ["generative-interactive", "latent-predictive"],
  "op3": ["generative-interactive", "latent-predictive"],
  "o2p2": ["generative-interactive", "latent-predictive"],
  "graph networks as learnable physics engines": ["latent-predictive"],
  "svg-lp": ["generative-interactive"],
  "visual interaction networks": ["latent-predictive"],
  "sv2p": ["generative-interactive"],
  "kalman variational auto-encoder": ["generative-interactive", "latent-predictive"],
  "dvbf": ["generative-interactive", "latent-predictive"],
  "action-conditional video prediction": ["generative-interactive"],
  "embed to control": ["latent-predictive"],
});

const mllmSignals = [
  /\b(?:m?llm|vlm|vla)\b/i,
  /large (?:vision[- ]language|multimodal|language) model/i,
  /vision[- ]language(?:[- ]action)?/i,
  /multimodal language model/i,
  /language model (?:serves|acts|reasons|predicts|plans|constructs|receives|integrates)/i,
  /(?:qwen|gpt)[- ]?(?:vl|4|5|agent)/i,
];

const latentSignals = [
  /latent (?:state|dynamics|transition|world|future|rollout|trajectory|representation|space|code|token)/i,
  /predictive (?:state|representation|feature|embedding|world representation)/i,
  /(?:feature|embedding|representation)[- ]space prediction/i,
  /joint[- ]embedding predictive/i,
  /\bjepa\b/i,
  /(?:recurrent|hidden|belief) state/i,
  /state[- ]space model/i,
  /world (?:feature|token|representation)/i,
  /compact (?:predictive )?state/i,
  /action[- ]conditioned (?:transition|dynamics) model/i,
];

const generativeSignals = [
  /(?:generate|synthesize|render|forecast|predict|reconstruct)(?:s|d|ed|ing)?[^.]{0,48}(?:video|image|frame|pixel|view|scene|occupancy|point cloud|depth|lidar|geometry|observation)/i,
  /(?:video|image|pixel|occupancy|point[- ]cloud|lidar|scene|visual) (?:generation|prediction|forecasting|simulation|rollout)/i,
  /interactive (?:visual )?(?:environment|world|simulation)/i,
  /(?:world|driving|robot|game) simulator/i,
  /physics engine/i,
  /diffusion (?:model|transformer|decoder|world model)/i,
  /future (?:visual )?observations?/i,
  /scene evolution/i,
];

const representationOnlyNames = /(?:\bjepa\b|^dino-wm$|^dino-foresight$|^dino-world$)/i;

function normalizedName(value) {
  return value.toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}

function hasSignal(text, signals) {
  return signals.some((signal) => signal.test(text));
}

/**
 * The English summaries supplied here are the portal's full-text-grounded
 * curation records, not paper abstracts. Figure 4 exemplars calibrate the
 * three lineages, while the signals extend those definitions to later works.
 * The lineages are deliberately non-exclusive because many recent systems
 * combine observable generation, latent prediction, and an (M)LLM interface.
 */
export function classifyResearchParadigms(work) {
  const name = normalizedName(work.name);
  const evidence = [work.name, work.title, work.applications, work.summary?.en]
    .filter(Boolean)
    .join(". ");
  const selected = new Set();

  for (const paradigm of RESEARCH_PARADIGMS) {
    if (figureFourCalibration[paradigm].has(name)) selected.add(paradigm);
  }
  if (hasSignal(evidence, generativeSignals)) selected.add("generative-interactive");
  if (hasSignal(evidence, latentSignals)) selected.add("latent-predictive");
  if (hasSignal(evidence, mllmSignals)) selected.add("mllm-integrated");
  if (representationOnlyNames.test(name)) selected.delete("generative-interactive");
  const auditedParadigms = FULL_TEXT_PARADIGM_AUDIT[name];
  if (auditedParadigms) {
    selected.delete("generative-interactive");
    selected.delete("latent-predictive");
    for (const paradigm of auditedParadigms) selected.add(paradigm);
  }
  if (mllmActionInterfaceOnly.has(name)) {
    selected.clear();
    selected.add("mllm-integrated");
  }

  // Predictive-state is the broad fallback for structured, causal, or
  // numerical transition models that do not render an observable world and
  // do not place an (M)LLM at the world-model interface.
  if (!selected.size) selected.add("latent-predictive");
  return RESEARCH_PARADIGMS.filter((paradigm) => selected.has(paradigm));
}
