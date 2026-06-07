import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon = <Inbox className="w-16 h-16" />,
  title = '暂无数据',
  message,
  action,
}: EmptyStateProps) {
  return (
    <div className="card p-12 text-center">
      <div className="flex justify-center text-dark-500 mb-4">
        {icon}
      </div>
      <p className="text-gray-300 text-lg font-medium mb-2">{title}</p>
      {message && <p className="text-dark-400 text-sm mb-4">{message}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
