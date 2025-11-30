import { BaseRule, type RuleContext, type RuleViolation } from '../../types/rules';

export interface CyclicDependencyConfig {
  // No additional config needed
}

/**
 * Rule that detects cyclic dependencies between files
 * Uses Tarjan's algorithm to find strongly connected components
 */
export class CyclicDependencyRule extends BaseRule {
  constructor(id: string, title: string, description: string, _config: CyclicDependencyConfig) {
    super(id, title, description);
  }

  check(ctx: RuleContext): RuleViolation[] {
    const violations: RuleViolation[] = [];

    // Build adjacency list
    const graph = new Map<string, Set<string>>();
    for (const [file] of ctx.files) {
      graph.set(file, new Set());
    }

    for (const dep of ctx.dependencies) {
      const fromSet = graph.get(dep.from);
      if (fromSet) {
        fromSet.add(dep.to);
      }
    }

    // Find strongly connected components (cycles)
    const cycles = this.findStronglyConnectedComponents(graph);

    // Report cycles with more than one node
    for (const cycle of cycles) {
      if (cycle.length > 1) {
        // Report violation for each file in the cycle
        for (const file of cycle) {
          violations.push({
            ruleId: this.id,
            severity: 'error',
            message: `File is part of a circular dependency involving ${cycle.length} files`,
            file,
            suggestion: `Break the circular dependency by refactoring. Cycle: ${cycle.join(' → ')}`,
            metadata: {
              cycle,
              cycleSize: cycle.length,
            },
          });
        }
      }
    }

    return violations;
  }

  /**
   * Find strongly connected components using Tarjan's algorithm
   */
  private findStronglyConnectedComponents(graph: Map<string, Set<string>>): string[][] {
    const index = new Map<string, number>();
    const lowlink = new Map<string, number>();
    const onStack = new Set<string>();
    const stack: string[] = [];
    const components: string[][] = [];
    let currentIndex = 0;

    const strongConnect = (node: string) => {
      index.set(node, currentIndex);
      lowlink.set(node, currentIndex);
      currentIndex++;
      stack.push(node);
      onStack.add(node);

      const neighbors = graph.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!index.has(neighbor)) {
          strongConnect(neighbor);
          lowlink.set(node, Math.min(lowlink.get(node)!, lowlink.get(neighbor)!));
        } else if (onStack.has(neighbor)) {
          lowlink.set(node, Math.min(lowlink.get(node)!, index.get(neighbor)!));
        }
      }

      if (lowlink.get(node) === index.get(node)) {
        const component: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          component.push(w);
        } while (w !== node);
        components.push(component);
      }
    };

    for (const node of graph.keys()) {
      if (!index.has(node)) {
        strongConnect(node);
      }
    }

    return components;
  }
}
