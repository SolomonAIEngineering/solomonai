import { featureFlags } from "@internal/env/dashboard";

/**
 * Object containing feature flag configurations.
 * @typedef {Object} Features
 * @property {boolean} isAnalyticsV2Enabled - Indicates if Analytics V2 is enabled.
 * @property {boolean} isPaymentsEnabled - Indicates if Payments feature is enabled.
 * @property {boolean} isBackendEnabled - Indicates if Solomon Backend Interactions are enabled.
 * @property {boolean} isEnterpriseTierEnabled - Indicates if Enterprise Tier features are enabled.
 */
const features = {
  /** Flag for Analytics V2 feature */
  isAnalyticsV2Enabled: featureFlags.isAnalyticsV2Enabled,
  /** Flag for Payments feature */
  isPaymentsEnabled: featureFlags.isPaymentsEnabled,
  /** Flag for Solomon Backend Interactions */
  isBackendEnabled: true,
  /** Flag for Enterprise Tier features */
  isEnterpriseTierEnabled: featureFlags.isEnterpriseTierEnabled,
};

/**
 * Exports the feature flag configurations.
 * @type {Features}
 */
export default features;
