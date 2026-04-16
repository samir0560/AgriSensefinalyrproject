import React from 'react';
import { useI18n } from '../i18n/i18nContext';
import { Link } from 'react-router-dom';

const Blog = () => {
  const { t } = useI18n();

  const blogPosts = [
    {
      id: 1,
      title: t('blogPost1Title'),
      excerpt: t('blogPost1Excerpt'),
      date: '2025-01-15',
      category: t('blogCategoryTechnology')
    },
    {
      id: 2,
      title: t('blogPost2Title'),
      excerpt: t('blogPost2Excerpt'),
      date: '2025-01-10',
      category: t('blogCategoryFarming')
    },
    {
      id: 3,
      title: t('blogPost3Title'),
      excerpt: t('blogPost3Excerpt'),
      date: '2025-01-05',
      category: t('blogCategoryTips')
    }
  ];

  return (
    <div className="blog-page">
      <div className="container">
        <div className="page-header">
          <h1>{t('blog')}</h1>
          <p>{t('blogSubtitle')}</p>
        </div>

        <div className="blog-content">
          <div className="blog-posts">
            {blogPosts.map((post) => (
              <article key={post.id} className="blog-post-card">
                <div className="blog-post-header">
                  <span className="blog-category">{post.category}</span>
                  <span className="blog-date">{new Date(post.date).toLocaleDateString()}</span>
                </div>
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                <Link to={`/blog/${post.id}`} className="btn btn-outline">
                  {t('readMore')}
                </Link>
              </article>
            ))}
          </div>

          <div className="blog-sidebar">
            <div className="sidebar-section">
              <h3>{t('blogCategories')}</h3>
              <ul className="category-list">
                <li><Link to="/blog?category=technology">{t('blogCategoryTechnology')}</Link></li>
                <li><Link to="/blog?category=farming">{t('blogCategoryFarming')}</Link></li>
                <li><Link to="/blog?category=tips">{t('blogCategoryTips')}</Link></li>
                <li><Link to="/blog?category=news">{t('blogCategoryNews')}</Link></li>
              </ul>
            </div>

            <div className="sidebar-section">
              <h3>{t('blogSubscribe')}</h3>
              <p>{t('blogSubscribeDesc')}</p>
              <form className="subscribe-form">
                <input type="email" placeholder={t('enterEmail')} required />
                <button type="submit" className="btn btn-primary">{t('subscribe')}</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
