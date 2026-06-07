import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import type { Problem } from '../types';
import MarkdownRenderer from '../components/MarkdownRenderer';

interface TestCase {
  input: string;
  expected_output: string;
}

const TYPE_OPTIONS = [
  { label: '编程题', value: 'programming' },
  { label: '选择题', value: 'choice' },
  { label: '填空题', value: 'fill_blank' },
];

const DIFFICULTY_OPTIONS = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
];

export default function AdminProblemForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>('programming');
  const [difficulty, setDifficulty] = useState<string>('easy');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Programming
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '', expected_output: '' },
  ]);

  // Choice
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);

  // Fill blank
  const [acceptableAnswers, setAcceptableAnswers] = useState<string[]>(['']);
  const [solution, setSolution] = useState('');

  /* ---- Fetch problem for edit ---- */
  const fetchProblem = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.problems.get(Number(id));
      const p: Problem = res;
      setTitle(p.title);
      setDescription(p.description);
      setType(p.type);
      setDifficulty(p.difficulty);

      const tagList = p.tags
        ? p.tags.split(',').filter(Boolean)
        : [];
      setTags(tagList);
      setTagsInput(tagList.join(', '));

      if (p.type === 'programming' && p.test_cases && p.test_cases.length > 0) {
        setTestCases(
          p.test_cases.map((tc: any) => ({
            input: tc.input || '',
            expected_output: tc.expected_output || '',
          }))
        );
      }
      if (p.type === 'choice') {
        setOptions(p.options || ['', '']);
        setCorrectAnswer(p.solution ? Number(p.solution) : 0);
      }
      if (p.type === 'fill_blank') {
        setAcceptableAnswers(p.blanks_answer || ['']);
        setSolution(p.solution || '');
      }
    } catch (err: any) {
      const msg = err.message || '加载题目失败';
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProblem();
  }, [fetchProblem]);

  /* ---- Tags ---- */
  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const parsed = value
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
    setTags(parsed);
  };

  /* ---- Test Cases ---- */
  const addTestCase = () => {
    setTestCases((prev) => [...prev, { input: '', expected_output: '' }]);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length <= 1) return;
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTestCase = (
    index: number,
    field: keyof TestCase,
    value: string
  ) => {
    setTestCases((prev) =>
      prev.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc))
    );
  };

  /* ---- Options ---- */
  const addOption = () => {
    setOptions((prev) => [...prev, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
    if (correctAnswer >= options.length - 1) {
      setCorrectAnswer(Math.max(0, options.length - 2));
    }
  };

  const updateOption = (index: number, value: string) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? value : opt))
    );
  };

  /* ---- Answers ---- */
  const addAnswer = () => {
    setAcceptableAnswers((prev) => [...prev, '']);
  };

  const removeAnswer = (index: number) => {
    if (acceptableAnswers.length <= 1) return;
    setAcceptableAnswers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAnswer = (index: number, value: string) => {
    setAcceptableAnswers((prev) =>
      prev.map((ans, i) => (i === index ? value : ans))
    );
  };

  /* ---- Save ---- */
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('请填写题目标题');
      return;
    }
    if (!description.trim()) {
      toast.error('请填写题目描述');
      return;
    }

    const payload: Record<string, any> = {
      title: title.trim(),
      description: description.trim(),
      type,
      difficulty,
      tags,
    };

    if (type === 'programming') {
      const validCases = testCases.filter(
        (tc) => tc.input.trim() || tc.expected_output.trim()
      );
      if (validCases.length === 0) {
        toast.error('请至少添加一个测试用例');
        return;
      }
      payload.test_cases = validCases;
    }

    if (type === 'choice') {
      const validOptions = options.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        toast.error('请至少添加两个选项');
        return;
      }
      if (correctAnswer >= validOptions.length) {
        toast.error('正确选项索引无效');
        return;
      }
      payload.options = validOptions;
      payload.correct_answer = correctAnswer;
    }

    if (type === 'fill_blank') {
      const validAnswers = acceptableAnswers.filter((ans) => ans.trim());
      if (validAnswers.length === 0) {
        toast.error('请至少添加一个可接受答案');
        return;
      }
      payload.blanks_answer = validAnswers;
      payload.solution = solution.trim();
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.problems.update(Number(id), payload);
        toast.success('题目已更新');
      } else {
        await api.problems.create(payload);
        toast.success('题目已创建');
      }
      navigate('/admin');
    } catch (err: any) {
      toast.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  /* ---- Render ---- */

  if (loading) {
    return (
      <div>
        <div className="card p-8 animate-pulse space-y-4">
          <div className="h-6 bg-dark-700 rounded w-1/4" />
          <div className="h-4 bg-dark-700 rounded w-full" />
          <div className="h-4 bg-dark-700 rounded w-full" />
          <div className="h-40 bg-dark-700 rounded" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div>
        <div className="card p-10 text-center">
          <AlertTriangle size={40} className="mx-auto text-red-400 mb-3" />
          <p className="text-red-400 mb-4">{fetchError}</p>
          <button onClick={fetchProblem} className="btn-primary">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/admin"
        className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        返回管理后台
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">
        {isEdit ? '编辑题目' : '创建题目'}
      </h1>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            题目标题 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入题目标题"
            className="input w-full"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            题目描述 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入题目描述（支持 HTML 和 Markdown）"
            rows={6}
            className="input w-full resize-y"
          />
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="mt-1 text-xs text-dark-400 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
            {showPreview ? '关闭预览' : '预览'}
          </button>
          {showPreview && description && (
            <div className="mt-2 p-4 bg-dark-800/50 rounded-lg border border-dark-700">
              <MarkdownRenderer content={description} />
            </div>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">类型</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input w-full"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">难度</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="input w-full"
          >
            {DIFFICULTY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            标签（逗号分隔）
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => handleTagsChange(e.target.value)}
            placeholder="如：数组, 排序, 动态规划"
            className="input w-full"
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-dark-800 text-gray-400 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ---- Conditional fields by type ---- */}

        {/* Programming: Test Cases */}
        {type === 'programming' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">
                测试用例 <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={addTestCase}
                className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1"
              >
                <Plus size={14} />
                添加
              </button>
            </div>

            <div className="space-y-3">
              {testCases.map((tc, index) => (
                <div key={index} className="card p-4 relative">
                  <div className="absolute top-2 left-3 text-xs text-dark-500 font-mono">#{index + 1}</div>
                  {testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        输入
                      </label>
                      <textarea
                        value={tc.input}
                        onChange={(e) =>
                          updateTestCase(index, 'input', e.target.value)
                        }
                        placeholder="测试输入"
                        rows={3}
                        className="input w-full resize-y text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        预期输出
                      </label>
                      <textarea
                        value={tc.expected_output}
                        onChange={(e) =>
                          updateTestCase(
                            index,
                            'expected_output',
                            e.target.value
                          )
                        }
                        placeholder="预期输出"
                        rows={3}
                        className="input w-full resize-y text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Choice: Options */}
        {type === 'choice' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">
                选项 <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={addOption}
                className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1"
              >
                <Plus size={14} />
                添加
              </button>
            </div>

            <div className="space-y-2">
              {options.map((opt, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswer === index}
                    onChange={() => setCorrectAnswer(index)}
                    className="accent-green-500 w-4 h-4"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`选项 ${index + 1}`}
                    className="input flex-1"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              选中单选框标记正确答案
            </p>
          </div>
        )}

        {/* Fill blank: Answers */}
        {type === 'fill_blank' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">
                可接受答案 <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={addAnswer}
                className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1"
              >
                <Plus size={14} />
                添加
              </button>
            </div>

            <div className="space-y-2">
              {acceptableAnswers.map((ans, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ans}
                    onChange={(e) => updateAnswer(index, e.target.value)}
                    placeholder={`可接受答案 ${index + 1}`}
                    className="input flex-1"
                  />
                  {acceptableAnswers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAnswer(index)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-1">
                答案解析（可选）
              </label>
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="答案解析说明..."
                rows={3}
                className="input w-full resize-y"
              />
            </div>
          </div>
        )}

        {/* Save */}
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary inline-flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save size={18} />
                保存
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
