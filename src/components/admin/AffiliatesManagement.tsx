import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AffiliateLink = {
  id: string;
  user_id: string;
  unique_code: string;
  clicks: number;
  conversions: number;
  user_email?: string;
};

const AffiliatesManagement = () => {
  const [affiliates, setAffiliates] = useState<AffiliateLink[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<AffiliateLink | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    user_id: "",
    unique_code: "",
    clicks: "0",
    conversions: "0",
  });

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    try {
      const { data: affiliatesData, error } = await supabase
        .from("affiliate_links")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({ title: "Error loading affiliates", variant: "destructive" });
        return;
      }

      if (affiliatesData) {
        const affiliatesWithDetails = await Promise.all(
          affiliatesData.map(async (affiliate) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", affiliate.user_id)
              .single();

            return {
              ...affiliate,
              user_email: profile?.email || "N/A",
            };
          })
        );

        setAffiliates(affiliatesWithDetails);
      }
    } catch (error) {
      console.error("Error fetching affiliates:", error);
      toast({ title: "Connection error", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const affiliateData = {
        user_id: formData.user_id,
        unique_code: formData.unique_code,
        clicks: parseInt(formData.clicks),
        conversions: parseInt(formData.conversions),
      };

      if (editingAffiliate) {
        const { error } = await supabase
          .from("affiliate_links")
          .update(affiliateData)
          .eq("id", editingAffiliate.id);

        if (error) {
          toast({ title: "Update failed", variant: "destructive" });
        } else {
          toast({ title: "Affiliate link updated successfully" });
        }
      } else {
        const { error } = await supabase.from("affiliate_links").insert(affiliateData);

        if (error) {
          toast({ title: "Creation failed", variant: "destructive" });
        } else {
          toast({ title: "Affiliate link created successfully" });
        }
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAffiliates();
    } catch (error) {
      console.error("Error saving affiliate:", error);
      toast({ title: "Connection error", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("affiliate_links").delete().eq("id", id);

      if (error) {
        toast({ title: "Delete failed", variant: "destructive" });
      } else {
        toast({ title: "Affiliate link deleted successfully" });
        fetchAffiliates();
      }
    } catch (error) {
      console.error("Error deleting affiliate:", error);
      toast({ title: "Connection error", variant: "destructive" });
    }
  };

  const handleEdit = (affiliate: AffiliateLink) => {
    setEditingAffiliate(affiliate);
    setFormData({
      user_id: affiliate.user_id,
      unique_code: affiliate.unique_code,
      clicks: affiliate.clicks.toString(),
      conversions: affiliate.conversions.toString(),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingAffiliate(null);
    setFormData({
      user_id: "",
      unique_code: "",
      clicks: "0",
      conversions: "0",
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Affiliates Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Affiliate Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAffiliate ? "Edit Affiliate Link" : "Add New Affiliate Link"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="user_id">User ID</Label>
                <Input
                  id="user_id"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unique_code">Unique Code</Label>
                <Input
                  id="unique_code"
                  value={formData.unique_code}
                  onChange={(e) => setFormData({ ...formData, unique_code: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="clicks">Clicks</Label>
                <Input
                  id="clicks"
                  type="number"
                  value={formData.clicks}
                  onChange={(e) => setFormData({ ...formData, clicks: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="conversions">Conversions</Label>
                <Input
                  id="conversions"
                  type="number"
                  value={formData.conversions}
                  onChange={(e) => setFormData({ ...formData, conversions: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingAffiliate ? "Update Affiliate Link" : "Create Affiliate Link"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Affiliate Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Email</TableHead>
                  <TableHead>Unique Code</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell className="font-medium">{affiliate.user_email}</TableCell>
                    <TableCell>{affiliate.unique_code}</TableCell>
                    <TableCell>{affiliate.clicks}</TableCell>
                    <TableCell>{affiliate.conversions}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(affiliate)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(affiliate.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliatesManagement;
