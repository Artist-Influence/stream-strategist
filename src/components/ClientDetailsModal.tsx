import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, X, Trash2, Calendar, DollarSign } from 'lucide-react';
import { useUpdateClient, useClientCredits, useAddClientCredit } from '@/hooks/useClients';
import { useCampaignsForClient, useUnassignedCampaigns, useAssignCampaignToClient, useUnassignCampaignFromClient } from '@/hooks/useCampaigns';
import { Client } from '@/types';
import { format } from 'date-fns';

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientDetailsModal({ client, isOpen, onClose }: ClientDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Partial<Client>>({});
  const [newEmail, setNewEmail] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');

  const updateClient = useUpdateClient();
  const addCredit = useAddClientCredit();
  const assignCampaign = useAssignCampaignToClient();
  const unassignCampaign = useUnassignCampaignFromClient();

  const { data: clientCredits = [] } = useClientCredits(client?.id || '');
  const { data: clientCampaigns = [] } = useCampaignsForClient(client?.id || '');
  const { data: unassignedCampaigns = [] } = useUnassignedCampaigns();

  const handleEdit = () => {
    setIsEditing(true);
    setEditedClient({
      name: client?.name,
      emails: [...(client?.emails || [])],
      notes: client?.notes,
    });
  };

  const handleSave = async () => {
    if (!client || !editedClient.name) return;
    
    try {
      await updateClient.mutateAsync({
        id: client.id,
        ...editedClient,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedClient({});
  };

  const addEmail = () => {
    if (!newEmail || !editedClient.emails) return;
    if (editedClient.emails.length >= 5) return;
    
    setEditedClient({
      ...editedClient,
      emails: [...editedClient.emails, newEmail],
    });
    setNewEmail('');
  };

  const removeEmail = (index: number) => {
    if (!editedClient.emails) return;
    setEditedClient({
      ...editedClient,
      emails: editedClient.emails.filter((_, i) => i !== index),
    });
  };

  const handleAddCredit = async () => {
    if (!client || !creditAmount) return;
    
    try {
      await addCredit.mutateAsync({
        client_id: client.id,
        amount: parseInt(creditAmount),
        reason: creditReason || null,
      });
      setCreditAmount('');
      setCreditReason('');
    } catch (error) {
      console.error('Error adding credit:', error);
    }
  };

  const handleAssignCampaign = async () => {
    if (!client || !selectedCampaign) return;
    
    try {
      await assignCampaign.mutateAsync({
        campaignId: selectedCampaign,
        clientId: client.id,
      });
      setSelectedCampaign('');
    } catch (error) {
      console.error('Error assigning campaign:', error);
    }
  };

  const handleUnassignCampaign = async (campaignId: string) => {
    if (!client) return;
    
    try {
      await unassignCampaign.mutateAsync({
        campaignId,
        clientId: client.id,
      });
    } catch (error) {
      console.error('Error unassigning campaign:', error);
    }
  };

  if (!client) return null;

  const displayClient = isEditing ? { ...client, ...editedClient } : client;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{displayClient.name}</span>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={handleEdit} variant="outline" size="sm">
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave} 
                    size="sm"
                    disabled={updateClient.isPending}
                  >
                    Save
                  </Button>
                  <Button 
                    onClick={handleCancel} 
                    variant="outline" 
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Client Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client-name">Client Name</Label>
                {isEditing ? (
                  <Input
                    id="client-name"
                    value={editedClient.name || ''}
                    onChange={(e) => setEditedClient({ ...editedClient, name: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{displayClient.name}</p>
                )}
              </div>
              
              <div>
                <Label>Credit Balance</Label>
                <p className="text-sm font-semibold text-green-600">
                  {displayClient.credit_balance || 0} credits
                </p>
              </div>
            </div>

            <div>
              <Label>Email Addresses</Label>
              <div className="space-y-2">
                {displayClient.emails?.map((email, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary">{email}</Badge>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEmail(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {isEditing && (editedClient.emails?.length || 0) < 5 && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add email address"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      type="email"
                    />
                    <Button type="button" onClick={addEmail} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="client-notes">Notes</Label>
              {isEditing ? (
                <Textarea
                  id="client-notes"
                  value={editedClient.notes || ''}
                  onChange={(e) => setEditedClient({ ...editedClient, notes: e.target.value })}
                  placeholder="Add notes about this client..."
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {displayClient.notes || 'No notes available'}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Credit Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Credit Management</h3>
            
            <div className="flex gap-2">
              <Input
                placeholder="Credit amount"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                type="number"
                className="w-32"
              />
              <Input
                placeholder="Reason (optional)"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleAddCredit}
                disabled={!creditAmount || addCredit.isPending}
                size="sm"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Add Credit
              </Button>
            </div>

            {clientCredits.length > 0 && (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientCredits.slice(0, 5).map((credit) => (
                      <TableRow key={credit.id}>
                        <TableCell>
                          {format(new Date(credit.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className={credit.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                          {credit.amount > 0 ? '+' : ''}{credit.amount}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {credit.reason || 'No reason specified'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <Separator />

          {/* Campaign Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Campaigns ({clientCampaigns.length})</h3>
              
              {unassignedCampaigns.length > 0 && (
                <div className="flex gap-2">
                  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedCampaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleAssignCampaign}
                    disabled={!selectedCampaign || assignCampaign.isPending}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                </div>
              )}
            </div>

            {clientCampaigns.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(campaign.start_date), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>${campaign.budget?.toLocaleString()}</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Unassign Campaign</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to unassign "{campaign.name}" from this client?
                                  The campaign will remain in the system but won't be associated with any client.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleUnassignCampaign(campaign.id)}>
                                  Unassign
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground">No campaigns assigned to this client.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}