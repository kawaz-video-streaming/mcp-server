import { createKawazMcpConfig } from "./config";
import { KawazMcpSystem } from "./services/system";

const main = async () => {
  const config = createKawazMcpConfig();
  const system = new KawazMcpSystem(config);
  await system.start();
};

main().catch((err: unknown) => {
  process.stderr.write(`Error in main: ${err}\n`);
  process.exit(1);
});
