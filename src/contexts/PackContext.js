import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import { useAuth } from './AuthContext';

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
  const { currentUser } = useAuth();

  // Load user's pack items from Firestore or localStorage on component mount/user change
  useEffect(() => {
    const loadUserPack = async () => {
      try {
        if (currentUser) {
          // User is logged in, try to get pack from Firestore
          console.log(`Loading pack from Firestore for user: ${currentUser.uid}`);
          const userPackRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userPackRef);
          
          if (userDoc.exists() && userDoc.data().packItems) {
            // User has pack items in Firestore
            setPackItems(userDoc.data().packItems);
            console.log("Loaded pack items from Firestore");
          } else {
            // User document doesn't exist or has no packItems
            // Initialize with empty pack instead of transferring from localStorage
            
            // Check if we need to create or update the document
            if (!userDoc.exists()) {
              // Create new document with empty pack
              await setDoc(userPackRef, { 
                packItems: [],
                bookingDetails: {
                  travelDates: {
                    startDate: '',
                    endDate: ''
                  },
                  numberOfPeople: 1,
                  travelers: [{ email: '', firstName: '', lastName: '', age: '', gender: '', playingGolf: false, requiresEquipment: false }]
                } 
              });
              console.log("Created new user document with empty pack");
            } else {
              // Document exists but doesn't have packItems field
              await updateDoc(userPackRef, { packItems: [] });
              console.log("Updated existing user document with empty pack");
            }
            
            // Set empty pack
            setPackItems([]);
            
            // Clear localStorage to avoid confusion
            localStorage.removeItem('userPack');
          }
          
          // Load booking details
          if (userDoc.exists() && userDoc.data().bookingDetails) {
            setBookingDetails(userDoc.data().bookingDetails);
            console.log("Loaded booking details from Firestore");
          } else {
            // Initialize with empty booking details instead of transferring from localStorage
            const defaultBookingDetails = {
              travelDates: {
                startDate: '',
                endDate: ''
              },
              numberOfPeople: 1,
              travelers: [{ email: '', firstName: '', lastName: '', age: '', gender: '', playingGolf: false, requiresEquipment: false }]
            };
            
            // Update the document with empty booking details
            if (userDoc.exists()) {
              await updateDoc(userPackRef, { bookingDetails: defaultBookingDetails });
              console.log("Updated document with empty booking details");
            }
            
            // Set empty booking details
            setBookingDetails(defaultBookingDetails);
            
            // Clear localStorage to avoid confusion
            localStorage.removeItem('bookingDetails');
          }
        } else {
          // No logged in user, use localStorage
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
        }
      } catch (error) {
        console.error('Error loading user pack:', error);
        // Fall back to localStorage only when not logged in
        if (!currentUser) {
          const savedPack = localStorage.getItem('userPack');
          if (savedPack) {
            try {
              setPackItems(JSON.parse(savedPack));
            } catch (error) {
              console.error('Failed to parse pack items from localStorage:', error);
            }
          }
        }
      }
    };

    loadUserPack();
  }, [currentUser]);

  // Save pack items whenever they change
  useEffect(() => {
    const saveUserPack = async () => {
      try {
        if (currentUser) {
          // User is logged in, save to Firestore
          const userPackRef = doc(db, "users", currentUser.uid);
          
          // Check if the document exists first
          const userDoc = await getDoc(userPackRef);
          
          if (userDoc.exists()) {
            // Update the existing document
            await updateDoc(userPackRef, { packItems });
          } else {
            // Create a new document
            await setDoc(userPackRef, { 
              packItems,
              bookingDetails: {
                travelDates: {
                  startDate: '',
                  endDate: ''
                },
                numberOfPeople: 1,
                travelers: [{ email: '', firstName: '', lastName: '', age: '', gender: '', playingGolf: false, requiresEquipment: false }]
              }
            });
          }
          console.log("Saved pack items to Firestore");
        } else {
          // No logged in user, save to localStorage
          localStorage.setItem('userPack', JSON.stringify(packItems));
        }
      } catch (error) {
        console.error('Error saving pack items:', error);
        // Fall back to localStorage
        localStorage.setItem('userPack', JSON.stringify(packItems));
      }
    };
    
    // Always save when the pack changes or user changes
    saveUserPack();
  }, [packItems, currentUser]);

  // Save booking details whenever they change
  useEffect(() => {
    const saveBookingDetails = async () => {
      try {
        if (currentUser) {
          // User is logged in, save to Firestore
          const userPackRef = doc(db, "users", currentUser.uid);
          
          // Check if the document exists first
          const userDoc = await getDoc(userPackRef);
          
          if (userDoc.exists()) {
            await updateDoc(userPackRef, { bookingDetails });
          } else {
            await setDoc(userPackRef, { 
              bookingDetails,
              packItems: [] 
            });
          }
          console.log("Saved booking details to Firestore");
        } else {
          // No logged in user, save to localStorage
          localStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));
        }
      } catch (error) {
        console.error('Error saving booking details:', error);
        // Fall back to localStorage
        localStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));
      }
    };
    
    // Always save booking details when they change
    saveBookingDetails();
  }, [bookingDetails, currentUser]);

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
  const clearPack = async () => {
    setPackItems([]);
    
    // Also clear from Firestore if user is logged in
    if (currentUser) {
      try {
        const userPackRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userPackRef);
        
        if (userDoc.exists()) {
          await updateDoc(userPackRef, { packItems: [] });
          console.log("Cleared pack items from Firestore");
        }
      } catch (error) {
        console.error('Error clearing pack items from Firestore:', error);
      }
    }
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