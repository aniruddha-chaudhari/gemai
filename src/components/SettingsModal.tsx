'use client'

import { X, Moon, Sun, Bell, Shield, Globe, User, Settings as SettingsIcon, Database } from 'lucide-react'
import { MemoryManagement } from './MemoryManagement'

interface SettingsModalProps {
  isDarkMode: boolean
  onToggleDarkMode: () => void
  onClose: () => void
}

export function SettingsModal({ isDarkMode, onToggleDarkMode, onClose }: SettingsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
      <div className="bg-linear-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl lg:rounded-3xl shadow-2xl shadow-teal-500/20 dark:shadow-teal-500/20 w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-gray-700/50 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200/50 dark:border-gray-800/50 bg-linear-to-r from-teal-50/30 to-emerald-50/30 dark:from-teal-900/20 dark:to-emerald-900/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-88px)] p-4 lg:p-6 space-y-4 lg:space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Appearance
            </h3>

            <div className="bg-linear-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-600/50 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Dark Mode
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Toggle between light and dark themes
                    </div>
                  </div>
                </div>
                <button
                  onClick={onToggleDarkMode}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                    isDarkMode ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Account
            </h3>

            <div className="bg-linear-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-4 space-y-4 border border-gray-200/50 dark:border-gray-600/50 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Profile Settings
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Manage your account information
                  </div>
                </div>
                <button className="text-sm text-teal-600 dark:text-teal-400 hover:underline transition-colors">
                  Edit
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Notifications
            </h3>

            <div className="bg-linear-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-4 space-y-4 border border-gray-200/50 dark:border-gray-600/50 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Push Notifications
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Receive updates and alerts
                    </div>
                  </div>
                </div>
                <button className="relative w-12 h-6 rounded-full bg-gray-300 dark:bg-gray-700">
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Privacy & Security
            </h3>

            <div className="bg-linear-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-4 space-y-4 border border-gray-200/50 dark:border-gray-600/50 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Data & Privacy
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Manage how your data is used
                  </div>
                </div>
                <button className="text-sm text-teal-600 dark:text-teal-400 hover:underline transition-colors">
                  View
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Language & Region
            </h3>

            <div className="bg-linear-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-600/50 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Language
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    English (US)
                  </div>
                </div>
                <button className="text-sm text-teal-600 dark:text-teal-400 hover:underline transition-colors">
                  Change
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Memory Management
            </h3>

            <div className="bg-linear-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-600/50 shadow-sm hover:shadow-md transition-shadow duration-200">
              <MemoryManagement />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
