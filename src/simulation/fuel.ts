/**
 * Fuel tank + refuelling state machine.
 *
 * Consumption is integrated from the engine's fuel mass flow (see
 * engineModel.ts). The "simulation speed" multiplier only accelerates the
 * fuel clock (consumption and pump flow) so a full tank can be observed in a
 * reasonable time; it never changes rpm, speed or anything else.
 */

export type RefuelPhase = 'idle' | 'connecting' | 'fueling' | 'disconnecting';

export const PUMP_FLOW_LPS = 0.8; // ~48 L/min, typical fuel-station dispenser
export const CONNECT_TIME_S = 1.4;
export const DISCONNECT_TIME_S = 1.1;
/** Below this level fuel pick-up becomes intermittent (misfires). */
export const STARVATION_L = 0.25;

export interface FuelState {
  capacityL: number;
  levelL: number;
  refuel: RefuelPhase;
  refuelTimer: number;
  pumpedL: number;
  /** When true the pump keeps going until the tank is full. */
  fillToFull: boolean;
  /** Pump speed multiplier ("COMPLETAR TANQUE" fast-forward). */
  pumpBoost: number;
}

export function createFuelState(capacityL: number, level = capacityL * 0.78): FuelState {
  return {
    capacityL,
    levelL: Math.min(capacityL, Math.max(0, level)),
    refuel: 'idle',
    refuelTimer: 0,
    pumpedL: 0,
    fillToFull: false,
    pumpBoost: 1,
  };
}

export function consume(state: FuelState, litres: number): void {
  state.levelL = Math.max(0, state.levelL - litres);
}

export function startRefuel(state: FuelState): boolean {
  if (state.refuel !== 'idle' || state.levelL >= state.capacityL - 1e-6) return false;
  state.refuel = 'connecting';
  state.refuelTimer = CONNECT_TIME_S;
  state.pumpedL = 0;
  state.fillToFull = true;
  state.pumpBoost = 1;
  return true;
}

/** Stops the pump; the nozzle is then removed. */
export function stopRefuel(state: FuelState): void {
  if (state.refuel === 'connecting' || state.refuel === 'fueling') {
    state.refuel = 'disconnecting';
    state.refuelTimer = DISCONNECT_TIME_S;
  }
}

/** Fills the tank completely (starting the sequence if needed) at an accelerated pump rate. */
export function completeRefuel(state: FuelState): void {
  if (state.refuel === 'idle') startRefuel(state);
  state.fillToFull = true;
  state.pumpBoost = 8;
}

/**
 * Advances the refuel animation/state.
 * @param dt wall/simulation seconds (animation timing)
 * @param fuelTimeScale fuel clock multiplier
 */
export function stepRefuel(state: FuelState, dt: number, fuelTimeScale: number): void {
  switch (state.refuel) {
    case 'connecting':
      state.refuelTimer -= dt;
      if (state.refuelTimer <= 0) state.refuel = 'fueling';
      break;
    case 'fueling': {
      const room = state.capacityL - state.levelL;
      const add = Math.min(room, PUMP_FLOW_LPS * fuelTimeScale * state.pumpBoost * dt);
      state.levelL += add;
      state.pumpedL += add;
      if (state.capacityL - state.levelL < 1e-4) {
        state.levelL = state.capacityL;
        state.refuel = 'disconnecting';
        state.refuelTimer = DISCONNECT_TIME_S;
      }
      break;
    }
    case 'disconnecting':
      state.refuelTimer -= dt;
      if (state.refuelTimer <= 0) {
        state.refuel = 'idle';
        state.pumpBoost = 1;
      }
      break;
    default:
      break;
  }
}

export const fuelFraction = (s: FuelState) => (s.capacityL > 0 ? s.levelL / s.capacityL : 0);
