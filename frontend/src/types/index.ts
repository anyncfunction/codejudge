export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  stats?: { total: number; accepted: number };
}

export interface Problem {
  id: number;
  title: string;
  description: string;
  type: 'programming' | 'choice' | 'fill_blank';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string;
  solution: string;
  test_cases: TestCase[];
  options: string[];
  blanks_answer: string[];
  accepted_count: number;
  submission_count: number;
  user_passed?: boolean;
  created_at: string;
}

export interface TestCase {
  input: string;
  expected_output: string;
}

export interface Submission {
  id: string;
  user_id: number;
  username?: string;
  problem_id: number;
  problem_title?: string;
  code: string;
  language: string;
  answer: string;
  status: 'accepted' | 'wrong_answer' | 'runtime_error' | 'compile_error' | 'time_limit';
  score: number;
  details: SubmissionDetails;
  time_ms: number;
  memory_kb: number;
  created_at: string;
}

export interface SubmissionDetails {
  total?: number;
  passed?: number | boolean;
  cases?: TestCaseResult[];
  error?: string;
  user_answer?: number | string;
  correct_answer?: number | string;
  acceptable_answers?: string[];
  options?: string[];
  reference?: string;
}

export interface TestCaseResult {
  case: number;
  input: string;
  expected: string;
  actual?: string;
  error?: string;
  passed: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  totalPages: number;
  problems?: T[];
  submissions?: T[];
}

export interface ProblemStats {
  total: number;
  programming: number;
  choice: number;
  fill_blank: number;
}
