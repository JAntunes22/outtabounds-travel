import React, { createContext, useState, useContext, useEffect } from 'react';

const PackContext = createContext();

export function usePack() {
  return useContext(PackContext);
}

export function PackProvider({ children }) {
  const [packItems, setPackItems] = useState([]);
  const [bookingDetails, setBookingDetails] = useState({
    travelDates: {
      startDate: '',
      endDate: ''
    },
    numberOfPeople: 1,
    travelers: [{ email: '', firstName: '', lastName: '', age: '', gender: '', playingGolf: false, requiresEquipment: false }]
  });

  // Load pack items from localStorage on component mount
  useEffect(() => {
    const savedPack = localStorage.getItem('userPack');
    if (savedPack) {
      try {
        setPackItems(JSON.parse(savedPack));
      } catch (error) {
        console.error('Failed to parse pack items from localStorage:', error);
      }
    }
    
    const savedBookingDetails = localStorage.getItem('bookingDetails');
    if (savedBookingDetails) {
      try {
        setBookingDetails(JSON.parse(savedBookingDetails));
      } catch (error) {
        console.error('Failed to parse booking details from localStorage:', error);
      }
    }
  }, []);

  // Save pack items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userPack', JSON.stringify(packItems));
  }, [packItems]);

  // Save booking details to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));
  }, [bookingDetails]);

  // Add an item to the pack
  const addToPack = (item) => {
    setPackItems(prevItems => {
      // Check if item already exists
      const exists = prevItems.find(i => i.id === item.id && i.type === item.type);
      if (exists) {
        return prevItems; // Item already in pack, don't add again
      }
      return [...prevItems, { ...item, addedAt: new Date().toISOString() }];
    });
  };

  // Remove an item from the pack
  const removeFromPack = (itemId, itemType) => {
    setPackItems(prevItems => 
      prevItems.filter(item => !(item.id === itemId && item.type === itemType))
    );
  };

  // Clear all items from the pack
  const clearPack = () => {
    setPackItems([]);
  };

  // Update booking details
  const updateBookingDetails = (details) => {
    setBookingDetails(prevDetails => ({
      ...prevDetails,
      ...details
    }));
  };

  // Add or update a traveler
  const updateTraveler = (index, travelerData) => {
    setBookingDetails(prevDetails => {
      const updatedTravelers = [...prevDetails.travelers];
      updatedTravelers[index] = {
        ...updatedTravelers[index],
        ...travelerData
      };
      return {
        ...prevDetails,
        travelers: updatedTravelers
      };
    });
  };

  // Add a new traveler
  const addTraveler = () => {
    setBookingDetails(prevDetails => ({
      ...prevDetails,
      travelers: [
        ...prevDetails.travelers, 
        { email: '', firstName: '', lastName: '', age: '', gender: '', playingGolf: false, requiresEquipment: false }
      ]
    }));
  };

  // Remove a traveler
  const removeTraveler = (index) => {
    setBookingDetails(prevDetails => {
      const updatedTravelers = prevDetails.travelers.filter((_, i) => i !== index);
      return {
        ...prevDetails,
        travelers: updatedTravelers,
        numberOfPeople: updatedTravelers.length
      };
    });
  };

  const value = {
    packItems,
    bookingDetails,
    addToPack,
    removeFromPack,
    clearPack,
    updateBookingDetails,
    updateTraveler,
    addTraveler,
    removeTraveler
  };

  return (
    <PackContext.Provider value={value}>
      {children}
    </PackContext.Provider>
  );
} 