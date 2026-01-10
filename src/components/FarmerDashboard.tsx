import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Camera, Sprout, Upload, Landmark, History } from "lucide-react";

type Summary = {
  totalScans: number;
  weedsDetectedScans: number;
  lastScanAt: string | null;
};

interface FarmerDashboardProps {
  onOpen: (tab: string) => void;
}

export function FarmerDashboard({ onOpen }: FarmerDashboardProps) {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<Summary>({
    totalScans: 0,
    weedsDetectedScans: 0,
    lastScanAt: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("detection_results")
          .select("weeds_detected, created_at")
          .order("created_at", { ascending: false })
          .limit(200);

        if (error) throw error;
        if (!mounted) return;

        const totalScans = data?.length ?? 0;
        const weedsDetectedScans = (data ?? []).filter((r) => r.weeds_detected).length;
        const lastScanAt = data?.[0]?.created_at ?? null;

        setSummary({ totalScans, weedsDetectedScans, lastScanAt });
      } catch {
        // Silent fail: dashboard still usable without stats.
        if (mounted) setSummary({ totalScans: 0, weedsDetectedScans: 0, lastScanAt: null });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const lastScanLabel = useMemo(() => {
    if (!summary.lastScanAt) return t("noHistory") || "No history";
    const d = new Date(summary.lastScanAt);
    return d.toLocaleString();
  }, [summary.lastScanAt, t]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-hero flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{t("dashboard") || "Farmer Dashboard"}</h2>
          <p className="text-sm text-muted-foreground">{t("dashboardDesc") || "Quick actions and your recent scanning summary"}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 glass-card">
          <p className="text-sm text-muted-foreground">{t("totalScans") || "Total scans"}</p>
          <p className="text-3xl font-bold mt-1">{loading ? "…" : summary.totalScans}</p>
        </Card>
        <Card className="p-5 glass-card">
          <p className="text-sm text-muted-foreground">{t("weedsDetected") || "Weeds detected"}</p>
          <p className="text-3xl font-bold mt-1">{loading ? "…" : summary.weedsDetectedScans}</p>
        </Card>
        <Card className="p-5 glass-card">
          <p className="text-sm text-muted-foreground">{t("lastScan") || "Last scan"}</p>
          <p className="text-sm font-semibold mt-2 leading-snug">{loading ? "…" : lastScanLabel}</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Button onClick={() => onOpen("live")} size="lg" className="h-16 text-lg bg-gradient-hero justify-start px-6">
          <Camera className="w-6 h-6 mr-3" />
          {t("liveDetection") || "Live Detection"}
        </Button>
        <Button onClick={() => onOpen("image")} size="lg" className="h-16 text-lg justify-start px-6" variant="secondary">
          <Upload className="w-6 h-6 mr-3" />
          {t("uploadImage") || "Upload Image"}
        </Button>
        <Button onClick={() => onOpen("planner")} size="lg" className="h-16 text-lg justify-start px-6" variant="outline">
          <Sprout className="w-6 h-6 mr-3" />
          {t("planner") || "Planner"}
        </Button>
        <Button onClick={() => onOpen("schemes")} size="lg" className="h-16 text-lg justify-start px-6" variant="outline">
          <Landmark className="w-6 h-6 mr-3" />
          {t("schemes") || "Schemes"}
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Button onClick={() => onOpen("video")} size="lg" className="h-14 text-base" variant="outline">
          <Upload className="w-5 h-5 mr-2" />
          {t("uploadVideo") || "Upload Video"}
        </Button>
        <Button onClick={() => onOpen("history")} size="lg" className="h-14 text-base" variant="outline">
          <History className="w-5 h-5 mr-2" />
          {t("history") || "History"}
        </Button>
      </div>
    </div>
  );
}
