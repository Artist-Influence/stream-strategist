import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  
  const variants = {
    'Active': 'bg-green-500/10 text-green-400 border-green-500/30',
    'Draft': 'bg-orange-500/10 text-orange-400 border-orange-500/30', 
    'Paused': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    'Completed': 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  };
  
  return (
    <Badge className={`${variants[normalizedStatus as keyof typeof variants] || variants['Draft']} border`}>
      {normalizedStatus}
    </Badge>
  );
}