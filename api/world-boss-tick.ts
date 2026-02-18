import { createClient } from '@supabase/supabase-js'

const WORLD_BOSS_DURATION = 12 * 60 * 60
const WORLD_BOSS_REWARD = 500

const getAttackFromState = (state: unknown) => {
  if (!state || typeof state !== 'object') return 1
  const player = (state as { player?: { baseAttack?: number } }).player
  const baseAttack = Math.max(1, Math.round(player?.baseAttack ?? 1))
  const equipment =
    (state as { equipment?: Record<string, { bonuses?: { attack?: number } } | null> }).equipment ?? {}
  let bonus = 0
  for (const key of Object.keys(equipment)) {
    const item = equipment[key]
    if (item?.bonuses?.attack) bonus += Number(item.bonuses.attack) || 0
  }
  return Math.max(1, Math.round(baseAttack + bonus))
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    res.status(500).json({ error: 'Missing Supabase env' })
    return
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const now = new Date()

  const { data: existing, error: loadError } = await supabase.from('world_boss').select('*').eq('id', 1).maybeSingle()
  if (loadError) {
    res.status(500).json({ error: 'Failed to load boss' })
    return
  }

  let boss = existing
  if (!boss) {
    const cycleStart = now.toISOString()
    const cycleEnd = new Date(now.getTime() + WORLD_BOSS_DURATION * 1000).toISOString()
    const { data } = await supabase
      .from('world_boss')
      .upsert(
        {
          id: 1,
          cycle_start: cycleStart,
          cycle_end: cycleEnd,
          prize_pool: WORLD_BOSS_REWARD,
          last_cycle_start: null,
          last_cycle_end: null,
          last_prize_pool: null,
          updated_at: now.toISOString(),
        },
        { onConflict: 'id' },
      )
      .select()
      .single()
    boss = data ?? null
  }

  if (!boss) {
    res.status(500).json({ error: 'Boss row missing' })
    return
  }

  const cycleEndTime = new Date(boss.cycle_end).getTime()
  if (cycleEndTime <= now.getTime()) {
    const newStart = now.toISOString()
    const newEnd = new Date(now.getTime() + WORLD_BOSS_DURATION * 1000).toISOString()
    const { data } = await supabase
      .from('world_boss')
      .update({
        cycle_start: newStart,
        cycle_end: newEnd,
        prize_pool: WORLD_BOSS_REWARD,
        last_cycle_start: boss.cycle_start,
        last_cycle_end: boss.cycle_end,
        last_prize_pool: boss.prize_pool,
        updated_at: now.toISOString(),
      })
      .eq('id', 1)
      .select()
      .single()
    boss = data ?? boss
  }

  const effectiveNow = Math.min(now.getTime(), new Date(boss.cycle_end).getTime())

  const { data: participants, error: participantsError } = await supabase
    .from('world_boss_participants')
    .select('wallet, damage, joined, updated_at')
    .eq('cycle_start', boss.cycle_start)
    .eq('joined', true)

  if (participantsError || !participants || participants.length === 0) {
    await supabase.from('world_boss').update({ updated_at: now.toISOString() }).eq('id', 1)
    res.status(200).json({ updated: 0 })
    return
  }

  const wallets = participants.map((row) => row.wallet)
  const { data: profiles } = await supabase.from('profiles').select('wallet, state').in('wallet', wallets)

  const profileMap = new Map<string, unknown>()
  for (const profile of profiles ?? []) {
    profileMap.set(profile.wallet, profile.state as unknown)
  }

  let updated = 0
  for (const participant of participants) {
    const lastUpdate = new Date(participant.updated_at ?? boss.cycle_start).getTime()
    const deltaSeconds = Math.max(0, Math.floor((effectiveNow - lastUpdate) / 1000))
    if (deltaSeconds <= 0) continue

    const attack = getAttackFromState(profileMap.get(participant.wallet))
    const damageGain = Math.max(1, Math.round(attack * deltaSeconds))
    const nextDamage = Number(participant.damage) + damageGain

    await supabase
      .from('world_boss_participants')
      .update({ damage: nextDamage, updated_at: new Date(effectiveNow).toISOString() })
      .eq('wallet', participant.wallet)
      .eq('cycle_start', boss.cycle_start)

    updated += 1
  }

  await supabase.from('world_boss').update({ updated_at: now.toISOString() }).eq('id', 1)

  res.status(200).json({ updated })
}
