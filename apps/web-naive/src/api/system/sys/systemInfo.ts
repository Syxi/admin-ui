import { requestClient } from '#/api/request';

export interface DiskInfo {
  name: string;
  mountPoint: string;
  totalSpace: number;
  usedSpace: number;
  freeSpace: number;
}

export interface SystemInfoVO {
  osName: string;
  osVersion: string;
  osArch: string;
  cpuLoad: number;
  totalMemory: number;
  usedMemory: number;
  freeMemory: number;
  disks: DiskInfo[];
}

export async function getSystemInfo() {
  return requestClient.get<SystemInfoVO>('/systemInfo');
}
