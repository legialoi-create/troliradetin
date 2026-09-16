import React from 'react';
import {
  ChevronRight,
  GitFork,
  Repeat,
  Code2,
  Layers,
  Type as TypeIcon,
  Database,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { CURRICULUM_TOPICS } from '../data/curriculum';
import { CurriculumTopic, TopicId, Difficulty } from '../types';

interface CurriculumRoadmapProps {
  selectedTopic: TopicId;
  onSelectTopic: (topicId: TopicId) => void;
  onQuickGenerate: (topic: CurriculumTopic, suggestedProblem?: { name: string; code: string; brief: string; difficulty: Difficulty }) => void;
}

const TOPIC_ICONS: Record<TopicId, React.ReactNode> = {
  branching: <GitFork className="w-4 h-4" />,
  loop: <Repeat className="w-4 h-4" />,
  function: <Code2 className="w-4 h-4" />,
  array: <Layers className="w-4 h-4" />,
  string: <TypeIcon className="w-4 h-4" />,
  struct_ds: <Database className="w-4 h-4" />,
  custom: <Sparkles className="w-4 h-4" />,
};

export const CurriculumRoadmap: React.FC<CurriculumRoadmapProps> = ({
  selectedTopic,
  onSelectTopic,
  onQuickGenerate,
}) => {
  const activeTopicObj = CURRICULUM_TOPICS.find((t) => t.id === selectedTopic) || CURRICULUM_TOPICS[0];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Roadmap label & title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Lộ trình sư phạm C++ cho người mới học
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn chủ đề theo lộ trình bài bản hoặc bấm vào bài tập gợi ý để sinh đề & 20 test tự động.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Đang chọn: <strong className="text-slate-800">{activeTopicObj.title}</strong>
          </div>
        </div>

        {/* Stepper visual roadmap */}
        <div className="flex items-center overflow-x-auto pb-2 scrollbar-thin gap-1 sm:gap-2">
          {CURRICULUM_TOPICS.map((topic, index) => {
            const isSelected = topic.id === selectedTopic;
            const isLast = index === CURRICULUM_TOPICS.length - 1;

            return (
              <React.Fragment key={topic.id}>
                <button
                  id={`btn-topic-${topic.id}`}
                  onClick={() => onSelectTopic(topic.id)}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all border ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
                    }`}
                  >
                    {TOPIC_ICONS[topic.id] || index + 1}
                  </span>
                  <span>{topic.shortTitle}</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-white border border-slate-200 text-slate-500">
                    #{topic.order}
                  </span>
                </button>

                {!isLast && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Active topic expanded drawer with concepts and suggested problems */}
        <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            {/* Left: Description & Concepts */}
            <div className="lg:w-5/12">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  {activeTopicObj.badge}
                </span>
                <h3 className="text-sm font-bold text-slate-900">{activeTopicObj.title}</h3>
              </div>
              <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                {activeTopicObj.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeTopicObj.concepts.map((concept, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    {concept}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Suggested Problems for Fast Generation */}
            <div className="lg:w-7/12">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">
                  Gợi ý bài tập kinh điển ({activeTopicObj.suggestedProblems.length} bài)
                </span>
                <button
                  id="btn-custom-generate-active-topic"
                  onClick={() => onQuickGenerate(activeTopicObj)}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Sinh bài tuỳ biến chủ đề này
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeTopicObj.suggestedProblems.map((prob) => (
                  <div
                    key={prob.code}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {prob.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                          {prob.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">
                        {prob.brief}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                          prob.difficulty === 'easy'
                            ? 'bg-emerald-50 text-emerald-700'
                            : prob.difficulty === 'medium'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {prob.difficulty === 'easy' ? 'Cơ bản' : prob.difficulty === 'medium' ? 'Vừa sức' : 'Thử thách'}
                      </span>
                      <button
                        id={`btn-load-suggested-${prob.code}`}
                        onClick={() => onQuickGenerate(activeTopicObj, prob)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                      >
                        Ra đề này <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
