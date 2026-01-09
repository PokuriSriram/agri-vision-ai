import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Grid3X3, Route, Sprout, Settings2, FileJson, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface PlantingConfig {
  crop: string;
  rowSpacing: number;
  plantSpacing: number;
  plantingDepth: number;
  fieldWidth: number;
  fieldLength: number;
}

interface SmartPlantingPlannerProps {
  onBack: () => void;
}

const CROP_PRESETS: Record<string, { rowSpacing: number; plantSpacing: number; plantingDepth: number }> = {
  rice: { rowSpacing: 20, plantSpacing: 20, plantingDepth: 3 },
  maize: { rowSpacing: 60, plantSpacing: 25, plantingDepth: 5 },
  cotton: { rowSpacing: 90, plantSpacing: 45, plantingDepth: 4 },
  tomato: { rowSpacing: 60, plantSpacing: 45, plantingDepth: 2 },
  groundnut: { rowSpacing: 30, plantSpacing: 10, plantingDepth: 5 },
  wheat: { rowSpacing: 22, plantSpacing: 5, plantingDepth: 4 },
  sugarcane: { rowSpacing: 120, plantSpacing: 60, plantingDepth: 8 },
  potato: { rowSpacing: 60, plantSpacing: 25, plantingDepth: 10 },
  custom: { rowSpacing: 50, plantSpacing: 30, plantingDepth: 5 },
};

export function SmartPlantingPlanner({ onBack }: SmartPlantingPlannerProps) {
  const { t } = useLanguage();
  const [config, setConfig] = useState<PlantingConfig>({
    crop: 'maize',
    rowSpacing: 60,
    plantSpacing: 25,
    plantingDepth: 5,
    fieldWidth: 500,
    fieldLength: 800,
  });

  const handleCropChange = (crop: string) => {
    const preset = CROP_PRESETS[crop];
    setConfig(prev => ({
      ...prev,
      crop,
      rowSpacing: preset.rowSpacing,
      plantSpacing: preset.plantSpacing,
      plantingDepth: preset.plantingDepth,
    }));
  };

  const gridData = useMemo(() => {
    const rows = Math.floor(config.fieldWidth / config.rowSpacing);
    const plantsPerRow = Math.floor(config.fieldLength / config.plantSpacing);
    const totalPlants = rows * plantsPerRow;
    
    const robotPath: { x: number; y: number }[] = [];
    for (let row = 0; row < rows; row++) {
      if (row % 2 === 0) {
        for (let plant = 0; plant < plantsPerRow; plant++) {
          robotPath.push({
            x: row * config.rowSpacing,
            y: plant * config.plantSpacing,
          });
        }
      } else {
        for (let plant = plantsPerRow - 1; plant >= 0; plant--) {
          robotPath.push({
            x: row * config.rowSpacing,
            y: plant * config.plantSpacing,
          });
        }
      }
    }

    return { rows, plantsPerRow, totalPlants, robotPath };
  }, [config]);

  const exportJSON = () => {
    const data = {
      crop: config.crop,
      row_spacing_cm: config.rowSpacing,
      plant_spacing_cm: config.plantSpacing,
      planting_depth_cm: config.plantingDepth,
      field_width_cm: config.fieldWidth,
      field_length_cm: config.fieldLength,
      total_rows: gridData.rows,
      plants_per_row: gridData.plantsPerRow,
      total_plants: gridData.totalPlants,
      robot_path: gridData.robotPath.map((p, i) => ({
        sequence: i + 1,
        x_cm: p.x,
        y_cm: p.y,
        action: "plant",
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planting-plan-${config.crop}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('exportSuccess') || 'Exported successfully!');
  };

  const exportCSV = () => {
    const headers = ['Sequence', 'X (cm)', 'Y (cm)', 'Action', 'Crop', 'Depth (cm)'];
    const rows = gridData.robotPath.map((p, i) => [
      i + 1,
      p.x,
      p.y,
      'plant',
      config.crop,
      config.plantingDepth,
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planting-plan-${config.crop}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('exportSuccess') || 'Exported successfully!');
  };

  // Calculate visual grid (limited for performance)
  const maxVisualRows = Math.min(gridData.rows, 20);
  const maxVisualPlants = Math.min(gridData.plantsPerRow, 30);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="lg" onClick={onBack} className="h-12 px-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('back')}
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sprout className="w-7 h-7 text-primary" />
            {t('smartPlantingPlanner') || 'Smart Planting Planner'}
          </h2>
          <p className="text-muted-foreground text-sm">{t('plannerDesc') || 'Plan your crop planting for autonomous robots'}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card className="p-6 glass-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            {t('configuration') || 'Configuration'}
          </h3>
          
          <div className="space-y-5">
            {/* Crop Selection */}
            <div className="space-y-2">
              <Label className="text-base font-medium">{t('selectCrop') || 'Select Crop'}</Label>
              <Select value={config.crop} onValueChange={handleCropChange}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rice">🌾 {t('rice') || 'Rice'} (20×20 cm)</SelectItem>
                  <SelectItem value="maize">🌽 {t('maize') || 'Maize'} (60×25 cm)</SelectItem>
                  <SelectItem value="cotton">🌿 {t('cotton') || 'Cotton'} (90×45 cm)</SelectItem>
                  <SelectItem value="tomato">🍅 {t('tomato') || 'Tomato'} (60×45 cm)</SelectItem>
                  <SelectItem value="groundnut">🥜 {t('groundnut') || 'Groundnut'} (30×10 cm)</SelectItem>
                  <SelectItem value="wheat">🌾 {t('wheat') || 'Wheat'} (22×5 cm)</SelectItem>
                  <SelectItem value="sugarcane">🎍 {t('sugarcane') || 'Sugarcane'} (120×60 cm)</SelectItem>
                  <SelectItem value="potato">🥔 {t('potato') || 'Potato'} (60×25 cm)</SelectItem>
                  <SelectItem value="custom">⚙️ {t('custom') || 'Custom'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Spacing Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('rowSpacing') || 'Row Spacing (cm)'}</Label>
                <Input
                  type="number"
                  value={config.rowSpacing}
                  onChange={(e) => setConfig(prev => ({ ...prev, rowSpacing: Number(e.target.value) }))}
                  className="h-12 text-lg"
                  min={5}
                  max={200}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('plantSpacing') || 'Plant Spacing (cm)'}</Label>
                <Input
                  type="number"
                  value={config.plantSpacing}
                  onChange={(e) => setConfig(prev => ({ ...prev, plantSpacing: Number(e.target.value) }))}
                  className="h-12 text-lg"
                  min={5}
                  max={200}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('plantingDepth') || 'Planting Depth (cm)'}</Label>
                <Input
                  type="number"
                  value={config.plantingDepth}
                  onChange={(e) => setConfig(prev => ({ ...prev, plantingDepth: Number(e.target.value) }))}
                  className="h-12 text-lg"
                  min={1}
                  max={30}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('fieldWidth') || 'Field Width (cm)'}</Label>
                <Input
                  type="number"
                  value={config.fieldWidth}
                  onChange={(e) => setConfig(prev => ({ ...prev, fieldWidth: Number(e.target.value) }))}
                  className="h-12 text-lg"
                  min={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">{t('fieldLength') || 'Field Length (cm)'}</Label>
              <Input
                type="number"
                value={config.fieldLength}
                onChange={(e) => setConfig(prev => ({ ...prev, fieldLength: Number(e.target.value) }))}
                className="h-12 text-lg"
                min={100}
              />
            </div>
          </div>
        </Card>

        {/* Stats Panel */}
        <Card className="p-6 glass-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            {t('plantingSummary') || 'Planting Summary'}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-primary/10 text-center">
              <p className="text-3xl font-bold text-primary">{gridData.rows}</p>
              <p className="text-sm text-muted-foreground">{t('totalRows') || 'Total Rows'}</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/10 text-center">
              <p className="text-3xl font-bold text-secondary">{gridData.plantsPerRow}</p>
              <p className="text-sm text-muted-foreground">{t('plantsPerRow') || 'Plants/Row'}</p>
            </div>
            <div className="p-4 rounded-xl bg-success/10 text-center col-span-2">
              <p className="text-4xl font-bold text-success">{gridData.totalPlants.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{t('totalPlants') || 'Total Plants'}</p>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-3">
            <Button onClick={exportJSON} className="flex-1 h-12 text-base bg-gradient-hero">
              <FileJson className="w-5 h-5 mr-2" />
              {t('exportJSON') || 'Export JSON'}
            </Button>
            <Button onClick={exportCSV} variant="outline" className="flex-1 h-12 text-base">
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              {t('exportCSV') || 'Export CSV'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Visual Grid */}
      <Card className="p-6 glass-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Route className="w-5 h-5" />
          {t('visualPlantingGrid') || 'Visual Planting Grid & Robot Path'}
        </h3>
        
        <div className="relative bg-gradient-to-br from-amber-50 to-green-50 dark:from-amber-950/30 dark:to-green-950/30 rounded-xl p-4 overflow-auto">
          <div 
            className="relative mx-auto"
            style={{ 
              width: `${Math.min(maxVisualRows * 24, 480)}px`,
              height: `${Math.min(maxVisualPlants * 16, 400)}px`,
            }}
          >
            {/* Grid lines */}
            {Array.from({ length: maxVisualRows + 1 }).map((_, i) => (
              <div
                key={`row-${i}`}
                className="absolute w-full border-t border-primary/20"
                style={{ top: `${(i / maxVisualRows) * 100}%` }}
              />
            ))}
            {Array.from({ length: maxVisualPlants + 1 }).map((_, i) => (
              <div
                key={`col-${i}`}
                className="absolute h-full border-l border-primary/20"
                style={{ left: `${(i / maxVisualPlants) * 100}%` }}
              />
            ))}

            {/* Plants */}
            {Array.from({ length: maxVisualRows }).map((_, row) =>
              Array.from({ length: maxVisualPlants }).map((_, plant) => (
                <div
                  key={`${row}-${plant}`}
                  className="absolute w-3 h-3 bg-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-sm"
                  style={{
                    left: `${((row + 0.5) / maxVisualRows) * 100}%`,
                    top: `${((plant + 0.5) / maxVisualPlants) * 100}%`,
                  }}
                />
              ))
            )}

            {/* Robot path (simplified) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {Array.from({ length: maxVisualRows }).map((_, row) => (
                <line
                  key={`path-${row}`}
                  x1={`${((row + 0.5) / maxVisualRows) * 100}%`}
                  y1={row % 2 === 0 ? '0%' : '100%'}
                  x2={`${((row + 0.5) / maxVisualRows) * 100}%`}
                  y2={row % 2 === 0 ? '100%' : '0%'}
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  opacity="0.5"
                />
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>{t('plantPosition') || 'Plant Position'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 border-t-2 border-dashed border-primary" />
              <span>{t('robotPath') || 'Robot Path'}</span>
            </div>
          </div>
        </div>

        {gridData.rows > maxVisualRows || gridData.plantsPerRow > maxVisualPlants ? (
          <p className="text-center text-sm text-muted-foreground mt-3">
            {t('gridPreview') || 'Showing preview (actual grid is larger)'}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
