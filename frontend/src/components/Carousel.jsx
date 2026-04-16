import React, { useState, useEffect } from 'react';
import { getCarouselImages } from '../services/carouselService';

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState([]);
  
  // Load carousel images on component mount
  useEffect(() => {
    const loadedSlides = getCarouselImages();
    setSlides(loadedSlides);
  }, []);

  // Auto-rotate the carousel every 5 seconds
  useEffect(() => {
    if (slides.length === 0) return; // Don't start timer if no slides
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevSlide = () => {
    if (slides.length === 0) return;
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNextSlide = () => {
    if (slides.length === 0) return;
    const isLastSlide = currentIndex === slides.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  // Don't render if no slides
  if (slides.length === 0) {
    return (
      <div className="carousel">
        <div className="carousel-container">
          <p>Loading carousel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="carousel">
      <div className="carousel-container">
        <div 
          className="carousel-track" 
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={slide.id} className="carousel-slide">
              <div className="carousel-content">
                <div className="carousel-text">
                  <h2>{slide.title}</h2>
                  <p>{slide.description}</p>
                </div>
                <div className="carousel-image">
                  <img src={slide.image} alt={slide.alt} />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation arrows */}
        <button className="carousel-btn prev-btn" onClick={goToPrevSlide}>
          &#10094;
        </button>
        <button className="carousel-btn next-btn" onClick={goToNextSlide}>
          &#10095;
        </button>
        
        {/* Indicators */}
        <div className="carousel-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Carousel;