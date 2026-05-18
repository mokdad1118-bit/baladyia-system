import { syncDaraaMunicipalities } from "./sync-municipalities";

syncDaraaMunicipalities().catch((e) => {
  console.error(e);
  process.exit(1);
});
