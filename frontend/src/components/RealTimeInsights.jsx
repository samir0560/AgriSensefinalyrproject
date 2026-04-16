import React, { useState, useEffect } from 'react';

const RealTimeInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);

  // Simulate fetching real-time insights
  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock insights data
      const mockInsights = [
        {
          id: 1,
          title: 'Optimal Planting Time',
          description: 'Based on current soil conditions and weather forecast, the next 3 days are optimal for planting corn.',
          priority: 'high',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 2,
          title: 'Irrigation Recommendation',
          description: 'Soil moisture levels are 15% below optimal. Recommend irrigation within 24 hours.',
          priority: 'medium',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 3,
          title: 'Fertilizer Application',
          description: 'Nitrogen levels are low. Consider applying nitrogen-rich fertilizer to boost crop growth.',
          priority: 'medium',
          timestamp: new Date(Date.now() - 10800000).toISOString()
        },
        {
          id: 4,
          title: 'Disease Prevention',
          description: 'Weather conditions favor fungal growth. Apply preventive fungicide to protect crops.',
          priority: 'high',
          timestamp: new Date(Date.now() - 14400000).toISOString()
        },
        {
          id: 5,
          title: 'Harvest Timing',
          description: 'Corn crop is approaching maturity. Plan harvest within the next 5-7 days for optimal yield.',
          priority: 'low',
          timestamp: new Date(Date.now() - 18000000).toISOString()
        }
      ];
      
      setInsights(mockInsights);
      setLoading(false);
    };

    fetchInsights();
    
    // Set up interval to refresh insights every 10 minutes
    const interval = setInterval(fetchInsights, 600000);
    
    return () => clearInterval(interval);
  }, []);

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return '';
    }
  };

  return (
    <div className="real-time-insights">
      <h3>AI-Driven Real-Time Insights</h3>
      {loading && <p>Loading insights...</p>}
      
      <div className="insights-list">
        {insights.map(insight => (
          <div key={insight.id} className="insight-card">
            <div className="insight-header">
              <h4>{insight.title}</h4>
              <span className={`priority-badge ${getPriorityClass(insight.priority)}`}>
                {getPriorityText(insight.priority)}
              </span>
            </div>
            <p className="insight-description">{insight.description}</p>
            <p className="insight-timestamp">
              {new Date(insight.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealTimeInsights;