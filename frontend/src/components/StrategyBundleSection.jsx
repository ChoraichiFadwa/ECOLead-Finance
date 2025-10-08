// components/StrategyBundleSection.jsx

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { Target, TrendingUp, DollarSign, Zap } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

const StrategyBundleSection = ({ studentId, selectedGoal = null }) => {
  const [goal, setGoal] = useState(selectedGoal || 'balance')
  const [bundle, setBundle] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (selectedGoal) {
      setGoal(selectedGoal)
    }
  }, [selectedGoal])

  useEffect(() => {
    const fetchBundle = async () => {
      try {
        setLoading(true)
        const data = await api.getStrategyBundle(studentId, goal, 3)
        setBundle(data)
      } catch (err) {
        console.error('Failed to fetch strategy bundle:', err)
      } finally {
        setLoading(false)
      }
    }

    if (studentId && goal) {
      fetchBundle()
    }
  }, [studentId, goal])

  const GOAL_CONFIG = {
    reduce_stress: {
      label: 'Diminuer le stress',
      icon: Target,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700'
    },
    boost_rentabilite: {
      label: 'Augmenter la rentabilité',
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700'
    },
    preserve_liquidity: {
      label: 'Préserver la trésorerie',
      icon: DollarSign,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    },
    balance: {
      label: 'Équilibrer les objectifs',
      icon: Zap,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700'
    }
  }

  const handleGoalSelect = (newGoal) => {
    setGoal(newGoal)
  }

  return (
    <div className="space-y-6">
      {/* Goal Selection */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Choisis Ton Objectif</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(GOAL_CONFIG).map(([key, config]) => {
            const IconComponent = config.icon
            const isSelected = goal === key
            const badge = bundle?.goal_recommendations?.[key]?.badge

            return (
              <button
                key={key}
                onClick={() => handleGoalSelect(key)}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? `${config.borderColor} ${config.bgColor}`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {badge && (
                  <span className="absolute top-2 right-2 text-xl">{badge}</span>
                )}
                <IconComponent
                  className={`h-6 w-6 mb-2 ${
                    isSelected ? config.textColor : 'text-gray-600'
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    isSelected ? config.textColor : 'text-gray-700'
                  }`}
                >
                  {config.label}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mission Cards */}
      {loading ? (
        <LoadingSpinner size="md" />
      ) : bundle?.bundle?.missions && bundle.bundle.missions.length > 0 ? (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ta carte de missions personnalisée
          </h3>
          <div className="space-y-4">
            {bundle.bundle.missions.map((mission, idx) => (
              <div
                key={mission.mission_id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {mission.concept}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Niveau : <span className="capitalize">{mission.niveau}</span>
                    </p>
                    {mission.why && mission.why.length > 0 && (
                      <ul className="space-y-1">
                        {mission.why.map((reason, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start">
                            <span className="mr-2">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/mission/${mission.mission_id}`)}
                    className="btn-primary ml-4"
                  >
                    Commencer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tip */}
          {bundle.tip?.text && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-gray-700">{bundle.tip.text}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-8 text-gray-600">
          Aucune mission disponible pour cet objectif pour le moment.
        </div>
      )}
    </div>
  )
}

export default StrategyBundleSection