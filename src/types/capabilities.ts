/**
 * Capability types for tracking code actions
 * Capabilities represent what the code is doing (networking, I/O, database, etc.)
 * Users define their own capability types in the config
 */

/**
 * A detected capability in a file
 */
export interface Capability {
  /** Type of capability (user-defined string) */
  type: string;

  /** Specific action or API being used */
  action: string;

  /** Confidence level (0-1) */
  confidence: number;

  /** Line number where detected (optional) */
  line?: number;
}

/**
 * Capability patterns for different languages
 * Maps API calls/imports to capability types
 */
export interface CapabilityPattern {
  /** Capability type this pattern detects (user-defined string) */
  type: string;

  /** Import/module names that indicate this capability */
  imports?: string[];

  /** Function/method call patterns (regex or exact match) */
  calls?: string[];

  /** Description of what this pattern detects */
  description: string;
}
