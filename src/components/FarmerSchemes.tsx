import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BadgeCheck, FileText, HandCoins, Landmark, PhoneCall, ShieldCheck } from "lucide-react";

interface FarmerSchemesProps {
  onBack: () => void;
}

const schemes = [
  {
    id: "pm-kisan",
    icon: HandCoins,
    titleKey: "schemePMKISANTitle" as const,
    descKey: "schemePMKISANDesc" as const,
    howKey: "schemeHowToApplySimple" as const,
  },
  {
    id: "pmfby",
    icon: ShieldCheck,
    titleKey: "schemePMFBYTitle" as const,
    descKey: "schemePMFBYDesc" as const,
    howKey: "schemeHowToApplyInsurance" as const,
  },
  {
    id: "kcc",
    icon: BadgeCheck,
    titleKey: "schemeKCCTitle" as const,
    descKey: "schemeKCCDesc" as const,
    howKey: "schemeHowToApplyBank" as const,
  },
  {
    id: "soil-health",
    icon: FileText,
    titleKey: "schemeSoilHealthTitle" as const,
    descKey: "schemeSoilHealthDesc" as const,
    howKey: "schemeHowToApplySoil" as const,
  },
];

export function FarmerSchemes({ onBack }: FarmerSchemesProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="lg" onClick={onBack} className="h-12 px-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t("back")}
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
            <Landmark className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t("schemes") || "Farmer Schemes"}</h2>
            <p className="text-sm text-muted-foreground">{t("schemesDesc") || "Useful schemes and simple steps to use them"}</p>
          </div>
        </div>
      </div>

      <Card className="p-5 glass-card">
        <div className="flex items-start gap-3">
          <PhoneCall className="w-6 h-6 text-primary mt-0.5" />
          <div>
            <p className="font-semibold">{t("schemesTipTitle") || "Tip"}</p>
            <p className="text-sm text-muted-foreground">
              {t("schemesTipDesc") ||
                "Take your Aadhaar, bank passbook, land/tenant proof (if available), and a phone number. Ask your local agriculture office / CSC / bank for the latest eligibility."}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {schemes.map((s) => (
          <Card key={s.id} className="p-6 glass-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">{t(s.titleKey as any)}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t(s.descKey as any)}</p>
                <div className="mt-4 p-4 rounded-xl bg-muted/50">
                  <p className="text-sm font-semibold mb-1">{t("howToUse") || "How to use"}</p>
                  <p className="text-sm text-muted-foreground">{t(s.howKey as any)}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 glass-card">
        <p className="text-sm text-muted-foreground">
          {t("schemesDisclaimer") ||
            "Note: Scheme rules change over time. Always confirm the latest process with your local agriculture department/CSC/bank."}
        </p>
      </Card>
    </div>
  );
}
