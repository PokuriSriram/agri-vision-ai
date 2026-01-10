import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  BarChart3,
  Camera,
  CheckCircle2,
  Landmark,
  Leaf,
  TrendingUp,
  AlertTriangle,
  Clock,
  Target,
  Sprout,
  History,
  Upload,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

type DetectionRecord = {
  weeds_detected: boolean;
  weed_count: number | null;
  confidence_score: number | null;
  created_at: string;
  processing_time_ms: number | null;
};

interface FarmerDashboardProps {
  onOpen: (tab: string) => void;
  onBack: () => void;
}

export function FarmerDashboard({ onOpen, onBack }: FarmerDashboardProps) {
  const { t } = useLanguage();
  const [records, setRecords] = useState<DetectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("detection_results")
          .select("weeds_detected, weed_count, confidence_score, created_at, processing_time_ms")
          .order("created_at", { ascending: false })
          .limit(500);

        if (error) throw error;
        if (!mounted) return;
        setRecords((data as DetectionRecord[]) ?? []);
      } catch {
        if (mounted) setRecords([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalScans = records.length;
    const cleanScans = records.filter((r) => !r.weeds_detected).length;
    const weedScans = totalScans - cleanScans;
    const totalWeedsDetected = records.reduce((acc, r) => acc + (r.weed_count ?? 0), 0);
    const avgConfidence =
      records.length > 0
        ? records.reduce((acc, r) => acc + (r.confidence_score ?? 0), 0) / records.length
        : 0;
    const avgProcessingTime =
      records.length > 0
        ? records.reduce((acc, r) => acc + (r.processing_time_ms ?? 0), 0) / records.length
        : 0;

    // Calculate improvement: clean scans percentage
    const cleanPercent = totalScans > 0 ? Math.round((cleanScans / totalScans) * 100) : 0;

    // Recent trend: last 10 scans vs previous 10
    const recent10 = records.slice(0, 10);
    const prev10 = records.slice(10, 20);
    const recentClean = recent10.filter((r) => !r.weeds_detected).length;
    const prevClean = prev10.filter((r) => !r.weeds_detected).length;
    const trendUp = prev10.length > 0 ? recentClean > prevClean : false;
    const trendLabel =
      prev10.length === 0
        ? t("notEnoughData") || "Not enough data"
        : trendUp
        ? t("improving") || "Improving"
        : t("needsAttention") || "Needs attention";

    const lastScanAt = records[0]?.created_at ?? null;

    return {
      totalScans,
      cleanScans,
      weedScans,
      totalWeedsDetected,
      avgConfidence: Math.round(avgConfidence * 100),
      avgProcessingTime: Math.round(avgProcessingTime),
      cleanPercent,
      trendUp,
      trendLabel,
      lastScanAt,
    };
  }, [records, t]);

  const lastScanLabel = useMemo(() => {
    if (!stats.lastScanAt) return t("noHistory") || "No history";
    const d = new Date(stats.lastScanAt);
    return d.toLocaleString();
  }, [stats.lastScanAt, t]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="lg" onClick={onBack} className="h-12 px-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t("back")}
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-hero flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t("dashboard") || "Farmer Dashboard"}</h2>
            <p className="text-sm text-muted-foreground">
              {t("dashboardAnalyticsDesc") || "See your farm's weed detection progress"}
            </p>
          </div>
        </div>
      </div>

      {/* Improvement Summary */}
      <Card className="p-6 glass-card bg-gradient-to-br from-success/10 to-primary/5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-success" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">{t("fieldHealth") || "Field Health Score"}</h3>
            <p className="text-sm text-muted-foreground">
              {t("cleanScansPercent") || "Percentage of scans with no weeds"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-success">{loading ? "…" : `${stats.cleanPercent}%`}</p>
            <p className="text-sm text-muted-foreground">{t("clean") || "clean"}</p>
          </div>
        </div>
        <Progress value={stats.cleanPercent} className="h-3" />
        <div className="flex items-center gap-2 mt-3">
          {stats.trendUp ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-warning" />
          )}
          <span className={`text-sm font-medium ${stats.trendUp ? "text-success" : "text-warning"}`}>
            {stats.trendLabel}
          </span>
          <span className="text-xs text-muted-foreground">
            ({t("basedOnRecent") || "based on recent scans"})
          </span>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 glass-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("totalScans") || "Total scans"}</p>
              <p className="text-2xl font-bold">{loading ? "…" : stats.totalScans}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 glass-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("cleanFields") || "Clean scans"}</p>
              <p className="text-2xl font-bold">{loading ? "…" : stats.cleanScans}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 glass-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("weedsFound") || "Weeds found"}</p>
              <p className="text-2xl font-bold">{loading ? "…" : stats.totalWeedsDetected}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 glass-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center">
              <Clock className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("avgSpeed") || "Avg speed"}</p>
              <p className="text-2xl font-bold">{loading ? "…" : `${stats.avgProcessingTime}ms`}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Last Scan Info */}
      <Card className="p-5 glass-card">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">{t("lastScan") || "Last scan"}</p>
            <p className="font-semibold">{loading ? "…" : lastScanLabel}</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold mb-3">{t("quickActions") || "Quick Actions"}</h3>
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
