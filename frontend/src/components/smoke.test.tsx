import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ScenarioManager } from './scenario/ScenarioManager';
import { SectorModules } from './calculator/SectorModules';
import { HarvestPlan } from './harvest-plan/HarvestPlan';
import { GoalSeekModal } from './goalseek/GoalSeekModal';

// Mock Jotai to prevent warning logs
vi.mock('jotai', async (importOriginal) => {
  const original = await importOriginal<typeof import('jotai')>();
  return {
    ...original,
    useAtom: vi.fn((atomVal) => [atomVal.init || null, vi.fn()]),
    useAtomValue: vi.fn((atomVal) => atomVal.init || []),
  };
});

describe('Component Smoke Tests', () => {
  it('renders ScenarioManager without crashing', () => {
    const { container } = render(
      <ScenarioManager
        variables={[]}
        onLoadScenario={vi.fn()}
        currentScenario={null}
        onStatusChange={vi.fn()}
        anoSafra={2026}
        setAnoSafra={vi.fn()}
        mesReferencia="Abril"
        setMesReferencia={vi.fn()}
        onSaveNew={vi.fn().mockResolvedValue(undefined)}
        saving={false}
        onSaveActive={vi.fn().mockResolvedValue(undefined)}
        savingActive={false}
        hasUnsavedChanges={false}
        years={[]}
        months={[]}
      />
    );
    expect(container).toBeDefined();
  });

  it('renders SectorModules without crashing', () => {
    const { container } = render(
      <SectorModules
        activeSector="MOAGEM"
        variables={[]}
        results={{}}
        isLocked={false}
        onEditVariable={vi.fn()}
        onAddVariable={vi.fn()}
        activeStatusFilter="all"
        setActiveStatusFilter={vi.fn()}
      />
    );
    expect(container).toBeDefined();
  });

  it('renders HarvestPlan without crashing', () => {
    const { container } = render(
      <HarvestPlan
        sectors={[]}
      />
    );
    expect(container).toBeDefined();
  });

  it('renders GoalSeekModal without crashing', () => {
    const { container } = render(
      <GoalSeekModal
        isOpen={true}
        onClose={vi.fn()}
        variables={[]}
        onApplyOptimalValue={vi.fn()}
      />
    );
    expect(container).toBeDefined();
  });
});
