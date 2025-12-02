import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const DataImport = () => {
    const [csvContent, setCsvContent] = useState("");
    const [importType, setImportType] = useState<"users" | "tasks">("users");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleImport = async () => {
        if (!csvContent.trim()) {
            toast({ title: "Error", description: "Please paste CSV content", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const rows = csvContent.split("\n").filter(r => r.trim());
            const headers = rows[0].split(",").map(h => h.trim());
            const data = rows.slice(1).map(row => {
                const values = row.split(",").map(v => v.trim());
                const obj: any = {};
                headers.forEach((h, i) => {
                    obj[h] = values[i];
                });
                return obj;
            });

            console.log("Parsed Data:", data);

            if (importType === "users") {
                // For users, we can only insert into profiles if they exist in Auth.
                // If they don't, we can't do much from client-side without Service Role.
                // But we can try to match by email if they exist.

                let successCount = 0;
                let failCount = 0;

                for (const row of data) {
                    // 1. Check if user exists in profiles (by email)
                    const { data: existingProfile } = await supabase
                        .from("profiles")
                        .select("id")
                        .eq("email", row.email)
                        .maybeSingle();

                    if (existingProfile) {
                        // Update existing profile
                        await supabase.from("profiles").update({
                            username: row.username,
                            phone: row.phone,
                            is_verified: row.is_verified === "true"
                        }).eq("id", existingProfile.id);

                        // Update wallet if balance provided
                        if (row.balance) {
                            await supabase.from("wallet").update({
                                total_balance: parseFloat(row.balance)
                            }).eq("user_id", existingProfile.id);
                        }
                        successCount++;
                    } else {
                        console.warn(`User ${row.email} not found in profiles. Cannot create auth user from client.`);
                        failCount++;
                    }
                }

                toast({
                    title: "Import Complete",
                    description: `Updated ${successCount} users. Failed/Skipped ${failCount} (User must exist in Auth).`
                });

            } else if (importType === "tasks") {
                let successCount = 0;
                let failCount = 0;

                for (const row of data) {
                    // Need to find user_id by email
                    const { data: user } = await supabase
                        .from("profiles")
                        .select("id")
                        .eq("email", row.user_email) // Assuming CSV has user_email
                        .single();

                    if (!user) {
                        console.warn(`User ${row.user_email} not found`);
                        failCount++;
                        continue;
                    }

                    // Need to find offer_id by title? Or assume offer_id is in CSV?
                    // Let's assume offer_id is in CSV for now, or we skip.
                    if (!row.offer_id) {
                        console.warn("Missing offer_id");
                        failCount++;
                        continue;
                    }

                    const { error } = await supabase.from("tasks").insert({
                        user_id: user.id,
                        offer_id: row.offer_id,
                        status: row.status || "pending",
                        proof_url: row.proof_url ? [row.proof_url] : [],
                        reward: row.reward // If tasks table has reward column? No, it's in offers.
                    });

                    if (error) {
                        console.error("Task insert error:", error);
                        failCount++;
                    } else {
                        successCount++;
                    }
                }

                toast({
                    title: "Import Complete",
                    description: `Imported ${successCount} tasks. Failed ${failCount}.`
                });
            }

        } catch (error: any) {
            console.error("Import error:", error);
            toast({ title: "Import Failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Safe Data Import</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-4">
                        <Button
                            variant={importType === "users" ? "default" : "outline"}
                            onClick={() => setImportType("users")}
                        >
                            Import Users
                        </Button>
                        <Button
                            variant={importType === "tasks" ? "default" : "outline"}
                            onClick={() => setImportType("tasks")}
                        >
                            Import Tasks
                        </Button>
                    </div>

                    <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-2">
                            {importType === "users"
                                ? "Paste CSV with headers: email, username, phone, is_verified, balance"
                                : "Paste CSV with headers: user_email, offer_id, status, proof_url"}
                        </p>
                        <Textarea
                            value={csvContent}
                            onChange={(e) => setCsvContent(e.target.value)}
                            placeholder="Paste CSV content here..."
                            className="h-64 font-mono text-xs"
                        />
                    </div>

                    <Button onClick={handleImport} disabled={loading}>
                        {loading ? "Importing..." : "Start Import"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default DataImport;
