// components/StrategicContextSection.jsx

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { BookOpen } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

const StrategicContextSection = ({ studentId }) => {
  const [context, setContext] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const data = await api.getStrategicContext(studentId)
        setContext(data)
      } catch (err) {
        console.error('Failed to fetch strategic context:', err)
      } finally {
        setLoading(false)
      }
    }

    if (studentId) {
      fetchContext()
    }
  }, [studentId])

  if (loading) {
    return (
      <div className="card">
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  if (!context || !context.concepts) {
    return null
  }

  const { concepts } = context
  const coveragePct = context.stage === 'experienced' 
    ? concepts.coverage_pct 
    : Math.round((concepts.explored / concepts.total) * 100)

  return (
    <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
      <div className="flex items-start space-x-4">
        <div className="p-3 bg-indigo-100 rounded-full">
          <BookOpen className="h-6 w-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              📚 Concepts explorés : {concepts.explored}/{concepts.total}
            </h3>
            <span className="text-xl font-bold text-indigo-600">
              {coveragePct}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-indigo-200 rounded-full mb-4">
            <div
              className="h-3 bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${coveragePct}%` }}
            ></div>
          </div>

          {/* Unexplored Concepts */}
          {concepts.unexplored_preview && concepts.unexplored_preview.length > 0 ? (
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Restent :</strong>
              </p>
              <p className="text-sm text-gray-600">
                {concepts.unexplored_preview.join(', ')}
                {concepts.unexplored_preview.length < (concepts.total - concepts.explored) && '...'}
              </p>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-sm text-green-700 font-medium">
                🎉 Tous les concepts de ton parcours sont explorés !
              </p>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={() => navigate('/concepts')}
            className="btn-outline flex items-center space-x-2"
          >
            <BookOpen className="h-4 w-4" />
            <span>Voir la bibliothèque complète</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default StrategicContextSection