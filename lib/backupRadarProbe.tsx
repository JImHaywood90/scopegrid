// src/lib/backupRadarProbe.ts
import axios from "axios";

export async function probeBackupRadarPresence(companyName?: string) {
  console.log("BR PROBE RUN");
  if (!companyName) return { hasResults: false };
  try {
    const res = await axios.get("/api/backups/backups", {
      params: { Size: 1, SearchByCompanyName: companyName },
      withCredentials: true,
    });
    const total = Number(res.data?.Total ?? 0);
    return { hasResults: total > 0 };
  } catch {
    return { hasResults: false };
  }
}
