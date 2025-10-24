'use client'

import { X, Check, Zap, Sparkles, Brain, Crown } from 'lucide-react'

interface ModelSelectorProps {
  selectedModel: string
  onSelectModel: (model: string) => void
  onClose: () => void
}

export function ModelSelector({ selectedModel, onSelectModel, onClose }: ModelSelectorProps) {
  const models = [
    {
      name: 'GPT-5',
      description: 'Most capable model with advanced reasoning',
      icon: Brain,
      badge: 'Pro',
      color: 'from-purple-500 to-pink-500',
      features: ['Advanced reasoning', 'Code generation', 'Creative writing'],
    },
    {
      name: 'GPT-4',
      description: 'Great for complex tasks and detailed responses',
      icon: Sparkles,
      badge: 'Pro',
      color: 'from-teal-500 to-emerald-500',
      features: ['Complex analysis', 'Detailed responses', 'Multi-step reasoning'],
    },
    {
      name: 'GPT-3.5',
      description: 'Fast and efficient for everyday tasks',
      icon: Zap,
      badge: 'Free',
      color: 'from-blue-500 to-cyan-500',
      features: ['Fast responses', 'General purpose', 'Cost effective'],
    },
  ]

  const handleSelect = (modelName: string) => {
    onSelectModel(modelName)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl lg:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">Select Model</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 lg:p-6 space-y-3">
          {models.map((model) => {
            const Icon = model.icon
            const isSelected = selectedModel === model.name

            return (
              <button
                key={model.name}
                onClick={() => handleSelect(model.name)}
                className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${model.color} flex items-center justify-center shrink-0 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {model.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                        model.badge === 'Pro'
                          ? 'bg-linear-to-r from-teal-600 to-emerald-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {model.badge === 'Pro' && <Crown className="w-3 h-3" />}
                        {model.badge}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {model.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {model.features.map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="p-4 lg:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Crown className="w-4 h-4" />
            <p className="text-center">
              Pro models require an active subscription
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
