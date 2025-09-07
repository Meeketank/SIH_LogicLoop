import { Badge } from "./ui/badge";

export type IssueStatus = 'reported' | 'acknowledged' | 'in-progress' | 'resolved';

interface StatusBadgeProps {
  status: IssueStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: IssueStatus) => {
    switch (status) {
      case 'reported':
        return { 
          label: 'Reported', 
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' 
        };
      case 'acknowledged':
        return { 
          label: 'Acknowledged', 
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' 
        };
      case 'in-progress':
        return { 
          label: 'In Progress', 
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' 
        };
      case 'resolved':
        return { 
          label: 'Resolved', 
          className: 'bg-green-100 text-green-800 hover:bg-green-100' 
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}