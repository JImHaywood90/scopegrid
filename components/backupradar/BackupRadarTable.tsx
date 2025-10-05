"use client";

import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { BackupRadarDevice } from "./BackupRadarDialog";
import clsx from "clsx";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useTheme } from "next-themes";

export function BackupRadarTable({ data }: { data: BackupRadarDevice[] }) {
  const [search, setSearch] = useState("");

  // 👇 Get current theme from Tailwind/next-themes
  const { resolvedTheme } = useTheme();

  // 👇 Create MUI theme that matches Tailwind mode
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: resolvedTheme === "dark" ? "dark" : "light",
        },
      }),
    [resolvedTheme]
  );

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((d) =>
      [d.deviceName, d.methodName, d.jobName, d.companyName, d.deviceType].some(
        (field) => field?.toLowerCase().includes(q)
      )
    );
  }, [data, search]);

  const columns: GridColDef<BackupRadarDevice>[] = [
    {
      field: "deviceName",
      headerName: "Device",
      flex: 1,
      minWidth: 140,
    },
    {
      field: "jobName",
      headerName: "Job Name",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "methodName",
      headerName: "Method",
      flex: 1,
      minWidth: 130,
    },
    {
      field: "deviceType",
      headerName: "Type",
      flex: 1,
      minWidth: 100,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 120,
      renderCell: ({ value }: GridRenderCellParams) => (
        <span
          className={clsx("px-2 py-0.5 text-xs rounded font-medium", {
            "bg-green-100 text-green-800": value?.name === "Success",
            "bg-yellow-100 text-yellow-800": value?.name === "Warning",
            "bg-red-100 text-red-800": value?.name === "Failed",
            "bg-gray-100 text-gray-800": ![
              "Success",
              "Warning",
              "Failed",
            ].includes(value?.name),
          })}
        >
          {value?.name || "Unknown"}
        </span>
      ),
    },
    {
      field: "lastResult",
      headerName: "Last Result",
      flex: 1,
      minWidth: 180,
      valueFormatter: (params) =>
        params ? new Date(params).toLocaleString() : "—",
    },
    {
      field: "ticketCount",
      headerName: "Tickets",
      flex: 0.5,
      minWidth: 80,
      type: "number",
    },
    {
      field: "isVerified",
      headerName: "Verified",
      flex: 0.5,
      minWidth: 100,
      renderCell: ({ value }: GridRenderCellParams) => (
        <span
          className={clsx(
            "px-2 py-0.5 text-xs rounded font-semibold",
            value ? "bg-green-600 text-white" : "bg-gray-300 text-gray-800"
          )}
        >
          {value ? "Yes" : "No"}
        </span>
      ),
    },
  ];

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="space-y-2 w-full">
        <Input
          placeholder="Search by device, method, job, company, type..."
          className="max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="h-[600px] w-full">
          <DataGrid
            rows={filteredRows}
            columns={columns}
            getRowId={(row) => row.backupId}
            autoPageSize
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            disableRowSelectionOnClick
          />
        </div>
      </div>
    </ThemeProvider>
  );
}
