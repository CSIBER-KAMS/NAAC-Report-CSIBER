import type { Criterion, KeyIndicator, Metric, PartASection } from './types';
import { extendedProfile } from './extendedProfile';
import { criterion1 } from './criterion1';
import { criterion2 } from './criterion2';
import { criterion3 } from './criterion3';
import { criterion4 } from './criterion4';
import { criterion5 } from './criterion5';
import { criterion6 } from './criterion6';
import { criterion7 } from './criterion7';
import { partASections } from './partA';

/** Extended Profile (number 0) first, then Criteria I–VII. */
export const allCriteria: Criterion[] = [
  extendedProfile,
  criterion1,
  criterion2,
  criterion3,
  criterion4,
  criterion5,
  criterion6,
  criterion7,
];

export { partASections };

export function getCriterion(n: number): Criterion | undefined {
  return allCriteria.find((c) => c.number === n);
}

export interface MetricLookup {
  criterion: Criterion;
  keyIndicator: KeyIndicator;
  metric: Metric;
}

const metricIndex = new Map<string, MetricLookup>();
for (const criterion of allCriteria) {
  for (const keyIndicator of criterion.keyIndicators) {
    for (const metric of keyIndicator.metrics) {
      metricIndex.set(metric.id, { criterion, keyIndicator, metric });
    }
  }
}

export function getMetric(id: string): MetricLookup | undefined {
  return metricIndex.get(id);
}

export function allMetrics(): MetricLookup[] {
  return Array.from(metricIndex.values());
}
