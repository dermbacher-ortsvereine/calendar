import { useSyncExternalStore } from "react";

const keinAbo = () => () => {};

/**
 * false beim Server-Rendern und während der Hydrierung, danach true.
 * Damit bleiben Seiten statisch (CDN-Cache), und URL- bzw. Login-abhängige Teile kommen erst im Browser dazu.
 */
export function useImBrowser(): boolean {
  return useSyncExternalStore(
    keinAbo,
    () => true,
    () => false,
  );
}
