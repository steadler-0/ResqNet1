const LANGUAGES = ['English', 'Spanish', 'Hindi', 'French', 'Arabic'];

const PLACEHOLDER_INSTRUCTIONS = {
  Flood: [
    'Move to higher ground immediately. Avoid walking or driving through flood waters.',
    'Turn off utilities if instructed. Do not touch electrical equipment if wet.',
    'Monitor local alerts and evacuation routes via official channels.',
  ],
  Fire: [
    'Evacuate the area. Stay low to avoid smoke inhalation.',
    'Call emergency services. Do not re-enter burning structures.',
    'If trapped, seal doors with wet cloth and signal for help at windows.',
  ],
  Wildfire: [
    'Evacuate immediately if authorities issue orders — do not wait to see flames.',
    'Stay indoors if trapped; close windows and block vents from smoke.',
    'Wear N95 mask if available. Avoid canyons and dense vegetation when fleeing.',
  ],
  'Fire Accident': [
    'Move to a safe distance from vehicles, fuel, and chemical hazards.',
    'Do not attempt rescue in active fire — call emergency services with exact location.',
    'Assist injured only if scene is safe; watch for explosions and toxic smoke.',
  ],
  Earthquake: [
    'Drop, Cover, and Hold On. Stay away from windows and heavy objects.',
    'After shaking stops, check for injuries and hazards before moving.',
    'Expect aftershocks. Avoid damaged buildings and downed power lines.',
  ],
  'Building Collapse': [
    'Move away from the structure and falling debris. Do not enter collapsed buildings.',
    'Call rescue services with precise location. Listen for tapping from survivors.',
    'Do not use elevators or compromised stairwells; beware of aftershocks or gas leaks.',
  ],
  'Medical Emergency': [
    'Ensure scene safety. Check responsiveness and breathing.',
    'Call emergency medical services. Provide clear location details.',
    'Apply first aid only within your training. Do not move spinal injury victims.',
  ],
  Pandemic: [
    'Isolate if symptomatic; wear a mask in crowded or high-risk areas.',
    'Follow public health guidance on testing, vaccination, and quarantine.',
    'Stock essential medicines and avoid spreading illness to vulnerable groups.',
  ],
};

export default function SafetyInstructions({ emergencyType = 'Flood' }) {
  const instructions = PLACEHOLDER_INSTRUCTIONS[emergencyType] || PLACEHOLDER_INSTRUCTIONS.Flood;

  return (
    <div className="rn-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-primary">AI Safety Instructions</h3>
          <p className="text-xs text-secondary">Multilingual guidance · Placeholder module</p>
        </div>
        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
          AI Generated
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {LANGUAGES.map((lang, i) => (
          <button
            key={lang}
            type="button"
            className={`rounded-lg border px-3 py-1 text-xs transition ${
              i === 0
                ? 'border-secondary/40 bg-secondary/10 text-secondary'
                : 'border-primary/10 text-secondary hover:border-secondary/40'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {instructions.map((text, i) => (
          <li
            key={i}
            className="flex gap-3 rounded-xl border border-primary/10 bg-slate-muted px-4 py-3 text-sm text-secondary transition hover:border-secondary/30"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-secondary/30 bg-secondary/10 text-xs font-bold text-secondary">
              {i + 1}
            </span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
