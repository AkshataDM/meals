import React, { useState, useEffect } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import './App.css'

function App() {
  const [meals, setMeals] = useState({})
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [showIngredients, setShowIngredients] = useState(false)
  const [ingredients, setIngredients] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Generate week dates
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Initialize meals for the week if not exists
  useEffect(() => {
    const weekKey = format(weekStart, 'yyyy-MM-dd')
    if (!meals[weekKey]) {
      const initialMeals = {}
      weekDays.forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd')
        initialMeals[dayKey] = {
          breakfast: '',
          lunch: '',
          dinner: ''
        }
      })
      setMeals(prev => ({ ...prev, [weekKey]: initialMeals }))
    }
  }, [currentWeek, weekStart, weekDays, meals])

  const handleMealChange = (date, mealType, value) => {
    const weekKey = format(weekStart, 'yyyy-MM-dd')
    const dayKey = format(date, 'yyyy-MM-dd')
    
    setMeals(prev => ({
      ...prev,
      [weekKey]: {
        ...prev[weekKey],
        [dayKey]: {
          ...prev[weekKey]?.[dayKey],
          [mealType]: value
        }
      }
    }))
  }

  const goToPreviousWeek = () => {
    setCurrentWeek(prev => addDays(prev, -7))
  }

  const goToNextWeek = () => {
    setCurrentWeek(prev => addDays(prev, 7))
  }

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date())
  }

  const getCurrentWeekMeals = () => {
    const weekKey = format(weekStart, 'yyyy-MM-dd')
    return meals[weekKey] || {}
  }

  const computeIngredients = async () => {
    const currentWeekMeals = getCurrentWeekMeals()
    
    // Check if there are any meals planned
    const hasMeals = Object.values(currentWeekMeals).some(dayMeals => 
      dayMeals.breakfast || dayMeals.lunch || dayMeals.dinner
    )
    
    if (!hasMeals) {
      alert('Please plan some meals first before computing ingredients!')
      return
    }

    setIsLoading(true)
    
    try {
      // Prepare the meals data for Claude API
      const mealsData = {
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekDays[6], 'yyyy-MM-dd'),
        meals: currentWeekMeals
      }

      // Make API call to Claude
      const response = await fetch('/api/compute-ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealsData)
      })

      if (!response.ok) {
        throw new Error('Failed to compute ingredients')
      }

      const data = await response.json()
      setIngredients(data.ingredients)
      setShowIngredients(true)
    } catch (error) {
      console.error('Error computing ingredients:', error)
      alert('Failed to compute ingredients. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyIngredients = async () => {
    try {
      await navigator.clipboard.writeText(ingredients)
      alert('Ingredients copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = ingredients
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('Ingredients copied to clipboard!')
    }
  }

  const closeIngredients = () => {
    setShowIngredients(false)
    setIngredients('')
  }

  const currentWeekMeals = getCurrentWeekMeals()

  return (
    <div className="app">
      <header className="header">
        <h1>🍽️ Weekly Meal Planner</h1>
        <p>Plan your meals for the week ahead</p>
      </header>

      <div className="week-navigation">
        <button onClick={goToPreviousWeek} className="nav-btn">
          ← Previous Week
        </button>
        <button onClick={goToCurrentWeek} className="nav-btn current">
          Current Week
        </button>
        <button onClick={goToNextWeek} className="nav-btn">
          Next Week →
        </button>
      </div>

      <div className="week-display">
        <h2>
          Week of {format(weekStart, 'MMMM d')} - {format(weekDays[6], 'MMMM d, yyyy')}
        </h2>
      </div>

      <div className="calendar">
        <div className="calendar-header">
          <div className="day-header">Day</div>
          <div className="meal-header">Breakfast</div>
          <div className="meal-header">Lunch</div>
          <div className="meal-header">Dinner</div>
        </div>
        
        {weekDays.map((day, index) => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const dayMeals = currentWeekMeals[dayKey] || { breakfast: '', lunch: '', dinner: '' }
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          
          return (
            <div key={dayKey} className={`calendar-row ${isToday ? 'today' : ''}`}>
              <div className="day-cell">
                <div className="day-name">{format(day, 'EEE')}</div>
                <div className="day-date">{format(day, 'MMM d')}</div>
                {isToday && <div className="today-indicator">Today</div>}
              </div>
              
              <div className="meal-cell">
                <textarea
                  placeholder="What's for breakfast?"
                  value={dayMeals.breakfast || ''}
                  onChange={(e) => handleMealChange(day, 'breakfast', e.target.value)}
                  className="meal-input"
                />
              </div>
              
              <div className="meal-cell">
                <textarea
                  placeholder="What's for lunch?"
                  value={dayMeals.lunch || ''}
                  onChange={(e) => handleMealChange(day, 'lunch', e.target.value)}
                  className="meal-input"
                />
              </div>
              
              <div className="meal-cell">
                <textarea
                  placeholder="What's for dinner?"
                  value={dayMeals.dinner || ''}
                  onChange={(e) => handleMealChange(day, 'dinner', e.target.value)}
                  className="meal-input"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="compute-section">
        <button 
          onClick={computeIngredients} 
          className="compute-btn"
          disabled={isLoading}
        >
          {isLoading ? 'Computing...' : '🧾 Compute Ingredients'}
        </button>
      </div>

      {/* Ingredients Popup Modal */}
      {showIngredients && (
        <div className="modal-overlay" onClick={closeIngredients}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Shopping List</h3>
              <button onClick={closeIngredients} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="ingredients-text">
                {ingredients.split('\n').map((line, index) => (
                  <div key={index} className="ingredient-line">
                    {line}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={copyIngredients} className="copy-btn">
                📋 Copy to Clipboard
              </button>
              <button onClick={closeIngredients} className="close-modal-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>Your meal plans are automatically saved as you type!</p>
      </footer>
    </div>
  )
}

export default App 