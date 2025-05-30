import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePack } from '../contexts/PackContext';
import { useLocale } from '../contexts/LocaleContext';
import './PackCommon.css';
import './YourPack.css';

export default function YourPack() {
  const { packItems, removeFromPack, clearPack } = usePack();
  const navigate = useNavigate();
  const [isEmptyAlert, setIsEmptyAlert] = useState(false);
  const { getLocalizedPath } = useLocale();

  // Group pack items by type
  const courseItems = packItems.filter(item => item.type === 'course');
  const experienceItems = packItems.filter(item => item.type === 'experience');
  
  const handleRemoveItem = (id, type) => {
    removeFromPack(id, type);
  };

  const handleProceedToBooking = () => {
    if (packItems.length === 0) {
      setIsEmptyAlert(true);
      setTimeout(() => setIsEmptyAlert(false), 3000);
      return;
    }
    navigate(getLocalizedPath('/booking-details'));
  };

  return (
    <div className="pack-page">
      <div className="pack-container your-pack-container">
        <div className="your-pack-header">
          <h1>Your Pack</h1>
          <p>Review the items you've added to your pack</p>
        </div>

        {isEmptyAlert && (
          <div className="empty-pack-alert">
            Please add at least one item to your pack before proceeding.
          </div>
        )}

        <div className="your-pack-content">
          {packItems.length === 0 ? (
            <div className="empty-pack">
              <h2>Your pack is empty</h2>
              <p>Browse our courses, experiences, and accommodations to create your perfect golf adventure.</p>
              <div className="empty-pack-links">
                <Link to={getLocalizedPath('/courses')} className="pack-browse-link">Browse Courses</Link>
                <Link to={getLocalizedPath('/experiences')} className="pack-browse-link">Browse Experiences</Link>
                <Link to={getLocalizedPath('/houses')} className="pack-browse-link">Browse Houses</Link>
              </div>
            </div>
          ) : (
            <>
              {courseItems.length > 0 && (
                <div className="pack-section">
                  <h2>Golf Courses</h2>
                  <div className="pack-items">
                    {courseItems.map(item => (
                      <div className="your-pack-item" key={`${item.type}-${item.id}`}>
                        <div className="pack-item-image">
                          <img src={item.imageUrl} alt={item.name} />
                        </div>
                        <div className="pack-item-details">
                          <h3>{item.name}</h3>
                          <p className="pack-item-location">{item.location}</p>
                          <p className="pack-item-description">{item.description}</p>
                        </div>
                        <button 
                          className="remove-item-btn" 
                          onClick={() => handleRemoveItem(item.id, item.type)}
                          aria-label={`Remove ${item.name} from pack`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {experienceItems.length > 0 && (
                <div className="pack-section">
                  <h2>Experiences</h2>
                  <div className="pack-items">
                    {experienceItems.map(item => (
                      <div className="your-pack-item" key={`${item.type}-${item.id}`}>
                        <div className="pack-item-image">
                          <img src={item.imageUrl} alt={item.name} />
                        </div>
                        <div className="pack-item-details">
                          <h3>{item.name}</h3>
                          <p className="pack-item-location">{item.location}</p>
                          <p className="pack-item-description">{item.description}</p>
                        </div>
                        <button 
                          className="remove-item-btn" 
                          onClick={() => handleRemoveItem(item.id, item.type)}
                          aria-label={`Remove ${item.name} from pack`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pack-summary">
                <div className="your-pack-actions">
                  <button className="clear-pack-btn" onClick={clearPack}>
                    Clear Pack
                  </button>
                  <button className="proceed-btn" onClick={handleProceedToBooking}>
                    Next: Travel Details
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 