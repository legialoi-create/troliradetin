export type TopicId =
  | 'branching'
  | 'loop'
  | 'function'
  | 'array'
  | 'string'
  | 'struct_ds'
  | 'custom';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface CurriculumTopic {
  id: TopicId;
  order: number;
  title: string;
  shortTitle: string;
  description: string;
  badge: string;
  concepts: string[];
  suggestedProblems: {
    name: string;
    code: string;
    brief: string;
    difficulty: Difficulty;
  }[];
}

export interface TestCase {
  id: number;
  testName: string; // e.g. "test01"
  input: string;
  output: string;
  isSample?: boolean;
  note?: string;
  subtask?: number; // e.g. 1, 2, 3
  subtaskConstraint?: string; // e.g. "Subtask 1: n <= 100"
  validationStatus?: 'pass' | 'warning' | 'fail';
  validationMessage?: string;
}

export interface SubtaskInfo {
  id: number;
  name: string; // e.g. "Subtask 1"
  percentage: number; // e.g. 20 (20% số test / điểm)
  condition: string; // e.g. "n <= 100"
  expectedTestCount: number; // e.g. 4
  actualTestCount: number; // e.g. 4
  testRange: string; // e.g. "test01 - test04"
  status: 'pass' | 'warning' | 'fail';
  details?: string;
}

export interface ValidationItem {
  id: string;
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: string;
}

export interface TestValidationReport {
  isValid: boolean;
  score: number; // 0 - 100
  totalTests: number;
  summary: string;
  subtasks: SubtaskInfo[];
  checks: ValidationItem[];
  sampleCheck: {
    passed: boolean;
    sampleInputMatched: boolean;
    sampleOutputMatched: boolean;
    message: string;
  };
  testDetails: {
    testId: number;
    testName: string;
    subtaskId: number;
    subtaskName: string;
    status: 'pass' | 'warning' | 'fail';
    violations: string[];
    metrics: {
      inputLines: number;
      tokenCount: number;
      maxNumber?: number;
      minNumber?: number;
      firstNumber?: number;
    };
  }[];
  lastValidated: number;
}

export interface ProblemData {
  id: string;
  topic: TopicId;
  topicName: string;
  problemName: string;
  problemCode: string;
  timeLimit: string;
  memoryLimit: string;
  difficulty: Difficulty;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  sampleExplanation: string;
  solutionCpp: string;
  algorithmExplanation: string;
  timeComplexity: string;
  spaceComplexity: string;
  commonMistakes: string[];
  testCases: TestCase[];
  createdAt: number;
  validationReport?: TestValidationReport;
}

export interface GenerationRequest {
  topic: TopicId;
  difficulty: Difficulty;
  customPrompt?: string;
  problemCode?: string;
  problemName?: string;
  testCount?: number;
  filePrefixCase?: 'UPPERCASE' | 'lowercase' | 'Original';
}
