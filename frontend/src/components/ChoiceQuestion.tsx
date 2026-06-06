import { Check, X } from 'lucide-react';

interface ChoiceQuestionProps {
  options: string[];
  selectedAnswer: number | null;
  onSelect: (index: number) => void;
  disabled?: boolean;
  correctAnswer?: number;
  showResult?: boolean;
}

export default function ChoiceQuestion({
  options,
  selectedAnswer,
  onSelect,
  disabled = false,
  correctAnswer,
  showResult = false,
}: ChoiceQuestionProps) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  function getOptionStyle(index: number): string {
    if (!showResult) {
      if (selectedAnswer === index) {
        return 'border-primary-500 bg-primary-500/10';
      }
      return 'border-dark-600 hover:border-dark-500';
    }

    const isCorrect = correctAnswer === index;
    const isSelected = selectedAnswer === index;

    if (isCorrect) {
      return 'border-emerald-500 bg-emerald-500/10';
    }
    if (isSelected && !isCorrect) {
      return 'border-red-500 bg-red-500/10';
    }
    return 'border-dark-600 opacity-50';
  }

  return (
    <div className="flex flex-col gap-2.5">
      {options.map((option, index) => {
        const letter = letters[index] || String(index);
        const isSelected = selectedAnswer === index;
        const isCorrect = correctAnswer === index;
        const showIcon = showResult && (isCorrect || isSelected);

        return (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(index)}
            className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-all duration-200 ${
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            } ${getOptionStyle(index)}`}
          >
            <span
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                isSelected && !showResult
                  ? 'bg-primary-500 text-white'
                  : showResult && isCorrect
                    ? 'bg-emerald-500 text-white'
                    : showResult && isSelected && !isCorrect
                      ? 'bg-red-500 text-white'
                      : 'bg-dark-700 text-dark-400'
              }`}
            >
              {letter}
            </span>
            <span className="flex-1 text-dark-200 text-sm">{option}</span>
            {showIcon && (
              <span className="flex-shrink-0">
                {isCorrect ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : isSelected && !isCorrect ? (
                  <X className="w-5 h-5 text-red-500" />
                ) : null}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
