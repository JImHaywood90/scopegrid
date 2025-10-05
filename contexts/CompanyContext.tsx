// src/contexts/CompanyContext.tsx
"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";

export interface CompanyContextType {
  companyId?: number;
  identifier?: string;
  name?: string;
  domain?: string;
  tenantId?: string;
  backupRadar?: { hasResults?: boolean };
  setCompanyContext: (patch: Partial<CompanyContextType>) => void;
  resetCompanyContext: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [companyId, setCompanyId] = useState<number | undefined>();
  const [identifier, setIdentifier] = useState<string | undefined>();
  const [name, setName] = useState<string | undefined>();
  const [domain, setDomain] = useState<string | undefined>();
  const [tenantId, setTenantId] = useState<string | undefined>();
  const [backupRadar, setBackupRadar] = useState<
    { hasResults?: boolean } | undefined
  >();

  // IMPORTANT: update even when value is undefined if the key exists in the patch.
  const setCompanyContext = (patch: Partial<CompanyContextType>) => {
    if ("companyId" in patch) setCompanyId(patch.companyId);
    if ("identifier" in patch) setIdentifier(patch.identifier);
    if ("name" in patch) setName(patch.name);
    if ("domain" in patch) setDomain(patch.domain);
    if ("tenantId" in patch) setTenantId(patch.tenantId);
    if ("backupRadar" in patch) setBackupRadar(patch.backupRadar);
  };

  const resetCompanyContext = () => {
    setCompanyId(undefined);
    setIdentifier(undefined);
    setName(undefined);
    setDomain(undefined);
    setTenantId(undefined);
    setBackupRadar(undefined);
  };

  return (
    <CompanyContext.Provider
      value={{
        companyId,
        identifier,
        name,
        domain,
        tenantId,
        backupRadar,
        setCompanyContext,
        resetCompanyContext,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompanyContext = () => {
  const ctx = useContext(CompanyContext);
  if (!ctx)
    throw new Error("useCompanyContext must be used within CompanyProvider");
  return ctx;
};