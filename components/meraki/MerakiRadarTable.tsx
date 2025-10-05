"use client";

import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import clsx from "clsx";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useTheme } from "next-themes";

export type MerakiDevice = {
  serial: string;
  name?: string;
  model?: string;
  status?: string;
  mac?: string;
  networkId?: string;
  networkName?: string;
  lastReportedAt?: string;
  productType?: string; // 👈 Add this
};


export function MerakiRadarTable({ data }: { data: MerakiDevice[] }) {
  const [search, setSearch] = useState("");
  const { resolvedTheme } = useTheme();

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
      [d.name, d.networkName, d.model, d.productType].some((field) =>
        field?.toLowerCase().includes(q)
      )
    );
  }, [data, search]);

  const columns: GridColDef<MerakiDevice>[] = [
    {
      field: "name",
      headerName: "Device Name",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "model",
      headerName: "Model",
      flex: 1,
      minWidth: 130,
    },
    {
      field: "productType",
      headerName: "Type",
      flex: 1,
      minWidth: 100,
    },
    {
      field: "networkName",
      headerName: "Network",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.6,
      minWidth: 100,
      renderCell: ({ value }: GridRenderCellParams) => (
        <span
          className={clsx(
            "px-2 py-0.5 text-xs rounded font-medium",
            {
              "bg-green-100 text-green-800": value === "online",
              "bg-red-100 text-red-800": value === "offline",
              "bg-yellow-100 text-yellow-800": value === "alerting",
              "bg-gray-100 text-gray-800":
                !["online", "offline", "alerting"].includes(value),
            }
          )}
        >
          {value || "Unknown"}
        </span>
      ),
    },
    {
      field: "mac",
      headerName: "MAC Address",
      flex: 1,
      minWidth: 140,
    },
  ];

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="space-y-2 w-full">
        <Input
          placeholder="Search by name, network, model, type..."
          className="max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="h-[600px] w-full">
          <DataGrid
            rows={filteredRows}
            columns={columns}
            getRowId={(row) => row.serial ?? row.mac ?? `fallback-${Math.random()}`}
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