import { describe, expect, it } from 'vitest';
import { EngineSimulation } from './EngineSimulation';
import { testEngine, withTurbo } from './__fixtures__/testEngine';
import { autoSelectGear, rpmFromSpeed, speedFromRpm, tireRadiusFromSize } from './transmission';
import { buildTorqueCurve } from './curves';
import { createFuelState, completeRefuel, startRefuel, stepRefuel, stopRefuel } from './fuel';

const run = (sim: EngineSimulation, seconds: number, dt = 1 / 60) => {
  for (let t = 0; t < seconds; t += dt) sim.step(dt);
};

const started = (def = testEngine) => {
  const sim = new EngineSimulation(def);
  sim.start();
  run(sim, 4);
  return sim;
};

describe('drivetrain conversions', () => {
  const dt = testEngine.drivetrain!;
  it('converts speed to rpm and back', () => {
    for (const gear of [1, 3, 6]) {
      const rpm = rpmFromSpeed(dt, gear, 100);
      expect(speedFromRpm(dt, gear, rpm)).toBeCloseTo(100, 6);
    }
  });
  it('matches the textbook formula rpm = v / (2πr) · 60 · gear · final', () => {
    const v = 100 / 3.6;
    const expected = (v / (2 * Math.PI * dt.tireRadiusM)) * 60 * 1.0 * 3.5;
    expect(rpmFromSpeed(dt, 5, 100)).toBeCloseTo(expected, 6);
  });
  it('lower gears give more rpm at the same speed', () => {
    expect(rpmFromSpeed(dt, 1, 60)).toBeGreaterThan(rpmFromSpeed(dt, 2, 60));
  });
  it('parses tire sizes', () => {
    expect(tireRadiusFromSize('285/30 ZR20')!).toBeCloseTo(((20 * 25.4 + 2 * 85.5) / 2000) * 0.975, 6);
    expect(tireRadiusFromSize('245/40ZR18')).not.toBeNull();
    expect(tireRadiusFromSize('PAX 365/710 R540')!).toBeCloseTo(0.355 * 0.975, 6);
  });
  it('auto shift policy upshifts near the limiter at full throttle and early at light throttle', () => {
    const base = { gear: 2, idleRpm: 750, redlineRpm: 7000, revLimitRpm: 7200, speedKmh: 0 };
    const spd = (rpm: number) => speedFromRpm(dt, 2, rpm);
    expect(autoSelectGear(dt, { ...base, rpm: 6000, throttle: 1, speedKmh: spd(6000) })).toBe(2);
    expect(autoSelectGear(dt, { ...base, rpm: 7100, throttle: 1, speedKmh: spd(7100) })).toBe(3);
    expect(autoSelectGear(dt, { ...base, rpm: 3200, throttle: 0.1, speedKmh: spd(3200) })).toBe(3);
  });
});

describe('engine start, idle and limiter', () => {
  it('cranks, fires and settles at idle', () => {
    const sim = new EngineSimulation(testEngine);
    sim.start();
    run(sim, 0.5);
    expect(sim.ignition).toBe('cranking');
    expect(sim.rpm).toBeGreaterThan(100);
    expect(sim.rpm).toBeLessThan(300);
    run(sim, 8);
    expect(sim.ignition).toBe('running');
    expect(sim.rpm).toBeGreaterThan(testEngine.performance.idleRpm * 0.9);
    expect(sim.rpm).toBeLessThan(testEngine.performance.idleRpm * 1.15);
  });

  it('revs higher with more throttle in neutral', () => {
    const sim = started();
    sim.pedal = 0.1;
    run(sim, 3);
    const low = sim.rpm;
    sim.pedal = 0.2;
    run(sim, 3);
    expect(sim.rpm).toBeGreaterThan(low + 300);
  });

  it('never exceeds the rev limiter by more than a small overshoot', () => {
    const sim = started();
    sim.pedal = 1;
    let peak = 0;
    for (let i = 0; i < 600; i++) {
      sim.step(1 / 60);
      peak = Math.max(peak, sim.rpm);
    }
    expect(peak).toBeLessThan(testEngine.performance.revLimitRpm + 250);
    expect(sim.rpm).toBeGreaterThan(testEngine.performance.revLimitRpm - 600);
  });

  it('crank angle advances at rpm·6 degrees per second', () => {
    const sim = started();
    const rpm = sim.rpm;
    const a0 = sim.crankDeg;
    sim.step(0.01);
    const moved = (sim.crankDeg - a0 + 720) % 720;
    expect(moved).toBeCloseTo(rpm * 6 * 0.01, -1);
  });

  it('spins down after STOP', () => {
    const sim = started();
    sim.stop();
    run(sim, 6);
    expect(sim.rpm).toBe(0);
    expect(sim.ignition).toBe('off');
  });
});

describe('fuel', () => {
  it('consumes little at idle and much more at full load on the dyno', () => {
    const sim = started();
    sim.fuelTimeScale = 1;
    run(sim, 2);
    const idleLph = sim.snapshot().fuelFlowLph;
    expect(idleLph).toBeGreaterThan(0.3);
    expect(idleLph).toBeLessThan(6);
    sim.setMode('dyno');
    sim.dynoTargetRpm = 6500;
    sim.pedal = 1;
    run(sim, 4);
    const wotLph = sim.snapshot().fuelFlowLph;
    expect(wotLph).toBeGreaterThan(idleLph * 15);
  });

  it('the time multiplier only accelerates the fuel clock', () => {
    const a = started();
    const b = started();
    b.fuelTimeScale = 60;
    const fa = a.fuel.levelL;
    const fb = b.fuel.levelL;
    run(a, 5);
    run(b, 5);
    const usedA = fa - a.fuel.levelL;
    const usedB = fb - b.fuel.levelL;
    expect(usedB / usedA).toBeGreaterThan(50);
    expect(Math.abs(a.rpm - b.rpm)).toBeLessThan(30);
  });

  it('stalls when the tank runs dry and cannot be restarted', () => {
    const sim = started();
    sim.setFuelLevel(0.02);
    sim.fuelTimeScale = 60;
    sim.pedal = 0.3;
    run(sim, 15);
    expect(sim.fuel.levelL).toBe(0);
    expect(sim.snapshot().outOfFuel).toBe(true);
    expect(sim.ignition).toBe('off');
    sim.pedal = 1;
    run(sim, 2);
    expect(sim.rpm).toBe(0);
    sim.start();
    run(sim, 4);
    expect(sim.ignition).toBe('off');
    expect(sim.rpm).toBe(0);
  });

  it('refuels with the engine off and can run again', () => {
    const sim = started();
    sim.setFuelLevel(0);
    run(sim, 6);
    expect(sim.startRefuel()).toBe(true);
    expect(sim.ignition).toBe('off');
    expect(sim.start()).toBe(false);
    sim.completeRefuel();
    run(sim, 30);
    expect(sim.fuel.refuel).toBe('idle');
    expect(sim.fuel.levelL).toBeCloseTo(sim.fuel.capacityL, 3);
    expect(sim.start()).toBe(true);
    run(sim, 4);
    expect(sim.ignition).toBe('running');
  });

  it('refuel state machine connects, pumps, stops and disconnects', () => {
    const f = createFuelState(80, 10);
    expect(startRefuel(f)).toBe(true);
    expect(f.refuel).toBe('connecting');
    for (let i = 0; i < 200; i++) stepRefuel(f, 0.05, 1);
    expect(f.refuel).toBe('fueling');
    expect(f.pumpedL).toBeGreaterThan(1);
    stopRefuel(f);
    expect(f.refuel).toBe('disconnecting');
    for (let i = 0; i < 40; i++) stepRefuel(f, 0.05, 1);
    expect(f.refuel).toBe('idle');
    expect(f.levelL).toBeGreaterThan(10);
    expect(f.levelL).toBeLessThan(80);
    completeRefuel(f);
    for (let i = 0; i < 400; i++) stepRefuel(f, 0.05, 1);
    expect(f.levelL).toBe(80);
  });
});

describe('drive mode', () => {
  const driving = () => {
    const sim = started();
    sim.setMode('drive');
    sim.gearMode = 'auto';
    sim.driveControl = 'cruise';
    return sim;
  };

  it('keeps rpm consistent with speed, gear, final drive and tire radius', () => {
    const sim = driving();
    sim.targetSpeedKmh = 120;
    run(sim, 40);
    const t = sim.snapshot();
    expect(t.speedKmh).toBeGreaterThan(110);
    expect(t.speedKmh).toBeLessThan(130);
    expect(t.clutchLocked).toBe(true);
    const expected = rpmFromSpeed(testEngine.drivetrain!, t.gear, t.speedKmh);
    expect(t.rpm).toBeCloseTo(expected, -1);
  });

  it('changes rpm when shifting gears manually', () => {
    const sim = driving();
    sim.gearMode = 'manual';
    sim.targetSpeedKmh = 80;
    run(sim, 25);
    // in manual mode the car stays in first gear until we shift
    const before = sim.snapshot();
    sim.requestGear(before.gear + 1);
    run(sim, 3);
    const after = sim.snapshot();
    expect(after.gear).toBe(before.gear + 1);
    expect(after.rpm).toBeLessThan(before.rpm);
  });

  it('refuses a downshift that would over-rev the engine', () => {
    const sim = driving();
    sim.targetSpeedKmh = 200;
    run(sim, 60);
    sim.gearMode = 'manual';
    expect(sim.requestGear(1)).toBe(false);
  });

  it('respects the electronic top speed limiter', () => {
    const sim = driving();
    sim.driveControl = 'pedal';
    sim.pedal = 1;
    run(sim, 120);
    expect(sim.snapshot().speedKmh).toBeLessThan(testEngine.vehicleSpec!.topSpeedKmh + 3);
  });

  it('speed is zero in neutral mode', () => {
    const sim = started();
    sim.pedal = 1;
    run(sim, 2);
    expect(sim.snapshot().speedKmh).toBe(0);
  });
});

describe('forced induction', () => {
  it('a naturally aspirated engine never builds boost', () => {
    const sim = started();
    sim.setMode('dyno');
    sim.pedal = 1;
    sim.dynoTargetRpm = 5000;
    run(sim, 4);
    expect(sim.boost).toBe(0);
    expect(sim.turboShaft.length).toBe(0);
  });

  it('a turbo engine builds boost under load with lag, and spins its turbines', () => {
    const def = withTurbo(testEngine);
    const sim = started(def);
    sim.setMode('dyno');
    sim.dynoTargetRpm = 5000;
    sim.pedal = 1;
    sim.step(1 / 60);
    const early = sim.boost;
    run(sim, 5);
    expect(sim.boost).toBeGreaterThan(early + 0.5);
    expect(sim.turboShaft.every((s) => s > 100000)).toBe(true);
  });

  it('turbo engine reaches the published torque at steady full boost', () => {
    const def = withTurbo(testEngine);
    const sim = started(def);
    sim.setMode('dyno');
    sim.dynoTargetRpm = 4500;
    sim.pedal = 1;
    run(sim, 8);
    const curve = buildTorqueCurve(def);
    expect(sim.torqueBrake).toBeCloseTo(curve(sim.rpm), -1);
  });
});

describe('dyno sweep', () => {
  it('records a power/torque curve close to the published peak values', () => {
    const sim = started();
    sim.setMode('dyno');
    sim.startDynoSweep();
    run(sim, 40);
    expect(sim.dynoRuns.length).toBe(1);
    const samples = sim.dynoRuns[0];
    expect(samples.length).toBeGreaterThan(40);
    const peakT = Math.max(...samples.map((s) => s.torqueNm));
    const peakP = Math.max(...samples.map((s) => s.powerKw));
    expect(peakT).toBeGreaterThan(testEngine.performance.torqueNm * 0.93);
    expect(peakT).toBeLessThan(testEngine.performance.torqueNm * 1.05);
    expect(peakP).toBeGreaterThan(testEngine.performance.powerKw * 0.93);
    expect(peakP).toBeLessThan(testEngine.performance.powerKw * 1.05);
  });
});
