import React, { useState } from 'react';
import { useI18n } from '../i18n/i18nContext';
import { Link } from 'react-router-dom';

const Tutorials = () => {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState('all');

  const tutorials = [
    {
      id: 1,
      title: t('tutorial1Title'),
      description: t('tutorial1Desc'),
      category: 'crop',
      duration: '10 min',
      level: t('tutorialLevelBeginner')
    },
    {
      id: 2,
      title: t('tutorial2Title'),
      description: t('tutorial2Desc'),
      category: 'fertilizer',
      duration: '15 min',
      level: t('tutorialLevelIntermediate')
    },
    {
      id: 3,
      title: t('tutorial3Title'),
      description: t('tutorial3Desc'),
      category: 'disease',
      duration: '12 min',
      level: t('tutorialLevelBeginner')
    },
    {
      id: 4,
      title: t('tutorial4Title'),
      description: t('tutorial4Desc'),
      category: 'irrigation',
      duration: '20 min',
      level: t('tutorialLevelAdvanced')
    },
    {
      id: 5,
      title: t('tutorial5Title'),
      description: t('tutorial5Desc'),
      category: 'soil',
      duration: '18 min',
      level: t('tutorialLevelIntermediate')
    },
    {
      id: 6,
      title: t('tutorial6Title'),
      description: t('tutorial6Desc'),
      category: 'weather',
      duration: '8 min',
      level: t('tutorialLevelBeginner')
    }
  ];

  const categories = [
    { id: 'all', name: t('tutorialCategoryAll') },
    { id: 'crop', name: t('cropPrediction') },
    { id: 'fertilizer', name: t('fertilizerRecommendation') },
    { id: 'disease', name: t('diseaseDetection') },
    { id: 'irrigation', name: t('irrigationAdvice') },
    { id: 'soil', name: t('soilAnalysis') },
    { id: 'weather', name: t('weather') }
  ];

  const filteredTutorials = activeCategory === 'all' 
    ? tutorials 
    : tutorials.filter(t => t.category === activeCategory);

  return (
    <div className="tutorials-page">
      <div className="container">
        <div className="page-header">
          <h1>{t('tutorials')}</h1>
          <p>{t('tutorialsSubtitle')}</p>
        </div>

        <div className="tutorials-filters">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`filter-btn ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="tutorials-grid">
          {filteredTutorials.map((tutorial) => (
            <div key={tutorial.id} className="tutorial-card">
              <div className="tutorial-header">
                <span className="tutorial-level">{tutorial.level}</span>
                <span className="tutorial-duration">⏱ {tutorial.duration}</span>
              </div>
              <h3>{tutorial.title}</h3>
              <p>{tutorial.description}</p>
              <Link to={`/tutorials/${tutorial.id}`} className="btn btn-outline">
                {t('startTutorial')}
              </Link>
            </div>
          ))}
        </div>

        <div className="tutorials-cta">
          <h2>{t('tutorialsNeedHelp')}</h2>
          <p>{t('tutorialsNeedHelpDesc')}</p>
          <Link to="/support" className="btn btn-primary">{t('contactSupport')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Tutorials;
