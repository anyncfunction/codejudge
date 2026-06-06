import { CheckCircle2, XCircle, AlertTriangle, Clock, Zap } from 'lucide-react';

interface SubmissionStatusProps {
  status: string;
  score: number;
}

interface StatusConfig {
  label: string;
  icon: React.ReactNode;
  className: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  accepted: {
    label: '通过',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  wrong_answer: {
    label: '答案错误',
    icon: <XCircle className="w-3.5 h-3.5" />,
    className: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
  runtime_error: {
    label: '运行错误',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    className: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  compile_error: {
    label: '编译错误',
    icon: <Zap className="w-3.5 h-3.5" />,
    className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  },
  time_limit: {
    label: '超时',
    icon: <Clock className="w-3.5 h-3.5" />,
    className: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
};

export default function SubmissionStatus({ status, score }: SubmissionStatusProps) {
  const config = STATUS_MAP[status] || {
    label: status,
    icon: null,
    className: 'bg-dark-700 text-dark-400 border-dark-600',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`badge ${config.className} gap-1`}>
        {config.icon}
        {config.label}
      </span>
      <span className="text-sm font-semibold text-primary-400">{score}分</span>
    </div>
  );
}
