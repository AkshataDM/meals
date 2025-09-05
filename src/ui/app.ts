export function serveUI(request: Request): Response {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🍽️ Weekly Meal Planner</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
                sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background: #faf7f2;
            min-height: 100vh;
            color: #333;
        }

        .app {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            min-height: 100vh;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            color: #2c3e50;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .week-navigation {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-bottom: 30px;
        }

        .nav-btn {
            padding: 12px 20px;
            border: none;
            border-radius: 25px;
            background: rgba(255, 255, 255, 0.9);
            color: #333;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .nav-btn:hover {
            background: white;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }

        .nav-btn.current {
            background: #4CAF50;
            color: white;
        }

        .week-display {
            text-align: center;
            margin-bottom: 30px;
        }

        .week-display h2 {
            color: #2c3e50;
            font-size: 1.5rem;
        }

        .calendar {
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            margin-bottom: 30px;
        }

        .calendar-header {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            background: #f8f9fa;
            border-bottom: 2px solid #e9ecef;
        }

        .day-header, .meal-header {
            padding: 15px;
            text-align: center;
            font-weight: 600;
            color: #495057;
        }

        .calendar-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            border-bottom: 1px solid #e9ecef;
        }

        .calendar-row:last-child {
            border-bottom: none;
        }

        .day-cell, .meal-cell {
            padding: 15px;
            border-right: 1px solid #e9ecef;
        }

        .day-cell:last-child, .meal-cell:last-child {
            border-right: none;
        }

        .day-cell {
            background: #f8f9fa;
            text-align: center;
        }

        .day-name {
            font-weight: 600;
            color: #495057;
            margin-bottom: 5px;
        }

        .day-date {
            color: #6c757d;
            font-size: 0.9rem;
        }

        .today-indicator {
            background: #4CAF50;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            margin-top: 8px;
            display: inline-block;
        }

        .meal-input {
            width: 100%;
            min-height: 80px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            padding: 10px;
            font-family: inherit;
            font-size: 0.9rem;
            resize: vertical;
            transition: border-color 0.3s ease;
        }

        .meal-input:focus {
            outline: none;
            border-color: #667eea;
        }

        .meal-input::placeholder {
            color: #adb5bd;
        }

        .compute-section {
            text-align: center;
            margin-bottom: 30px;
        }

        .compute-btn {
            padding: 15px 30px;
            border: none;
            border-radius: 25px;
            background: #4CAF50;
            color: white;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .compute-btn:hover:not(:disabled) {
            background: #45a049;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }

        .compute-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .save-btn {
            padding: 15px 30px;
            border: none;
            border-radius: 25px;
            background: #667eea;
            color: white;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            margin-left: 15px;
        }

        .save-btn:hover:not(:disabled) {
            background: #5a6fd8;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }

        .save-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .nutrition-btn {
            padding: 15px 30px;
            border: none;
            border-radius: 25px;
            background: #ff6b6b;
            color: white;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            margin-left: 15px;
        }

        .nutrition-btn:hover:not(:disabled) {
            background: #ee5a52;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }

        .nutrition-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* Toast Notification Styles */
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2000;
            pointer-events: none;
        }

        .toast {
            background: white;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 10px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            border-left: 4px solid #4CAF50;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            pointer-events: auto;
            max-width: 300px;
            font-weight: 500;
        }

        .toast.show {
            transform: translateX(0);
        }

        .toast.success {
            border-left-color: #4CAF50;
        }

        .toast.error {
            border-left-color: #f44336;
        }

        .toast.info {
            border-left-color: #2196F3;
        }

        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }

        .modal-overlay.show {
            opacity: 1;
            visibility: visible;
        }

        .modal-content {
            background: white;
            border-radius: 24px;
            max-width: 700px;
            width: 100%;
            max-height: 85vh;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(0,0,0,0.25);
            transform: scale(0.9) translateY(20px);
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.1);
        }

        .modal-overlay.show .modal-content {
            transform: scale(1) translateY(0);
        }

        .modal-header {
            padding: 24px 28px 20px;
            border-bottom: 1px solid #f0f0f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }

        .modal-header h3 {
            color: #2c3e50;
            margin: 0;
            font-size: 1.4rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .close-btn {
            background: none;
            border: none;
            font-size: 1.8rem;
            cursor: pointer;
            color: #6c757d;
            padding: 0;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.3s ease;
            font-weight: 300;
        }

        .close-btn:hover {
            background: #f1f3f4;
            color: #2c3e50;
            transform: scale(1.1);
        }

        .modal-body {
            padding: 28px;
            max-height: 450px;
            overflow-y: auto;
            background: #ffffff;
        }

        .modal-body::-webkit-scrollbar {
            width: 6px;
        }

        .modal-body::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
        }

        .modal-body::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;
        }

        .modal-body::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }

        .cache-indicator {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            color: #1565c0;
            padding: 12px 16px;
            border-radius: 12px;
            margin-bottom: 20px;
            text-align: center;
            font-weight: 500;
            border: 1px solid #90caf9;
            box-shadow: 0 2px 8px rgba(25, 118, 210, 0.1);
        }

        .cache-indicator.semantic {
            background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
            color: #2e7d32;
            border: 1px solid #81c784;
            box-shadow: 0 2px 4px rgba(46, 125, 50, 0.15);
        }

        .cache-indicator.fresh {
            background: linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%);
            color: #e65100;
            border: 1px solid #ffb74d;
            box-shadow: 0 2px 4px rgba(230, 81, 0, 0.15);
        }

        .cache-indicator small {
            display: block;
            margin-top: 4px;
            font-size: 0.8rem;
            opacity: 0.8;
        }

        .ingredients-text {
            line-height: 1.7;
            white-space: pre-line;
            font-size: 1rem;
            color: #2c3e50;
            background: #fafbfc;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e9ecef;
        }

        .ingredient-line {
            margin-bottom: 6px;
            padding: 2px 0;
        }

        .modal-footer {
            padding: 24px 28px;
            border-top: 1px solid #f0f0f0;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }

        .copy-btn, .close-modal-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .copy-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .copy-btn:hover {
            background: linear-gradient(135deg, #5a6fd8 0%, #6a4c93 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .close-modal-btn {
            background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
            color: white;
        }

        .close-modal-btn:hover {
            background: linear-gradient(135deg, #5a6268 0%, #343a40 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
        }

        .footer {
            text-align: center;
            color: white;
            opacity: 0.8;
            margin-top: 30px;
        }

        /* Landing Page Styles */
        .landing-page {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            min-height: 100vh;
            background: #faf7f2;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .landing-header {
            text-align: center;
            margin-bottom: 60px;
            color: #2c3e50;
        }

        .landing-header h1 {
            font-size: 3rem;
            margin-bottom: 15px;
        }

        .landing-header p {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 0;
        }

        .ai-provider-selection {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 40px;
            margin-bottom: 40px;
        }

        .provider-card {
            background: white;
            border-radius: 20px;
            padding: 30px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 3px solid transparent;
            position: relative;
            overflow: hidden;
        }

        .provider-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .provider-card.workers-ai:hover {
            border-color: #667eea;
        }

        .provider-card.claude:hover {
            border-color: #ff6b6b;
        }

        .provider-icon {
            font-size: 3rem;
            margin-bottom: 20px;
            text-align: center;
        }

        .provider-card h3 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 1.5rem;
            text-align: center;
        }

        .provider-card p {
            color: #6c757d;
            margin-bottom: 20px;
            text-align: center;
            font-size: 1.1rem;
        }

        .provider-card ul {
            list-style: none;
            padding: 0;
            margin-bottom: 20px;
        }

        .provider-card li {
            padding: 8px 0;
            color: #495057;
            font-weight: 500;
        }

        .provider-model {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 10px 15px;
            border-radius: 25px;
            text-align: center;
            font-weight: 600;
            color: #495057;
            margin-top: 20px;
        }

        .provider-note {
            text-align: center;
            font-size: 0.9rem;
            color: #dc3545;
            margin-top: 10px;
            font-weight: 500;
        }

        .landing-footer {
            text-align: center;
            color: white;
            opacity: 0.8;
        }

        .landing-footer p {
            margin: 0;
            font-size: 1rem;
        }

        @media (max-width: 768px) {
            .landing-page {
                padding: 20px;
            }
            
            .landing-header h1 {
                font-size: 2.5rem;
            }
            
            .ai-provider-selection {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .provider-card {
                padding: 20px;
            }
        }

        /* Claude Setup Modal Styles */
        .claude-setup-content {
            max-width: 500px;
        }

        .claude-setup-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            border-left: 4px solid #667eea;
        }

        .claude-setup-info p {
            margin-bottom: 15px;
            color: #495057;
            font-weight: 500;
        }

        .claude-setup-info ol {
            margin: 0;
            padding-left: 20px;
        }

        .claude-setup-info li {
            margin-bottom: 8px;
            color: #6c757d;
        }

        .claude-setup-info a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }

        .claude-setup-info a:hover {
            text-decoration: underline;
        }

        .api-key-input-section {
            margin-bottom: 20px;
        }

        .api-key-input-section label {
            display: block;
            margin-bottom: 8px;
            color: #495057;
            font-weight: 600;
        }

        .api-key-input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9rem;
            transition: border-color 0.3s ease;
        }

        .api-key-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .input-help {
            margin-top: 8px;
            font-size: 0.85rem;
            color: #6c757d;
            font-style: italic;
        }

        .cancel-btn, .save-claude-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .cancel-btn {
            background: #6c757d;
            color: white;
            margin-right: 10px;
        }

        .cancel-btn:hover {
            background: #5a6268;
        }

        .save-claude-btn {
            background: #667eea;
            color: white;
        }

        .save-claude-btn:hover {
            background: #5a6fd8;
        }

        .save-claude-btn:disabled {
            background: #adb5bd;
            cursor: not-allowed;
        }

        /* Nutrition Page Styles */
        .nutrition-page {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            min-height: 100vh;
            background: #faf7f2;
        }

        .nutrition-header {
            text-align: center;
            margin-bottom: 40px;
            color: #2c3e50;
        }

        .nutrition-header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .nutrition-header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .back-btn {
            position: absolute;
            top: 20px;
            left: 20px;
            padding: 12px 20px;
            border: none;
            border-radius: 25px;
            background: rgba(255, 255, 255, 0.9);
            color: #333;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .back-btn:hover {
            background: white;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }

        .nutrition-content {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .nutrition-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            margin-bottom: 40px;
        }

        .summary-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            border: 1px solid #dee2e6;
        }

        .summary-card h3 {
            color: #495057;
            margin-bottom: 10px;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .summary-value {
            font-size: 2rem;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 5px;
        }

        .summary-unit {
            color: #6c757d;
            font-size: 0.8rem;
            font-weight: 500;
        }

        .nutrition-charts {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }

        .chart-container {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 15px;
            border: 1px solid #dee2e6;
        }

        .chart-container h3 {
            color: #2c3e50;
            margin-bottom: 20px;
            text-align: center;
        }

        .chart-placeholder {
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6c757d;
            font-style: italic;
        }

        .nutrition-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 15px;
            border: 1px solid #dee2e6;
        }

        .nutrition-details h3 {
            color: #2c3e50;
            margin-bottom: 20px;
            text-align: center;
        }

        .loading-placeholder {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            padding: 40px;
        }

        @media (max-width: 768px) {
            .nutrition-summary {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .nutrition-charts {
                grid-template-columns: 1fr;
            }
        }

        /* Chart Visualization Styles */
        .macro-chart-visual {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .macro-bar {
            position: relative;
            height: 40px;
            background: #e9ecef;
            border-radius: 20px;
            overflow: hidden;
        }

        .macro-fill {
            height: 100%;
            transition: width 0.8s ease;
        }

        .macro-fill.protein {
            background: linear-gradient(90deg, #4CAF50, #66BB6A);
        }

        .macro-fill.carbs {
            background: linear-gradient(90deg, #FF9800, #FFB74D);
        }

        .macro-fill.fat {
            background: linear-gradient(90deg, #F44336, #EF5350);
        }

        /* Nutrition Chart Styles */
        .nutrition-chart-visual {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .nutrition-bar {
            position: relative;
            height: 35px;
            background: #f8f9fa;
            border-radius: 18px;
            overflow: hidden;
            border: 1px solid #e9ecef;
        }

        .nutrition-fill {
            height: 100%;
            transition: width 0.8s ease;
            border-radius: 18px;
        }

        .nutrition-label {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            font-weight: 600;
            font-size: 0.9rem;
            color: #495057;
            z-index: 2;
        }

        /* Nutrition-specific colors */
        .nutrition-fill.fiber { background: linear-gradient(90deg, #84fab0, #8fd3f4); }
        .nutrition-fill.iron { background: linear-gradient(90deg, #d299c2, #fef9d7); }
        .nutrition-fill.calcium { background: linear-gradient(90deg, #89f7fe, #66a6ff); }
        .nutrition-fill.vitamin-c { background: linear-gradient(90deg, #fa709a, #fee140); }
        .nutrition-fill.vitamin-a { background: linear-gradient(90deg, #43e97b, #38f9d7); }
        .nutrition-fill.vitamin-d { background: linear-gradient(90deg, #4facfe, #00f2fe); }

        .macro-label {
            position: absolute;
            top: 50%;
            left: 15px;
            transform: translateY(-50%);
            color: white;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .daily-chart-visual {
            display: flex;
            align-items: end;
            justify-content: space-around;
            height: 200px;
            gap: 10px;
        }



        @media (max-width: 768px) {
            .app {
                padding: 15px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .week-navigation {
                flex-direction: column;
                align-items: center;
            }
            
            .calendar-header, .calendar-row {
                grid-template-columns: 1fr;
            }
            
            .day-cell, .meal-cell {
                border-right: none;
                border-bottom: 1px solid #e9ecef;
            }
            
            .day-cell:last-child, .meal-cell:last-child {
                border-bottom: none;
            }
        }
    </style>
</head>
<body>
    <div class="app" style="display: none;">
        <header class="header">
            <h1>🍽️ Weekly Meal Planner</h1>
            <p>Plan your meals for the week ahead</p>
        </header>

        <div class="week-navigation">
            <button class="nav-btn" onclick="goToPreviousWeek()">← Previous Week</button>
            <button class="nav-btn current" onclick="goToCurrentWeek()">Current Week</button>
            <button class="nav-btn" onclick="goToNextWeek()">Next Week →</button>
        </div>

        <div class="week-display">
            <h2 id="week-display">Week of ...</h2>
        </div>

        <div class="calendar">
            <div class="calendar-header">
                <div class="day-header">Day</div>
                <div class="meal-header">Breakfast</div>
                <div class="meal-header">Lunch</div>
                <div class="meal-header">Dinner</div>
            </div>
            <div id="calendar-body"></div>
        </div>

        <div class="compute-section">
            <button class="compute-btn" onclick="computeIngredients()" id="compute-btn">
                🧾 Compute Ingredients
            </button>
            <button class="save-btn" onclick="saveMealPlan()" id="save-btn">
                💾 Save Meal Plan
            </button>
            <button class="nutrition-btn" onclick="computeNutrition()" id="nutrition-btn">
                🥗 Compute Nutrition
            </button>
        </div>

        <div id="modal" class="modal-overlay" style="display: none;" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>📋 Shopping List</h3>
                    <button class="close-btn" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                                         <div id="cache-indicator" style="display: none;" class="cache-indicator">
                         ⚡ Cache indicator
                     </div>
                    <div id="ingredients-text" class="ingredients-text"></div>
                </div>
                <div class="modal-footer">
                    <button class="copy-btn" onclick="copyIngredients()">
                        📋 Copy to Clipboard
                    </button>
                    <button class="close-modal-btn" onclick="closeModal()">
                        Close
                    </button>
                </div>
            </div>
        </div>

        <footer class="footer">
            <p>Your meal plans are automatically saved as you type!</p>
        </footer>
    </div>

    <!-- Toast Notification Container -->
    <div id="toast-container" class="toast-container"></div>

    <!-- Landing Page -->
    <div id="landing-page" class="landing-page">
        <div class="landing-header">
            <h1>🍽️ Weekly Meal Planner</h1>
            <p>Choose your AI assistant for meal planning and nutrition analysis</p>
        </div>

        <div class="ai-provider-selection">
            <div class="provider-card workers-ai" onclick="selectAiProvider('workers-ai')">
                <div class="provider-icon">⚡</div>
                <h3>Cloudflare Workers AI</h3>
                <p>Fast, included with your Cloudflare plan</p>
                <ul>
                    <li>✅ No additional costs</li>
                    <li>⚡ Edge performance</li>
                    <li>🔒 Built-in security</li>
                    <li>🌍 Global availability</li>
                </ul>
                <div class="provider-model">Llama 3.3 70B</div>
            </div>

            <div class="provider-card claude" onclick="showClaudeSetup()">
                <div class="provider-icon">🧠</div>
                <h3>Claude (Anthropic)</h3>
                <p>Advanced AI with superior reasoning</p>
                <ul>
                    <li>🎯 Highly accurate</li>
                    <li>💬 Natural conversations</li>
                    <li>📊 Detailed analysis</li>
                    <li>🔬 Research-grade AI</li>
                </ul>
                <div class="provider-model">Claude 3.5 Sonnet</div>
                <div class="provider-note">*Requires API key</div>
            </div>
        </div>

        <div class="landing-footer">
            <p>You can change this preference anytime in the application</p>
        </div>
    </div>

    <!-- Claude API Key Setup Modal -->
    <div id="claude-setup-modal" class="modal-overlay" style="display: none;" onclick="closeClaudeSetup()">
        <div class="modal-content claude-setup-content" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h3>🧠 Setup Claude API</h3>
                <button class="close-btn" onclick="closeClaudeSetup()">×</button>
            </div>
            <div class="modal-body">
                <div class="claude-setup-info">
                    <p>To use Claude, you'll need an API key from Anthropic:</p>
                    <ol>
                        <li>Visit <a href="https://console.anthropic.com/" target="_blank">console.anthropic.com</a></li>
                        <li>Create an account or sign in</li>
                        <li>Generate an API key</li>
                        <li>Paste it below</li>
                    </ol>
                </div>
                
                <div class="api-key-input-section">
                    <label for="claude-api-key">Claude API Key:</label>
                    <input 
                        type="password" 
                        id="claude-api-key" 
                        placeholder="sk-ant-api03-..." 
                        class="api-key-input"
                    />
                    <div class="input-help">
                        Your API key is stored securely and only used for AI requests
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="cancel-btn" onclick="closeClaudeSetup()">
                    Cancel
                </button>
                <button class="save-claude-btn" onclick="setupClaude()">
                    Save & Continue
                </button>
            </div>
        </div>
    </div>

    <!-- Nutrition Page -->
    <div id="nutrition-page" class="nutrition-page" style="display: none;">
        <div class="nutrition-header">
            <button class="back-btn" onclick="showCalendar()">← Back to Meal Planner</button>
            <h1>🥗 Nutrition & Macros Analysis</h1>
            <p>Total macros and nutrition summary</p>
        </div>

        <div class="nutrition-content">
            <div class="nutrition-summary">
                <div class="summary-card">
                    <h3>Total Calories</h3>
                    <div class="summary-value" id="total-calories">-</div>
                    <div class="summary-unit">kcal</div>
                </div>
                <div class="summary-card">
                    <h3>Protein</h3>
                    <div class="summary-value" id="total-protein">-</div>
                    <div class="summary-unit">g</div>
                </div>
                <div class="summary-card">
                    <h3>Carbs</h3>
                    <div class="summary-value" id="total-carbs">-</div>
                    <div class="summary-unit">g</div>
                </div>
                <div class="summary-card">
                    <h3>Fat</h3>
                    <div class="summary-value" id="total-fat">-</div>
                    <div class="summary-unit">g</div>
                </div>
                <div class="summary-card">
                    <h3>Fiber</h3>
                    <div class="summary-value" id="total-fiber">-</div>
                    <div class="summary-unit">g</div>
                </div>
                <div class="summary-card">
                    <h3>Sugar</h3>
                    <div class="summary-value" id="total-sugar">-</div>
                    <div class="summary-unit">g</div>
                </div>
                <div class="summary-card">
                    <h3>Sodium</h3>
                    <div class="summary-value" id="total-sodium">-</div>
                    <div class="summary-unit">mg</div>
                </div>
                <div class="summary-card">
                    <h3>Calcium</h3>
                    <div class="summary-value" id="total-calcium">-</div>
                    <div class="summary-unit">mg</div>
                </div>
            </div>

            <div class="nutrition-charts">
                <div class="chart-container">
                    <h3>Macro Distribution</h3>
                    <div class="macro-chart" id="macro-chart">
                        <div class="chart-placeholder">Loading chart...</div>
                    </div>
                </div>
                <div class="chart-container">
                    <h3>Key Nutrients</h3>
                    <div class="nutrition-chart" id="nutrition-chart">
                        <div class="chart-placeholder">Loading chart...</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // State management
        let meals = {};
        let currentWeek = new Date();
        let isLoading = false;
        let sessionId = null;

        // Session management
        function generateSessionId() {
            return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        }

        function getSessionId() {
            if (!sessionId) {
                // Try to get from localStorage first
                sessionId = localStorage.getItem('meal-planner-session-id');
                if (!sessionId) {
                    // Generate new session ID
                    sessionId = generateSessionId();
                    localStorage.setItem('meal-planner-session-id', sessionId);
                    console.log('Generated new session ID:', sessionId);
                } else {
                    console.log('Using existing session ID:', sessionId);
                }
            }
            return sessionId;
        }

        // Toast notification system
        function showToast(message, type = 'success', duration = 3000) {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = 'toast ' + type;
            toast.textContent = message;
            
            container.appendChild(toast);
            
            // Trigger animation
            setTimeout(() => {
                toast.classList.add('show');
            }, 10);
            
            // Auto remove after duration
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (container.contains(toast)) {
                        container.removeChild(toast);
                    }
                }, 300);
            }, duration);
        }

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize session
            getSessionId();
            checkAiProvider();
        });

        async function checkAiProvider() {
            // For now, always show landing page first for testing
            // Later you can uncomment the provider check below
            showLandingPage();
            
            /* Uncomment this section when you want to remember provider choice:
            try {
                // Check if AI provider is already set
                const response = await fetch('/api/get-ai-provider');
                if (response.ok) {
                    const data = await response.json();
                    // Check if provider was explicitly set (not just defaulted)
                    if (data.provider && data.explicitlySet) {
                        // Provider already set, show main app
                        showMainApp();
                        return;
                    }
                }
                
                // No provider set or error, show landing page
                showLandingPage();
            } catch (error) {
                console.log('No AI provider set, showing landing page');
                showLandingPage();
            }
            */
        }

        function showLandingPage() {
            document.getElementById('landing-page').style.display = 'block';
            document.querySelector('.app').style.display = 'none';
            document.getElementById('nutrition-page').style.display = 'none';
        }

        function showMainApp() {
            document.getElementById('landing-page').style.display = 'none';
            document.querySelector('.app').style.display = 'block';
            document.getElementById('nutrition-page').style.display = 'none';
            
            // Initialize the main app
            initializeWeek();
            renderCalendar();
            loadSavedMealPlan();
        }

        function showClaudeSetup() {
            const modal = document.getElementById('claude-setup-modal');
            modal.style.display = 'flex';
            // Add show class for animation
            setTimeout(() => modal.classList.add('show'), 10);
        }

        function closeClaudeSetup() {
            const modal = document.getElementById('claude-setup-modal');
            modal.classList.remove('show');
            // Hide after animation completes
            setTimeout(() => modal.style.display = 'none', 300);
            document.getElementById('claude-api-key').value = '';
        }

        async function setupClaude() {
            const apiKey = document.getElementById('claude-api-key').value.trim();
            
            if (!apiKey) {
                showToast('Please enter your Claude API key', 'error');
                return;
            }

            if (!apiKey.startsWith('sk-ant-')) {
                showToast('Invalid Claude API key format. It should start with "sk-ant-"', 'error');
                return;
            }

            try {
                const response = await fetch('/api/set-ai-provider', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        provider: 'claude',
                        apiKey: apiKey
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to set Claude API key');
                }

                const data = await response.json();
                showToast('Claude API key saved successfully!', 'success');
                closeClaudeSetup();
                
                // Show main app after a brief delay
                setTimeout(() => {
                    showMainApp();
                }, 1000);

            } catch (error) {
                console.error('Error setting Claude API key:', error);
                showToast('Failed to save Claude API key. Please try again.', 'error');
            }
        }

        async function selectAiProvider(provider) {
            try {
                const response = await fetch('/api/set-ai-provider', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ provider: provider })
                });

                if (!response.ok) {
                    throw new Error('Failed to set AI provider');
                }

                const data = await response.json();
                showToast('AI provider set to ' + (provider === 'workers-ai' ? 'Workers AI' : 'Claude'), 'success');
                
                // Show main app after a brief delay
                setTimeout(() => {
                    showMainApp();
                }, 1000);

            } catch (error) {
                console.error('Error setting AI provider:', error);
                showToast('Failed to set AI provider. Please try again.', 'error');
            }
        }

        // Load saved meal plan from D1 database
        async function loadSavedMealPlan() {
            const weekStart = startOfWeek(currentWeek);
            const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
            
            try {
                const response = await fetch('/api/get-meal-plan?sessionId=' + getSessionId() + '&weekStart=' + format(weekStart, 'yyyy-MM-dd') + '&weekEnd=' + format(weekDays[6], 'yyyy-MM-dd'));
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.mealPlan) {
                        // Load the saved meals
                        const weekKey = format(weekStart, 'yyyy-MM-dd');
                        meals[weekKey] = data.mealPlan.meals;
                        renderCalendar();
                        showToast('Meal plan loaded successfully!', 'info');
                    }
                }
            } catch (error) {
                console.log('No saved meal plan found for this week');
            }
        }

        // Nutrition functions
        function computeNutrition() {
            const weekStart = startOfWeek(currentWeek);
            const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
            const weekKey = format(weekStart, 'yyyy-MM-dd');
            const currentWeekMeals = meals[weekKey] || {};
            
            // Check if there are any meals planned
            const hasMeals = Object.values(currentWeekMeals).some(dayMeals => 
                dayMeals.breakfast || dayMeals.lunch || dayMeals.dinner
            );
            
            if (!hasMeals) {
                showToast('Please plan some meals first before computing nutrition!', 'error');
                return;
            }

            // Show nutrition page
            showNutritionPage();
            
            // Fetch nutrition data
            fetchNutritionData(weekStart, weekDays, currentWeekMeals);
        }

        function showNutritionPage() {
            document.querySelector('.app').style.display = 'none';
            document.getElementById('nutrition-page').style.display = 'block';
        }

        function showCalendar() {
            document.getElementById('nutrition-page').style.display = 'none';
            document.querySelector('.app').style.display = 'block';
        }

        async function fetchNutritionData(weekStart, weekDays, currentWeekMeals) {
            try {
                // First, get the ingredients from D1 database
                const response = await fetch('/api/get-meal-plan?sessionId=' + getSessionId() + '&weekStart=' + format(weekStart, 'yyyy-MM-dd') + '&weekEnd=' + format(weekDays[6], 'yyyy-MM-dd'));
                
                if (!response.ok) {
                    throw new Error('Failed to fetch meal plan');
                }

                const data = await response.json();
                if (data.success && data.mealPlan && data.mealPlan.ingredients) {
                    // Use stored ingredients to compute nutrition
                    await computeNutritionFromIngredients(data.mealPlan.ingredients, currentWeekMeals);
                } else {
                    // No stored ingredients, compute them first
                    await computeIngredientsAndNutrition(currentWeekMeals, weekStart, weekDays);
                }
            } catch (error) {
                console.error('Error fetching nutrition data:', error);
                showToast('Failed to fetch nutrition data. Please try again.', 'error');
            }
        }

        async function computeIngredientsAndNutrition(currentWeekMeals, weekStart, weekDays) {
            try {
                // Compute ingredients first
                const mealsData = {
                    sessionId: getSessionId(),
                    weekStart: format(weekStart, 'yyyy-MM-dd'),
                    weekEnd: format(weekDays[6], 'yyyy-MM-dd'),
                    meals: currentWeekMeals
                };

                const response = await fetch('/api/compute-ingredients', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(mealsData)
                });

                if (!response.ok) {
                    throw new Error('Failed to compute ingredients');
                }

                const data = await response.json();
                await computeNutritionFromIngredients(data.ingredients, currentWeekMeals);
            } catch (error) {
                console.error('Error computing ingredients and nutrition:', error);
                showToast('Failed to compute nutrition. Please try again.', 'error');
            }
        }

        async function computeNutritionFromIngredients(ingredients, currentWeekMeals) {
            try {
                // Call nutrition API
                const response = await fetch('/api/compute-nutrition', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId: getSessionId(),
                        ingredients: ingredients,
                        meals: currentWeekMeals
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    console.error('Nutrition API error:', errorData);
                    throw new Error('Failed to compute nutrition: ' + (errorData.error || response.statusText));
                }

                const nutritionData = await response.json();
                console.log('Received nutrition data:', nutritionData);
                
                // Check if we have the required data structure
                if (!nutritionData || typeof nutritionData !== 'object') {
                    console.error('Invalid nutrition data structure:', nutritionData);
                    throw new Error('Invalid nutrition data received from API');
                }
                
                displayNutritionData(nutritionData);
            } catch (error) {
                console.error('Error computing nutrition:', error);
                showToast('Failed to compute nutrition. Please try again.', 'error');
            }
        }

                function displayNutritionData(nutritionData) {
            // Update summary cards
            document.getElementById('total-calories').textContent = nutritionData.totalCalories || '-';
            document.getElementById('total-protein').textContent = nutritionData.totalProtein || '-';
            document.getElementById('total-carbs').textContent = nutritionData.totalCarbs || '-';
            document.getElementById('total-fat').textContent = nutritionData.totalFat || '-';
            document.getElementById('total-fiber').textContent = nutritionData.totalFiber || '-';
            document.getElementById('total-sugar').textContent = nutritionData.totalSugar || '-';
            document.getElementById('total-sodium').textContent = nutritionData.totalSodium || '-';
            document.getElementById('total-calcium').textContent = nutritionData.totalCalcium || '-';
            
            // Create macro distribution chart
            createMacroChart(nutritionData);
            
            // Create nutrition chart
            createNutritionChart(nutritionData);
        }

        function createMacroChart(nutritionData) {
            const macroChart = document.getElementById('macro-chart');
            const protein = nutritionData.totalProtein || 0;
            const carbs = nutritionData.totalCarbs || 0;
            const fat = nutritionData.totalFat || 0;
            const total = protein + carbs + fat;
            
            if (total === 0) {
                macroChart.innerHTML = '<div class="chart-placeholder">No data available</div>';
                return;
            }

            const proteinPercent = Math.round((protein / total) * 100);
            const carbsPercent = Math.round((carbs / total) * 100);
            const fatPercent = Math.round((fat / total) * 100);

            macroChart.innerHTML = 
                '<div class="macro-chart-visual">' +
                    '<div class="macro-bar">' +
                        '<div class="macro-fill protein" style="width: ' + proteinPercent + '%"></div>' +
                        '<span class="macro-label">Protein ' + protein + 'g (' + proteinPercent + '%)</span>' +
                    '</div>' +
                    '<div class="macro-bar">' +
                        '<div class="macro-fill carbs" style="width: ' + carbsPercent + '%"></div>' +
                        '<span class="macro-label">Carbs ' + carbs + 'g (' + carbsPercent + '%)</span>' +
                    '</div>' +
                    '<div class="macro-bar">' +
                        '<div class="macro-fill fat" style="width: ' + fatPercent + '%"></div>' +
                        '<span class="macro-label">Fat ' + fat + 'g (' + fatPercent + '%)</span>' +
                    '</div>' +
                '</div>';
        }

        function createNutritionChart(nutritionData) {
            const nutritionChart = document.getElementById('nutrition-chart');
            
            // Define nutrition data with recommended daily values for scaling
            const nutritionItems = [
                { 
                    name: 'Fiber', 
                    value: nutritionData.totalFiber || 0, 
                    unit: 'g', 
                    recommendedDaily: 25, 
                    className: 'fiber' 
                },
                { 
                    name: 'Iron', 
                    value: nutritionData.totalIron || 0, 
                    unit: 'mg', 
                    recommendedDaily: 18, 
                    className: 'iron' 
                },
                { 
                    name: 'Calcium', 
                    value: nutritionData.totalCalcium || 0, 
                    unit: 'mg', 
                    recommendedDaily: 1000, 
                    className: 'calcium' 
                },
                { 
                    name: 'Vitamin C', 
                    value: nutritionData.totalVitaminC || 0, 
                    unit: 'mg', 
                    recommendedDaily: 90, 
                    className: 'vitamin-c' 
                },
                { 
                    name: 'Vitamin A', 
                    value: nutritionData.totalVitaminA || 0, 
                    unit: 'μg', 
                    recommendedDaily: 900, 
                    className: 'vitamin-a' 
                },
                { 
                    name: 'Vitamin D', 
                    value: nutritionData.totalVitaminD || 0, 
                    unit: 'μg', 
                    recommendedDaily: 20, 
                    className: 'vitamin-d' 
                }
            ];

            if (nutritionItems.every(item => item.value === 0)) {
                nutritionChart.innerHTML = '<div class="chart-placeholder">No nutrition data available</div>';
                return;
            }

            let chartHTML = '<div class="nutrition-chart-visual">';
            nutritionItems.forEach(item => {
                const percentage = Math.min((item.value / item.recommendedDaily) * 100, 100);
                const displayValue = item.value % 1 === 0 ? item.value : item.value.toFixed(1);
                
                chartHTML += 
                    '<div class="nutrition-bar">' +
                        '<div class="nutrition-fill ' + item.className + '" style="width: ' + percentage + '%"></div>' +
                        '<span class="nutrition-label">' + item.name + ' ' + displayValue + item.unit + ' (' + Math.round(percentage) + '% DV)</span>' +
                    '</div>';
            });
            chartHTML += '</div>';
            
            nutritionChart.innerHTML = chartHTML;
        }

        // Date utilities
        function startOfWeek(date, weekStartsOn = 1) {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : weekStartsOn);
            return new Date(d.setDate(diff));
        }

        function addDays(date, days) {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        }

        function format(date, formatStr) {
            if (formatStr === 'yyyy-MM-dd') {
                return date.toISOString().split('T')[0];
            }
            if (formatStr === 'MMMM d') {
                return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            }
            if (formatStr === 'MMMM d, yyyy') {
                return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            }
            if (formatStr === 'EEE') {
                return date.toLocaleDateString('en-US', { weekday: 'short' });
            }
            if (formatStr === 'MMM d') {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            return date.toString();
        }

        // Week navigation
        function goToPreviousWeek() {
            currentWeek = addDays(currentWeek, -7);
            initializeWeek();
            renderCalendar();
            updateNavigationButtons();
            loadSavedMealPlan();
        }

        function goToNextWeek() {
            currentWeek = addDays(currentWeek, 7);
            initializeWeek();
            renderCalendar();
            updateNavigationButtons();
            loadSavedMealPlan();
        }

        function goToCurrentWeek() {
            currentWeek = new Date();
            initializeWeek();
            renderCalendar();
            updateNavigationButtons();
            loadSavedMealPlan();
        }

        function updateNavigationButtons() {
            const currentBtn = document.querySelector('.nav-btn.current');
            if (currentBtn) {
                currentBtn.classList.remove('current');
            }
            
            const today = new Date();
            const weekStart = startOfWeek(today);
            const currentWeekStart = startOfWeek(currentWeek);
            
            if (weekStart.getTime() === currentWeekStart.getTime()) {
                document.querySelector('.nav-btn:nth-child(2)').classList.add('current');
            }
        }

        // Week initialization
        function initializeWeek() {
            const weekStart = startOfWeek(currentWeek);
            const weekKey = format(weekStart, 'yyyy-MM-dd');
            
            if (!meals[weekKey]) {
                const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
                const initialMeals = {};
                
                weekDays.forEach(day => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    initialMeals[dayKey] = {
                        breakfast: '',
                        lunch: '',
                        dinner: ''
                    };
                });
                
                meals[weekKey] = initialMeals;
            }
        }

        // Calendar rendering
        function renderCalendar() {
            const weekStart = startOfWeek(currentWeek);
            const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
            const weekKey = format(weekStart, 'yyyy-MM-dd');
            
            // Update week display
            document.getElementById('week-display').textContent = 
                \`Week of \${format(weekStart, 'MMMM d')} - \${format(weekDays[6], 'MMMM d, yyyy')}\`;
            
            // Render calendar body
            const calendarBody = document.getElementById('calendar-body');
            calendarBody.innerHTML = '';
            
            weekDays.forEach((day, index) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayMeals = meals[weekKey]?.[dayKey] || { breakfast: '', lunch: '', dinner: '' };
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                
                const row = document.createElement('div');
                row.className = 'calendar-row';
                
                row.innerHTML = \`
                    <div class="day-cell">
                        <div class="day-name">\${format(day, 'EEE')}</div>
                        <div class="day-date">\${format(day, 'MMM d')}</div>
                        \${isToday ? '<div class="today-indicator">Today</div>' : ''}
                    </div>
                    <div class="meal-cell">
                        <textarea 
                            class="meal-input" 
                            placeholder="What's for breakfast?"
                            value="\${dayMeals.breakfast || ''}"
                            onchange="handleMealChange('\${dayKey}', 'breakfast', this.value)"
                        ></textarea>
                    </div>
                    <div class="meal-cell">
                        <textarea 
                            class="meal-input" 
                            placeholder="What's for lunch?"
                            value="\${dayMeals.lunch || ''}"
                            onchange="handleMealChange('\${dayKey}', 'lunch', this.value)"
                        ></textarea>
                    </div>
                    <div class="meal-cell">
                        <textarea 
                            class="meal-input" 
                            placeholder="What's for dinner?"
                            value="\${dayMeals.dinner || ''}"
                            onchange="handleMealChange('\${dayKey}', 'dinner', this.value)"
                        ></textarea>
                    </div>
                \`;
                
                calendarBody.appendChild(row);
            });
        }

        // Meal change handler
        function handleMealChange(date, mealType, value) {
            const weekStart = startOfWeek(currentWeek);
            const weekKey = format(weekStart, 'yyyy-MM-dd');
            
            if (!meals[weekKey]) {
                meals[weekKey] = {};
            }
            if (!meals[weekKey][date]) {
                meals[weekKey][date] = {};
            }
            
            meals[weekKey][date][mealType] = value;
        }

        // Save meal plan to D1 database
        async function saveMealPlan() {
            const weekStart = startOfWeek(currentWeek);
            const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
            const weekKey = format(weekStart, 'yyyy-MM-dd');
            const currentWeekMeals = meals[weekKey] || {};
            
            // Check if there are any meals planned
            const hasMeals = Object.values(currentWeekMeals).some(dayMeals => 
                dayMeals.breakfast || dayMeals.lunch || dayMeals.dinner
            );
            
            if (!hasMeals) {
                showToast('Please plan some meals first before saving!', 'error');
                return;
            }

            const saveBtn = document.getElementById('save-btn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;
            
            try {
                const mealsData = {
                    sessionId: getSessionId(),
                    weekStart: format(weekStart, 'yyyy-MM-dd'),
                    weekEnd: format(weekDays[6], 'yyyy-MM-dd'),
                    meals: currentWeekMeals,
                    ingredients: '' // Will be populated when ingredients are computed
                };

                const response = await fetch('/api/save-meal-plan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(mealsData)
                });

                if (!response.ok) {
                    throw new Error('Failed to save meal plan');
                }

                const data = await response.json();
                showToast('Meal plan saved successfully!', 'success');
            } catch (error) {
                console.error('Error saving meal plan:', error);
                showToast('Failed to save meal plan. Please try again.', 'error');
            } finally {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }
        }

        // Compute ingredients
        async function computeIngredients() {
            const weekStart = startOfWeek(currentWeek);
            const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
            const weekKey = format(weekStart, 'yyyy-MM-dd');
            const currentWeekMeals = meals[weekKey] || {};
            
            // Check if there are any meals planned
            const hasMeals = Object.values(currentWeekMeals).some(dayMeals => 
                dayMeals.breakfast || dayMeals.lunch || dayMeals.dinner
            );
            
            if (!hasMeals) {
                showToast('Please plan some meals first before computing ingredients!', 'error');
                return;
            }

            setIsLoading(true);
            
            try {
                const mealsData = {
                    sessionId: getSessionId(),
                    weekStart: format(weekStart, 'yyyy-MM-dd'),
                    weekEnd: format(weekDays[6], 'yyyy-MM-dd'),
                    meals: currentWeekMeals
                };

                const response = await fetch('/api/compute-ingredients', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(mealsData)
                });

                if (!response.ok) {
                    throw new Error('Failed to compute ingredients');
                }

                                 const data = await response.json();
                 showIngredients(data.ingredients, data);
            } catch (error) {
                console.error('Error computing ingredients:', error);
                showToast('Failed to compute ingredients. Please try again.', 'error');
            } finally {
                setIsLoading(false);
            }
        }

        function setIsLoading(loading) {
            isLoading = loading;
            const btn = document.getElementById('compute-btn');
            if (loading) {
                btn.textContent = 'Computing...';
                btn.disabled = true;
            } else {
                btn.textContent = '🧾 Compute Ingredients';
                btn.disabled = false;
            }
        }

                 function showIngredients(ingredients, data) {
            document.getElementById('ingredients-text').textContent = ingredients;
            
            const cacheIndicator = document.getElementById('cache-indicator');
            const source = data.source || 'unknown';
            const isCached = data.cached || false;
            const message = data.message || '';
            
            // Show indicator with appropriate icon based on source
            if (source === 'exact_cache') {
                cacheIndicator.style.display = 'block';
                cacheIndicator.innerHTML = '⚡ ' + message;
                cacheIndicator.className = 'cache-indicator';
            } else if (source === 'semantic_adaptation') {
                cacheIndicator.style.display = 'block';
                cacheIndicator.innerHTML = '🧠 ' + message + '<br><small>Original: ' + data.adaptedFrom + '</small>';
                cacheIndicator.className = 'cache-indicator semantic';
            } else if (source === 'ai_generation') {
                cacheIndicator.style.display = 'block';
                cacheIndicator.innerHTML = '🔥 ' + message;
                cacheIndicator.className = 'cache-indicator fresh';
            } else {
                cacheIndicator.style.display = 'none';
            }
            
            const modal = document.getElementById('modal');
            modal.style.display = 'flex';
            // Trigger animation
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
        }

        function closeModal() {
            const modal = document.getElementById('modal');
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }

        async function copyIngredients() {
            const ingredients = document.getElementById('ingredients-text').textContent;
            try {
                await navigator.clipboard.writeText(ingredients);
                showToast('Ingredients copied to clipboard!', 'success');
            } catch (error) {
                console.error('Failed to copy:', error);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = ingredients;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showToast('Ingredients copied to clipboard!', 'success');
            }
        }
    </script>
</body>
</html>
`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    },
  });
}
