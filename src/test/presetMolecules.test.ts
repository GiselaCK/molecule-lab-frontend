import { describe, expect, it } from 'vitest';
import { presetMolecules } from '@/data/presetMolecules';
import { VALENCE } from '@/lib/moleculeEngine';

function formulaCounts(formula: string): Record<string, number> {
  const counts: Record<string, number> = {};
  const pattern = /([A-Z][a-z]?)(\d*)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(formula)) !== null) {
    const [, symbol, rawCount] = match;
    counts[symbol] = (counts[symbol] ?? 0) + (rawCount ? Number(rawCount) : 1);
  }

  return counts;
}

describe('preset molecules', () => {
  it('match their declared formulas and satisfy neutral valence rules', () => {
    for (const molecule of presetMolecules) {
      const atomIds = new Set(molecule.atoms.map((atom) => atom.id));
      const observedFormula = molecule.atoms.reduce<Record<string, number>>((acc, atom) => {
        acc[atom.symbol] = (acc[atom.symbol] ?? 0) + 1;
        return acc;
      }, {});
      const observedValence = Object.fromEntries(
        molecule.atoms.map((atom) => [atom.id, 0])
      ) as Record<string, number>;

      expect(atomIds.size, `${molecule.name}: atom ids must be unique`).toBe(molecule.atoms.length);
      expect(observedFormula, `${molecule.name}: formula mismatch`).toEqual(formulaCounts(molecule.formula));

      for (const bond of molecule.bonds) {
        expect(atomIds.has(bond.from), `${molecule.name}: missing atom ${bond.from}`).toBe(true);
        expect(atomIds.has(bond.to), `${molecule.name}: missing atom ${bond.to}`).toBe(true);
        expect([1, 2, 3], `${molecule.name}: invalid bond order`).toContain(bond.order);
        observedValence[bond.from] += bond.order;
        observedValence[bond.to] += bond.order;
      }

      for (const atom of molecule.atoms) {
        expect(
          observedValence[atom.id],
          `${molecule.name}: ${atom.id} (${atom.symbol}) has wrong valence`
        ).toBe(VALENCE[atom.symbol]);
      }
    }
  });
});
