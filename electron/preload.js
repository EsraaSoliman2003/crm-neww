import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("crmDesktop", {
  platform: process.platform,
});
