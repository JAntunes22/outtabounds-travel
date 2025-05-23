import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePack } from '../contexts/PackContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import './PackCommon.css';
import './ReviewInquiry.css';

export default function ReviewInquiry() {
  const { packItems, bookingDetails, clearPack } = usePack();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if pack is empty
  useEffect(() => {
    if (packItems.length === 0) {
      navigate('/your-pack');
    }
  }, [packItems, navigate]);

  // Group pack items by type
  const courseItems = packItems.filter(item => item.type === 'course');

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleBack = () => {
    navigate('/traveler-details');
  };

  const handleSubmitInquiry = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    
    try {
      // Prepare inquiry data
      const inquiryData = {
        userId: currentUser ? currentUser.uid : null,
        userEmail: currentUser ? currentUser.email : bookingDetails.travelers[0].email,
        packItems,
        bookingDetails,
        status: 'new',
        createdAt: serverTimestamp(),
        submitted: true
      };
      
      // Save inquiry to Firestore
      const inquiryRef = await addDoc(collection(db, 'inquiries'), inquiryData);
      console.log('Inquiry submitted with ID:', inquiryRef.id);
      
      // Clear the pack after successful submission
      await clearPack();
      
      // Show success message and redirect to home
      alert('Your inquiry has been submitted successfully! We will contact you shortly.');
      navigate('/');
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert('There was an error submitting your inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pack-page">
      <div className="pack-container review-inquiry-container">
        <div className="review-inquiry-header">
          <h1>Review Your Inquiry</h1>
          <p>Please review all details before submitting your inquiry</p>
        </div>

        <div className="review-inquiry-content">
          <section className="review-section">
            <h2>Selected Items</h2>
            <div className="selected-items">
              {courseItems.length > 0 && (
                <div className="item-category">
                  <h3>Golf Courses</h3>
                  <ul className="item-list">
                    {courseItems.map(item => (
                      <li key={`${item.type}-${item.id}`} className="item">
                        <div className="item-image">
                          <img src={item.imageUrl} alt={item.name} />
                        </div>
                        <div className="item-details">
                          <h4>{item.name}</h4>
                          <p className="item-location">{item.location}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <section className="review-section">
            <h2>Travel Dates</h2>
            <div className="travel-details">
              <p><strong>From:</strong> {formatDate(bookingDetails.travelDates.startDate)}</p>
              <p><strong>To:</strong> {formatDate(bookingDetails.travelDates.endDate)}</p>
            </div>
          </section>

          <section className="review-section">
            <h2>Travelers ({bookingDetails.travelers.length})</h2>
            <div className="travelers-details">
              {bookingDetails.travelers.map((traveler, index) => (
                <div key={index} className="traveler-card">
                  <h3>Traveler {index + 1}</h3>
                  <div className="traveler-info">
                    <p><strong>Name:</strong> {traveler.firstName} {traveler.lastName}</p>
                    <p><strong>Email:</strong> {traveler.email}</p>
                    <p><strong>Age:</strong> {traveler.age}</p>
                    <p><strong>Gender:</strong> {traveler.gender ? traveler.gender.charAt(0).toUpperCase() + traveler.gender.slice(1) : 'Not specified'}</p>
                    <p><strong>Playing Golf:</strong> {traveler.playingGolf ? 'Yes' : 'No'}</p>
                    {traveler.playingGolf && (
                      <p><strong>Equipment Rental:</strong> {traveler.requiresEquipment ? 'Yes' : 'No'}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="inquiry-navigation">
            <button 
              type="button" 
              className="back-button"
              onClick={handleBack}
            >
              Back to Traveler Details
            </button>
            <button 
              type="button" 
              className="submit-inquiry-button"
              onClick={handleSubmitInquiry}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 