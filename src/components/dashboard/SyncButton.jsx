import React, { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Loader2, CircleAlert, CircleCheck } from "lucide-react";
import { Button } from "../ui/button";
import { runSync, fetchStatus } from "../../lib/api";
import { toast } from "sonner";

const relTime = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export const SyncButton = ({ onSynced }) => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [errored, setErrored] = useState(false);
  const poll = useRef(null);

  const applyStatus = useCallback((s) => {
    const meta = s?.meta || {};
    setLastSync(meta.last_sync || null);
    setErrored(meta.status === "error");
    return s;
  }, []);

  const stopPolling = useCallback(() => {
    if (poll.current) clearInterval(poll.current);
    poll.current = null;
  }, []);

  useEffect(() => {
    fetchStatus().then((s) => {
      applyStatus(s);
      if (s?.syncing) startPolling();
    });
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPolling = useCallback(() => {
    setSyncing(true);
    stopPolling();
    poll.current = setInterval(async () => {
      try {
        const s = await fetchStatus();
        applyStatus(s);
        if (!s?.syncing) {
          stopPolling();
          setSyncing(false);
          if (s?.meta?.status === "error") {
            toast.error("Sync failed", { description: s.meta.error || "Could not reach Azure MySQL" });
          } else {
            toast.success("Data refreshed from Azure", {
              description: `${(s?.count || 0).toLocaleString()} vacancies loaded`,
            });
            onSynced?.();
          }
        }
      } catch (e) {
        stopPolling();
        setSyncing(false);
      }
    }, 3000);
  }, [applyStatus, stopPolling, onSynced]);

  const handleSync = async () => {
    if (syncing) return;
    setErrored(false);
    try {
      const res = await runSync();
      toast.info("Syncing from Azure MySQL…", { description: "This can take a minute." });
      startPolling();
    } catch (e) {
      toast.error("Could not start sync");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {lastSync && !syncing && (
        <span className="hidden font-mono-data text-[10px] text-slate-500 md:inline" data-testid="sync-last-time">
          synced {relTime(lastSync)}
        </span>
      )}
      <Button
        data-testid="sync-azure-btn"
        onClick={handleSync}
        disabled={syncing}
        size="sm"
        className={`gap-1.5 border font-medium transition-colors ${
          errored
            ? "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
            : "border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8] hover:bg-[#38BDF8]/20"
        }`}
      >
        {syncing ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Syncing…
          </>
        ) : errored ? (
          <>
            <CircleAlert className="h-3.5 w-3.5" /> Retry sync
          </>
        ) : (
          <>
            <RefreshCw className="h-3.5 w-3.5" /> Sync from Azure
          </>
        )}
      </Button>
    </div>
  );
};
