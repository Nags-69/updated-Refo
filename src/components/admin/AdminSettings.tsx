import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    payoutCycle: "weekly",
    commissionRate: "10",
    themeColor: "#2563EB",
  });

  const handleSave = () => {
    toast({ title: "Settings saved successfully" });
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Settings</h2>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payout Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="payoutCycle">Payout Cycle</Label>
              <select
                id="payoutCycle"
                value={settings.payoutCycle}
                onChange={(e) =>
                  setSettings({ ...settings, payoutCycle: e.target.value })
                }
                className="w-full h-10 px-3 rounded-md border border-input bg-background mt-2"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commission Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                value={settings.commissionRate}
                onChange={(e) =>
                  setSettings({ ...settings, commissionRate: e.target.value })
                }
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="themeColor">Primary Color</Label>
              <div className="flex gap-3 mt-2">
                <Input
                  id="themeColor"
                  type="color"
                  value={settings.themeColor}
                  onChange={(e) =>
                    setSettings({ ...settings, themeColor: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={settings.themeColor}
                  onChange={(e) =>
                    setSettings({ ...settings, themeColor: e.target.value })
                  }
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full">
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
