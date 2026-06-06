import { useState, useEffect } from 'react';
import { X, Code2, ListChecks, PenLine, ArrowRight } from 'lucide-react';

const STEPS = [
  { icon: <Code2 className="w-6 h-6 text-blue-400" />, title: '刷编程题', desc: '在线编写 JavaScript 或 Python 代码，实时判题反馈' },
  { icon: <ListChecks className="w-6 h-6 text-violet-400" />, title: '做选择题', desc: '从四个选项中选择正确答案，即时评分' },
  { icon: <PenLine className="w-6 h-6 text-cyan-400" />, title: '填填空题', desc: '输入答案，支持多个可接受答案匹配' },
];

export default function TutorialOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem('cj_tutorial_seen');
    if (!seen) {
      setTimeout(() => setVisible(true), 500);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('cj_tutorial_seen', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={dismiss}>
      <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">欢迎来到 CodeJudge</h2>
          <button onClick={dismiss} className="text-dark-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>

        {step === 0 && (
          <div className="text-center py-4">
            <p className="text-dark-300 mb-6">一个平台搞定三种题型</p>
            <div className="grid gap-4">
              {STEPS.map(s => (
                <div key={s.title} className="flex items-start gap-3 p-3 rounded-lg bg-dark-700/50">
                  {s.icon}
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">{s.title}</p>
                    <p className="text-dark-400 text-xs">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="py-4">
            <p className="text-dark-300 mb-4 text-center">预置账户</p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-dark-700/50">
                <p className="text-white text-sm mb-1">管理员</p>
                <p className="text-dark-400 text-xs font-mono">admin@oj.com / admin123</p>
              </div>
              <div className="p-3 rounded-lg bg-dark-700/50">
                <p className="text-white text-sm mb-1">学生</p>
                <p className="text-dark-400 text-xs font-mono">test@oj.com / test123</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-700">
          <div className="flex gap-1.5">
            {[0, 1].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full ${step === i ? 'bg-primary-500' : 'bg-dark-600'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={dismiss} className="btn-ghost text-xs px-3 py-1.5">跳过</button>
            {step < 1 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary text-xs inline-flex items-center gap-1">
                下一步 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={dismiss} className="btn-primary text-xs px-4">开始使用</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
