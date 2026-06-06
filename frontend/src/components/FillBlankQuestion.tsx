import { Check, X } from 'lucide-react';

interface FillBlankQuestionProps {
  answer: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  correctAnswer?: string[];
  userAnswer?: string;
  showResult?: boolean;
}

export default function FillBlankQuestion({
  answer,
  onChange,
  disabled = false,
  correctAnswer,
  userAnswer,
  showResult = false,
}: FillBlankQuestionProps) {
  const isCorrect = showResult && correctAnswer
    ? correctAnswer.some((a) => a.trim().toLowerCase() === (userAnswer || answer).trim().toLowerCase())
    : null;

  return (
    <div className="flex flex-col gap-2.5">
      <input
        type="text"
        className={`input ${
          showResult && isCorrect === true
            ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/50'
            : showResult && isCorrect === false
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
              : ''
        }`}
        value={answer}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="请输入你的答案..."
      />

      {showResult && correctAnswer && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {isCorrect ? (
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <X className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          <span>
            {isCorrect
              ? '回答正确！'
              : `回答错误，正确答案为：${correctAnswer.join(' 或 ')}`}
          </span>
        </div>
      )}
    </div>
  );
}
