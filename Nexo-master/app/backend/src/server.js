import './config/env.js';

import { app } from './app.js';
import { validateBackendConfig } from './config/validateBackendConfig.js';
import { startDashboardRealtimeHub } from './services/dashboardRealtimeHub.js';

const PORT = process.env.PORT || 3001;

try {
  const runtimeStatus = validateBackendConfig();

  app.listen(PORT, () => {
    startDashboardRealtimeHub();
    console.log(`Nexo backend running on port ${PORT}`);
    console.log(
      `[ai] requested=${runtimeStatus.requestedProvider} active=${runtimeStatus.activeProvider} ` +
      `strict=${runtimeStatus.strict} trace=${runtimeStatus.aiTraceProvider} ` +
      `researchLake=${runtimeStatus.researchLakeProvider}`
    );
  });
} catch (error) {
  console.error(error.message || error);
  process.exitCode = 1;
}
