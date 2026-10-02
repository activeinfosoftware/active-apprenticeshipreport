import { MsalProvider, AuthenticatedTemplate, useMsal, UnauthenticatedTemplate } from '@azure/msal-react';
import { Container} from 'react-bootstrap';
import { PageLayout } from './components/PageLayout';
import { loginRequest } from './authConfig';

import React, { useEffect, useState, useCallback } from "react";
import "@/App.css";
import "leaflet/dist/leaflet.css";
import { Activity, BarChart3, Map as MapIcon, TableIcon, Menu, Database, GitCompareArrows } from "lucide-react";
import { fetchAnalytics, fetchMap } from "@/lib/api";
import { FilterSidebar } from "@/components/dashboard/FilterSidebar";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { TimeSeriesChart, RouteBarChart, LevelDonut, RegionBarChart } from "@/components/dashboard/Charts";
import { RankingCharts } from "@/components/dashboard/RankingCharts";
import { FastestGrowth } from "@/components/dashboard/FastestGrowth";
import { ComparePanel } from "@/components/dashboard/ComparePanel";
import { UkMap } from "@/components/dashboard/UkMap";
import { DataTable } from "@/components/dashboard/DataTable";
import { SyncButton } from "@/components/dashboard/SyncButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

const EMPTY = {
  date_from: null, date_to: null, course_routes: [], apprenticeship_levels: [],
  course_types: [], itl1: [], itl2: [], itl3: [],
  provider_types: [],
  employers: [], providers: [], standards: [],
  employers_mode: "include", providers_mode: "include", standards_mode: "include", status: null, search: null,
};

//function App() {
const ApprenticeReport = () => {

  const [filters, setFilters] = useState(EMPTY);
  const [analytics, setAnalytics] = useState(null);
  const [mapData, setMapData] = useState({ points: [], total: 0, returned: 0 });
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [tab, setTab] = useState("analytics");

  useEffect(() => {
    setLoading(true);
    fetchAnalytics(filters).then(setAnalytics).finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    setMapLoading(true);
    fetchMap(filters).then(setMapData).finally(() => setMapLoading(false));
  }, [filters]);

  const sidebar = (
    <FilterSidebar filters={filters} setFilters={setFilters} resultCount={analytics?.kpis?.total_vacancies} />
  );

  const reloadAll = useCallback(() => setFilters((f) => ({ ...f })), []);

  return (
    <div className="min-h-screen bg-[#0B101D] text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-[600] border-b border-[#2A3A56] bg-[#131C31]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#38BDF8]/15 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
              <Activity className="h-5 w-5 text-[#38BDF8]" />
            </div>
            <div>
              <h1 className="font-heading text-base font-bold tracking-tight text-white sm:text-lg">
                UK Apprenticeships Analytics
              </h1>
              <p className="hidden text-[11px] text-slate-500 sm:block">
                Live vacancy intelligence · sourced from Azure MySQL
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-[#2A3A56] bg-[#0E1626] px-3 py-1.5 font-mono-data text-[11px] text-slate-400 sm:flex">
              <Database className="h-3 w-3 text-[#10B981]" />
              {analytics?.kpis?.total_vacancies?.toLocaleString() ?? "…"} records
            </span>
          {/*   <SyncButton onSynced={reloadAll}  */}
            {/* Mobile filter trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button data-testid="mobile-filter-btn" variant="outline" size="sm"
                  className="border-[#2A3A56] bg-[#0E1626] text-slate-200 hover:bg-[#1E2D4D] lg:hidden">
                  <Menu className="h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 border-[#2A3A56] bg-[#0E1626] p-0">
                {sidebar}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1700px]">
        {/* Desktop sidebar */}
        <div className="sticky top-[61px] hidden h-[calc(100vh-61px)] w-80 flex-shrink-0 border-r border-[#2A3A56] lg:block">
          {sidebar}
        </div>

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <KpiCards kpis={analytics?.kpis} loading={loading} />

          <Tabs value={tab} onValueChange={setTab} className="mt-6">
            <TabsList className="grid w-full max-w-xl grid-cols-4 border border-[#2A3A56] bg-[#131C31]">
              <TabsTrigger data-testid="tab-analytics" value="analytics"
                className="gap-1.5 data-[state=active]:bg-[#38BDF8]/15 data-[state=active]:text-[#38BDF8]">
                <BarChart3 className="h-4 w-4" /> Analytics
              </TabsTrigger>
              <TabsTrigger data-testid="tab-compare" value="compare"
                className="gap-1.5 data-[state=active]:bg-[#8B5CF6]/15 data-[state=active]:text-[#8B5CF6]">
                <GitCompareArrows className="h-4 w-4" /> Compare
              </TabsTrigger>
              <TabsTrigger data-testid="tab-map" value="map"
                className="gap-1.5 data-[state=active]:bg-[#38BDF8]/15 data-[state=active]:text-[#38BDF8]">
                <MapIcon className="h-4 w-4" /> Map
              </TabsTrigger>
              <TabsTrigger data-testid="tab-table" value="table"
                className="gap-1.5 data-[state=active]:bg-[#38BDF8]/15 data-[state=active]:text-[#38BDF8]">
                <TableIcon className="h-4 w-4" /> Records
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="mt-6 space-y-4 sm:space-y-6">
              <TimeSeriesChart data={analytics?.timeseries || []} />
              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                <RouteBarChart data={analytics?.by_route || []} />
                <LevelDonut data={analytics?.by_level || []} />
              </div>
              <RegionBarChart data={analytics?.by_region || []} />
              <RankingCharts topEmployers={analytics?.top_employers || []} topProviders={analytics?.top_providers || []} />
              <FastestGrowth filters={filters} setFilters={setFilters} />
            </TabsContent>

            <TabsContent value="compare" className="mt-6">
              <ComparePanel />
            </TabsContent>

            <TabsContent value="map" className="mt-6">
              <UkMap
                points={mapData.points}
                total={mapData.total_with_geo}
                returned={mapData.returned}
                loading={mapLoading}
                choropleth={analytics?.choropleth || []}
                filters={filters}
                setFilters={setFilters}
              />
            </TabsContent>

            <TabsContent value="table" className="mt-6">
              <DataTable filters={filters} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}

const MainContent = () => {
    /**
     * useMsal is hook that returns the PublicClientApplication instance,
     * that tells you what msal is currently doing. For more, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/hooks.md
     */
    const { instance } = useMsal();
    const activeAccount = instance.getActiveAccount();

    const handleRedirect = () => {
        instance
            .loginRedirect({
                ...loginRequest,
                prompt: 'create',
            })
            .catch((error) => console.log(error));
    };
    return (
        <div className="App">
            <AuthenticatedTemplate>
                {activeAccount ? (
                    <Container>
                       <div className="data-area-div">
                            <ApprenticeReport />
                        </div>  
                    </Container>
                ) : null}
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <Button className="signInButton" onClick={handleRedirect} variant="primary">
                    Sign In
                </Button>
            </UnauthenticatedTemplate>
        </div>
    );
};


const App = ({ instance }) => {
    return (
        <MsalProvider instance={instance}>
            <PageLayout>
                <MainContent />
            </PageLayout>
        </MsalProvider>
    );
};
export default App;
