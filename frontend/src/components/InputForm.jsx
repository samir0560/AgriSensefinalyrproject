import React from 'react';

const InputForm = ({ children, onSubmit, title, description }) => {
  return (
    <div className="input-form-container">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      <form onSubmit={onSubmit} className="input-form">
        {children}
      </form>
    </div>
  );
};

export default InputForm;