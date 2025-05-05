import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePack } from '../contexts/PackContext';
import './AddToPack.css';

const AddToPack = ({ item, type, buttonStyle = 'primary', showFeedback = true }) => {
  const { packItems, addToPack } = usePack();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Check if this item is already in the pack
  const isInPack = packItems.some(i => i.id === item.id && i.type === type);
  
  const handleAddToPack = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInPack) {
      navigate('/your-pack');
      return;
    }
    
    // Prepare the item for the pack
    const packItem = {
      ...item,
      type
    };
    
    // Add to pack
    addToPack(packItem);
    
    // Show success feedback
    if (showFeedback) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }
  };
  
  const buttonClasses = `add-to-pack-button ${buttonStyle} ${isInPack ? 'in-pack' : ''}`;
  
  return (
    <div className="add-to-pack-container">
      <button 
        className={buttonClasses}
        onClick={handleAddToPack}
        aria-label={isInPack ? "View in your pack" : "Add to your pack"}
      >
        {isInPack ? (
          <>
            <span className="check-icon">✓</span> In Your Pack
          </>
        ) : (
          <>
            <span className="plus-icon">+</span> Add to Pack
          </>
        )}
      </button>
      
      {showFeedback && showSuccess && (
        <div className="add-success-message">
          Added to your pack! <button onClick={() => navigate('/your-pack')}>View Pack</button>
        </div>
      )}
    </div>
  );
};

export default AddToPack; 